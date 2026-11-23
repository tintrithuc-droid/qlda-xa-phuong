// Kiểm thử bản 1.10 phần 2 (chuyển toàn bộ dữ liệu e-work, KPI tháng, ẩn phân hệ): node tests/e2e/v110b.js [http://127.0.0.1:5080] — cần CSDL trống
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
  const fx = fs.readFileSync(path.join(__dirname, '../fixtures/ework_luutru.json'));
  const up = () => r.post(BASE + '/api/vp/import-ework', { headers: H, multipart: { file: { name: 'ework.json', mimeType: 'application/json', buffer: fx } } }).then(x => x.json());
  const imp = await up();
  ok(imp.meetings === 1 && imp.notices === 1, 'Chuyển lịch họp/thông báo sai: ' + JSON.stringify({ m: imp.meetings, n: imp.notices }));
  ok(imp.archive && imp.archive.BangKPIs === 3 && imp.archive.LichHops === 1 && Object.keys(imp.archive).length === 13, 'Lưu trữ thiếu bảng: ' + JSON.stringify(imp.archive));
  const acc = Object.fromEntries(imp.newAccounts.map(a => [a.username, a.password]));
  const emps = await (await r.get(BASE + '/api/vp/employees', { headers: H })).json();
  const ttb = emps.find(e => e.name === 'Trần Thị B'), nva = emps.find(e => e.name === 'Nguyễn Văn A');
  const mt = await (await r.get(BASE + '/api/vp/meetings?from=2026-10-01&to=2026-10-31', { headers: H })).json();
  const m = mt[0] || {};
  ok(mt.length === 1 && m.title === 'Họp giao ban tháng 10' && /Rà soát tiến độ dự án A/.test(m.content) && !/<p>/.test(m.content), 'Nội dung lịch họp chuyển sai: ' + JSON.stringify(m));
  ok(/Thống nhất kế hoạch/.test(m.conclusion || '') && /trước 15\/10/.test(m.conclusion || ''), 'Mất kết luận cuộc họp: ' + m.conclusion);
  ok(m.place === 'Phòng họp lớn' && m.chair === 'Nguyễn Văn A' && (m.attendeeIds || '').split(',').includes(ttb.id) && m.startAt.startsWith('2026-10-05T01:00'), 'Thông tin lịch họp sai: ' + JSON.stringify(m));
  // 1.10.10: phiếu xác nhận tăng ca e-work (TaskTangCas) thành phiếu "Tăng ca" tính lương; đề xuất tăng ca trước khi làm chỉ là đăng ký
  ok(imp.otSlips === 3, 'Số phiếu tăng ca chuyển sai: ' + imp.otSlips);
  const rq = await (await r.get(BASE + '/api/vp/requests', { headers: H })).json();
  const ot = rq.filter(x => x.type === 'Tăng ca' && x.fromAt && x.fromAt.startsWith('2025-10')).sort((a, b) => a.fromAt.localeCompare(b.fromAt));
  ok(ot.length === 2 && ot[0].hours === 3 && ot[0].fromAt.startsWith('2025-10-11T01:00') && ot[0].status === 'Đã duyệt' && ot[0].title.includes('bình thường') && (ot[0].decidedAt || '').startsWith('2025-11-02') && ot[0].approverName === 'Nguyễn Văn A' && ot[0].reason === 'Triển khai hệ thống', 'Phiếu tăng ca 1 chuyển sai: ' + JSON.stringify(ot[0]));
  ok(ot[1].hours === 2 && ot[1].fromAt.startsWith('2025-10-14T11:00') && ot[1].title.includes('gấp') && (ot[1].decidedAt || '').startsWith('2025-10-20'), 'Phiếu tăng ca 2 (giờ không kèm ngày) chuyển sai: ' + JSON.stringify(ot[1]));
  ok(rq.some(x => x.type === 'Tăng ca' && x.hours === 1 && x.status === 'Đã hủy'), 'Phiếu tăng ca chờ duyệt quá 30 ngày chưa hủy');
  ok(rq.some(x => x.type === 'Đăng ký tăng ca (e-work)' && x.reason === 'Đăng ký trước') && !rq.some(x => x.type === 'Tăng ca' && x.reason === 'Đăng ký trước'), 'Đề xuất tăng ca trước khi làm vẫn tính là tăng ca');
  // Chạy lại: không trùng, lưu trữ thay theo bảng
  const imp2 = await up();
  ok(imp2.meetings === 0 && imp2.otSlips === 0 && imp2.notices === 0 && imp2.archive.BangKPIs === 3, 'Chạy lại sinh trùng: ' + JSON.stringify({ m: imp2.meetings, n: imp2.notices }));
  const tabs = await (await r.get(BASE + '/api/vp/ework-archive', { headers: H })).json();
  ok(tabs.find(t => t.table === 'BangKPIs')?.rows === 3, 'Lưu trữ bị nhân đôi sau khi chạy lại: ' + JSON.stringify(tabs));
  const k10 = await (await r.get(BASE + '/api/vp/ework-archive/BangKPIs?period=2026-10', { headers: H })).json();
  ok(k10.total === 2 && k10.periods.join() === '2026-10,2026-09' && k10.rows.every(x => x.Thang === 10), 'Lọc kỳ lưu trữ sai: ' + JSON.stringify(k10));
  const kq = await (await r.get(BASE + '/api/vp/ework-archive/QuanLyCongViecs?q=' + encodeURIComponent('hồ sơ mời'), { headers: H })).json();
  ok(kq.total === 1 && kq.rows[0].TenCongViec === 'Lập hồ sơ mời thầu', 'Tìm trong lưu trữ sai');

  // Nhân viên ttb, trưởng phòng nva
  const login = async (u) => { const c = await b.newContext(); const q = c.request;
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: acc[u] } });
    await q.post(BASE + '/api/auth/change-password', { headers: H, data: { old: acc[u], password: 'Nhanvien2026' } });
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: 'Nhanvien2026' } }); return q; };
  const q = await login('ttb'), qa = await login('nva');
  p._x = true; ok((await q.get(BASE + '/api/vp/ework-archive', { headers: H })).status() === 403, 'Nhân viên xem được lưu trữ e-work'); p._x = false;
  const nl = await (await q.get(BASE + '/api/vp/notices', { headers: H })).json();
  const ib = await (await q.get(BASE + '/api/vp/inbox', { headers: H })).json();
  ok(nl.some(n => n.title === 'Lịch nghỉ lễ 2/9' && n.read && /Chúc mọi người & gia đình/.test(n.body)) && ib.unread === 0, 'Thông báo chuyển từ e-work sai (phạm vi, đã đọc, nội dung): ' + JSON.stringify(nl));

  // ---- KPI tháng
  const M = '2026-11';
  const myId = await p.evaluate(() => S.user.id); const depts = await (await r.get(BASE + '/api/vp/departments', { headers: H })).json();
  await r.put(BASE + '/api/vp/employees/ns-admin', { headers: H, data: { name: 'Quản Trị', userId: myId, departmentId: depts.find(d => d.name === 'Phòng Kinh doanh').id, status: 'Đang làm việc', attendance: false } });
  p._x = true; ok((await r.put(BASE + `/api/vp/kpi/${M}/ns-admin`, { headers: H, data: { rating: 5 } })).status() === 403, 'Tự chấm KPI của mình được'); p._x = false;
  ok((await r.put(BASE + `/api/vp/kpi/${M}/${ttb.id}`, { headers: H, data: { workScore: 90, projectScore: 80, rating: 4, note: 'Hoàn thành tốt' } })).ok(), 'Chấm KPI lỗi');
  p._x = true; ok((await r.put(BASE + `/api/vp/kpi/${M}/${ttb.id}`, { headers: H, data: { rating: 6 } })).status() === 400, 'Nhận điểm ngoài thang'); p._x = false;
  let kp = await (await r.get(BASE + `/api/vp/kpi?month=${M}`, { headers: H })).json();
  let rb = kp.rows.find(x => x.employeeId === ttb.id);
  const expect = Math.round((90 * 40 + 80 * 20 + rb.attendance * 10 + 80 * 30) / 100 * 10) / 10;
  ok(rb.total === expect && rb.missing.length === 0 && rb.attDetail.standard > 0, `Tổng điểm KPI sai: ${rb.total} khác ${expect}`);
  const ad = kp.rows.find(x => x.employeeId === 'ns-admin'); ok(ad && ad.attendance === null && ad.self && !ad.canRate, 'Người không điểm danh: chuyên cần phải bỏ trống, không tự chấm');
  const mine = await (await q.get(BASE + `/api/vp/kpi?month=${M}`, { headers: H })).json();
  ok(mine.rows.length === 1 && mine.rows[0].self && !mine.rows[0].canRate, 'Nhân viên thấy KPI người khác hoặc tự chấm được: ' + mine.rows.length);
  ok((await q.post(BASE + `/api/vp/kpi/${M}/phan-hoi`, { headers: H, data: { note: 'Em xin xem lại điểm chuyên cần' } })).ok(), 'Nhân viên phản hồi KPI lỗi');
  const tp = await (await qa.get(BASE + `/api/vp/kpi?month=${M}`, { headers: H })).json();
  ok(tp.rows.some(x => x.employeeId === ttb.id && x.canRate && x.employeeNote === 'Em xin xem lại điểm chuyên cần') && !tp.rows.some(x => x.employeeId === 'ns-admin'), 'Trưởng phòng không thấy đúng phạm vi phòng mình');
  ok((await qa.put(BASE + `/api/vp/kpi/${M}/${ttb.id}`, { headers: H, data: { rating: 5 } })).ok(), 'Trưởng phòng không chấm được nhân viên phòng mình');
  p._x = true; ok((await qa.put(BASE + `/api/vp/kpi/${M}/ns-admin`, { headers: H, data: { rating: 5 } })).status() === 403, 'Trưởng phòng chấm được người phòng khác');
  ok((await qa.post(BASE + `/api/vp/kpi/${M}/chot`, { headers: H, data: { lock: true } })).status() === 403, 'Trưởng phòng chốt được KPI'); p._x = false;
  const pre = (await (await r.get(BASE + `/api/vp/kpi?month=${M}`, { headers: H })).json()).rows.find(x => x.employeeId === ttb.id);
  ok(pre.rating === 5 && pre.total === Math.round((90 * 40 + 80 * 20 + pre.attendance * 10 + 100 * 30) / 100 * 10) / 10, 'Điểm sau khi trưởng phòng chấm lại sai: ' + pre.total);
  const lk = await (await r.post(BASE + `/api/vp/kpi/${M}/chot`, { headers: H, data: { lock: true } })).json(); ok(lk.n >= 3, 'Chốt KPI sai: ' + JSON.stringify(lk));
  p._x = true; ok((await r.put(BASE + `/api/vp/kpi/${M}/${ttb.id}`, { headers: H, data: { rating: 3 } })).status() === 409, 'Đã chốt vẫn sửa được'); p._x = false;
  await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: { ...kp.settings, wWork: 70, wProject: 0, wAttendance: 0, wManager: 30 } });
  kp = await (await r.get(BASE + `/api/vp/kpi?month=${M}`, { headers: H })).json(); rb = kp.rows.find(x => x.employeeId === ttb.id);
  ok(rb.locked && rb.total === pre.total && rb.grade === pre.grade, 'Đổi thiết lập làm thay đổi KPI đã chốt: ' + rb.total + ' / ' + pre.total);
  const frozen = rb.total;
  await r.post(BASE + `/api/vp/kpi/${M}/chot`, { headers: H, data: { lock: false } });
  kp = await (await r.get(BASE + `/api/vp/kpi?month=${M}`, { headers: H })).json(); rb = kp.rows.find(x => x.employeeId === ttb.id);
  ok(!rb.locked && rb.total === Math.round((90 * 70 + 100 * 30) / 100 * 10) / 10, 'Mở chốt không tính lại theo thiết lập mới: ' + rb.total + ' (chốt ' + frozen + ')');
  await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: kp.settings.wWork === 70 ? { ...kp.settings, wWork: 40, wProject: 20, wAttendance: 10, wManager: 30 } : kp.settings });
  const bk = await (await r.get(BASE + '/api/backup', { headers: H })).json();
  ok(bk.data.vp_kpi.length >= 3 && bk.data.vp_ework.length === 19 && bk.data.vp_ework.every(x => x.tableName && x.data), 'Sao lưu thiếu KPI hoặc lưu trữ e-work');
  ok((await r.post(BASE + '/api/backup', { headers: H, data: bk })).ok(), 'Phục hồi có lưu trữ e-work lỗi');
  const tabs2 = await (await r.get(BASE + '/api/vp/ework-archive', { headers: H })).json(); ok(tabs2.reduce((s, t) => s + t.rows, 0) === 19, 'Phục hồi làm trùng lưu trữ');

  // ---- Giao diện KPI, lưu trữ
  await p.evaluate(() => { vpReset(); location.hash = 'kpi'; }); await p.waitForTimeout(500);
  await p.evaluate(m => { S.f.kpim = m; render(); }, M); await p.waitForSelector('text=Trần Thị B', { timeout: 10000 });
  await p.screenshot({ path: `${SHOTS}/v110b-kpi.png`, fullPage: true });
  const [dx] = await Promise.all([p.waitForEvent('download'), p.click('[data-act="kpi-xlsx"]')]); ok(/KPI_2026-11\.xlsx$/.test(dx.suggestedFilename()), 'Không xuất được Excel KPI');
  await p.evaluate(() => { window._prt = null; const orig = document.body.appendChild.bind(document.body); document.body.appendChild = el => { if (el.tagName === 'IFRAME') setTimeout(() => { window._prt = el.contentDocument.documentElement.outerHTML; }, 100); return orig(el); }; });
  await p.click('[data-act="kpi-pdf"]'); await p.waitForTimeout(600);
  const prt = await p.evaluate(() => window._prt || ''); ok(/ĐÁNH GIÁ KPI THÁNG 11\/2026/.test(prt) && /Trần Thị B/.test(prt), 'Bản in KPI thiếu nội dung');
  const pv = await ctx.newPage(); await pv.setContent(prt); await pv.screenshot({ path: `${SHOTS}/v110b-kpi-in.png`, fullPage: true }); await pv.close();
  await p.evaluate(() => { location.hash = 'ework-cu'; }); await p.waitForSelector('text=Bảng KPI', { timeout: 10000 });
  await p.screenshot({ path: `${SHOTS}/v110b-ework-bang.png`, fullPage: true });
  await p.click('text=Bảng KPI'); await p.waitForSelector('text=92.5', { timeout: 10000 });
  await p.selectOption('#ew_p', '2026-09'); await p.waitForTimeout(800);
  ok(await p.locator('#content td', { hasText: '92.5' }).count() === 0 && await p.locator('#content td', { hasText: '80' }).count() > 0, 'Lọc kỳ trên giao diện lưu trữ sai');
  await p.click('#content tr.click'); await p.waitForSelector('.mform >> text=TongDiemKPI'); await p.screenshot({ path: `${SHOTS}/v110b-ework-dong.png` }); await p.click('[data-close]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act="ew-xlsx"]')]); ok(/ework_BangKPIs_2026-09\.xlsx$/.test(dl.suggestedFilename()), 'Không xuất Excel lưu trữ');

  // ---- Ẩn phân hệ theo đơn vị
  const br = await (await r.get(BASE + '/api/branding', { headers: H })).json();
  ok((await r.put(BASE + '/api/branding', { headers: H, data: { ...br, hideMods: 'lich-hop,kpi' } })).ok(), 'Lưu phân hệ ẩn lỗi');
  await p.reload(); await p.waitForSelector('#app'); await p.waitForTimeout(1200);
  const nav = await p.textContent('nav, #nav, .side').catch(() => '');
  ok(!/Lịch công tác/.test(nav) && !/\bKPI\b/.test(nav) && /Thông báo/.test(nav), 'Menu vẫn hiện phân hệ đã ẩn: ' + nav.slice(0, 300));
  ok(await p.evaluate(() => !can('lich-hop') && !can('kpi') && can('thong-bao')), 'Quyền vẫn mở phân hệ đã ẩn');
  await p.evaluate(() => location.hash = 'kpi'); await p.waitForTimeout(600); ok(await p.evaluate(() => S.route !== 'kpi'), 'Vào được trang phân hệ đã ẩn');
  await r.put(BASE + '/api/branding', { headers: H, data: { ...br, hideMods: '' } });
  // Điện thoại: KPI của tôi
  const mob = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'Asia/Ho_Chi_Minh' });
  const pm = await mob.newPage(); pm.on('pageerror', e => errs.push('MOB ' + e.message));
  await pm.goto(BASE + '/'); await pm.fill('#lg_user', 'ttb'); await pm.fill('#lg_pw', 'Nhanvien2026'); await pm.click('#login button[type=submit]'); await pm.waitForSelector('#app');
  await pm.evaluate(m => { location.hash = 'kpi'; S.f.kpim = m; }, M); await pm.waitForTimeout(1500); await pm.evaluate(() => render()); await pm.waitForSelector('#content >> text=Trần Thị B', { timeout: 10000 });
  await pm.screenshot({ path: `${SHOTS}/v110b-mobile-kpi.png`, fullPage: true });
  ok(!(await pm.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Tràn ngang trên điện thoại (KPI)');
  await b.close();
  if (errs.length) { console.log('LỖI:\n' + errs.join('\n')); process.exit(1); } else console.log('v110b: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
