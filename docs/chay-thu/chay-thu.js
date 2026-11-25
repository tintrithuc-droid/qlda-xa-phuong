// Bản 1.10.12: CHẠY THỬ THỦ CÔNG THEO VAI TRÒ (bắt buộc trước khi xin cài, cùng với kiểm thử tự động).
// Đóng vai 5 người dùng (Nhân viên, Trưởng phòng, Kế toán, Giám đốc, Quản trị), mở MỌI mục trong menu của từng người,
// chụp ảnh từng màn hình, ghi lại lỗi trang, lỗi API, màn hình trống. Người chạy XEM TỪNG ẢNH rồi ghi nhận xét vào báo cáo.
// Dữ liệu mẫu kiểu e-work (không phải dữ liệu thật), có tệp đính kèm bằng cấp, CCCD, lịch họp, thông báo, đề xuất.
// Chạy: bash /tmp/claude-0/run.sh ct ; node docs/chay-thu/chay-thu.js [BASE] [CSDL] [thư mục ảnh]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'ct';
const ROOT = path.join(__dirname, '../..'), APP = path.join(ROOT, 'src/QldaTtts.Web'), OUT = process.argv[4] || path.join(__dirname, 'anh');
const PW = 'Admin2026', H = { 'X-QLDA': '1' }, VIEW = { width: 1366, height: 860 };
fs.mkdirSync(OUT, { recursive: true });
const report = { roles: {}, flows: [], errors: [] };
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
  const r = spawnSync('dotnet', ['bin/Release/net8.0/QldaTtts.Web.dll', ...args], { cwd: APP, env, encoding: 'utf8', timeout: 300000 });
  return (r.stdout || '') + (r.stderr || '');
}
const vnNow = () => new Date(Date.now() + 7 * 3600e3);
const today = () => vnNow().toISOString().slice(0, 10);
const prevMonth = () => { const d = vnNow(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
const thisMonth = () => today().slice(0, 7);

/* Tệp "giấy tờ" mẫu: ảnh chụp văn bằng (vẽ bằng trình duyệt) và PDF một trang */
async function makeDoc(b, file, title, lines) {
  const pg = await b.newPage({ viewport: { width: 900, height: 620 } });
  await pg.setContent(`<div style="font-family:serif;border:12px double #8a6d3b;margin:10px;height:560px;padding:30px;text-align:center;background:#fffaf0">
    <div style="font-size:15px">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</div><h1 style="color:#a12;margin:40px 0 20px;font-size:40px">${title}</h1>
    ${lines.map(l => `<p style="font-size:20px;margin:8px">${l}</p>`).join('')}<p style="margin-top:50px;font-style:italic">(Tài liệu mẫu để chạy thử)</p></div>`);
  if (file.endsWith('.pdf')) await pg.pdf({ path: file, width: '900px', height: '620px', printBackground: true });
  else await pg.screenshot({ path: file, type: file.endsWith('.png') ? 'png' : 'jpeg' });
  await pg.close();
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chay-thu-'));
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: VIEW, deviceScaleFactor: 1, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' }); const p = await ctx.newPage();
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request; const J = async x => (await x).json();
  const br = await J(r.get(BASE + '/api/branding'));
  await r.put(BASE + '/api/branding', { headers: H, data: { ...br, appName: 'e-work Tri Thức', orgShort: 'Công ty Tri Thức', orgName: 'Công ty Cổ phần Tin học Tri Thức', unitName: 'Công ty Cổ phần Tin học Tri Thức',
    bannerTitle: 'e-work Tri Thức', style: 'tech', color: 'teal', field: 'cntt', printNation: '0', hideMods: 'von,gpmb,mo-hinh,nhat-ky,khoi-luong,quyet-toan' } });

  // ---- dữ liệu kiểu e-work + thư mục tệp kiểu site e-work (Uploads/...)
  const fx = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/ework_luutru.json'), 'utf8').replace(/^﻿/, ''));
  fx.users.forEach(u => { if (u.Id === 'u4') { u.Status = true; u.IsLock = false; } });
  const base = fx.users.find(u => u.Id === 'u2');
  fx.users.push({ ...base, Id: 'u5', UserName: 'thuha', Email: 'thuha@vidu.vn', FullName: 'Phạm Thu Hà', RoleName: 'KETOAN', PhongBan: 'pb-kd', TenChucVu: 'Kế toán' });
  fx.users.push({ ...base, Id: 'u6', UserName: 'giamdoc', Email: 'giamdoc@vidu.vn', FullName: 'Đỗ Minh Quang', RoleName: 'GIAMDOC', PhongBan: 'pb-kd', TenChucVu: 'Giám đốc' });
  const L = fx.luutru;
  L.BangLuongCoBans = [{ Id: 'hs1', UserId: 'u2', FullName: 'Trần Thị B', MatTruocCCCD: '/Uploads/CCCD/2024/u2_mattruoc.jpg', MatSauCCCD: '/Uploads/CCCD/2024/u2_matsau.jpg' },
    { Id: 'hs2', UserId: 'u1', FullName: 'Nguyễn Văn A' }];
  L.RefBangCaps = [
    { Id: 'bc1', RefId: 'hs1', TenVanBang: 'Bằng kỹ sư Công nghệ thông tin', DonViCapBang: 'Trường Đại học Bách khoa Hà Nội', SoHieuBang: 'A123456', NamTotNghiep: 2017, NganhDaoTao: 'Công nghệ thông tin',
      DinhKem: JSON.stringify([{ FileName: 'Bang ky su CNTT.pdf', Url: '/Uploads/HoSo/2024/05/6f1c2a9e-1b2c-4d5e-8f90-112233445566_Bang ky su CNTT.pdf' }]) },
    { Id: 'bc2', RefId: 'hs1', TenVanBang: 'Chứng chỉ Quản lý dự án PMP', DonViCapBang: 'PMI', SoHieuBang: 'PMP-778899', NamTotNghiep: 2022, DinhKem: '/Uploads/HoSo/2024/06/chung_chi_pmp.jpg' },
    { Id: 'bc3', RefId: 'hs2', TenVanBang: 'Bằng thạc sĩ Quản lý xây dựng', DonViCapBang: 'Trường Đại học Xây dựng', SoHieuBang: 'TS-2020-15', NamTotNghiep: 2020,
      DinhKem: 'https://e-work.vn/Uploads/HoSo/2023/bang_thac_si.pdf;https://e-work.vn/Uploads/HoSo/2023/bang_diem_thac_si.pdf' },
    { Id: 'bc4', RefId: 'hs2', TenVanBang: 'Chứng chỉ hành nghề giám sát', DonViCapBang: 'Bộ Xây dựng', NamTotNghiep: 2021, DinhKem: '/Uploads/HoSo/khong_con_tep.pdf' }];
  L.LichHops[0].DinhKem = JSON.stringify([{ name: 'Bao cao giao ban T10.pdf', path: 'Uploads/LichHop/bao_cao_giao_ban_t10.pdf' }]);
  L.LogFileUploaders = [{ Id: 'lf1', RefId: 'tb-a1', RefTableName: 'ThongBaos', UrlFile: '/Uploads/ThongBao/lich_nghi_le.pdf', IsActive: true }];
  const EW = path.join(tmp, 'site-ework'); const up = (...x) => { const f = path.join(EW, 'wwwroot', ...x); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };
  await makeDoc(b, up('Uploads/HoSo/2024/05/6f1c2a9e-1b2c-4d5e-8f90-112233445566_Bang ky su CNTT.pdf'), 'BẰNG KỸ SƯ', ['Công nghệ thông tin', 'Cấp cho: Trần Thị B', 'Số hiệu: A123456']);
  await makeDoc(b, up('Uploads/HoSo/2024/06/chung_chi_pmp.jpg'), 'CHỨNG CHỈ PMP', ['Project Management Professional', 'Trần Thị B', 'Số: PMP-778899']);
  await makeDoc(b, up('Uploads/HoSo/2023/bang_thac_si.pdf'), 'BẰNG THẠC SĨ', ['Quản lý xây dựng', 'Cấp cho: Nguyễn Văn A']);
  await makeDoc(b, up('Uploads/HoSo/2023/bang_diem_thac_si.pdf'), 'BẢNG ĐIỂM', ['Thạc sĩ Quản lý xây dựng', 'Nguyễn Văn A']);
  await makeDoc(b, up('Uploads/CCCD/2024/u2_mattruoc.jpg'), 'CĂN CƯỚC CÔNG DÂN', ['Mặt trước', 'Trần Thị B']);
  await makeDoc(b, up('Uploads/CCCD/2024/u2_matsau.jpg'), 'CĂN CƯỚC CÔNG DÂN', ['Mặt sau']);
  await makeDoc(b, up('Uploads/LichHop/bao_cao_giao_ban_t10.pdf'), 'BÁO CÁO GIAO BAN', ['Tháng 10/2026']);
  await makeDoc(b, up('Uploads/ThongBao/lich_nghi_le.pdf'), 'THÔNG BÁO', ['Lịch nghỉ lễ 2/9']);
  const FX = path.join(tmp, 'ew.json'); fs.writeFileSync(FX, JSON.stringify(fx));
  report.import = cli(['--nhap-ework', FX], { QLDA_MAT_KHAU_CHUNG: 'TriThuc2026' }).split('\n').filter(l => /XONG|lỗi|Lỗi|nhân sự/.test(l)).join('\n');
  report.importFiles = cli(['--nhap-tep-ework', FX, '--thu-muc', EW]).trim();
  report.importFilesAgain = cli(['--nhap-tep-ework', FX, '--thu-muc', EW]).trim().split('\n').pop();
  console.log(report.import + '\n' + report.importFiles + '\nLần 2: ' + report.importFilesAgain);

  // Bản 1.10.16: chạy lại bước nâng cấp một lần như lúc cài trên máy thật (đơn vị đã có dữ liệu e-work -> bật "Nhận nhiệm vụ", KPI tự động)
  if (process.env.CHAY_THU_RESTART) {
    spawnSync('psql', ['-h', '127.0.0.1', '-U', 'qlda', '-d', DB, '-c', `delete from "Settings" where "Key"='upgrade:1.10.16-nhan-nhiem-vu'`], { env: { ...process.env, PGPASSWORD: 'qlda' }, encoding: 'utf8' });
    const rs = spawnSync('bash', [process.env.CHAY_THU_RESTART, DB], { encoding: 'utf8', timeout: 180000 }); console.log('Khởi động lại: ' + (rs.stdout || '').trim().split('\n').pop());
    const vs = await J(r.get(BASE + '/api/vp/settings', { headers: H })); const ks = await J(r.get(BASE + '/api/vp/kpi-settings', { headers: H }));
    report.upgrade = { inOnly: vs.inOnly, word: vs.word, leaveBonus: vs.leaveSeniorityBonus, kpi: [ks.auto, ks.wWork, ks.wAttendance, ks.rankCompany, ks.rankTop, ks.public] };
    console.log('Nâng cấp 1.10.16: ' + JSON.stringify(report.upgrade));
  }
  const emps = await J(r.get(BASE + '/api/vp/employees', { headers: H })); const E = n => emps.find(e => e.name === n);
  for (const e of emps) await r.put(BASE + '/api/vp/luong-ho-so/' + e.id, { headers: H, data: { baseSalary: 12000000, insuranceSalary: 8000000, allowances: [{ name: 'Ăn trưa', amount: 730000 }] } });
  const login = async (u) => { const cx = await b.newContext({ viewport: VIEW, deviceScaleFactor: 1, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' }); const q = cx.request;
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: 'TriThuc2026' } });
    await q.post(BASE + '/api/auth/change-password', { headers: H, data: { old: 'TriThuc2026', password: 'Mau2026abc' } });
    await q.post(BASE + '/api/auth/login', { headers: H, data: { username: u, password: 'Mau2026abc' } }); return cx; };
  const roles = { 'nhan-vien': await login('ttb'), 'truong-phong': await login('nva'), 'ke-toan': await login('thuha'), 'giam-doc': await login('giamdoc'), 'quan-tri': ctx };
  const label = { 'nhan-vien': 'Nhân viên (Trần Thị B)', 'truong-phong': 'Trưởng phòng (Nguyễn Văn A)', 'ke-toan': 'Kế toán (Phạm Thu Hà)', 'giam-doc': 'Giám đốc (Đỗ Minh Quang)', 'quan-tri': 'Quản trị hệ thống' };
  { const _vs = await J(r.get(BASE + '/api/vp/settings', { headers: H })); await r.put(BASE + '/api/vp/settings', { headers: H, data: { ..._vs, workdays: [...(_vs.workdays || []), today() + ' Ngày chạy thử'] } }); }
  const nv = roles['nhan-vien'], gd = roles['giam-doc'], tp = roles['truong-phong'];
  const nd = today().slice(0, 8) + '28';
  await nv.request.put(BASE + '/api/vp/requests/dx-ct1', { headers: H, data: { type: 'Nghỉ phép', fromAt: nd + 'T08:00:00+07:00', toAt: nd + 'T17:30:00+07:00', days: 1, reason: 'Việc gia đình' } });
  await r.put(BASE + '/api/data/projects/da-mau', { headers: H, data: { name: 'Phần mềm quản lý văn bản cho khách hàng A', code: 'PM-A' } });
  const M = thisMonth(), PM = prevMonth();
  const mk = async (q, data) => (await J(q.post(BASE + '/api/vp/viec', { headers: H, data }))).id;
  const nvu = await mk(gd.request, { name: 'Triển khai phần mềm cho khách hàng A', projectId: 'da-mau', assigneeUserId: E('Nguyễn Văn A').userId, level: 'Quan trọng', startDate: M + '-01', due: M + '-28' });
  await mk(tp.request, { name: 'Cài đặt máy chủ, nạp dữ liệu', parentId: nvu, assigneeUserId: E('Trần Thị B').userId, level: 'Quan trọng', startDate: M + '-03', due: today() });
  { const tks = await J(nv.request.get(BASE + '/api/vp/my-tasks', { headers: H }));
    await nv.request.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'office', taskIds: tks.map(x => x.id) } });
    await nv.request.post(BASE + '/api/vp/check/today', { headers: H, data: { result: 'Đã cài máy chủ, nạp xong dữ liệu mẫu' } });
    await tp.request.post(BASE + '/api/vp/check', { headers: H, data: { kind: 'in', mode: 'khac', note: 'Họp với khách hàng A tại trụ sở khách hàng' } }); }
  for (const e of emps) await r.put(BASE + `/api/vp/kpi/${PM}/${e.id}`, { headers: H, data: { workScore: 85, projectScore: 80, rating: 4 } });

  // ---- đi từng màn hình của từng vai trò
  for (const [role, cx] of Object.entries(roles)) {
    const rr = report.roles[role] = { label: label[role], screens: [] };
    const pg = await cx.newPage(); const apiErr = [], pageErr = [];
    pg.on('pageerror', e => pageErr.push(e.message));
    pg.on('response', res => { if (res.url().includes('/api/') && res.status() >= 400) apiErr.push(res.status() + ' ' + res.url().replace(BASE, '')); });
    await pg.goto(BASE + '/#van-phong'); await pg.waitForSelector('#app', { timeout: 30000 }); await pg.waitForTimeout(1500);
    const links = await pg.$$eval('#nav a[href^="#"]', as => as.map(a => ({ href: a.getAttribute('href').slice(1), text: a.textContent.trim(), act: a.dataset.act || '' })).filter(a => a.href && !a.act || a.act === 'hs-me'));
    rr.menu = links.map(l => l.text);
    let i = 0;
    for (const l of links) {
      const a0 = apiErr.length, p0 = pageErr.length;
      if (l.act === 'hs-me') { await pg.click('#nav a[data-act="hs-me"]'); } else { await pg.evaluate(h => { location.hash = h; }, l.href); }
      await pg.waitForTimeout(1600);
      const name = `${role}-${String(++i).padStart(2, '0')}-${l.href}`;
      await pg.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
      const info = await pg.evaluate(() => { const c = document.querySelector('#content'); const t = c ? c.innerText : '';
        return { len: t.length, empties: [...document.querySelectorAll('#content .empty, #content .muted')].map(e => e.textContent.trim()).filter(x => /^(Chưa có|Không có|Chưa)/.test(x)).slice(0, 6), alerts: [...document.querySelectorAll('#content .alert.bad')].map(e => e.textContent.trim()).slice(0, 3) }; });
      rr.screens.push({ menu: l.text, route: l.href, shot: name + '.png', ...info, apiErrors: apiErr.slice(a0), pageErrors: pageErr.slice(p0) });
    }
    await pg.close();
  }

  // ---- Bản 1.10.16: nhận nhiệm vụ (nhân viên chưa bấm), hôm nay ai ở đâu, tổng hợp tháng, KPI công khai
  const snap0 = (pg, n) => pg.screenshot({ path: path.join(OUT, n + '.png'), fullPage: true });
  { const kt = roles['ke-toan']; const pg = await kt.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    try { await pg.goto(BASE + '/#van-phong'); await pg.waitForSelector('.vp-mode', { timeout: 20000 }); await pg.waitForTimeout(1200); await snap0(pg, 'nnv-01-ke-toan-truoc-khi-nhan');
      await pg.check('input[name=vp_mode][value=online]'); await pg.click('[data-act="vp-check"][data-id="in"]'); await pg.waitForSelector('.vp-done', { timeout: 10000 }); await pg.waitForTimeout(600); await snap0(pg, 'nnv-02-ke-toan-da-nhan');
    } catch (e) { errs.push('Lỗi luồng: ' + e.message); } report.flows.push({ name: 'Kế toán: nhận nhiệm vụ làm việc online', errs }); await pg.close(); }
  for (const [role, n] of [['giam-doc', 'nnv-03-gd-hom-nay'], ['truong-phong', 'nnv-04-tp-hom-nay']]) {
    const pg = await roles[role].newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    try { await pg.goto(BASE + '/#diem-danh'); await pg.waitForSelector('.tabs', { timeout: 20000 }); await pg.waitForTimeout(1500); await snap0(pg, n);
      await pg.click('.tabs button[data-id=bang]'); await pg.waitForTimeout(1500); await snap0(pg, n.replace('hom-nay', 'tong-hop'));
      await pg.goto(BASE + '/#kpi'); await pg.waitForTimeout(2000); await snap0(pg, n.replace('hom-nay', 'kpi'));
    } catch (e) { errs.push('Lỗi luồng: ' + e.message); } report.flows.push({ name: role + ': hôm nay ai ở đâu, tổng hợp tháng, KPI', errs }); await pg.close(); }
  { const pg = await nv.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    try { await pg.goto(BASE + '/#kpi'); await pg.waitForSelector('#app'); await pg.waitForTimeout(2000); await snap0(pg, 'nnv-05-nv-kpi-cong-khai'); }
    catch (e) { errs.push('Lỗi luồng: ' + e.message); } report.flows.push({ name: 'Nhân viên: KPI công khai', errs }); await pg.close(); }

  // ---- luồng hồ sơ nhân sự (bằng cấp): quản trị mở hồ sơ, xem bằng cấp đã chuyển, thêm bằng cấp kèm tệp; nhân viên tự xem và thêm
  const flow = async (cx, name, fn) => { const pg = await cx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    try { await fn(pg); } catch (e) { errs.push('Lỗi luồng: ' + e.message); } report.flows.push({ name, errs }); await pg.close(); };
  const snap = (pg, n) => pg.screenshot({ path: path.join(OUT, n + '.png') });
  await flow(ctx, 'Quản trị: danh sách nhân sự, mở hồ sơ, xem bằng cấp chuyển từ e-work, xem tệp', async pg => {
    await pg.goto(BASE + '/#nhan-su'); await pg.waitForSelector('#app'); await pg.waitForTimeout(1800); await snap(pg, 'hs-01-danh-sach');
    const row = pg.locator('tr', { hasText: 'Trần Thị B' }).locator('button', { hasText: 'Xem hồ sơ' }); await row.click(); await pg.waitForTimeout(1500); await snap(pg, 'hs-02-thong-tin-chung');
    await pg.click('.hs-tabs button[data-id="bang-cap"]'); await pg.waitForTimeout(600); await snap(pg, 'hs-03-bang-cap');
    await pg.locator('.hs-item', { hasText: 'PMP' }).locator('button', { hasText: 'Xem' }).first().click(); await pg.waitForTimeout(1200); await snap(pg, 'hs-04-xem-anh'); await pg.keyboard.press('Escape');
    await pg.locator('.hs-item', { hasText: 'kỹ sư' }).locator('button', { hasText: 'Xem' }).first().click(); await pg.waitForTimeout(2500); await snap(pg, 'hs-05-xem-pdf'); await pg.keyboard.press('Escape');
    await pg.click('.hs-tabs button[data-id="giay-to"]'); await pg.waitForTimeout(600); await snap(pg, 'hs-06-cccd');
    await pg.click('.hs-tabs button[data-id="tep"]'); await pg.waitForTimeout(600); await snap(pg, 'hs-07-tat-ca-tep');
    // thêm bằng cấp mới kèm tệp trong một bước
    await pg.click('.hs-tabs button[data-id="bang-cap"]'); await pg.waitForTimeout(400);
    await pg.click('button[data-act="hs-rec"][data-id="bang-cap|"]'); await pg.waitForTimeout(500);
    await pg.fill('#f_title', 'Chứng chỉ tiếng Anh B2'); await pg.fill('#f_org', 'Trung tâm Ngoại ngữ');
    const f1 = path.join(tmp, 'Chung chi tieng Anh B2.jpg'); await makeDoc(b, f1, 'CHỨNG CHỈ TIẾNG ANH', ['Bậc B2', 'Trần Thị B']);
    await pg.setInputFiles('#f_file', f1); await snap(pg, 'hs-08-them-bang-cap');
    await pg.click('#ov button[type=submit]'); await pg.waitForTimeout(2000); await snap(pg, 'hs-09-sau-khi-them');
    const n = await pg.locator('.hs-item', { hasText: 'tiếng Anh B2' }).locator('.hs-file').count(); if (n !== 1) throw new Error('Bằng cấp mới không có tệp: ' + n);
  });
  await flow(nv, 'Nhân viên: Hồ sơ của tôi, tự thêm bằng cấp', async pg => {
    await pg.goto(BASE + '/#van-phong'); await pg.waitForSelector('#app'); await pg.waitForTimeout(1500);
    await pg.click('#nav a[data-act="hs-me"]'); await pg.waitForTimeout(1500); await snap(pg, 'hs-10-ho-so-cua-toi');
    await pg.click('.hs-tabs button[data-id="bang-cap"]'); await pg.waitForTimeout(600); await snap(pg, 'hs-11-nv-bang-cap');
    if (await pg.locator('button[data-act="hs-rec"][data-id="bang-cap|"]').count() !== 1) throw new Error('Nhân viên không thấy nút thêm bằng cấp');
  });
  // quyền: nhân viên khác không xem được hồ sơ, tệp của người khác
  const other = roles['ke-toan'].request; const ttb = E('Trần Thị B');
  const hsx = await other.get(BASE + '/api/vp/ho-so/' + ttb.id, { headers: H }); report.flows.push({ name: 'Kế toán xem hồ sơ Trần Thị B (theo quyền nhóm)', errs: [], status: hsx.status() });
  const own = await J(nv.request.get(BASE + '/api/vp/ho-so/' + ttb.id, { headers: H }));
  const fid = own.records.flatMap(x => x.files)[0].fileId;
  const lvc = await login('lvc'); const st = (await lvc.request.get(BASE + '/api/files/' + fid, { headers: H })).status();
  report.flows.push({ name: 'Nhân viên khác tải tệp bằng cấp của Trần Thị B', errs: st === 403 ? [] : ['Phải bị chặn, nhận ' + st] });
  fs.writeFileSync(path.join(OUT, 'bao-cao.json'), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report.flows, null, 1));
  for (const [k, v] of Object.entries(report.roles)) console.log(k, v.menu.join(' | '), '\n  lỗi:', v.screens.filter(s => s.apiErrors.length || s.pageErrors.length).map(s => s.route + ': ' + [...s.apiErrors, ...s.pageErrors].join('; ')).join(' || '));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
