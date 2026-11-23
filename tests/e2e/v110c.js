// Kiểm thử bản 1.10 phần 3 (lương: hồ sơ lương chuyển từ e-work, bảng lương tự tính, bảo hiểm, thuế TNCN, chốt, phiếu lương): node tests/e2e/v110c.js — cần CSDL trống
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const PW = 'Admin2026', H = { 'X-QLDA': '1' };
const errs = []; const ok = (c, m) => { if (!c) errs.push(m); };
function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, timezoneId: 'Asia/Ho_Chi_Minh', geolocation: { latitude: 10.0343, longitude: 105.7470 }, permissions: ['geolocation'] });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400 && !p._x) errs.push(`HTTP ${r.status()} ${r.url()}`); });
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request;
  const imp = await (await r.post(BASE + '/api/vp/import-ework', { headers: H, multipart: { file: { name: 'e.json', mimeType: 'application/json', buffer: fs.readFileSync(path.join(__dirname, '../fixtures/ework_luutru.json')) } } })).json();
  ok(imp.payProfiles === 1, 'Không chuyển hồ sơ lương từ e-work: ' + imp.payProfiles);
  const acc = Object.fromEntries(imp.newAccounts.map(a => [a.username, a.password]));
  const emps = await (await r.get(BASE + '/api/vp/employees', { headers: H })).json();
  const ttb = emps.find(e => e.name === 'Trần Thị B'), nva = emps.find(e => e.name === 'Nguyễn Văn A');
  ok(ttb.dependents === 1, 'Không chuyển người phụ thuộc: ' + ttb.dependents);
  const pr = await (await r.get(BASE + '/api/vp/luong-ho-so', { headers: H })).json();
  const pt = pr.find(x => x.employeeId === ttb.id);
  ok(pt && pt.baseSalary === 10000000 && pt.allowances.length === 2 && pt.allowances.find(a => a.name === 'Ăn trưa').exempt === 730000, 'Hồ sơ lương chuyển sai (phải lấy mức áp dụng mới nhất): ' + JSON.stringify(pt));
  ok((await r.put(BASE + `/api/vp/luong-ho-so/${nva.id}`, { headers: H, data: { baseSalary: 60000000, insuranceSalary: 60000000, allowances: [], noInsurance: false, flatTax: false, dependents: 0 } })).ok(), 'Lưu hồ sơ lương lỗi');
  const M = '2026-10';
  // KPI tháng 10 xếp loại A cho ttb để có thưởng KPI
  ok((await r.put(BASE + `/api/vp/kpi/${M}/${ttb.id}`, { headers: H, data: { workScore: 100, projectScore: 100, rating: 5 } })).ok(), 'Chấm KPI lỗi');
  await r.post(BASE + `/api/vp/kpi/${M}/chot`, { headers: H, data: { lock: true } });
  await r.put(BASE + `/api/vp/luong/${M}/${nva.id}`, { headers: H, data: { bonus: 1000000, deduction: 500000, note: 'Thưởng dự án' } });
  let d = await (await r.get(BASE + `/api/vp/luong?month=${M}`, { headers: H })).json();
  const bb = d.rows.find(x => x.employeeId === ttb.id), a = d.rows.find(x => x.employeeId === nva.id);
  ok(bb.paid === bb.standard && bb.standard >= 20, 'Ngày công hưởng lương sai: ' + bb.paid + '/' + bb.standard);
  ok(bb.timePay === 10000000 && bb.allowances === 1030000 && bb.kpiBonus === 1000000 && bb.kpiGrade === 'A' && bb.gross === 12030000, 'Thu nhập ttb sai: ' + JSON.stringify(bb));
  ok(bb.insurance === 1050000 && bb.taxable === 11300000 && bb.assessable === 0 && bb.pit === 0 && bb.net === 10980000 && bb.employerIns === 2350000, 'Khấu trừ ttb sai: ' + JSON.stringify({ i: bb.insurance, t: bb.taxable, a: bb.assessable, p: bb.pit, n: bb.net, e: bb.employerIns }));
  // Trần đóng BHXH, BHYT = 20 × lương cơ sở 2.530.000 (từ 01/7/2026)
  ok(a.bhxh === 4048000 && a.bhyt === 759000 && a.bhtn === 600000, 'Trần bảo hiểm sai: ' + JSON.stringify({ x: a.bhxh, y: a.bhyt, t: a.bhtn }));
  ok(a.gross === 61000000 && a.assessable === 40093000 && a.pit === 4518600 && a.net === 50574400, 'Thuế TNCN biểu 5 bậc sai: ' + JSON.stringify({ g: a.gross, a: a.assessable, p: a.pit, n: a.net }));
  const st = d.settings; await r.put(BASE + '/api/vp/luong-settings', { headers: H, data: { ...st, taxTables: [st.taxTables[0]] } });
  d = await (await r.get(BASE + `/api/vp/luong?month=${M}`, { headers: H })).json();
  ok(d.rows.find(x => x.employeeId === nva.id).pit === 6773250, 'Thuế TNCN biểu 7 bậc sai: ' + d.rows.find(x => x.employeeId === nva.id).pit);
  await r.put(BASE + '/api/vp/luong-settings', { headers: H, data: st });
  // Nhân viên chưa thấy phiếu khi chưa chốt; không xem được hồ sơ lương
  const ctx2 = await b.newContext(); const q2 = ctx2.request;
  await q2.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: acc.ttb } });
  await q2.post(BASE + '/api/auth/change-password', { headers: H, data: { old: acc.ttb, password: 'Nhanvien2026' } });
  await q2.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: 'Nhanvien2026' } });
  let mine = await (await q2.get(BASE + `/api/vp/luong?month=${M}`, { headers: H })).json();
  ok(!mine.all && mine.rows.length === 0, 'Nhân viên thấy phiếu lương chưa chốt');
  p._x = true; ok((await q2.get(BASE + '/api/vp/luong-ho-so', { headers: H })).status() === 403, 'Nhân viên xem được hồ sơ lương');
  ok((await q2.put(BASE + `/api/vp/luong/${M}/${ttb.id}`, { headers: H, data: { bonus: 99, deduction: 0 } })).status() === 403, 'Nhân viên tự sửa lương được'); p._x = false;
  // 1.10.9: nhân sự không chấm công: hưởng nguyên lương chính, không cần tự xác nhận
  ok((await r.put(BASE + `/api/vp/employees/${nva.id}`, { headers: H, data: { ...nva, attendance: false } })).ok(), 'Đặt không chấm công lỗi');
  d = await (await r.get(BASE + `/api/vp/luong?month=${M}`, { headers: H })).json();
  const na = d.rows.find(x => x.employeeId === nva.id);
  ok(na.noAttendance && na.paid === na.standard && na.timePay === 60000000 && na.absent === 0, 'Không chấm công chưa hưởng nguyên lương chính: ' + JSON.stringify({ n: na.noAttendance, p: na.paid, s: na.standard, t: na.timePay }));
  // Chốt
  const lk = await (await r.post(BASE + `/api/vp/luong/${M}/chot`, { headers: H, data: { lock: true } })).json(); ok(lk.n === 2, 'Chốt bảng lương sai số người: ' + lk.n);
  { const d2 = await (await r.get(BASE + `/api/vp/luong?month=${M}`, { headers: H })).json(); const n2 = d2.rows.find(x => x.employeeId === nva.id), t2 = d2.rows.find(x => x.employeeId === ttb.id);
    ok(n2.confirmedAt && n2.confirmState === 'Không cần xác nhận (không chấm công)' && !n2.confirmOpen, 'Không chấm công vẫn phải xác nhận: ' + JSON.stringify({ c: n2.confirmedAt, s: n2.confirmState }));
    ok(!t2.confirmedAt && !t2.noAttendance, 'Người có chấm công bị tự xác nhận'); }
  p._x = true; ok((await r.put(BASE + `/api/vp/luong/${M}/${nva.id}`, { headers: H, data: { bonus: 0, deduction: 0 } })).status() === 409, 'Đã chốt vẫn điều chỉnh được'); p._x = false;
  await r.put(BASE + `/api/vp/luong-ho-so/${ttb.id}`, { headers: H, data: { baseSalary: 20000000, allowances: [], noInsurance: false, flatTax: false } });
  mine = await (await q2.get(BASE + `/api/vp/luong?month=${M}`, { headers: H })).json();
  ok(mine.rows.length === 1 && mine.rows[0].net === 10980000 && mine.rows[0].locked, 'Phiếu lương đã chốt bị thay đổi hoặc nhân viên không thấy: ' + JSON.stringify(mine.rows.map(x => x.net)));
  ok((await (await q2.get(BASE + `/api/vp/luong?month=2026-09`, { headers: H })).json()).rows.length === 0, 'Thấy phiếu tháng chưa chốt');
  const bk = await (await r.get(BASE + '/api/backup', { headers: H })).json();
  ok(bk.data.vp_payprofiles.length === 2 && bk.data.vp_payslips.length === 2 && bk.data.vp_payslips.every(x => x.data), 'Sao lưu thiếu dữ liệu lương');
  ok((await r.post(BASE + '/api/backup', { headers: H, data: bk })).ok(), 'Phục hồi có dữ liệu lương lỗi');
  // Giao diện
  await p.evaluate(m => { vpReset(); S.f.plm = m; location.hash = 'luong'; }, M); await p.waitForSelector('#content >> text=Trần Thị B', { timeout: 15000 });
  await p.screenshot({ path: `${SHOTS}/v110c-bang-luong.png`, fullPage: true });
  const [dx] = await Promise.all([p.waitForEvent('download'), p.click('[data-act="pay-xlsx"]')]); ok(/Bang_luong_2026-10\.xlsx$/.test(dx.suggestedFilename()), 'Không xuất Excel bảng lương');
  await p.click('#content tr.click >> text=Trần Thị B'); await p.waitForSelector('.mform >> text=THỰC LĨNH'); await p.screenshot({ path: `${SHOTS}/v110c-phieu.png` });
  await p.evaluate(() => { window._prt = null; const orig = document.body.appendChild.bind(document.body); document.body.appendChild = el => { if (el.tagName === 'IFRAME') setTimeout(() => { window._prt = el.contentDocument.documentElement.outerHTML; }, 100); return orig(el); }; });
  await p.click('.mform [data-act="pay-pdf"]'); await p.waitForTimeout(600);
  const prt = await p.evaluate(() => window._prt || ''); ok(/PHIẾU LƯƠNG THÁNG 10\/2026/.test(prt) && /10\.980\.000/.test(prt) && !/Nguyễn Văn A/.test(prt), 'Phiếu lương in sai: ' + prt.slice(0, 200));
  const pv = await ctx.newPage(); await pv.setContent(prt); await pv.screenshot({ path: `${SHOTS}/v110c-phieu-in.png`, fullPage: true }); await pv.close();
  await p.click('[data-close]');
  await p.click('[data-act="pay-profiles"]'); await p.waitForSelector('.mform >> text=Hồ sơ lương'); await p.click('.mform tr.click >> text=Nguyễn Văn A'); await p.waitForSelector('#f_base');
  await p.fill('#f_base', '62000000'); await p.click('#mform button[type=submit]'); await p.waitForTimeout(1200);
  const pr2 = await (await r.get(BASE + '/api/vp/luong-ho-so', { headers: H })).json(); ok(pr2.find(x => x.employeeId === nva.id).baseSalary === 62000000, 'Sửa hồ sơ lương qua giao diện lỗi');
  const mob = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'Asia/Ho_Chi_Minh' });
  const pm = await mob.newPage(); pm.on('pageerror', e => errs.push('MOB ' + e.message));
  await pm.goto(BASE + '/'); await pm.fill('#lg_user', 'ttb'); await pm.fill('#lg_pw', 'Nhanvien2026'); await pm.click('#login button[type=submit]'); await pm.waitForSelector('#app');
  await pm.evaluate(m => { S.f.plm = m; location.hash = 'luong'; }, M); await pm.waitForSelector('#content >> text=THỰC LĨNH', { timeout: 15000 });
  await pm.screenshot({ path: `${SHOTS}/v110c-mobile-phieu.png`, fullPage: true });
  ok(!(await pm.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Tràn ngang trên điện thoại (phiếu lương)');
  await b.close();
  if (errs.length) { console.log('LỖI:\n' + errs.join('\n')); process.exit(1); } else console.log('v110c: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
