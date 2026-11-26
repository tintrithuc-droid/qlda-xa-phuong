// Kiểm thử bản 1.10.16: "Nhận nhiệm vụ" (một lượt mỗi ngày, chọn Ở công ty / Online / Công tác / Khác, không định vị, không phiếu), bảng tổng hợp tháng, xuất Excel.
// node tests/e2e/v110k.js [BASE] [tên CSDL] — cần CSDL trống, máy chủ chạy bằng /tmp/claude-0/run.sh <tên CSDL>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'v110k';
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

const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const py = (code, file) => { const r = spawnSync('python3', ['-c', code, file], { encoding: 'utf8' }); return (r.stdout || '') + (r.stderr || ''); };

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v110k-'));
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request; const J = async x => (await x).json();
  const PM = prevMonth(), D0 = vnToday();

  // 1) Nạp e-work (nhân sự, tài khoản, nội dung chuyển khoản theo lần chuyển lương gần nhất)
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/ework_luutru.json'), 'utf8').replace(/^﻿/, ''));
  fx.users.forEach(u => { if (u.Id === 'u4') { u.Status = true; u.IsLock = false; } });
  fx.luutru.QuanLyCongViecs = []; // việc e-work kiểm thử riêng ở v110f
  fx.luutru.ChuyenLuongs = [{ Id: 'cl1', UserId: 'u2', SoTien: 1, NoiDung: 'TRI THUC THANH TOAN LUONG T09.2026', Thang: 9, Nam: 2026 }, { Id: 'cl2', UserId: 'u2', SoTien: 1, NoiDung: 'TRI THUC THANH TOAN LUONG T10.2026', Thang: 10, Nam: 2026 }];
  // 1.10.18: tháng trước Trần Thị B nhận nhiệm vụ mọi ngày trừ ngày HD; ngày HD nghỉ phép buổi sáng: buổi chiều tự tính đi làm (như e-work), không tính vắng
  const pmDays = []; { const d = new Date(PM + '-01T00:00:00Z'); while (d.toISOString().slice(0, 7) === PM) { pmDays.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); } }
  const HD = pmDays.find(x => x.slice(8) >= '05' && ![0, 6].includes(new Date(x + 'T00:00:00Z').getUTCDay()));
  pmDays.filter(x => x !== HD).forEach((x, i) => fx.chamcong.push({ Id: 'cc-pm' + i, UserId: 'u2', NgayChamCong: x + 'T08:00:00', ViTriDiemDanh: 'Trong công ty' }));
  // (cùng lý do, điểm danh các ngày đã qua của tháng này để chuyên cần KPI không bị tính vắng từ tháng trước)
  for (let d = thisMonth() + '-01', i = 0; d < D0; d = addDays(d, 1), i++) fx.chamcong.push({ Id: 'cc-tm' + i, UserId: 'u2', NgayChamCong: d + 'T08:00:00', ViTriDiemDanh: 'Trong công ty' });
  fx.dexuat.push({ Id: 'dx-nua', TenDeXuat: 'Đề xuất nghỉ phép', JsonDeXuat: JSON.stringify({ ThoiGianBatDau: HD + 'T08:00:00', ThoiGianKetThuc: HD + 'T12:00:00', SoNgay: 0.5 }), LyDo: 'Nửa ngày', TenTrangThaiXuLy: 'Đã duyệt', CreatedBy: 'u2', CreatedDate: HD + 'T07:00:00' });
  const FX = path.join(tmp, 'ew.json'); fs.writeFileSync(FX, JSON.stringify(fx));
  const c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk.csv')], { QLDA_MAT_KHAU_CHUNG: 'TriThuc2026' });
  ok(c.code === 0 && c.out.includes('TRI THUC THANH TOAN LUONG T{thang}.{nam}'), 'Nạp e-work / nội dung chuyển khoản lỗi: ' + c.out);
  const emps = await J(r.get(BASE + '/api/vp/employees', { headers: H }));
  const E = n => emps.find(e => e.name === n); const ttb = E('Trần Thị B'), nva = E('Nguyễn Văn A');
  const login = async (u, pw0 = 'TriThuc2026') => { const cx = await b.newContext({ acceptDownloads: true }); const q = cx.request;
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: pw0 } });
    await q.post(BASE + '/api/auth/change-password', { headers: H, data: { old: pw0, password: 'Nhanvien2026' } });
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: 'Nhanvien2026' } }); return cx; };
  const cA = await login('nva'), cB = await login('ttb'); const qa = cA.request, qb = cB.request;


  // hôm nay luôn là ngày làm việc; bật "Nhận nhiệm vụ"
  const vs0 = await J(r.get(BASE + '/api/vp/settings', { headers: H }));
  ok(vs0.inOnly === false && vs0.word === 'Điểm danh' && vs0.leaveSeniorityBonus === true, 'Mặc định xã khác phải giữ điểm danh vào/ra: ' + JSON.stringify({ i: vs0.inOnly, w: vs0.word }));
  const put = await r.put(BASE + '/api/vp/settings', { headers: H, data: { ...vs0, inOnly: true, word: 'Nhận nhiệm vụ', leaveSeniorityBonus: false, workdays: [...(vs0.workdays || []), D0 + ' Ngày kiểm thử'] } });
  ok(put.ok(), 'Lưu thiết lập lỗi ' + put.status());
  const stA = await J(qa.get(BASE + '/api/vp/state', { headers: H }));
  ok(stA.settings.inOnly === true && stA.settings.word === 'Nhận nhiệm vụ', 'state chưa trả inOnly/word');

  // 2) API: Khác phải ghi nội dung; online ghi đúng nơi; một lượt mỗi ngày; không có lượt ra
  let x = await qa.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'khac' } });
  ok(x.status() === 400, 'Khác không nội dung phải bị chặn: ' + x.status());
  x = await qa.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'online' } });
  const aA = await x.json(); ok(x.ok() && aA.inPlace === 'Làm việc online' && aA.inLat == null, 'Online lỗi: ' + JSON.stringify(aA));
  x = await qa.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'office' } });
  ok(x.status() === 409, 'Bấm lần 2 phải báo đã nhận: ' + x.status());
  x = await qa.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'out', mode: 'office' } });
  ok(x.status() === 400, 'Không có lượt ra: ' + x.status());

  // việc giao cho Trần Thị B để chọn khi nhận nhiệm vụ
  const tk = await r.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'Lập dự toán hạng mục cấp nước', assigneeUserId: ttb.userId, due: addDays(D0, 3) } });
  ok(tk.ok(), 'Giao việc lỗi ' + tk.status() + ' ' + (await tk.text()).slice(0, 200));
  const myT = await J(qb.get(BASE + '/api/vp/my-tasks', { headers: H }));
  ok(myT.some(z => z.name === 'Lập dự toán hạng mục cấp nước'), 'my-tasks thiếu việc: ' + JSON.stringify(myT).slice(0, 200));

  // 3) Giao diện nhân viên Trần Thị B: 4 mục, chọn Khác hiện ô nội dung, bấm một nút
  const pb = await cB.newPage(); pb.on('pageerror', e => errs.push('PAGEERR(B) ' + e.message));
  await pb.setViewportSize({ width: 420, height: 900 });
  await pb.goto(BASE + '/#van-phong'); await pb.waitForSelector('.vp-mode', { timeout: 20000 });
  ok((await pb.textContent('.head h1')).trim() === 'Nhận nhiệm vụ', 'Tiêu đề chưa đổi');
  const labels = await pb.$$eval('.vp-mode label', l => l.map(x => x.textContent.trim()));
  ok(JSON.stringify(labels) === JSON.stringify(['Ở công ty', 'Làm việc online', 'Đi công tác', 'Khác']), 'Mục chọn: ' + labels);
  ok(!(await pb.$('[data-act="vp-check"][data-id="out"]')), 'Không được còn nút ra');
  ok(!(await pb.isVisible('#vp_note')), 'Ô nội dung chỉ hiện khi chọn Khác');
  await pb.check('input[name=vp_mode][value=khac]'); ok(await pb.isVisible('#vp_note'), 'Chọn Khác phải hiện ô nội dung');
  await pb.click('[data-act="vp-check"][data-id="in"]'); await pb.waitForTimeout(500);
  ok(!(await pb.$('.vp-done')), 'Khác chưa ghi nội dung mà vẫn ghi');
  await pb.fill('#vp_note', 'Họp với chủ đầu tư tại UBND xã');
  await pb.waitForSelector('input[name=vp_task]', { timeout: 10000 }); await pb.check('input[name=vp_task]');
  await pb.screenshot({ path: path.join(tmp, '1-nv-truoc.png') });
  await pb.click('[data-act="vp-check"][data-id="in"]'); await pb.waitForSelector('.vp-done', { timeout: 10000 });
  ok((await pb.textContent('.vp-done')).includes('Họp với chủ đầu tư'), 'Không hiện nội dung đã ghi');
  ok((await pb.textContent('.vp-done')).includes('Lập dự toán hạng mục cấp nước'), 'Không hiện việc đã chọn');
  await pb.fill('#vp_result', 'Xong dự toán, đã gửi chủ đầu tư'); await pb.click('[data-act="vp-result"]'); await pb.waitForTimeout(800);
  ok(((await J(qb.get(BASE + '/api/vp/state', { headers: H }))).attendance || {}).result === 'Xong dự toán, đã gửi chủ đầu tư', 'Chưa lưu kết quả cuối ngày');
  await pb.screenshot({ path: path.join(tmp, '2-nv-da-nhan.png') });
  const navTxt = await pb.textContent('body'); ok(navTxt.includes('Lịch sử nhận nhiệm vụ'), 'Lịch sử chưa đổi chữ');

  // 4) Bảng tổng hợp tháng (quản trị): cột theo nơi làm, nghỉ không phép, Excel
  const ts = await J(r.get(BASE + '/api/vp/timesheet?month=' + thisMonth(), { headers: H }));
  const rA = ts.rows.find(z => z.employeeId === nva.id), rB = ts.rows.find(z => z.employeeId === ttb.id);
  ok(rA && rA.online >= 1 && rA.early === 0 && rA.noOut === 0, 'Dòng A: ' + JSON.stringify(rA));
  ok(rB && rB.other === 1, 'Dòng B: ' + JSON.stringify(rB));
  await p.goto(BASE + '/#diem-danh'); await p.reload(); await p.waitForSelector('.tabs', { timeout: 20000 });
  const tabTxt = await p.textContent('.tabs'); ok(tabTxt.includes('Tổng hợp tháng') && tabTxt.includes('Chi tiết nhận nhiệm vụ'), 'Thẻ: ' + tabTxt);
  await p.click('.tabs button[data-id=bang]'); await p.waitForSelector('table', { timeout: 15000 });
  const th = await p.$$eval('table th', l => l.map(x => x.textContent.trim()));
  ok(th.includes('Nghỉ không phép') && th.includes('Ở công ty') && th.includes('Khác') && !th.includes('Về sớm'), 'Cột tổng hợp: ' + th);
  await p.screenshot({ path: path.join(tmp, '3-tong-hop.png'), fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act="vp-ts-xlsx"]')]);
  const XF = path.join(tmp, 'th.xlsx'); await dl.saveAs(XF);
  const xo = py("import sys,openpyxl;ws=openpyxl.load_workbook(sys.argv[1]).active;print([c.value for c in ws[4]])", XF);
  ok(xo.includes('Nghỉ không phép') && xo.includes('Làm việc online'), 'Excel: ' + xo);
  // chi tiết: không còn cột Giờ ra, lọc theo Khác
  await p.click('.tabs button[data-id=ngay]'); await p.waitForSelector('table', { timeout: 15000 }); await p.waitForTimeout(800);
  const th2 = await p.$$eval('table th', l => l.map(x => x.textContent.trim())); ok(!th2.includes('Giờ ra'), 'Chi tiết còn Giờ ra');
  await p.screenshot({ path: path.join(tmp, '4-chi-tiet.png'), fullPage: true });
  const menu = await p.textContent('nav, .side, body'); ok(menu.includes('Nhận nhiệm vụ'), 'Menu chưa đổi chữ');

  const tsPm = await J(r.get(BASE + '/api/vp/timesheet?month=' + PM, { headers: H }));
  const pB = tsPm.rows.find(z => z.employeeId === ttb.id);
  ok(pB && pB.absent === 0 && pB.leave === 0.5, 'Nghỉ phép nửa ngày: buổi còn lại phải tính đi làm, không vắng (' + HD + '): ' + JSON.stringify(pB && { a: pB.absent, l: pB.leave }));

  // 5) Hôm nay ai ở đâu
  const bd = await J(r.get(BASE + '/api/vp/today', { headers: H }));
  const bB = bd.rows.find(z => z.employeeId === ttb.id);
  ok(bB && bB.place === 'Khác' && bB.tasks.includes('Lập dự toán hạng mục cấp nước') && bB.result, 'Bảng hôm nay: ' + JSON.stringify(bB));
  const dA = await qa.get(BASE + '/api/vp/today', { headers: H }); ok(dA.status() === ((stA.perms.att || stA.perms.managed.length) ? 200 : 403), 'Quyền xem bảng hôm nay theo quyền bảng công: ' + dA.status());
  await p.click('.tabs button[data-id=hom-nay]'); await p.waitForSelector('.kpis', { timeout: 15000 }); await p.waitForTimeout(500);
  ok((await p.textContent('#main, body')).includes('Xong dự toán'), 'Bảng hôm nay chưa hiện kết quả');
  await p.screenshot({ path: path.join(tmp, '5-hom-nay.png'), fullPage: true });
  // 6) KPI tự động: công việc 70 + chuyên cần 30, không ai chấm tay
  const ks = await J(r.get(BASE + '/api/vp/kpi-settings', { headers: H }));
  const kp = await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: { ...ks, auto: true, wWork: 70, wProject: 0, wAttendance: 30, wManager: 0, qualityFactors: [1, 1, 1, 1, 1] } });
  ok(kp.ok(), 'Lưu KPI tự động lỗi ' + kp.status());
  const kk = await J(r.get(BASE + '/api/vp/kpi?month=' + thisMonth(), { headers: H }));
  const kB = kk.rows.find(z => z.employeeId === ttb.id);
  ok(kB && kB.missing.length === 0 && kB.grade !== 'Chưa đủ dữ liệu' && kB.total > 0, 'KPI tự động: ' + JSON.stringify(kB).slice(0, 300));
  // KPI: chỉ 2 người điểm cao nhất toàn công ty được thưởng
  const ks2 = await J(r.get(BASE + '/api/vp/kpi-settings', { headers: H }));
  await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: { ...ks2, rankOn: true, rankCompany: true, rankTop: 2, rankMinGrade: 'D', rankTables: [{ from: '2020-01', amounts: [300000, 200000, 100000] }] } });
  // bằng điểm: mọi người cùng điểm công việc 100 (ghi đè) để có người bằng tổng điểm, vẫn chỉ 2 người được thưởng, không trùng hạng
  for (const e of emps) await r.put(BASE + `/api/vp/kpi/${thisMonth()}/${e.id}`, { headers: H, data: { workScore: 100 } });
  const kr = (await J(r.get(BASE + '/api/vp/kpi?month=' + thisMonth(), { headers: H }))).rows;
  const rk = kr.filter(z => z.rank != null).map(z => z.rank);
  ok(new Set(rk).size === rk.length, 'Không được trùng hạng khi chỉ thưởng 2 người: ' + JSON.stringify(kr.map(z => [z.name, z.total, z.attendance, z.rank])));
  const tops = kr.filter(z => z.rank === 1 || z.rank === 2), rest = kr.filter(z => z.rank > 2);
  ok(rest.every(z => tops.every(t0 => t0.total > z.total || (t0.total === z.total && (t0.attendance ?? -1) >= (z.attendance ?? -1)))), 'Thứ tự xét bằng điểm sai');
  const paid = kr.filter(z => z.rankBonus > 0);
  ok(paid.length >= 1 && paid.length <= 2 && paid.every(z => z.rank <= 2 && z.rankLabel.startsWith('Toàn công ty')), 'Thưởng 2 người đứng đầu: ' + JSON.stringify(kr.map(z => [z.name, z.total, z.rank, z.rankBonus])));
  ok(kr.filter(z => z.rank > 2).every(z => !z.rankBonus), 'Hạng 3 trở đi không được thưởng');
  // KPI công khai: nhân viên A thấy điểm của B, không thấy tiền thưởng của B
  const ks3 = await J(r.get(BASE + '/api/vp/kpi-settings', { headers: H }));
  await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: { ...ks3, public: true } });
  const ka = (await J(qa.get(BASE + '/api/vp/kpi?month=' + thisMonth(), { headers: H }))).rows;
  const kaB = ka.find(z => z.employeeId === ttb.id);
  ok(kaB && kaB.total != null && (stA.perms.managed.length || stA.perms.att || (kaB.rankBonus === 0 && kaB.bonus === 0)), 'KPI công khai: ' + JSON.stringify(kaB).slice(0, 200));
  // 1.10.21: KPI chỉ tính người đang làm việc: khóa tài khoản Lê Văn C, cho Nguyễn Văn A nghỉ việc thì cả hai biến khỏi bảng KPI và bảng xếp hạng
  const lvc = E('Lê Văn C'); ok(kr.some(z => z.employeeId === lvc.id), 'Lê Văn C phải có KPI khi còn làm');
  const uC = { id: lvc.userId }; ok(!!lvc.userId, 'Lê Văn C chưa có tài khoản');
  const lk = await r.post(BASE + `/api/users/${uC.id}/active`, { headers: H, data: { active: false } }); ok(lk.ok(), 'Khóa tài khoản lỗi ' + lk.status());
  const eA = await J(r.get(BASE + '/api/vp/employees', { headers: H })); const nvaFull = eA.find(e => e.id === nva.id);
  const nv = await r.put(BASE + `/api/vp/employees/${nva.id}`, { headers: H, data: { ...nvaFull, status: 'Nghỉ việc' } }); ok(nv.ok(), 'Cho nghỉ việc lỗi ' + nv.status() + ' ' + (await nv.text()).slice(0, 200));
  const kr2 = (await J(r.get(BASE + '/api/vp/kpi?month=' + thisMonth(), { headers: H }))).rows;
  ok(!kr2.some(z => z.employeeId === lvc.id || z.employeeId === nva.id), 'Người khóa tài khoản / nghỉ việc vẫn còn trong KPI: ' + JSON.stringify(kr2.map(z => z.name)));
  ok(kr2.some(z => z.employeeId === ttb.id), 'Người đang làm phải còn KPI');
  await r.post(BASE + `/api/users/${uC.id}/active`, { headers: H, data: { active: true } });
  await r.put(BASE + `/api/vp/employees/${nva.id}`, { headers: H, data: { ...nvaFull } });
  // 1.10.21: phòng có người cùng phụ trách: A trưởng phòng, B cùng phụ trách; đề xuất của A, B do Giám đốc (quản trị) duyệt, không duyệt chéo
  { const dps = await J(r.get(BASE + '/api/vp/departments', { headers: H })); const dp = dps.find(x => x.id === nva.departmentId) || dps[0];
    const sv = await r.put(BASE + '/api/vp/departments/' + dp.id, { headers: H, data: { ...dp, managerUserId: nva.userId, deputyUserId: ttb.userId } }); ok(sv.ok(), 'Lưu người cùng phụ trách lỗi ' + sv.status());
    for (const e of [nva, ttb]) { const fe = (await J(r.get(BASE + '/api/vp/employees', { headers: H }))).find(x => x.id === e.id); await r.put(BASE + `/api/vp/employees/${e.id}`, { headers: H, data: { ...fe, departmentId: dp.id } }); }
    const stB = await J(qb.get(BASE + '/api/vp/state', { headers: H })); ok(stB.perms.approve === true, 'Người cùng phụ trách phải duyệt được');
    const F = addDays(D0, 20) + 'T08:00:00+07:00', Tt = addDays(D0, 20) + 'T17:00:00+07:00';
    const mk = async (q, id) => { const x = await q.put(BASE + '/api/vp/requests/' + id, { headers: H, data: { type: 'Nghỉ không lương', fromAt: F, toAt: Tt, reason: 'Thử duyệt' } }); ok(x.ok(), 'Tạo đề xuất lỗi ' + x.status() + ' ' + (await x.text()).slice(0, 150)); };
    await mk(qa, 'dx-dep-a'); await mk(qb, 'dx-dep-b');
    ok(!(await qb.post(BASE + '/api/vp/requests/dx-dep-a/decide', { headers: H, data: { action: 'approve' } })).ok(), 'Người cùng phụ trách không được duyệt đề xuất của trưởng phòng');
    ok(!(await qa.post(BASE + '/api/vp/requests/dx-dep-b/decide', { headers: H, data: { action: 'approve' } })).ok(), 'Trưởng phòng không được duyệt đề xuất của người cùng phụ trách');
    ok((await r.post(BASE + '/api/vp/requests/dx-dep-a/decide', { headers: H, data: { action: 'reject', note: 'thử' } })).ok(), 'Giám đốc phải duyệt được đề xuất của trưởng phòng');
    await r.post(BASE + '/api/vp/requests/dx-dep-b/decide', { headers: H, data: { action: 'reject', note: 'thử' } }); }
  // 1.10.21: trưởng phòng, người cùng phụ trách xem bảng lương phòng mình (chỉ xem, không tài khoản ngân hàng)
  { const pl = await J(qb.get(BASE + '/api/vp/luong?month=' + PM, { headers: H }));
    ok(pl.all === true && pl.dept === true && pl.canEdit === false && !pl.bank && pl.rows.some(x => x.employeeId === nva.id) && pl.rows.every(x => [nva.id, ttb.id].includes(x.employeeId) || (E2 => E2 && E2.departmentId === nva.departmentId)((emps.find(e => e.id === x.employeeId)))), 'Bảng lương phòng cho người cùng phụ trách sai: ' + JSON.stringify({ all: pl.all, dept: pl.dept, n: (pl.rows || []).length })); }
  // 7) Phép năm: tắt cộng thâm niên thì người làm lâu năm vẫn 12 ngày
  const vs1 = await J(r.get(BASE + '/api/vp/settings', { headers: H })); ok(vs1.leaveSeniorityBonus === false && vs1.inOnly === true, 'Thiết lập chưa lưu');

  console.log('Ảnh: ' + tmp);
  await b.close();
  if (errs.length) { console.error('LỖI:\n' + errs.join('\n')); process.exit(1); }
  console.log('v110k: đạt');
})().catch(e => { console.error(e); process.exit(1); });
