// Kiểm thử bản 1.10.4: lịch nghỉ lễ theo luật, ngày làm bù, lời chúc điểm danh; nhân viên tự xác nhận lương, kiến nghị; hồ sơ nhân sự đầy đủ (bằng cấp, khen thưởng, kỷ luật, quá trình công tác).
// node tests/e2e/v110e.js [BASE] [tên CSDL] — cần CSDL trống, máy chủ chạy bằng /tmp/claude-0/run.sh <tên CSDL>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'v110e';
const APP = path.join(__dirname, '../../src/QldaTtts.Web');
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
function cli(args, extraEnv = {}) {
  const env = { ...process.env, Database__Provider: 'PostgreSQL', ConnectionStrings__PostgreSQL: `Host=127.0.0.1;Database=${DB};Username=qlda;Password=qlda`,
    Storage__FilesPath: '/tmp/qlda-app/files', Storage__BackupPath: '/tmp/qlda-app/bk', ASPNETCORE_URLS: 'http://127.0.0.1:5999', ...extraEnv };
  const r = spawnSync('dotnet', ['bin/Release/net8.0/QldaTtts.Web.dll', ...args], { cwd: APP, env, encoding: 'utf8', timeout: 120000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const vnToday = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const prevMonth = () => { const d = new Date(Date.now() + 7 * 3600e3); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
const thisMonth = () => vnToday().slice(0, 7);

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v110e-'));
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request;

  // 0) Nạp e-work có bằng cấp, khen thưởng, kỷ luật, ngày nghỉ có tên
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/ework_luutru.json'), 'utf8').replace(/^﻿/, ''));
  fx.luutru.RefBangCaps = [{ Id: 'bc1', RefId: 'hs1', RefTableName: 'BangLuongCoBans', TenVanBang: 'Kỹ sư Công nghệ thông tin', DonViCapBang: 'ĐH Bách khoa', SoHieuBang: 'BK-123', NamTotNghiep: 2017, NganhDaoTao: 'CNTT' }];
  fx.luutru.KhenThuongKyLuats = [
    { Id: 'kt1', UserId: 'u2', TenLoaiThuongPhat: 'Khen thưởng', LyDo: '<p>Hoàn thành xuất sắc dự án</p>', SoTien: 2000000, Thang: 6, Nam: 2026 },
    { Id: 'kt2', UserId: 'u2', TenLoaiThuongPhat: 'Phạt đi muộn', LyDo: 'Đi muộn 5 lần', SoTien: 200000, Thang: 7, Nam: 2026 }];
  const FX = path.join(tmp, 'ew.json'); fs.writeFileSync(FX, JSON.stringify(fx));
  let c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk.csv')], { QLDA_MAT_KHAU_CHUNG: 'TriThuc2026' });
  ok(c.code === 0 && c.out.includes('3 mục hồ sơ nhân sự'), 'Nạp e-work (mục hồ sơ) lỗi: ' + c.out);
  c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk2.csv')]);
  ok(c.code === 0 && c.out.includes('0 mục hồ sơ nhân sự'), 'Nạp lại sinh trùng mục hồ sơ: ' + c.out);
  const emps = await (await r.get(BASE + '/api/vp/employees', { headers: H })).json();
  const ttb = emps.find(e => e.name === 'Trần Thị B'); ok(ttb, 'Không có Trần Thị B');
  let recs = await (await r.get(BASE + `/api/vp/employees/${ttb.id}/records`, { headers: H })).json();
  const bc = recs.find(x => x.kind === 'bang-cap'), kl = recs.find(x => x.kind === 'ky-luat'), kt = recs.find(x => x.kind === 'khen-thuong');
  ok(bc && bc.title === 'Kỹ sư Công nghệ thông tin' && bc.org === 'ĐH Bách khoa' && bc.number === 'BK-123' && bc.fromDate === '2017-01-01', 'Bằng cấp chuyển sai: ' + JSON.stringify(bc));
  ok(kt && kt.title === 'Hoàn thành xuất sắc dự án' && kt.amount === 2000000 && kt.fromDate === '2026-06-01', 'Khen thưởng chuyển sai: ' + JSON.stringify(kt));
  ok(kl && kl.amount === 200000, 'Kỷ luật (phạt) chuyển sai: ' + JSON.stringify(kl));
  let vs = await (await r.get(BASE + '/api/vp/settings', { headers: H })).json();
  ok(vs.holidays.includes('2026-09-02 Quốc khánh') && vs.holidays.includes('2026-12-31:s Cuối năm'), 'Ngày nghỉ e-work thiếu tên: ' + JSON.stringify(vs.holidays));

  // 1) Gợi ý ngày lễ theo luật (âm lịch, Ngày Văn hóa 24/11, nghỉ bù)
  const L26 = await (await r.get(BASE + '/api/vp/holidays/legal?year=2026', { headers: H })).json();
  const L27 = await (await r.get(BASE + '/api/vp/holidays/legal?year=2027', { headers: H })).json();
  const has = (l, d, n) => l.some(x => x.date === d && x.name.includes(n));
  ok(['2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'].every(d => has(L26, d, 'Tết Nguyên đán')), 'Tết 2026 sai: ' + JSON.stringify(L26));
  ok(has(L26, '2026-04-26', 'Giỗ Tổ') && has(L26, '2026-11-24', 'Văn hóa') && has(L26, '2026-04-27', 'Nghỉ bù Giỗ Tổ'), 'Giỗ Tổ / 24/11 / nghỉ bù 2026 sai: ' + JSON.stringify(L26));
  ok(['2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09'].every(d => has(L27, d, 'Tết')) && has(L27, '2027-04-16', 'Giỗ Tổ'), 'Âm lịch 2027 sai: ' + JSON.stringify(L27));
  ok(has(L27, '2027-05-01', 'Lao động') && L27.some(x => x.name === 'Nghỉ bù Quốc tế Lao động' && x.date === '2027-05-03'), 'Nghỉ bù 1/5/2027 (thứ Bảy) sai: ' + JSON.stringify(L27));
  ok((await ctx.request.get(BASE + '/api/vp/holidays/legal?year=1990', { headers: H })).status() === 400, 'Nhận năm sai');

  // 2) Lời chúc theo lịch: hôm nay là ngày lễ / ngày làm bù
  const T = vnToday();
  await r.put(BASE + '/api/vp/settings', { headers: H, data: { ...vs, holidays: [...vs.holidays, T + ' Ngày hội công ty', 'sai dòng'], workdays: [] } });
  vs = await (await r.get(BASE + '/api/vp/settings', { headers: H })).json();
  ok(vs.holidays.includes(T + ' Ngày hội công ty') && !vs.holidays.includes('sai dòng'), 'Lưu ngày nghỉ có tên lỗi: ' + JSON.stringify(vs.holidays));
  // ttb đăng nhập bằng mật khẩu chung, đổi mật khẩu
  const ctx2 = await b.newContext(); const q2 = ctx2.request;
  await q2.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: 'TriThuc2026' } });
  await q2.post(BASE + '/api/auth/change-password', { headers: H, data: { old: 'TriThuc2026', password: 'Nhanvien2026' } });
  await q2.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: 'Nhanvien2026' } });
  let st = await (await q2.get(BASE + '/api/vp/state', { headers: H })).json();
  ok(st.day && st.day.kind === 'holiday' && st.day.greeting.startsWith('Ngày hội công ty. ') && st.day.greeting.includes('ngày nghỉ vui vẻ'), 'Lời chúc ngày nghỉ sai: ' + JSON.stringify(st.day));
  const ck = await (await q2.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'office' } })).json();
  ok(ck.lateMinutes === 0 && String(ck.note || '').includes('Đi làm ngày nghỉ'), 'Điểm danh ngày nghỉ vẫn tính muộn: ' + JSON.stringify(ck));
  await r.put(BASE + '/api/vp/settings', { headers: H, data: { ...vs, holidays: vs.holidays.filter(h => !h.startsWith(T)), workdays: [T + ' Làm bù'], greetWork: '' } });
  st = await (await q2.get(BASE + '/api/vp/state', { headers: H })).json();
  ok(st.day.kind === 'work' && st.day.value === 1 && st.day.greeting === 'Chúc ngày làm việc mới vui vẻ, thành công!', 'Lời chúc ngày làm việc sai: ' + JSON.stringify(st.day));

  // 3) Xác nhận lương: chốt tháng trước hôm nay -> mở hạn từ hôm nay 3 ngày; tháng này chưa đến hạn
  const PM = prevMonth(), TM = thisMonth();
  await r.put(BASE + `/api/vp/luong-ho-so/${ttb.id}`, { headers: H, data: { baseSalary: 20000000, allowances: [], noInsurance: false, flatTax: false } });
  await r.post(BASE + `/api/vp/luong/${PM}/chot`, { headers: H, data: { lock: true } });
  await r.post(BASE + `/api/vp/luong/${TM}/chot`, { headers: H, data: { lock: true } });
  st = await (await q2.get(BASE + '/api/vp/state', { headers: H })).json();
  ok(st.payConfirm && st.payConfirm.month === PM, 'Không nhắc xác nhận lương: ' + JSON.stringify(st.payConfirm));
  let mine = await (await q2.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H })).json();
  ok(mine.rows[0] && mine.rows[0].confirmOpen && mine.rows[0].confirmState === 'Chưa xác nhận' && mine.rows[0].confirmFrom === T, 'Hạn xác nhận sai: ' + JSON.stringify(mine.rows[0] && { o: mine.rows[0].confirmOpen, s: mine.rows[0].confirmState, f: mine.rows[0].confirmFrom, t: mine.rows[0].confirmTo }));
  ok((await q2.post(BASE + `/api/vp/luong/${PM}/xac-nhan`, { headers: H, data: { agree: false, feedback: '' } })).status() === 400, 'Kiến nghị trống vẫn nhận');
  ok((await q2.post(BASE + `/api/vp/luong/${TM}/xac-nhan`, { headers: H, data: { agree: true } })).status() === 409, 'Xác nhận lương trước hạn được');
  ok((await q2.post(BASE + `/api/vp/luong/${PM}/xac-nhan`, { headers: H, data: { agree: false, feedback: 'Ngày 12 tôi đi công tác' } })).ok(), 'Gửi kiến nghị lỗi');
  let all = await (await r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H })).json(); let row = all.rows.find(x => x.employeeId === ttb.id);
  ok(row.confirmState === 'Có kiến nghị' && row.feedback === 'Ngày 12 tôi đi công tác', 'Kế toán không thấy kiến nghị: ' + JSON.stringify({ s: row.confirmState, f: row.feedback }));
  const sa = await (await r.get(BASE + '/api/vp/state', { headers: H })).json(); ok(sa.payFeedback === 1, 'Không báo số kiến nghị chờ: ' + sa.payFeedback);
  ok((await q2.post(BASE + `/api/vp/luong/${PM}/${ttb.id}/tra-loi`, { headers: H, data: { reply: 'x' } })).status() === 403, 'Nhân viên tự trả lời kiến nghị');
  ok((await r.post(BASE + `/api/vp/luong/${PM}/${ttb.id}/tra-loi`, { headers: H, data: { reply: 'Đã kiểm tra, ngày 12 tính công tác, bổ sung tháng sau.' } })).ok(), 'Trả lời kiến nghị lỗi');
  mine = await (await q2.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H })).json();
  ok(mine.rows[0].confirmState === 'Đã trả lời kiến nghị' && mine.rows[0].reply.startsWith('Đã kiểm tra'), 'Nhân viên không thấy trả lời');
  ok((await q2.post(BASE + `/api/vp/luong/${PM}/xac-nhan`, { headers: H, data: { agree: true } })).ok(), 'Xác nhận lương lỗi');
  ok((await q2.post(BASE + `/api/vp/luong/${PM}/xac-nhan`, { headers: H, data: { agree: true } })).status() === 409, 'Xác nhận hai lần');
  all = await (await r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H })).json(); row = all.rows.find(x => x.employeeId === ttb.id);
  ok(row.confirmState === 'Đã xác nhận' && row.confirmedAt, 'Trạng thái đã xác nhận sai: ' + row.confirmState);
  st = await (await q2.get(BASE + '/api/vp/state', { headers: H })).json(); ok(!st.payConfirm, 'Vẫn nhắc sau khi đã xác nhận');

  // 4) Hồ sơ nhân sự: thêm mục, đổi phòng ban tự ghi quá trình công tác; nhân viên không sửa được
  ok((await r.put(BASE + `/api/vp/employees/${ttb.id}/records/hs-test1`, { headers: H, data: { kind: 'giay-to', title: 'Giấy khám sức khỏe', fromDate: '2026-01-05' } })).ok(), 'Thêm mục hồ sơ lỗi');
  ok((await r.put(BASE + `/api/vp/employees/${ttb.id}/records/hs-test2`, { headers: H, data: { kind: 'khac', title: 'x' } })).status() === 400, 'Nhận loại mục sai');
  ok((await q2.put(BASE + `/api/vp/employees/${ttb.id}/records/hs-test3`, { headers: H, data: { kind: 'bang-cap', title: 'Tự thêm' } })).status() === 403, 'Nhân viên tự sửa hồ sơ được');
  const own = await (await q2.get(BASE + `/api/vp/employees/${ttb.id}/records`, { headers: H })).json(); ok(own.length === 4, 'Nhân viên không xem được hồ sơ của mình: ' + own.length);
  const depts = await (await r.get(BASE + '/api/vp/departments', { headers: H })).json();
  const full = (await (await r.get(BASE + '/api/vp/employees', { headers: H })).json()).find(e => e.id === ttb.id);
  const other = depts.find(d => d.id !== full.departmentId);
  await r.put(BASE + `/api/vp/employees/${ttb.id}`, { headers: H, data: { ...full, departmentId: other.id, position: 'Trưởng nhóm', education: 'Đại học', emergencyName: 'Trần Văn C', emergencyPhone: '0909' } });
  recs = await (await r.get(BASE + `/api/vp/employees/${ttb.id}/records`, { headers: H })).json();
  const ct = recs.find(x => x.kind === 'cong-tac'); ok(ct && ct.title.includes('Phòng ban:') && ct.title.includes('Trưởng nhóm') && ct.org === other.name, 'Không tự ghi quá trình công tác: ' + JSON.stringify(ct));
  const f2 = (await (await r.get(BASE + '/api/vp/employees', { headers: H })).json()).find(e => e.id === ttb.id);
  ok(f2.education === 'Đại học' && f2.emergencyName === 'Trần Văn C', 'Không lưu lý lịch mới');

  // 5) Giao diện: lời chúc, nhắc lương, hồ sơ nhân sự
  await p.goto(BASE + '/#nhan-su'); await p.reload(); // đổi hash không tải lại trang: tải lại để có dữ liệu mới nạp
  await p.waitForFunction(() => typeof VP !== 'undefined' && VP.st && VP.emps.length > 0, null, { timeout: 20000 });
  await p.evaluate(id => ACT['vp-prof'](id), ttb.id); await p.waitForTimeout(800);
  const ptxt = await p.textContent('.mform'); ok(ptxt.includes('Bằng cấp, chứng chỉ') && ptxt.includes('Kỹ sư Công nghệ thông tin') && ptxt.includes('Quá trình công tác') && ptxt.includes('Tài khoản đăng nhập: ttb'), 'Hồ sơ nhân sự trên giao diện thiếu: ' + ptxt.slice(0, 300));
  await p.evaluate(() => closeModal());
  await p.evaluate(() => { location.hash = '#quan-tri'; }); await p.waitForTimeout(1000);
  ok((await p.textContent('#app')).includes('Hồ sơ nhân sự'), 'Danh sách người dùng không có cột hồ sơ nhân sự');
  const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push('PAGEERR2 ' + e.message));
  await p2.goto(BASE + '/#van-phong'); await p2.waitForSelector('.vp-greet', { timeout: 20000 });
  ok((await p2.textContent('.vp-greet')).includes('Chúc ngày làm việc mới vui vẻ, thành công'), 'Màn hình điểm danh không có lời chúc');
  await p2.goto(BASE + '/#luong'); await p2.waitForTimeout(500); await p2.evaluate(m => { S.f.plm = m; render(); }, PM); await p2.waitForTimeout(1500);
  const lt = await p2.textContent('#app'); ok(lt.includes('Bạn đã xác nhận lương') && lt.includes('Đã kiểm tra, ngày 12'), 'Phiếu lương không hiện xác nhận/trả lời: ' + lt.slice(0, 200));

  await b.close();
  if (errs.length) { console.log('v110e: LỖI\n- ' + errs.join('\n- ')); process.exit(1); }
  console.log('v110e: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
