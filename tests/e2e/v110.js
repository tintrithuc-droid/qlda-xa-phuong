// Kiểm thử bản 1.10 (lịch công tác, thông báo, sao lưu Văn phòng): node tests/e2e/v110.js [http://127.0.0.1:5080] — cần CSDL trống
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

  const imp = await (await r.post(BASE + '/api/vp/import-ework', { headers: H, multipart: { file: { name: 'ework.json', mimeType: 'application/json', buffer: fs.readFileSync(path.join(__dirname, '../fixtures/ework_mau.json')) } } })).json();
  const acc = Object.fromEntries(imp.newAccounts.map(a => [a.username, a.password]));
  const depts = await (await r.get(BASE + '/api/vp/departments', { headers: H })).json();
  const myId = await p.evaluate(() => S.user.id);
  await r.put(BASE + '/api/vp/employees/ns-admin', { headers: H, data: { name: 'Quản Trị', userId: myId, departmentId: depts[0].id, status: 'Đang làm việc', attendance: true } });
  const emps = await (await r.get(BASE + '/api/vp/employees', { headers: H })).json();
  const ttb = emps.find(e => e.name === 'Trần Thị B');
  // Nhân viên ttb đăng nhập
  const c2 = await b.newContext(); const q = c2.request;
  await q.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: acc.ttb } });
  await q.post(BASE + '/api/auth/change-password', { headers: H, data: { old: acc.ttb, password: 'Nhanvien2026' } });
  await q.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: 'Nhanvien2026' } });

  // ---- Lịch công tác
  const day = new Date(Date.now() + 86400e3); const ymd = day.toISOString().slice(0, 10);
  const at = (h, m = 0) => new Date(`${ymd}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+07:00`).toISOString();
  const m1 = await r.put(BASE + '/api/vp/meetings/lh-1', { headers: H, data: { m: { kind: 'Họp', title: 'Họp giao ban tuần', startAt: at(8), endAt: at(9, 30), place: 'Phòng họp tầng 2', chair: 'Giám đốc', participants: 'Trưởng các phòng', attendeeIds: ttb.id }, force: false } });
  ok(m1.ok(), 'Tạo lịch lỗi ' + m1.status());
  p._x = true; const clash = await r.put(BASE + '/api/vp/meetings/lh-2', { headers: H, data: { m: { kind: 'Họp', title: 'Họp dự án', startAt: at(9), endAt: at(10), place: 'phòng họp tầng 2 ' }, force: false } }); p._x = false;
  ok(clash.status() === 409, 'Không cảnh báo trùng phòng họp: ' + clash.status());
  const forced = await r.put(BASE + '/api/vp/meetings/lh-2', { headers: H, data: { m: { kind: 'Họp', title: 'Họp dự án', startAt: at(9), endAt: at(10), place: 'Phòng họp tầng 2' }, force: true } });
  ok(forced.ok(), 'Vẫn lưu khi trùng phòng lỗi');
  p._x = true; const badEnd = await r.put(BASE + '/api/vp/meetings/lh-3', { headers: H, data: { m: { title: 'X', startAt: at(10), endAt: at(9) }, force: false } }); p._x = false;
  ok(badEnd.status() === 400, 'Giờ kết thúc trước giờ bắt đầu vẫn lưu');
  const ib = await (await q.get(BASE + '/api/vp/inbox', { headers: H })).json();
  ok(ib.meetings.some(m => m.id === 'lh-1') && !ib.meetings.some(m => m.id === 'lh-2'), 'Lịch của tôi (nhân viên được mời) sai: ' + JSON.stringify(ib.meetings.map(m => m.id)));
  p._x = true; const notMine = await q.put(BASE + '/api/vp/meetings/lh-1', { headers: H, data: { m: { title: 'Sửa trộm', startAt: at(8) }, force: true } }); p._x = false;
  ok(notMine.status() === 403, 'Nhân viên sửa được lịch của người khác');
  const own = await q.put(BASE + '/api/vp/meetings/lh-ttb', { headers: H, data: { m: { kind: 'Công tác', title: 'Khảo sát hiện trường', startAt: at(13, 30), place: 'Công trình A' }, force: false } });
  ok(own.ok(), 'Nhân viên không tự đăng ký lịch được');
  const wk = await (await q.get(BASE + `/api/vp/meetings?from=${ymd}&to=${ymd}`, { headers: H })).json();
  ok(wk.length === 3, 'Lịch tuần thiếu: ' + wk.length);

  // ---- Thông báo
  const n1 = await r.put(BASE + '/api/vp/notices/tb-1', { headers: H, data: { title: 'Lịch nghỉ Tết Dương lịch 2027', body: 'Công ty nghỉ ngày 01/01/2027.\nĐi làm lại ngày 02/01/2027.', important: true } });
  ok(n1.ok(), 'Đăng thông báo lỗi ' + n1.status());
  await r.put(BASE + '/api/vp/notices/tb-2', { headers: H, data: { title: 'Chỉ phòng khác', deptIds: depts.find(d => d.id !== ttb.departmentId).id } });
  p._x = true; const noRight = await q.put(BASE + '/api/vp/notices/tb-x', { headers: H, data: { title: 'Không quyền' } }); p._x = false;
  ok(noRight.status() === 403, 'Nhân viên đăng được thông báo');
  const ib2 = await (await q.get(BASE + '/api/vp/inbox', { headers: H })).json();
  ok(ib2.unread === 1 && ib2.important.length === 1, 'Hộp thư nhân viên sai: ' + JSON.stringify(ib2));
  const nl = await (await q.get(BASE + '/api/vp/notices', { headers: H })).json();
  ok(nl.length === 1 && nl[0].body.includes('\n'), 'Danh sách thông báo nhân viên sai hoặc mất xuống dòng');
  await q.post(BASE + '/api/vp/notices/tb-1/read', { headers: H }); await q.post(BASE + '/api/vp/notices/tb-1/read', { headers: H });
  const ib3 = await (await q.get(BASE + '/api/vp/inbox', { headers: H })).json(); ok(ib3.unread === 0, 'Đã xem nhưng vẫn đếm chưa xem');
  const rd = await (await r.get(BASE + '/api/vp/notices/tb-1/reads', { headers: H })).json();
  ok(rd.filter(x => x.readAt).length === 1, 'Theo dõi đã xem sai: ' + JSON.stringify(rd));

  // ---- Sao lưu có dữ liệu Văn phòng; phục hồi tệp cũ không xóa dữ liệu Văn phòng
  const bk = await (await r.get(BASE + '/api/backup', { headers: H })).json();
  ok(Array.isArray(bk.data.vp_employees) && bk.data.vp_employees.length >= 4 && bk.data.vp_employees.every(e => e.name) && bk.data.vp_attendances.every(a => a.employeeId) && bk.data.vp_meetings.length === 3 && bk.data.vp_notices.length === 2, 'Sao lưu thiếu dữ liệu Văn phòng');
  const old = JSON.parse(JSON.stringify(bk)); for (const k of Object.keys(old.data)) if (k.startsWith('vp_')) delete old.data[k];
  const rs = await r.post(BASE + '/api/backup', { headers: H, data: old }); ok(rs.ok(), 'Phục hồi lỗi ' + rs.status());
  const after = await (await r.get(BASE + '/api/vp/employees', { headers: H })).json();
  const mAfter = await (await r.get(BASE + `/api/vp/meetings?from=${ymd}&to=${ymd}`, { headers: H })).json();
  ok(after.length === emps.length && mAfter.length === 3, 'Phục hồi bản sao lưu cũ làm mất dữ liệu Văn phòng');
  await r.delete(BASE + '/api/vp/meetings/lh-2', { headers: H });
  const rs2 = await r.post(BASE + '/api/backup', { headers: H, data: bk }); ok(rs2.ok(), 'Phục hồi có Văn phòng lỗi');
  const m2 = await (await r.get(BASE + `/api/vp/meetings?from=${ymd}&to=${ymd}`, { headers: H })).json(); ok(m2.length === 3, 'Phục hồi không đưa lại lịch đã xóa');

  // ---- Giao diện
  await p.evaluate(() => { vpReset(); VP.ib = null; location.hash = 'lich-hop'; }); await p.waitForTimeout(800);
  await p.evaluate(d => { S.f.lhw = d; render(); }, ymd); await p.waitForSelector('text=Họp giao ban tuần', { timeout: 10000 });
  await p.screenshot({ path: `${SHOTS}/v110-lich-tuan.png`, fullPage: true });
  await p.click('[data-act="mt-edit"][data-id=""]'); await p.waitForSelector('#f_title');
  await p.fill('#f_title', 'Họp chuyên đề KPI'); await p.fill('#f_date', ymd); await p.fill('#f_start', '09:00'); await p.fill('#f_end', '10:00'); await p.fill('#f_place', 'Phòng họp tầng 2');
  const nd = new Date(day.getTime() + 14 * 86400e3).toISOString().slice(0, 10); await p.fill('#f_repeat', nd);
  p._x = true; await p.click('#mform button[type=submit]'); await p.waitForTimeout(1200);
  const er = await p.textContent('#mform_err'); ok(/Bấm Lưu lần nữa/.test(er), 'Biểu mẫu không báo trùng phòng: ' + er);
  await p.click('#mform button[type=submit]'); await p.waitForTimeout(2000); p._x = false;
  const rep = await (await r.get(BASE + `/api/vp/meetings?from=${ymd}&to=${nd}`, { headers: H })).json();
  ok(rep.filter(m => m.title === 'Họp chuyên đề KPI').length === 3, 'Lặp hằng tuần sai: ' + rep.filter(m => m.title === 'Họp chuyên đề KPI').length);
  await p.click('text=Họp giao ban tuần'); await p.waitForSelector('[data-act="mt-ics"]'); await p.screenshot({ path: `${SHOTS}/v110-lich-chi-tiet.png` });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act="mt-ics"]')]);
  const ics = fs.readFileSync(await dl.path(), 'utf8'); ok(/BEGIN:VEVENT[\s\S]*DTSTART:\d{8}T010000Z/.test(ics), 'Tệp .ics sai giờ: ' + ics.slice(0, 300));
  await p.click('[data-close]');
  const [dx] = await Promise.all([p.waitForEvent('download'), p.click('[data-act="mt-xlsx"]')]); ok(/\.xlsx$/.test(dx.suggestedFilename()), 'Không xuất được Excel lịch tuần');
  await p.evaluate(() => { window._prt = null; const orig = document.body.appendChild.bind(document.body); document.body.appendChild = el => { if (el.tagName === 'IFRAME') setTimeout(() => { window._prt = el.contentDocument.documentElement.outerHTML; }, 100); return orig(el); }; });
  await p.click('[data-act="mt-pdf"]'); await p.waitForTimeout(600);
  const prt = await p.evaluate(() => window._prt || ''); ok(/LỊCH CÔNG TÁC TUẦN/.test(prt) && /Họp giao ban tuần/.test(prt) && /CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/.test(prt), 'Bản in lịch tuần thiếu nội dung');
  fs.writeFileSync(`${SHOTS}/v110-lich-in.html`, prt);
  const pv = await ctx.newPage(); await pv.setContent(prt); await pv.screenshot({ path: `${SHOTS}/v110-lich-in.png`, fullPage: true }); await pv.close();
  await p.evaluate(() => { location.hash = 'thong-bao'; }); await p.waitForSelector('text=Lịch nghỉ Tết', { timeout: 10000 });
  await p.screenshot({ path: `${SHOTS}/v110-thong-bao.png`, fullPage: true });
  await p.click('[data-act="nt-edit"][data-id=""]'); await p.fill('#f_title', 'Thông báo họp toàn công ty'); await p.fill('#f_body', 'Dòng 1\nDòng 2');
  await p.click('#mform button[type=submit]'); await p.waitForTimeout(1500);
  const nl2 = await (await r.get(BASE + '/api/vp/notices', { headers: H })).json();
  ok(nl2.some(n => n.title === 'Thông báo họp toàn công ty' && n.body === 'Dòng 1\nDòng 2'), 'Đăng thông báo qua giao diện lỗi');
  await p.click('[data-act="nt-reads"][data-id="tb-1"]'); await p.waitForSelector('text=Chưa xem'); await p.screenshot({ path: `${SHOTS}/v110-da-xem.png` }); await p.click('[data-close]');
  // Nhân viên: trang Điểm danh hiện thông báo quan trọng, lịch của tôi
  await r.put(BASE + '/api/vp/notices/tb-3', { headers: H, data: { title: 'Quy định mới về chấm công', important: true } });
  const mob = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'Asia/Ho_Chi_Minh' });
  const pm = await mob.newPage(); pm.on('pageerror', e => errs.push('MOB ' + e.message));
  await pm.goto(BASE + '/'); await pm.fill('#lg_user', 'ttb'); await pm.fill('#lg_pw', 'Nhanvien2026'); await pm.click('#login button[type=submit]'); await pm.waitForSelector('#app');
  await pm.evaluate(() => location.hash = 'van-phong'); await pm.waitForSelector('text=Quy định mới về chấm công', { timeout: 10000 }); await pm.waitForSelector('text=Lịch của tôi 7 ngày tới');
  await pm.screenshot({ path: `${SHOTS}/v110-mobile-diem-danh.png`, fullPage: true });
  ok(!(await pm.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Tràn ngang trên điện thoại (điểm danh)');
  await pm.click('text=Quy định mới về chấm công'); await pm.waitForTimeout(800); await pm.click('[data-close].btn'); await pm.waitForTimeout(800);
  const ib4 = await (await pm.request.get(BASE + '/api/vp/inbox', { headers: H })).json(); ok(ib4.important.length === 0, 'Mở thông báo không đánh dấu đã xem');
  for (const rt of ['lich-hop', 'thong-bao']) { await pm.evaluate(x => location.hash = x, rt); await pm.waitForTimeout(1200); await pm.screenshot({ path: `${SHOTS}/v110-mobile-${rt}.png`, fullPage: true });
    ok(!(await pm.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Tràn ngang trên điện thoại: ' + rt); }
  await b.close();
  if (errs.length) { console.log('LỖI:\n' + errs.join('\n')); process.exit(1); } else console.log('v110: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
