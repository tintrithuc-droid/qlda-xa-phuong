// Kiểm thử bản 1.9 (phân hệ Văn phòng): node tests/e2e/v19.js [http://127.0.0.1:5080] — cần CSDL trống
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
  // Chuyển dữ liệu mẫu e-work
  const imp = await (await r.post(BASE + '/api/vp/import-ework', { headers: H, multipart: { file: { name: 'ework.json', mimeType: 'application/json', buffer: fs.readFileSync(path.join(__dirname, '../fixtures/ework_mau.json')) } } })).json();
  console.log('Nhập e-work:', JSON.stringify({ ...imp, newAccounts: imp.newAccounts.map(a => a.username) }));
  ok(imp.departments === 2 && imp.employees === 3 && imp.newAccounts.length === 2 && imp.attendances === 2 && imp.requests === 2, 'Số liệu nhập e-work sai');
  const imp2 = await (await r.post(BASE + '/api/vp/import-ework', { headers: H, multipart: { file: { name: 'ework.json', mimeType: 'application/json', buffer: fs.readFileSync(path.join(__dirname, '../fixtures/ework_mau.json')) } } })).json();
  ok(imp2.employees === 0 && imp2.attendances === 0 && imp2.requests === 0 && imp2.newAccounts.length === 0, 'Nhập lần 2 bị trùng');
  const st0 = await (await r.get(BASE + '/api/vp/state', { headers: H })).json();
  ok(st0.settings.places.length === 1 && st0.settings.holidays.length === 2, 'Thiết lập nơi điểm danh, ngày nghỉ chưa nạp');
  // Gắn hồ sơ cho quản trị để điểm danh
  const depts = await (await r.get(BASE + '/api/vp/departments', { headers: H })).json();
  await r.put(BASE + '/api/vp/employees/ns-admin', { headers: H, data: { name: 'Quản Trị', userId: st0.perms ? (await p.evaluate(() => S.user.id)) : null, departmentId: depts[0].id, status: 'Đang làm việc', attendance: true } });
  // Giao diện: điểm danh vào bằng nút (định vị giả trong bán kính văn phòng)
  await p.evaluate(() => { vpReset(); location.hash = 'van-phong'; }); await p.waitForSelector('[data-act="vp-check"][data-id="in"]', { timeout: 10000 });
  await p.screenshot({ path: `${SHOTS}/v19-diem-danh-truoc.png` });
  await p.click('[data-act="vp-check"][data-id="in"]'); await p.waitForTimeout(1500);
  const st = await (await r.get(BASE + '/api/vp/state', { headers: H })).json();
  ok(st.attendance && st.attendance.inPlace === 'Trong công ty' && /Văn phòng/.test(st.attendance.site || ''), 'Điểm danh vào không nhận trong công ty: ' + JSON.stringify(st.attendance));
  p._x = true; const dup = await r.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in' } }); p._x = false; ok(dup.status() === 409, 'Điểm danh vào lần 2 không bị chặn');
  await p.click('[data-act="vp-check"][data-id="out"]'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${SHOTS}/v19-diem-danh-sau.png`, fullPage: true });
  // Đề xuất qua giao diện
  await p.click('[data-act="vp-req-new"]'); await p.click('[data-act="vp-req-form"][data-id="Nghỉ phép"]');
  await p.fill('#f_fd', '2026-12-01'); await p.fill('#f_td', '2026-12-02'); await p.fill('#f_reason', 'Về quê'); await p.click('#mform button[type=submit]'); await p.waitForTimeout(1200); const fe=await p.$('#mform_err'); if(fe) console.log('Lỗi biểu mẫu:', await fe.textContent()); await p.screenshot({path:SHOTS+'/v19-form.png'});
  const mine = await (await r.get(BASE + '/api/vp/requests?scope=mine', { headers: H })).json();
  ok(mine.length === 1 && Number(mine[0].days) === 2 && mine[0].status === 'Chờ duyệt', 'Đề xuất nghỉ phép: ' + JSON.stringify(mine[0]));
  // Trưởng phòng (tài khoản mới nva) duyệt đề xuất của nhân viên ttb
  const acc = Object.fromEntries(imp.newAccounts.map(a => [a.username, a.password]));
  const c2 = await b.newContext(); const q = c2.request;
  await q.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: acc.ttb } });
  await q.post(BASE + '/api/auth/change-password', { headers: H, data: { old: acc.ttb, password: 'Nhanvien2026' } });
  const lg = await q.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: 'Nhanvien2026' } });
  ok(lg.ok(), 'Nhân viên mới không đăng nhập được: ' + lg.status());
  const sent = await q.put(BASE + '/api/vp/requests/dx-t1', { headers: H, data: { type: 'Tăng ca', fromAt: '2026-11-22T17:30:00+07:00', toAt: '2026-11-22T20:00:00+07:00', hours: 2.5, reason: 'Gấp' } });
  ok(sent.ok(), 'Nhân viên gửi đề xuất lỗi ' + sent.status());
  const empsT = await (await q.get(BASE + '/api/vp/employees', { headers: H })).json();
  ok(empsT.every(e => e.userId === null || e.name === 'Trần Thị B' || e.idNumber === undefined), 'Lộ thông tin riêng của người khác');
  const tsT = await (await q.get(BASE + '/api/vp/timesheet?month=2026-11', { headers: H })).json();
  ok(tsT.rows.length === 1, 'Nhân viên thấy bảng công của người khác: ' + tsT.rows.length);
  const c3 = await b.newContext(); const m = c3.request;
  await m.post(BASE + '/api/auth/login', { headers: H, data: { username: 'nva', password: acc.nva } });
  await m.post(BASE + '/api/auth/change-password', { headers: H, data: { old: acc.nva, password: 'Truongphong2026' } });
  await m.post(BASE + '/api/auth/login', { headers: H, data: { username: 'nva', password: 'Truongphong2026' } });
  const ap = await (await m.get(BASE + '/api/vp/requests?scope=approve', { headers: H })).json();
  ok(ap.some(x => x.id === 'dx-t1'), 'Trưởng phòng không thấy đề xuất chờ duyệt: ' + JSON.stringify(ap.map(x => x.code)));
  const dc = await m.post(BASE + '/api/vp/requests/dx-t1/decide', { headers: H, data: { action: 'approve' } }); ok(dc.ok(), 'Duyệt lỗi ' + dc.status());
  const tsM = await (await m.get(BASE + '/api/vp/timesheet?month=2026-11', { headers: H })).json();
  ok(tsM.rows.some(x => x.name === 'Trần Thị B' && Number(x.overtime) === 2.5), 'Bảng công trưởng phòng thiếu tăng ca: ' + JSON.stringify(tsM.rows));
  // Chép chấm công sang e-work
  const k = await (await r.post(BASE + '/api/vp/sync-key?from=2026-11-01', { headers: H })).json();
  const pend = await (await r.get(BASE + '/api/vp/sync/pending', { headers: { 'X-Sync-Key': k.key } })).json();
  console.log('Chờ chép sang e-work:', pend.length);
  p._x = true; const bad = await r.get(BASE + '/api/vp/sync/pending', { headers: { 'X-Sync-Key': 'sai' } }); p._x = false; ok(bad.status() === 403, 'Khóa sai vẫn đọc được');
  // Các màn hình
  for (const rt of ['de-xuat', 'diem-danh', 'nhan-su']) { await p.evaluate(x => location.hash = x, rt); await p.waitForTimeout(1200); await p.screenshot({ path: `${SHOTS}/v19-${rt}.png`, fullPage: true }); }
  await p.click('[data-g=dd][data-id=thiet-lap]').catch(() => {}); await p.evaluate(() => { S.tab.dd = 'thiet-lap'; location.hash = 'diem-danh'; render(); }); await p.waitForTimeout(1200); await p.screenshot({ path: `${SHOTS}/v19-thiet-lap.png`, fullPage: true });
  const mob = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, geolocation: { latitude: 10.2, longitude: 105.9 }, permissions: ['geolocation'] });
  const pm = await mob.newPage(); pm.on('pageerror', e => errs.push('MOB ' + e.message));
  await pm.goto(BASE + '/'); await pm.fill('#lg_user', 'ttb'); await pm.fill('#lg_pw', 'Nhanvien2026'); await pm.click('#login button[type=submit]'); await pm.waitForSelector('#app');
  await pm.waitForSelector('[data-act="vp-check"]', { timeout: 10000 }); await pm.screenshot({ path: `${SHOTS}/v19-mobile.png` });
  ok(!(await pm.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Tràn ngang trên điện thoại');
  await b.close();
  if (errs.length) { console.log('LỖI:\n' + errs.join('\n')); process.exit(1); } else console.log('v19: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
