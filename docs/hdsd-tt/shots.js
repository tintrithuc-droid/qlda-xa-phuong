// Chụp ảnh màn hình cho HDSD e-work Tri Thức theo vai trò. Dữ liệu mẫu (không phải dữ liệu thật của Công ty).
// Chạy máy chủ với CSDL trống: bash /tmp/claude-0/run.sh hdsd ; rồi: node docs/hdsd-tt/shots.js [BASE] [CSDL]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'hdsd';
const ROOT = path.join(__dirname, '../..'), APP = path.join(ROOT, 'src/QldaTtts.Web'), OUT = path.join(__dirname, 'shots');
const PW = 'Admin2026', H = { 'X-QLDA': '1' };
fs.mkdirSync(OUT, { recursive: true });
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
  return (r.stdout || '') + (r.stderr || '');
}
const vnNow = () => new Date(Date.now() + 7 * 3600e3);
const today = () => vnNow().toISOString().slice(0, 10);
const prevMonth = () => { const d = vnNow(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
const thisMonth = () => today().slice(0, 7);
const VIEW = { width: 1366, height: 820 };

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hdsd-'));
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: VIEW, deviceScaleFactor: 2, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' }); const p = await ctx.newPage();
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request; const J = async x => (await x).json();

  // thông tin đơn vị: Công ty Tri Thức, giao diện Công nghệ
  const br = await J(r.get(BASE + '/api/branding'));
  await r.put(BASE + '/api/branding', { headers: H, data: { ...br, appName: 'e-work Tri Thức', orgShort: 'Công ty Tri Thức', orgName: 'Công ty Cổ phần Tin học Tri Thức', unitName: 'Công ty Cổ phần Tin học Tri Thức',
    bannerTitle: 'e-work Tri Thức', bannerText: 'Điểm danh, đề xuất, công việc, KPI, lương trên một hệ thống.', style: 'tech', color: 'teal', field: 'cntt', printNation: '0',
    footer: '© {năm} Công ty Cổ phần Tin học Tri Thức', hideMods: 'von,gpmb,mo-hinh,nhat-ky,khoi-luong,quyet-toan', loginHint: 'Dùng tài khoản e-work của bạn.' } });

  // dữ liệu mẫu: nạp e-work kiểm thử, thêm Kế toán, Giám đốc
  const fx = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/ework_luutru.json'), 'utf8').replace(/^﻿/, ''));
  fx.users.forEach(u => { if (u.Id === 'u4') { u.Status = true; u.IsLock = false; } });
  const base = fx.users.find(u => u.Id === 'u2');
  fx.users.push({ ...base, Id: 'u5', UserName: 'thuha', Email: 'thuha@vidu.vn', FullName: 'Phạm Thu Hà', RoleName: 'KETOAN', PhongBan: 'pb-kd' });
  fx.users.push({ ...base, Id: 'u6', UserName: 'giamdoc', Email: 'giamdoc@vidu.vn', FullName: 'Đỗ Minh Quang', RoleName: 'GIAMDOC', PhongBan: 'pb-kd' });
  fx.luutru.QuanLyCongViecs = [];
  const FX = path.join(tmp, 'ew.json'); fs.writeFileSync(FX, JSON.stringify(fx));
  console.log(cli(['--nhap-ework', FX], { QLDA_MAT_KHAU_CHUNG: 'TriThuc2026' }).split('\n').filter(l => /dự án|nhân sự/.test(l)).join('\n'));
  const emps = await J(r.get(BASE + '/api/vp/employees', { headers: H })); const E = n => emps.find(e => e.name === n);
  for (const e of emps) {
    await r.put(BASE + '/api/vp/luong-ho-so/' + e.id, { headers: H, data: { baseSalary: 12000000, insuranceSalary: 8000000, allowances: [{ name: 'Ăn trưa', amount: 730000 }, { name: 'Điện thoại', amount: 300000 }] } });
    await r.put(BASE + '/api/vp/employees/' + e.id, { headers: H, data: { ...e, bankAccount: '9' + String(100000000 + emps.indexOf(e)).slice(1), bankName: 'MB Bank' } });
  }
  const login = async (u) => { const cx = await b.newContext({ viewport: VIEW, deviceScaleFactor: 2, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' }); const q = cx.request;
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: 'TriThuc2026' } });
    await q.post(BASE + '/api/auth/change-password', { headers: H, data: { old: 'TriThuc2026', password: 'Mau2026abc' } });
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: 'Mau2026abc' } }); return cx; };
  const nv = await login('ttb'), tp = await login('nva'), kt = await login('thuha'), gd = await login('giamdoc');
  const ttb = E('Trần Thị B');
  const PM = prevMonth(), M = thisMonth(), D0 = today();

  { const _vs = await (await r.get(BASE + '/api/vp/settings', { headers: H })).json(); const _td = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    // Bản 1.10.16: thiết lập như máy Tri Thức sau nâng cấp (Nhận nhiệm vụ, phép 12 ngày không cộng thâm niên)
    await r.put(BASE + '/api/vp/settings', { headers: H, data: { ..._vs, inOnly: true, word: 'Nhận nhiệm vụ', leaveSeniorityBonus: false, checkIn: '08:00', workdays: [...(_vs.workdays || []), _td + ' Ngày kiểm thử'] } }); } // hôm nay luôn là ngày làm việc
  { const ks = await J(r.get(BASE + '/api/vp/kpi-settings', { headers: H }));
    await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: { ...ks, auto: true, wWork: 70, wProject: 0, wAttendance: 30, wManager: 0, qualityFactors: [1, 1, 1, 1, 1], rankOn: true, rankCompany: true, rankTop: 2, rankMinGrade: 'C', public: true,
      rankTables: (ks.rankTables && ks.rankTables.length) ? ks.rankTables : [{ from: '2026-01', amounts: [1000000, 500000] }] } }); }
  // điểm danh, đề xuất
  await gd.request.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'office' } });
  await tp.request.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'khac', note: 'Họp với khách hàng A tại trụ sở khách hàng' } });
  await kt.request.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'online' } });
  const nd = D0.slice(0, 8) + '28';
  await nv.request.put(BASE + '/api/vp/requests/dx-hd1', { headers: H, data: { type: 'Nghỉ phép', fromAt: nd + 'T08:00:00+07:00', toAt: nd + 'T17:30:00+07:00', days: 1, reason: 'Việc gia đình' } });
  await nv.request.put(BASE + '/api/vp/requests/dx-hd2', { headers: H, data: { type: 'Xăng xe', fromAt: D0 + 'T08:00:00+07:00', toAt: D0 + 'T17:00:00+07:00', place: 'Khách hàng tại quận 3', km: 24, amount: 120000, reason: 'Triển khai phần mềm' } });

  // công việc: Giám đốc tạo nhiệm vụ, trưởng phòng giao việc
  await r.put(BASE + '/api/data/projects/da-mau', { headers: H, data: { name: 'Phần mềm quản lý văn bản cho khách hàng A', code: 'PM-A' } });
  const proj = { id: 'da-mau' };
  const mk = async (q, data) => (await J(q.post(BASE + '/api/vp/viec', { headers: H, data }))).id;
  const nvu = await mk(gd.request, { name: 'Triển khai phần mềm cho khách hàng A', projectId: proj?.id, assigneeUserId: E('Nguyễn Văn A').userId, level: 'Quan trọng', startDate: M + '-01', due: M + '-28' });
  const v1 = await mk(tp.request, { name: 'Cài đặt máy chủ, nạp dữ liệu', parentId: nvu, assigneeUserId: ttb.userId, level: 'Quan trọng', startDate: M + '-03', due: D0 });
  const v2 = await mk(tp.request, { name: 'Đào tạo người dùng', parentId: nvu, assigneeUserId: ttb.userId, level: 'Bình thường', startDate: M + '-10', due: M + '-27' });
  const v3 = await mk(tp.request, { name: 'Viết biên bản nghiệm thu', parentId: nvu, assigneeUserId: ttb.userId, level: 'Bình thường', startDate: M + '-05', due: M + '-12' });
  await nv.request.post(BASE + `/api/vp/viec/${v1}/trang-thai`, { headers: H, data: { status: 'Hoàn thành', doneDate: D0, result: 'Đã cài đặt, nạp đủ dữ liệu' } });
  await nv.request.post(BASE + `/api/vp/viec/${v2}/trang-thai`, { headers: H, data: { status: 'Đang thực hiện' } });
  await nv.request.post(BASE + '/api/vp/viec', { headers: H, data: { name: 'Sửa lỗi in phiếu theo yêu cầu khách hàng', parentId: nvu, startDate: D0, due: M + '-27' } });
  // nhân viên: chụp màn hình trước khi nhận nhiệm vụ (chọn nơi làm, việc được giao), rồi nhận nhiệm vụ và ghi kết quả
  await (async () => { const pg = await nv.newPage(); await pg.goto(BASE + '/#van-phong'); await pg.waitForSelector('.vp-mode', { timeout: 30000 }); await pg.waitForTimeout(1500);
    await pg.screenshot({ path: path.join(OUT, 'nhan-nhiem-vu.png') }); await pg.close(); })();
  { const tks = await J(nv.request.get(BASE + '/api/vp/my-tasks', { headers: H }));
    await nv.request.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'office', taskIds: tks.slice(0, 2).map(x => x.id) } });
    await nv.request.post(BASE + '/api/vp/check/today', { headers: H, data: { result: 'Đã cài máy chủ, nạp xong dữ liệu; hẹn khách hàng đào tạo thứ Sáu' } }); }

  // tháng trước: chấm KPI, chốt, chốt lương để nhân viên xem phiếu lương
  for (const e of emps) await r.put(BASE + `/api/vp/kpi/${PM}/${e.id}`, { headers: H, data: { workScore: 85 + (emps.indexOf(e) % 3) * 5 } });
  await r.post(BASE + `/api/vp/kpi/${PM}/chot`, { headers: H, data: { lock: true } });
  await r.post(BASE + `/api/vp/luong/${PM}/chot`, { headers: H, data: { lock: true } });

  const shot = async (cx, name, route, prep, opt = {}) => {
    const pg = await cx.newPage(); await pg.goto(BASE + '/#' + route); await pg.waitForSelector('#app', { timeout: 30000 });
    if (prep) await pg.evaluate(prep); await pg.waitForTimeout(1500);
    if (opt.click) { await pg.click(opt.click); await pg.waitForTimeout(1200); }
    const box = await pg.locator('.main').boundingBox();
    await pg.screenshot({ path: path.join(OUT, name + '.png'), clip: opt.full ? undefined : { x: box.x, y: 0, width: box.width, height: VIEW.height } }); await pg.close(); console.log('ảnh', name);
  };
  // đăng nhập
  { const cx = await b.newContext({ viewport: VIEW, deviceScaleFactor: 2, timezoneId: 'Asia/Ho_Chi_Minh' }); const pg = await cx.newPage(); await pg.goto(BASE + '/'); await pg.waitForSelector('#login'); await pg.waitForTimeout(800);
    await pg.screenshot({ path: path.join(OUT, 'dang-nhap.png') }); await cx.close(); }
  await shot(nv, 'diem-danh', 'van-phong', null, { full: true });
  await shot(gd, 'hom-nay', 'diem-danh', `S.tab.dd='hom-nay'; render()`);
  await shot(kt, 'tong-hop', 'diem-danh', `S.tab.dd='bang'; render()`);
  await shot(nv, 'de-xuat', 'de-xuat');
  await shot(nv, 'cong-viec', 'cong-viec');
  await shot(nv, 'kpi', 'kpi', `S.f.kpim='${PM}'; render()`);
  await shot(nv, 'phieu-luong', 'luong', `S.f.plm='${PM}'; render()`);
  await shot(tp, 'giao-viec', 'cong-viec', `S.f.cvs='dept'; render()`);
  await shot(tp, 'duyet', 'de-xuat');
  await shot(kt, 'nhan-su', 'nhan-su');
  await shot(kt, 'bang-luong', 'luong', `S.f.plm='${PM}'; render()`);
  await r.post(BASE + `/api/vp/luong/${PM}/duyet`, { headers: H, data: { approve: true } });
  await shot(gd, 'duyet-chi', 'luong', `S.f.plm='${PM}'; render()`);
  await shot(ctx, 'qt-nguoi-dung', 'quan-tri');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
