// Kiểm thử toàn quy trình bản 1.10.4 (đầu đến cuối): nạp e-work → điểm danh → đề xuất nghỉ (trưởng phòng duyệt) → giao việc, hoàn thành, nghiệm thu → KPI chốt
// → lương chốt → nhân viên xác nhận, kiến nghị, trả lời → Giám đốc duyệt chi (Kế toán không cần) → xuất bảng lương kế toán, danh sách chuyển khoản theo mẫu MB Bank.
// node tests/e2e/v110g.js [BASE] [tên CSDL] — cần CSDL trống, máy chủ chạy bằng /tmp/claude-0/run.sh <tên CSDL>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'v110g';
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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v110g-'));
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

  { const _vs = await (await r.get(BASE + '/api/vp/settings', { headers: H })).json(); const _td = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    await r.put(BASE + '/api/vp/settings', { headers: H, data: { ..._vs, workdays: [...(_vs.workdays || []), _td + ' Ngày kiểm thử'] } }); } // hôm nay luôn là ngày làm việc (ngày nghỉ không mở điểm danh)
  // 2) Điểm danh hôm nay
  const ck = await qb.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'office' } });
  ok(ck.ok(), 'Điểm danh vào lỗi: ' + await ck.text());
  const st = await J(qb.get(BASE + '/api/vp/state', { headers: H })); ok(st.attendance && st.attendance.inAt, 'Không ghi giờ vào: ' + JSON.stringify(st.attendance));

  // 3) Đề xuất nghỉ phép tháng trước, trưởng phòng duyệt
  const d1 = PM + '-10';
  ok((await qb.put(BASE + '/api/vp/requests/dx-e2e1', { headers: H, data: { type: 'Nghỉ phép', fromAt: d1 + 'T08:00:00+07:00', toAt: d1 + 'T17:30:00+07:00', days: 1, reason: 'Việc gia đình' } })).ok(), 'Gửi đề xuất lỗi');
  ok((await qb.post(BASE + '/api/vp/requests/dx-e2e1/decide', { headers: H, data: { action: 'approve' } })).status() === 403, 'Tự duyệt đề xuất');
  ok((await qa.post(BASE + '/api/vp/requests/dx-e2e1/decide', { headers: H, data: { action: 'approve' } })).ok(), 'Trưởng phòng duyệt đề xuất lỗi');

  // 4) Giao việc (hạn trong tháng trước), hoàn thành đúng hạn, nghiệm thu 4 sao
  const due = PM + '-20';
  let res = await qa.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'Báo cáo tiến độ dự án', assigneeUserId: ttb.userId, level: 'Bình thường', startDate: PM + '-01', due } });
  const G = (await res.json()).id; ok(res.ok() && G, 'Giao việc lỗi');
  ok((await qb.post(BASE + `/api/vp/viec/${G}/trang-thai`, { headers: H, data: { status: 'Hoàn thành', doneDate: due, result: 'Đã gửi báo cáo' } })).ok(), 'Báo hoàn thành lỗi');
  ok((await qa.post(BASE + `/api/vp/viec/${G}/nghiem-thu`, { headers: H, data: { quality: 4 } })).ok(), 'Nghiệm thu lỗi');

  // 5) KPI tháng trước: điểm công việc 90 (4 sao), trưởng phòng chấm, chốt
  let k = await J(r.get(BASE + `/api/vp/kpi?month=${PM}`, { headers: H }));
  ok(k.rows.find(x => x.employeeId === ttb.id).workAuto?.score === 90, 'Điểm công việc KPI sai: ' + JSON.stringify(k.rows.find(x => x.employeeId === ttb.id).workAuto));
  ok((await qa.put(BASE + `/api/vp/kpi/${PM}/${ttb.id}`, { headers: H, data: { projectScore: 80, rating: 4 } })).ok(), 'Trưởng phòng chấm KPI lỗi');
  ok((await r.post(BASE + `/api/vp/kpi/${PM}/chot`, { headers: H, data: { lock: true } })).ok(), 'Chốt KPI lỗi');

  // 6) Lương tháng trước: hồ sơ lương, tài khoản ngân hàng, chốt
  for (const [e, sal, acc, bank] of [[ttb, 20000000, '0123456789', 'MB Bank'], [nva, 26000000, '9876543210', 'Vietcombank']]) {
    await r.put(BASE + `/api/vp/luong-ho-so/${e.id}`, { headers: H, data: { baseSalary: sal, allowances: [], noInsurance: false, flatTax: false } });
    const fe = (await J(r.get(BASE + '/api/vp/employees', { headers: H }))).find(x => x.id === e.id);
    ok((await r.put(BASE + `/api/vp/employees/${e.id}`, { headers: H, data: { ...fe, bankAccount: acc, bankName: bank } })).ok(), 'Lưu tài khoản ngân hàng lỗi');
  }
  // 6b) Theo luật: nghỉ việc riêng có lương (Điều 115) không trừ lương, không trừ phép; nghỉ không lương trừ công; tăng ca chủ nhật 200% (Điều 98)
  const sun = (() => { for (let d = 1; d <= 28; d++) { const x = PM + '-' + String(d).padStart(2, '0'); if (new Date(x + 'T00:00:00Z').getUTCDay() === 0) return x; } })();
  const before = (await J(r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }))).rows.find(x => x.employeeId === ttb.id);
  for (const [id, data] of [['dx-e2e2', { type: 'Nghỉ việc riêng có lương', fromAt: PM + '-14T08:00:00+07:00', toAt: PM + '-14T17:30:00+07:00', days: 1, reason: 'Kết hôn' }],
    ['dx-e2e3', { type: 'Nghỉ không lương', fromAt: PM + '-15T08:00:00+07:00', toAt: PM + '-15T17:30:00+07:00', days: 1, reason: 'Việc riêng' }],
    ['dx-e2e4', { type: 'Tăng ca', fromAt: sun + 'T08:00:00+07:00', toAt: sun + 'T10:00:00+07:00', hours: 2, reason: 'Triển khai' }]]) {
    ok((await qb.put(BASE + '/api/vp/requests/' + id, { headers: H, data })).ok(), 'Gửi đề xuất ' + data.type + ' lỗi');
    ok((await qa.post(BASE + `/api/vp/requests/${id}/decide`, { headers: H, data: { action: 'approve' } })).ok(), 'Duyệt ' + data.type + ' lỗi');
  }
  const after = (await J(r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }))).rows.find(x => x.employeeId === ttb.id);
  const hourly = 20000000 / after.standard / 8;
  ok(after.privateLeave === 1 && after.unpaidDays === 1 && after.paid === before.paid - 1 && after.leaveDays === before.leaveDays, 'Nghỉ việc riêng / không lương tính sai: ' + JSON.stringify({ b: before.paid, a: after.paid, pl: after.privateLeave, u: after.unpaidDays, l: after.leaveDays }));
  // 1.10.9: mặc định phiếu duyệt trong tháng nào tính vào lương tháng đó -> tháng trước chưa có, tháng này có
  ok(after.otHours === 0, 'Phiếu tăng ca duyệt tháng này mà tính vào tháng trước: ' + after.otHours);
  const nowRow = (await J(r.get(BASE + `/api/vp/luong?month=${thisMonth()}`, { headers: H }))).rows.find(x => x.employeeId === ttb.id);
  ok(nowRow.otHours === 2 && nowRow.otRest === 2, 'Phiếu tăng ca duyệt tháng này chưa vào lương tháng này: ' + JSON.stringify({ h: nowRow.otHours, r: nowRow.otRest }));
  // Tùy chọn "theo ngày tăng ca" (như e-work): tính vào tháng có ngày tăng ca, chủ nhật 200%
  const ps = await J(r.get(BASE + '/api/vp/luong-settings', { headers: H }));
  ok((await r.put(BASE + '/api/vp/luong-settings', { headers: H, data: { ...ps, otByApproval: false } })).ok(), 'Lưu tùy chọn tăng ca lỗi');
  const after2 = (await J(r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }))).rows.find(x => x.employeeId === ttb.id);
  ok(after2.otHours === 2 && after2.otPay === Math.round(hourly * 2 * 2), 'Tăng ca chủ nhật chưa tính 200%: ' + JSON.stringify({ h: after2.otHours, p: after2.otPay, e: Math.round(hourly * 4) }));
  // 1.10.18: e-work ghi cả Chủ nhật vào danh sách ngày nghỉ ("Chủ Nhật"): vẫn là nghỉ hằng tuần (200%), không phải ngày lễ (300%)
  const vsg = await J(r.get(BASE + '/api/vp/settings', { headers: H }));
  await r.put(BASE + '/api/vp/settings', { headers: H, data: { ...vsg, holidays: [...(vsg.holidays || []), sun + ' Chủ Nhật'] } });
  const after2b = (await J(r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }))).rows.find(x => x.employeeId === ttb.id);
  ok(after2b.otRest === 2 && after2b.otHoliday === 0 && after2b.otPay === after2.otPay, 'Chủ nhật trong danh sách ngày nghỉ bị tính tăng ca ngày lễ: ' + JSON.stringify({ r: after2b.otRest, h: after2b.otHoliday, p: after2b.otPay }));
  await r.put(BASE + '/api/vp/settings', { headers: H, data: vsg });
  // 1.10.11: đơn giá giờ tăng ca tính trên lương chính + phụ cấp (như e-work); tùy chọn chỉ lương chính
  await r.put(BASE + `/api/vp/luong-ho-so/${ttb.id}`, { headers: H, data: { baseSalary: 20000000, allowances: [{ name: 'Phụ cấp trách nhiệm', amount: 2000000, exempt: 0 }], noInsurance: false, flatTax: false } });
  const a3 = (await J(r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }))).rows.find(x => x.employeeId === ttb.id);
  ok(a3.otPay === Math.round(22000000 / a3.standard / 8 * 2 * 2), 'Tăng ca chưa tính trên lương gồm phụ cấp: ' + JSON.stringify({ p: a3.otPay, e: Math.round(22000000 / a3.standard / 8 * 4) }));
  // 1.10.20 (như e-work): ngày không hưởng lương trừ cả phụ cấp theo ngày
  ok(a3.paid < a3.standard && a3.allowanceCut === Math.round(2000000 * (a3.standard - a3.paid) / a3.standard), 'Ngày nghỉ không lương chưa trừ phụ cấp theo ngày: ' + JSON.stringify({ p: a3.paid, s: a3.standard, c: a3.allowanceCut }));
  // 1.10.18: phụ cấp BHXH không tính vào đơn giá tăng ca (e-work: LuongKhongBHXH = lương + phụ cấp − PC BHXH)
  await r.put(BASE + `/api/vp/luong-ho-so/${ttb.id}`, { headers: H, data: { baseSalary: 20000000, allowances: [{ name: 'Phụ cấp trách nhiệm', amount: 2000000, exempt: 0 }, { name: 'PC BHXH', amount: 1500000, exempt: 0 }], noInsurance: false, flatTax: false } });
  const a3b = (await J(r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }))).rows.find(x => x.employeeId === ttb.id);
  ok(a3b.otPay === Math.round(22000000 / a3b.standard / 8 * 2 * 2) && a3b.allowances === 3500000, 'Phụ cấp BHXH không được tính vào đơn giá tăng ca: ' + JSON.stringify({ p: a3b.otPay, a: a3b.allowances }));
  await r.put(BASE + '/api/vp/luong-settings', { headers: H, data: { ...ps, otByApproval: false, otWithAllowances: false } });
  const a4 = (await J(r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }))).rows.find(x => x.employeeId === ttb.id);
  ok(a4.otPay === Math.round(20000000 / a4.standard / 8 * 2 * 2), 'Tùy chọn tăng ca chỉ trên lương chính sai: ' + a4.otPay);
  await r.put(BASE + `/api/vp/luong-ho-so/${ttb.id}`, { headers: H, data: { baseSalary: 20000000, allowances: [], noInsurance: false, flatTax: false } });
  await r.put(BASE + '/api/vp/luong-settings', { headers: H, data: { ...ps, otByApproval: true } });
  const ps0 = await J(r.get(BASE + '/api/vp/luong-settings', { headers: H }));
  ok(ps0.baseWage === 2530000 && ps0.regionMinWage === 5310000 && ps0.otRestRate === 200 && ps0.otHolidayRate === 300, 'Mức lương cơ sở / vùng / tăng ca mặc định chưa đúng 2026: ' + JSON.stringify(ps0));
  ok((await r.post(BASE + `/api/vp/luong/${PM}/chot`, { headers: H, data: { lock: true } })).ok(), 'Chốt lương lỗi');
  let pay = await J(r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }));
  const slipB = pay.rows.find(x => x.employeeId === ttb.id);
  ok(slipB.locked && slipB.kpiGrade && slipB.net > 0 && pay.bank && pay.canApprove, 'Phiếu lương sau chốt sai: ' + JSON.stringify({ l: slipB.locked, g: slipB.kpiGrade, n: slipB.net, b: !!pay.bank }));

  // 7) Nhân viên xác nhận, trưởng phòng kiến nghị; Giám đốc chưa duyệt được khi còn kiến nghị
  ok((await qb.post(BASE + `/api/vp/luong/${PM}/xac-nhan`, { headers: H, data: { agree: true } })).ok(), 'Nhân viên xác nhận lương lỗi');
  ok((await qa.post(BASE + `/api/vp/luong/${PM}/xac-nhan`, { headers: H, data: { agree: false, feedback: 'Thiếu phụ cấp trách nhiệm' } })).ok(), 'Gửi kiến nghị lỗi');
  const gd = { id: 'g-gd', name: 'Ban giám đốc', perms: { 'tong-quan': 'view', 'luong': 'view', 'luong:duyet': '1', 'kpi': 'view' }, admin: false, scope: [] };
  ok((await r.put(BASE + '/api/data/groups/g-gd', { headers: H, data: gd })).ok(), 'Tạo nhóm Ban giám đốc lỗi');
  ok((await r.post(BASE + '/api/users', { headers: H, data: { username: 'giamdoc', name: 'Giám Đốc', groupId: 'g-gd', password: 'Giamdoc2026x' } })).ok(), 'Tạo tài khoản Giám đốc lỗi');
  const cG = await login('giamdoc', 'Giamdoc2026x'); const qg = cG.request;
  const gp = await J(qg.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }));
  ok(gp.canApprove && !gp.canEdit && gp.bank && gp.rows.length >= 2, 'Giám đốc không xem được bảng lương để duyệt: ' + JSON.stringify({ a: gp.canApprove, e: gp.canEdit, n: gp.rows && gp.rows.length }));
  ok((await qg.post(BASE + `/api/vp/luong/${PM}/duyet`, { headers: H, data: { approve: true } })).status() === 409, 'Duyệt chi được khi còn kiến nghị');
  ok((await qb.post(BASE + `/api/vp/luong/${PM}/duyet`, { headers: H, data: { approve: true } })).status() === 403, 'Nhân viên duyệt chi được');
  ok((await r.post(BASE + `/api/vp/luong/${PM}/${nva.id}/tra-loi`, { headers: H, data: { reply: 'Bổ sung vào tháng sau.' } })).ok(), 'Trả lời kiến nghị lỗi');
  res = await qg.post(BASE + `/api/vp/luong/${PM}/duyet`, { headers: H, data: { approve: true } });
  ok(res.ok(), 'Giám đốc duyệt chi lỗi: ' + await res.text());
  ok((await r.post(BASE + `/api/vp/luong/${PM}/chot`, { headers: H, data: { lock: false } })).status() === 409, 'Mở chốt được khi đã duyệt chi');
  pay = await J(r.get(BASE + `/api/vp/luong?month=${PM}`, { headers: H }));
  ok(pay.rows.filter(x => x.locked).every(x => x.approvedAt && x.approvedBy === 'Giám Đốc'), 'Không lưu người duyệt chi');
  const logs = await J(r.get(BASE + '/api/data', { headers: H })); ok(logs.logs.some(l => l.action === 'Duyệt chi bảng lương' && l.username === 'giamdoc'), 'Nhật ký không ghi duyệt chi');

  // 8) Giao diện: xuất danh sách chuyển khoản theo mẫu MB Bank, bảng lương kế toán, PDF
  await p.goto(BASE + '/#luong'); await p.reload();
  await p.waitForFunction(() => typeof VP !== 'undefined' && VP.st, null, { timeout: 20000 });
  await p.evaluate(m => { S.f.plm = m; render(); }, PM); await p.waitForTimeout(1500);
  const ht = await p.textContent('#app'); ok(ht.includes('Đã duyệt chi') && ht.includes('Danh sách chuyển khoản ngân hàng') && ht.includes('Bảng lương kế toán (Excel)'), 'Trang lương thiếu trạng thái/nút: ' + ht.slice(0, 300));
  let [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.evaluate(()=>document.querySelectorAll('details.xmenu').forEach(d=>d.open=true)).then(()=>p.click('[data-act="pay-bank"]'))]);
  const fb = path.join(tmp, 'bank.xlsx'); await dl.saveAs(fb);
  ok(dl.suggestedFilename() === `ChuyenLuong-T${PM.slice(5)}.${PM.slice(0, 4)}.xlsx`, 'Tên tệp chuyển khoản: ' + dl.suggestedFilename());
  const MM = PM.slice(5), YY = PM.slice(0, 4);
  const out = py(`import openpyxl,sys,json
ws=openpyxl.load_workbook(sys.argv[1]).active
rows=[[c.value for c in r] for r in ws.iter_rows(min_row=3) if r[0].value is not None]
print(json.dumps({'title':ws['B1'].value,'merged':[str(x) for x in ws.merged_cells.ranges],'h':[ws.cell(2,i).value for i in range(1,7)],'rows':rows,'fmtB':ws['B3'].number_format,'typeB':type(ws['B3'].value).__name__,'fill':ws['A2'].fill.fgColor.rgb}, ensure_ascii=False))`, fb);
  let bx = null; try { bx = JSON.parse(out); } catch (e) { errs.push('Không đọc được tệp chuyển khoản: ' + out); }
  if (bx) {
    ok(bx.title === 'DANH SÁCH GIAO DỊCH\n(LIST OF TRANSACTIONS)' && bx.merged.includes('B1:F1') && bx.fill === 'FFD8DAD9', 'Tiêu đề mẫu MB sai: ' + JSON.stringify(bx));
    ok(bx.h[0].startsWith('STT\n(Ord. No.)') && bx.h[1].startsWith('Số tài khoản\n(Account No.)') && bx.h[2].startsWith('Tên đơn vị thụ hưởng') && bx.h[3].startsWith('Ngân hàng thụ hưởng/Chi nhánh') && bx.h[4].startsWith('Số tiền') && bx.h[5].startsWith('Chi tiết thanh toán'), 'Cột mẫu MB sai: ' + JSON.stringify(bx.h));
    const rb = bx.rows.find(x => x[2] === 'Trần Thị B');
    ok(rb && rb[1] === '0123456789' && bx.typeB === 'str' && rb[3] === 'MB Bank' && rb[4] === slipB.net && rb[5] === `TRI THUC THANH TOAN LUONG T${MM}.${YY}`, 'Dòng chuyển khoản sai: ' + JSON.stringify(bx.rows));
    ok(bx.rows.length === pay.rows.filter(x => x.locked && x.net > 0).length && !bx.rows.some(x => x[2] === 'TỔNG CỘNG'), 'Số dòng chuyển khoản sai / có dòng tổng: ' + bx.rows.length);
  }
  [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.evaluate(()=>document.querySelectorAll('details.xmenu').forEach(d=>d.open=true)).then(()=>p.click('[data-act="pay-xlsx"]'))]);
  const fa = path.join(tmp, 'acc.xlsx'); await dl.saveAs(fa);
  const ao = py(`import openpyxl,sys
ws=openpyxl.load_workbook(sys.argv[1]).active
print('|'.join(str(c.value) for r in ws.iter_rows(max_row=6) for c in r if c.value is not None))`, fa);
  ok(ao.includes('BẢNG THANH TOÁN TIỀN LƯƠNG') && ao.includes('BHXH') && ao.includes('Thuế TNCN') && ao.includes('Thực lĩnh') && ao.includes('Chi phí công ty'), 'Bảng lương kế toán thiếu cột: ' + ao.slice(0, 300));
  await p.evaluate(() => ACT['pay-acc-pdf']()); await p.waitForTimeout(800);
  const pdfHtml = await p.evaluate(() => { const f = document.querySelector('iframe[title="In bảng lương"]'); return f ? f.contentDocument.body.innerText : ''; });
  ok(pdfHtml.includes('BẢNG THANH TOÁN TIỀN LƯƠNG') && pdfHtml.includes('GIÁM ĐỐC') && pdfHtml.includes('KẾ TOÁN TRƯỞNG') && pdfHtml.includes('Ký nhận'), 'Bản in bảng lương kế toán thiếu: ' + pdfHtml.slice(0, 200));
  // Giám đốc hủy duyệt thì kế toán mở chốt được
  ok((await qg.post(BASE + `/api/vp/luong/${PM}/duyet`, { headers: H, data: { approve: false } })).ok(), 'Hủy duyệt chi lỗi');
  ok((await r.post(BASE + `/api/vp/luong/${PM}/chot`, { headers: H, data: { lock: false } })).ok(), 'Mở chốt sau hủy duyệt lỗi');

  // 9) Đối chiếu lương với bảng lương e-work (dòng lệnh trên máy chủ, ghi CSV)
  const dc = cli(['--doi-chieu-luong', PM, '--ra', path.join(tmp, 'dc.csv')]);
  const dcsv = fs.existsSync(path.join(tmp, 'dc.csv')) ? fs.readFileSync(path.join(tmp, 'dc.csv'), 'utf8') : '';
  ok(dc.code === 0 && dc.out.includes('1 người trên e-work, 0 khớp, 1 có lệch') && dcsv.includes('Trần Thị B') && dcsv.includes('Lương cơ bản'), 'Đối chiếu lương e-work lỗi: ' + dc.out + dcsv.slice(0, 200));
  ok(cli(['--doi-chieu-luong', '2020-01']).code === 1, 'Đối chiếu tháng không có dữ liệu vẫn chạy');

  await b.close();
  if (errs.length) { console.log('v110g: LỖI\n- ' + errs.join('\n- ')); process.exit(1); }
  console.log('v110g: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
