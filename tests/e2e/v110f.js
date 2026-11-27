// Kiểm thử bản 1.10.4 (đợt 2): công việc dự án → nhiệm vụ → công việc, việc phát sinh, gia hạn, nghiệm thu, KPI theo thiết lập, nhắc việc, chuyển công việc từ e-work.
// node tests/e2e/v110f.js [BASE] [tên CSDL] — cần CSDL trống, máy chủ chạy bằng /tmp/claude-0/run.sh <tên CSDL>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'v110f';
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

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v110f-'));
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request; const J = async x => (await x).json();

  // 0) Nạp e-work: dự án, nhóm việc (nhiệm vụ), công việc (việc phát sinh, phối hợp, gia hạn, hủy)
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/ework_luutru.json'), 'utf8').replace(/^﻿/, ''));
  fx.users.forEach(u => { if (u.Id === 'u4') { u.Status = true; u.IsLock = false; } }); // lvc đang làm việc (phòng Kinh doanh)
  fx.luutru.QuanLyDuAns = [{ Id: 'da1', TenGoiThau: 'Phần mềm một cửa xã X', TenChuDauTu: 'UBND xã X', MaHopDong: 'HD-01', GiaTriHopDong: 500000000, NgayBatDau: '2026-09-01T00:00:00', HanXuLy: '2026-12-31T00:00:00', TenTrangThaiXuLy: 'Đang xử lý' }];
  fx.luutru.NhomViecs = [{ Id: 'nv1', Ten: 'Triển khai giai đoạn 1', RefIdQuanLyDuAn: 'da1', CreatedBy: 'u1' }];
  fx.luutru.QuanLyCongViecs = [
    { Id: 'cv1', NhomViec: 'nv1', TenCongViec: 'Lập hồ sơ mời thầu', NoiDung: '<p>Gói thầu số 3</p>', TenCapDo: 'Quan trọng', HanXuLy: '2026-10-20T00:00:00', NgayHoanThanh: '2026-10-21T00:00:00', TenTrangThaiXuLy: 'Hoàn thành', NguoiXuLy: 'u2', TenNguoiXuLy: 'Trần Thị B', NguoiGiaoViec: 'u1', SoLanGiaHan: 1, CreatedDate: '2026-10-01T08:00:00' },
    { Id: 'cv2', NhomViec: 'nv1', RefTableNameCreate: 'QuanLyCongViecs', TableCreateRefId: 'cv1', TenCongViec: 'Sửa biểu mẫu phát sinh', HanXuLy: '2026-10-23T00:00:00', TenTrangThaiXuLy: 'Đang xử lý', NguoiXuLy: 'u2', CreatedDate: '2026-10-10T08:00:00' },
    { Id: 'cv3', NhomViec: 'nv1', TenCongViec: 'Việc đã hủy', HanXuLy: '2026-10-22T00:00:00', TenTrangThaiXuLy: 'Đã hủy', NguoiXuLy: 'u2' },
    { Id: 'cv4', NhomViec: 'nv1', TenCongViec: 'Cài đặt máy chủ', TenCapDo: 'Khẩn cấp', HanXuLy: '2026-10-15T00:00:00', NgayHoanThanh: '2026-10-15T00:00:00', TenTrangThaiXuLy: 'Hoàn thành', NguoiXuLy: 'u2', ThongTinPhoiHop: '["u4"]' }];
  fx.luutru.TaskMoLais = [{ Id: 'ml1', RefId: 'cv2', RefTableName: 'QuanLyCongViecs' }];
  const FX = path.join(tmp, 'ew.json'); fs.writeFileSync(FX, JSON.stringify(fx));
  let c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk.csv')], { QLDA_MAT_KHAU_CHUNG: 'TriThuc2026' });
  ok(c.code === 0 && c.out.includes('1 dự án, 5 nhiệm vụ và công việc') && c.out.includes('Trạng thái công việc e-work: Hoàn thành: 2'), 'Nạp công việc e-work lỗi: ' + c.out);
  c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk2.csv')]);
  ok(c.code === 0 && c.out.includes('0 dự án, 0 nhiệm vụ và công việc'), 'Nạp lại sinh trùng công việc: ' + c.out);
  const emps = await J(r.get(BASE + '/api/vp/employees', { headers: H }));
  const E = n => emps.find(e => e.name === n); const ttb = E('Trần Thị B'), nva = E('Nguyễn Văn A'), lvc = E('Lê Văn C');
  let all = await J(r.get(BASE + '/api/vp/viec?scope=all&status=all', { headers: H }));
  const T = id => all.rows.find(x => x.id === id);
  const t1 = T('cv-ew-cv1'), t2 = T('cv-ew-cv2'), t3 = T('cv-ew-cv3'), t4 = T('cv-ew-cv4'), nv = T('nv-ew-nv1');
  ok(nv && nv.projectId === 'da-ew-da1' && nv.hasChildren && nv.projectName === 'Phần mềm một cửa xã X', 'Nhiệm vụ e-work sai: ' + JSON.stringify(nv));
  ok(t1 && t1.parentId === 'nv-ew-nv1' && t1.projectId === 'da-ew-da1' && t1.status === 'Hoàn thành' && t1.doneDate === '2026-10-21' && t1.level === 'Quan trọng' && t1.extendCount === 1 && t1.assigneeUserId === ttb.userId && t1.hasChildren, 'Công việc e-work cv1 sai: ' + JSON.stringify(t1));
  ok(t2 && t2.arising && t2.arisingConfirmed && t2.parentId === 'cv-ew-cv1' && t2.projectId === 'da-ew-da1' && t2.status === 'Đang thực hiện' && t2.reopenCount === 1, 'Việc phát sinh e-work sai: ' + JSON.stringify(t2));
  ok(t3 && t3.status === 'Đã hủy', 'Việc hủy e-work sai: ' + JSON.stringify(t3));
  ok(t4 && t4.collaborators.includes(lvc.userId) && t4.level === 'Khẩn cấp', 'Người phối hợp e-work sai: ' + JSON.stringify(t4));
  const data = await J(r.get(BASE + '/api/data', { headers: H }));
  ok(data.tasks.some(x => x.id === 'cv-ew-cv1') && data.projects.some(x => x.id === 'da-ew-da1'), 'Dự án/công việc e-work không có ở phân hệ Dự án');

  // 1) KPI tháng 10/2026 theo thiết lập: nv1 đã chia việc (không tính); cv1 Quan trọng 1,5 trễ 1 ngày (0,75), gia hạn 1 lần (0,9), việc phát sinh không làm mất cv1;
  //    cv2 quá hạn (1 × 0), cv3 hủy, cv4 Khẩn cấp 2 đúng hạn; lvc phối hợp cv4 (2 × 0,3)
  let k = await J(r.get(BASE + '/api/vp/kpi?month=2026-10', { headers: H }));
  const KR = (d, e) => d.rows.find(x => x.employeeId === e.id);
  ok(KR(k, ttb).workAuto && KR(k, ttb).workAuto.total === 3 && KR(k, ttb).workAuto.overdue === 1 && KR(k, ttb).workAuto.late === 1 && KR(k, ttb).workAuto.score === 66.9, 'Điểm công việc tháng 10 sai: ' + JSON.stringify(KR(k, ttb).workAuto));
  ok(KR(k, lvc).workAuto && KR(k, lvc).workAuto.collab === 1 && KR(k, lvc).workAuto.score === 100, 'Điểm phối hợp sai: ' + JSON.stringify(KR(k, lvc).workAuto));
  // Bản 1.10.17: việc báo xong quá 3 ngày làm việc chưa nghiệm thu thì tự Đạt, không nghiệm thu lại được (cv4 xong 15/10)
  { const rr = await r.post(BASE + '/api/vp/viec/cv-ew-cv4/nghiem-thu', { headers: H, data: { quality: 3 } }); ok(rr.status() === 409 && (await rr.text()).includes('tự Đạt'), 'Nghiệm thu việc đã tự Đạt phải bị chặn: ' + rr.status()); }
  k = await J(r.get(BASE + '/api/vp/kpi?month=2026-10', { headers: H }));
  ok(KR(k, ttb).workAuto.score === 66.9 && KR(k, lvc).workAuto.score === 100, 'Việc tự Đạt phải tính như Đạt: ' + JSON.stringify([KR(k, ttb).workAuto, KR(k, lvc).workAuto]));
  // thiết lập động
  const ks = await J(r.get(BASE + '/api/vp/kpi-settings', { headers: H }));
  ok(ks.levels.length === 3 && ks.lateSteps.length === 3 && ks.qualityFactors.length === 5 && ks.collabFactor === 0.3, 'Thiết lập KPI công việc mặc định sai: ' + JSON.stringify(ks));
  ok((await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: { ...ks, qualityFactors: [1, 1, 1, 1] } })).status() === 400, 'Nhận hệ số chất lượng thiếu mức');
  ok((await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: { ...ks, levels: [{ name: 'Bình thường', weight: 1 }, { name: 'Khẩn cấp', weight: 3 }], collabFactor: 0.5 } })).ok(), 'Lưu thiết lập KPI công việc lỗi');
  k = await J(r.get(BASE + '/api/vp/kpi?month=2026-10', { headers: H }));
  ok(KR(k, ttb).workAuto.score === 73.5 && KR(k, lvc).workAuto.score === 100, 'KPI chưa theo hệ số mới ((0,675+3)/5): ' + JSON.stringify(KR(k, ttb).workAuto));
  await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: ks });

  // 2) Giao việc, việc phát sinh, gia hạn, hoàn thành, nghiệm thu, mở lại (trưởng phòng nva, nhân viên ttb, lvc phòng khác)
  const login = async (u) => { const cx = await b.newContext(); const q = cx.request;
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: 'TriThuc2026' } });
    await q.post(BASE + '/api/auth/change-password', { headers: H, data: { old: 'TriThuc2026', password: 'Nhanvien2026' } });
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: 'Nhanvien2026' } }); return cx; };
  const cA = await login('nva'), cB = await login('ttb'), cC = await login('lvc'); const qa = cA.request, qb = cB.request, qc = cC.request;
  const D0 = vnToday();
  let res = await qa.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'Viết tài liệu hướng dẫn', projectId: 'da-ew-da1', assigneeUserId: ttb.userId, collaborators: [lvc.userId], level: 'Quan trọng', due: addDays(D0, 1) } });
  ok(res.ok(), 'Trưởng phòng giao việc lỗi: ' + await res.text()); const G = (await res.json()).id;
  ok((await qa.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'x', assigneeUserId: lvc.userId, due: D0 } })).status() === 403, 'Trưởng phòng giao được cho người phòng khác');
  ok((await qb.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'x', assigneeUserId: nva.userId, due: D0 } })).status() === 403, 'Nhân viên giao được việc');
  // Bản 1.10.17: "Việc của tôi" không cần việc cha; nhân viên tự tạo thì chờ trưởng phòng xác nhận
  { const rr = await qb.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'Phát sinh không cha', due: D0 } }); ok(rr.ok() && (await rr.json()).arising === true, 'Việc của tôi không cần việc cha, phải chờ xác nhận: ' + rr.status()); }
  res = await qb.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'Chụp màn hình minh họa', parentId: G, due: D0 } });
  const P = (await res.json()).id; ok(res.ok() && P, 'Tạo việc phát sinh lỗi');
  let mine = await J(qb.get(BASE + '/api/vp/viec?scope=my&status=all', { headers: H }));
  const pr = mine.rows.find(x => x.id === P); ok(pr && pr.arising && !pr.arisingConfirmed && pr.projectId === 'da-ew-da1' && !pr.canConfirm && pr.canEdit, 'Việc phát sinh chưa kế thừa dự án / quyền: ' + JSON.stringify(pr));
  let rm = await J(qb.get(BASE + '/api/vp/viec/nhac', { headers: H }));
  ok(rm.soon.some(x => x.id === G) && rm.myPending === 2 && rm.kpi && rm.kpi.target === 'B', 'Nhắc việc nhân viên sai: ' + JSON.stringify(rm));
  ok((await qb.post(BASE + `/api/vp/viec/${P}/xac-nhan`, { headers: H, data: { accept: true } })).status() === 403, 'Tự xác nhận việc phát sinh');
  let ra = await J(qa.get(BASE + '/api/vp/viec/nhac', { headers: H }));
  ok(ra.team && ra.team.confirm === 2, 'Trưởng phòng không được nhắc xác nhận việc phát sinh: ' + JSON.stringify(ra.team));
  ok((await qa.post(BASE + `/api/vp/viec/${P}/xac-nhan`, { headers: H, data: { accept: true } })).ok(), 'Trưởng phòng xác nhận lỗi');
  ok((await qa.put(BASE + `/api/vp/viec/${G}`, { headers: H, data: { due: addDays(D0, 4) } })).ok(), 'Gia hạn lỗi');
  let g = (await J(qa.get(BASE + '/api/vp/viec?scope=giao&status=all', { headers: H }))).rows.find(x => x.id === G);
  ok(g.extendCount === 1 && g.originalDue === addDays(D0, 1) && g.due === addDays(D0, 4), 'Gia hạn không lưu hạn ban đầu: ' + JSON.stringify(g));
  ok((await qb.post(BASE + `/api/vp/viec/${G}/trang-thai`, { headers: H, data: { status: 'Hoàn thành' } })).status() === 409, 'Hoàn thành được khi việc con chưa xong');
  ok((await qb.post(BASE + `/api/vp/viec/${P}/trang-thai`, { headers: H, data: { status: 'Hoàn thành', result: 'Đã chụp 12 ảnh' } })).ok(), 'Báo hoàn thành lỗi');
  ok((await qb.post(BASE + `/api/vp/viec/${P}/nghiem-thu`, { headers: H, data: { quality: 5 } })).status() === 403, 'Tự nghiệm thu việc của mình');
  ok((await qa.post(BASE + `/api/vp/viec/${P}/nghiem-thu`, { headers: H, data: { reopen: true, note: 'Thiếu ảnh bước 3' } })).ok(), 'Mở lại lỗi');
  await qb.post(BASE + `/api/vp/viec/${P}/trang-thai`, { headers: H, data: { status: 'Hoàn thành' } });
  await qa.post(BASE + `/api/vp/viec/${P}/nghiem-thu`, { headers: H, data: { quality: 5 } });
  mine = await J(qb.get(BASE + '/api/vp/viec?scope=my&status=all', { headers: H }));
  const p2 = mine.rows.find(x => x.id === P);
  ok(p2.status === 'Hoàn thành' && p2.quality === 5 && p2.reopenCount === 1 && p2.note.includes('Thiếu ảnh bước 3') && p2.note.includes('Đã chụp 12 ảnh'), 'Nghiệm thu / mở lại sai: ' + JSON.stringify(p2));
  ok((await qa.delete(BASE + `/api/vp/viec/${G}`, { headers: H })).status() === 409, 'Xóa được nhiệm vụ còn việc con');
  // Bản 1.10.17: việc phối hợp nằm ở thẻ "Được giao", không ở "Việc của tôi"
  const cs = await J(qc.get(BASE + '/api/vp/viec?scope=duoc&status=all', { headers: H })), cm = await J(qc.get(BASE + '/api/vp/viec?scope=my&status=all', { headers: H }));
  ok(cs.rows.some(x => x.id === G && x.role === 'phoi-hop') && !cs.rows.some(x => x.id === P) && !cm.rows.some(x => x.id === G), 'Người phối hợp không thấy việc ở Được giao / thấy việc không liên quan');
  ok((await qc.put(BASE + `/api/vp/viec/${G}`, { headers: H, data: { name: 'sửa' } })).status() === 403, 'Người phối hợp sửa được việc');
  const ca = await J(qc.get(BASE + '/api/vp/viec?scope=all&status=all', { headers: H }));
  // Bản 1.10.17: việc thuộc dự án mở xem cho người có quyền xem dự án (như tab Công việc của dự án), nhưng không làm/sửa/nghiệm thu được
  { const x = ca.rows.find(x => x.id === 'cv-ew-cv1'); ok(!x || (!x.canEdit && !x.canWork && !x.canReview && !x.canUpdate), 'Nhân viên phòng khác thao tác được việc không liên quan: ' + JSON.stringify(x)); }
  ok((await qb.get(BASE + '/api/vp/viec?scope=dept', { headers: H })).ok(), 'Lọc phòng lỗi');

  // 3) Giao diện: trang Công việc, nhắc việc trên Điểm danh, thiết lập KPI
  await p.goto(BASE + '/#cong-viec'); await p.reload();
  await p.waitForFunction(() => typeof VP !== 'undefined' && VP.st, null, { timeout: 20000 });
  await p.evaluate(() => { S.f.cvs = 'all'; S.f.cvt = 'all'; render(); }); await p.waitForTimeout(1500);
  let txt = await p.textContent('#app');
  ok(txt.includes('Lập hồ sơ mời thầu') && txt.includes('Triển khai giai đoạn 1') && txt.includes('Viết tài liệu hướng dẫn') && txt.includes('gia hạn 1 lần'), 'Trang Công việc thiếu: ' + txt.slice(0, 400));
  await p.evaluate(() => ACT['cv-view']('cv-ew-cv4')); await p.waitForTimeout(600);
  ok((await p.textContent('.mform')).includes('Cài đặt máy chủ'), 'Không mở được chi tiết công việc');
  await p.evaluate(() => closeModal());
  await p.evaluate(() => ACT['cv-new']('give')); await p.waitForTimeout(600);
  ok(await p.$('#f_assigneeUserId') && await p.$('#f_parentId') && await p.$('#f_collaborators'), 'Biểu mẫu giao việc thiếu ô');
  await p.evaluate(() => closeModal());
  // Bản 1.10.29: việc chung của dự án (không chọn gói thầu) phải lưu được qua biểu mẫu
  await p.evaluate(() => ACT['cv-new']('me')); await p.waitForTimeout(600);
  await p.evaluate(d => { const set = (k, v) => { const el = document.querySelector('#f_' + k); if (!el) return; el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); if (el._cbSync) el._cbSync(); };
    set('projectId', 'da-ew-da1'); set('packageId', ''); set('name', 'Việc chung dự án không gói thầu'); { const w = document.querySelector('#f_who'); if (w && w.options.length) set('who', w.options[0].value); } set('due', d); set('assigneeUserId', (document.querySelector('#f_assigneeUserId') || { options: [{}, { value: '' }] }).options[1]?.value || '');
    set('deliverable', 'Báo cáo tổng hợp'); set('criteria', 'Được duyệt'); }, new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
  ok(await p.$eval('#f_packageId', el => el.value === '' && el.options[0].textContent.includes('Việc chung của dự án')), 'Ô gói thầu không có lựa chọn Việc chung của dự án');
  await p.click('.mform button[type=submit]'); await p.waitForTimeout(1500);
  { const e = await p.$('#mform_err'); const et = e ? await e.textContent() : ''; ok(!et, 'Lưu việc chung của dự án báo lỗi: ' + et); }
  await p.evaluate(() => closeModal());
  { const all = await J(r.get(BASE + '/api/vp/viec?scope=all&status=all', { headers: H })); const x = (all.rows || []).find(x => x.name === 'Việc chung dự án không gói thầu');
    ok(x && x.projectId === 'da-ew-da1' && !x.packageId, 'Không tạo được việc chung của dự án: ' + JSON.stringify(x)); }
  await p.evaluate(() => { location.hash = '#kpi'; }); await p.waitForTimeout(1200);
  await p.evaluate(() => ACT['kpi-set']()); await p.waitForTimeout(800);
  ok(await p.$('#f_levels') && await p.$('#f_qualityFactors') && await p.$('#f_collabFactor'), 'Thiết lập KPI thiếu cách tính điểm công việc');
  await p.click('.mform button[type=submit], .mform .btn.primary'); await p.waitForTimeout(1000);
  const ks2 = await J(r.get(BASE + '/api/vp/kpi-settings', { headers: H }));
  ok(JSON.stringify(ks2.levels) === JSON.stringify(ks.levels) && JSON.stringify(ks2.qualityFactors) === JSON.stringify(ks.qualityFactors) && ks2.lateSteps.length === 3, 'Lưu thiết lập KPI qua giao diện làm đổi hệ số: ' + JSON.stringify(ks2));
  const pb = await cB.newPage(); pb.on('pageerror', e => errs.push('PAGEERR-B ' + e.message));
  await pb.goto(BASE + '/#van-phong'); await pb.waitForSelector('.cv-remind', { timeout: 20000 });
  // Bản 1.10.17 (tinh gọn giao diện): trang Nhận nhiệm vụ chỉ nhắc việc, KPI tạm tính xem ở trang Công việc
  ok(!(await pb.textContent('.cv-remind')).includes('KPI tạm tính tháng này'), 'Trang Nhận nhiệm vụ không còn hiện KPI tạm tính');
  await pb.goto(BASE + '/#cong-viec'); await pb.reload(); await pb.waitForSelector('.cv-remind', { timeout: 20000 });
  ok((await pb.textContent('.cv-remind')).includes('KPI tạm tính tháng này'), 'Trang Công việc không có nhắc việc / KPI tạm tính');


  await b.close();
  if (errs.length) { console.log('v110f: LỖI\n- ' + errs.join('\n- ')); process.exit(1); }
  console.log('v110f: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
