// Kiểm thử bản 1.10.4: phân quyền theo vai trò doanh nghiệp (Nhân viên, Trưởng phòng, Kế toán, Ban giám đốc).
// Nhân viên chỉ thấy dữ liệu Văn phòng của mình; thông tin dự án mở cho mọi vai trò (chỉ xem); tài khoản chưa có nhóm không nhận dữ liệu dự án.
// node tests/e2e/v110h.js [BASE] [tên CSDL] — cần CSDL trống, máy chủ chạy bằng /tmp/claude-0/run.sh <tên CSDL>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'v110h';
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
const thisMonth = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v110h-'));
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request; const J = async x => (await x).json();

  // 1) Nạp e-work: thêm Kế toán, Giám đốc, một tài khoản quản trị e-work
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/ework_luutru.json'), 'utf8').replace(/^\uFEFF/, ''));
  const base = fx.users.find(u => u.Id === 'u2');
  fx.users.push({ ...base, Id: 'u5', UserName: 'ktoan', Email: 'ktoan@tt.vn', FullName: 'Phạm Kế Toán', RoleName: 'KETOAN', PhongBan: 'pb-kd' });
  fx.users.push({ ...base, Id: 'u6', UserName: 'giamdoc', Email: 'gd@tt.vn', FullName: 'Đỗ Giám Đốc', RoleName: 'GIAMDOC', PhongBan: 'pb-kd' });
  fx.users.push({ ...base, Id: 'u7', UserName: 'qtew', Email: 'qt@tt.vn', FullName: 'Quản Trị Cũ', RoleName: 'ADMIN', PhongBan: 'pb-kd' });
  fx.luutru.QuanLyCongViecs = [];
  const FX = path.join(tmp, 'ew.json'); fs.writeFileSync(FX, JSON.stringify(fx));
  const c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk.csv')], { QLDA_MAT_KHAU_CHUNG: 'TriThuc2026' });
  ok(c.code === 0 && /4 nhóm vai trò mới/.test(c.out), 'Nạp e-work / tạo nhóm vai trò lỗi: ' + c.out.slice(-600));
  ok(/Quản Trị Cũ là quản trị trên e-work: tài khoản nhận nhóm Nhân viên/.test(c.out), 'Thiếu cảnh báo tài khoản quản trị e-work');
  const all = await J(r.get(BASE + '/api/data', { headers: H }));
  const grp = id => all.groups.find(g => g.id === id); const usr = u => all.users.find(x => x.username === u);
  ok(['g-nv', 'g-tp', 'g-ketoan', 'g-bgd'].every(grp), 'Thiếu nhóm vai trò: ' + all.groups.map(g => g.id).join(','));
  const want = { nva: 'g-tp', ttb: 'g-nv', ktoan: 'g-ketoan', giamdoc: 'g-bgd', qtew: 'g-nv' };
  for (const [u, g] of Object.entries(want)) ok(usr(u)?.groupId === g, `Tài khoản ${u} nhận nhóm ${usr(u)?.groupId}, cần ${g}`);
  ok(!grp('g-nv').perms['luong'] && !grp('g-nv').perms['nhan-su'] && grp('g-nv').perms['du-an'] === 'view', 'Quyền nhóm Nhân viên sai: ' + JSON.stringify(grp('g-nv').perms));
  // nạp lại không tạo trùng, không đổi nhóm đã gán
  await r.put(BASE + '/api/users/' + usr('qtew').id, { headers: H, data: { ...usr('qtew'), groupId: 'g-bgd' } });
  const c2 = cli(['--nhap-ework', FX], { QLDA_MAT_KHAU_CHUNG: 'TriThuc2026' });
  ok(c2.code === 0 && /0 nhóm vai trò mới/.test(c2.out), 'Nạp lại tạo trùng nhóm: ' + c2.out.slice(-300));

  // 2) Dự án (quản trị tạo), một tài khoản chưa có nhóm
  ok((await r.put(BASE + '/api/data/projects/da-test', { headers: H, data: { name: 'Dự án phần mềm A', code: 'PM-A' } })).ok(), 'Tạo dự án lỗi');
  const cu = await r.post(BASE + '/api/users', { headers: H, data: { username: 'khach1', name: 'Không Nhóm', password: 'Khach2026abc', groupId: 'g-nv' } });
  ok(cu.ok(), 'Tạo tài khoản lỗi: ' + await cu.text());
  // tài khoản cũ chưa có nhóm (bản trước nạp e-work khi chưa có nhóm Nhân viên): bỏ nhóm trực tiếp trong CSDL
  spawnSync('su', ['postgres', '-c', `psql -q -d ${DB} -c "UPDATE \\"Users\\" SET \\"GroupId\\"=NULL WHERE \\"Username\\"='khach1'"`], { encoding: 'utf8' });
  const nProj = (await J(r.get(BASE + '/api/data', { headers: H }))).projects.length;
  const emps = await J(r.get(BASE + '/api/vp/employees', { headers: H }));
  const E = n => emps.find(e => e.name === n);
  // hồ sơ lương để kiểm tra phạm vi xem
  for (const e of emps) await r.put(BASE + '/api/vp/luong-ho-so/' + e.id, { headers: H, data: { baseSalary: 10000000, insuranceSalary: 10000000 } });
  await r.put(BASE + '/api/vp/employees/' + E('Trần Thị B').id, { headers: H, data: { ...E('Trần Thị B'), bankAccount: '0123456789', bankName: 'MB Bank', idNumber: '001200000001' } });

  const login = async (u, pw0 = 'TriThuc2026') => { const cx = await b.newContext(); const q = cx.request;
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: pw0 } });
    await q.post(BASE + '/api/auth/change-password', { headers: H, data: { old: pw0, password: 'Nhanvien2026' } });
    const li = await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: 'Nhanvien2026' } });
    if (!li.ok()) await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: pw0 } });
    ok((await q.get(BASE + '/api/vp/state', { headers: H })).ok(), 'Không đăng nhập được ' + u); return cx; };
  const M = thisMonth();
  const role = {};
  for (const u of ['ttb', 'nva', 'ktoan', 'giamdoc']) role[u] = await login(u);
  const kh = await login('khach1', 'Khach2026abc');

  // 3) Nhân viên
  {
    const q = role.ttb.request; const d = await J(q.get(BASE + '/api/data', { headers: H }));
    ok(nProj > 1 && d.projects.length === nProj && d.projects.some(x => x.id === 'da-test'), 'Nhân viên không xem được đủ dự án: ' + d.projects.length + '/' + nProj);
    ok((await q.put(BASE + '/api/data/projects/da-test', { headers: H, data: { name: 'Sửa trái phép' } })).status() === 403, 'Nhân viên sửa được dự án');
    ok(d.logs.length === 0 && !('passwordHash' in (d.users[0] || {})), 'Nhân viên thấy nhật ký hoặc chi tiết tài khoản');
    const es = await J(q.get(BASE + '/api/vp/employees', { headers: H }));
    const other = es.find(e => e.name === 'Nguyễn Văn A'), me = es.find(e => e.name === 'Trần Thị B');
    ok(other && !('bankAccount' in other) && !('idNumber' in other), 'Nhân viên thấy tài khoản ngân hàng, CCCD của người khác');
    ok(me && me.bankAccount === '0123456789', 'Nhân viên không xem được hồ sơ của mình');
    const l = await J(q.get(BASE + `/api/vp/luong?month=${M}`, { headers: H }));
    ok(l.all === false && !l.bank && l.rows.every(x => x.employeeId === me.id), 'Nhân viên thấy lương người khác: ' + JSON.stringify(l).slice(0, 200));
    const k = await J(q.get(BASE + `/api/vp/kpi?month=${M}`, { headers: H }));
    ok((k.rows || []).every(x => x.employeeId === me.id), 'Nhân viên thấy KPI người khác');
    ok((await q.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'office' } })).ok(), 'Nhân viên không điểm danh được');
    ok((await q.put(BASE + '/api/vp/luong-settings', { headers: H, data: {} })).status() === 403, 'Nhân viên sửa được thiết lập lương');
    ok((await q.post(BASE + `/api/vp/luong/${M}/duyet`, { headers: H, data: { approve: true } })).status() === 403, 'Nhân viên duyệt chi lương');
    const v = await J(q.get(BASE + '/api/vp/viec?scope=all&status=all', { headers: H }));
    ok(v.perms && !v.perms.seeAll && !v.perms.boss, 'Nhân viên có quyền xem/giao mọi việc: ' + JSON.stringify(v.perms));
    // giao diện: thấy dự án, không thấy Nhân sự, Quản trị
    const pg = await role.ttb.newPage(); pg.on('pageerror', e => errs.push('PAGEERR nv ' + e.message));
    await pg.goto(BASE + '/'); await pg.waitForSelector('#app', { timeout: 30000 });
    const nav = await pg.$$eval('nav a, .side a', a => a.map(x => x.getAttribute('href')));
    ok(nav.includes('#du-an') && nav.includes('#van-phong') && !nav.includes('#nhan-su') && !nav.includes('#quan-tri'), 'Menu nhân viên sai: ' + nav.join(' '));
  }
  // 4) Tài khoản chưa có nhóm: không nhận dữ liệu dự án
  {
    const rs = await kh.request.get(BASE + '/api/data', { headers: H }); if (!rs.ok()) throw new Error('khach1 /api/data ' + rs.status() + ' ' + errs.join(' | '));
    const d = await rs.json();
    ok(d.projects.length === 0 && d.contracts.length === 0 && d.orgs.length === 0, 'Tài khoản chưa có nhóm vẫn nhận dữ liệu dự án');
  }
  // 5) Trưởng phòng: thấy phòng mình
  {
    const q = role.nva.request; const v = await J(q.get(BASE + '/api/vp/viec?scope=dept&status=all', { headers: H }));
    ok(v.perms && v.perms.managed && v.perms.managed.length === 1 && !v.perms.boss, 'Trưởng phòng không quản lý phòng: ' + JSON.stringify(v.perms));
    const l = await J(q.get(BASE + `/api/vp/luong?month=${M}`, { headers: H }));
    ok(l.all === false, 'Trưởng phòng thấy bảng lương công ty');
  }
  // 6) Kế toán: lập lương, duyệt chi, xem tài khoản ngân hàng; không giao việc chính thức
  {
    const q = role.ktoan.request; const l = await J(q.get(BASE + `/api/vp/luong?month=${M}`, { headers: H }));
    ok(l.all && l.canEdit && l.canApprove && l.bank && l.bank.some(x => x.account === '0123456789'), 'Quyền lương của Kế toán sai');
    const es = await J(q.get(BASE + '/api/vp/employees', { headers: H }));
    ok(es.find(e => e.name === 'Trần Thị B').idNumber, 'Kế toán không xem được hồ sơ nhân sự');
    ok((await q.put(BASE + '/api/data/projects/da-test', { headers: H, data: { name: 'Sửa' } })).status() === 403, 'Kế toán sửa được dự án');
    const v = await J(q.get(BASE + '/api/vp/viec?scope=all&status=all', { headers: H }));
    ok(v.perms && !v.perms.boss, 'Kế toán có quyền giao việc toàn công ty');
  }
  // 7) Ban giám đốc: làm việc như mọi người, thêm quyền
  {
    const q = role.giamdoc.request;
    ok((await q.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'office' } })).ok(), 'Giám đốc không điểm danh được');
    const v = await J(q.get(BASE + '/api/vp/viec?scope=all&status=all', { headers: H }));
    ok(v.perms && v.perms.boss && v.perms.seeAll, 'Giám đốc không có quyền giao việc');
    const ttb = E('Trần Thị B');
    const g = await q.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'Việc Giám đốc giao', assigneeUserId: ttb.userId, level: 'Quan trọng', startDate: M + '-01', due: M + '-28' } });
    ok(g.ok(), 'Giám đốc giao việc lỗi: ' + await g.text());
    const self = await q.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'Việc tự làm của Giám đốc', assigneeUserId: E('Đỗ Giám Đốc').userId, startDate: M + '-01', due: M + '-28' } });
    ok(self.ok(), 'Giám đốc tự tạo việc lỗi: ' + await self.text());
    const l = await J(q.get(BASE + `/api/vp/luong?month=${M}`, { headers: H }));
    ok(l.all && l.canApprove, 'Giám đốc không duyệt chi lương được');
    const k = await J(q.get(BASE + `/api/vp/kpi?month=${M}`, { headers: H }));
    ok((k.rows || []).length >= 4, 'Giám đốc không xem KPI toàn công ty');
    ok((await q.put(BASE + '/api/data/projects/da-test', { headers: H, data: { name: 'Dự án phần mềm A', code: 'PM-A' } })).ok(), 'Giám đốc không sửa được dự án');
    ok((await q.post(BASE + '/api/users', { headers: H, data: { username: 'thu1', name: 'Thử', password: 'Thu2026abcd' } })).status() === 403, 'Giám đốc vào được Quản trị người dùng');
  }
  await b.close();
  if (errs.length) { console.log('LỖI:\n' + errs.join('\n')); process.exit(1); }
  console.log('v110h: ĐẠT');
})().catch(e => { console.error(e); process.exit(2); });
