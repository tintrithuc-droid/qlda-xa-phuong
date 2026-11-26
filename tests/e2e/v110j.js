// Kiểm thử bản 1.10.13–1.10.14: mức công tác phí riêng từ e-work; KPI tự chốt lúc 0 giờ ngày 1 tháng sau (mở chốt để sửa thì không tự chốt lại), thưởng tháng còn làm trên e-work lấy theo bảng lương e-work.
// node tests/e2e/v110h.js [BASE] [tên CSDL]
// node tests/e2e/v110g.js [BASE] [tên CSDL] — cần CSDL trống, máy chủ chạy bằng /tmp/claude-0/run.sh <tên CSDL>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'v110j';
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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v110j-'));
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request; const J = async x => (await x).json();
  const PM = prevMonth(), D0 = vnToday();

  // 1) Nạp e-work: bảng lương e-work tháng 09/2026 có cột Thưởng; tháng trước (theo ngày máy) không có bảng lương e-work
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/ework_luutru.json'), 'utf8').replace(/^\uFEFF/, ''));
  fx.luutru.QuanLyCongViecs = [];
  fx.luutru.BangLuongs = [{ Id: 'l9', UserId: 'u2', FullName: 'Trần Thị B', LuongCoBan: 9000000, Thuong: 1500000, NgayCongTac: 2, MucCongTacPhi: 0, Thang: 9, Nam: 2026 },
    { Id: 'l8a', UserId: 'u1', FullName: 'Nguyễn Văn A', NgayCongTac: 1.5, MucCongTacPhi: 150000, Thang: 8, Nam: 2026 }, { Id: 'l9a', UserId: 'u1', FullName: 'Nguyễn Văn A', NgayCongTac: 0, MucCongTacPhi: 0, Thang: 9, Nam: 2026 }];
  const FX = path.join(tmp, 'ew.json'); fs.writeFileSync(FX, JSON.stringify(fx));
  const c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk.csv')], { QLDA_MAT_KHAU_CHUNG: 'TriThuc2026' });
  ok(c.code === 0, 'Nạp e-work lỗi: ' + c.out);
  const emps = await J(r.get(BASE + '/api/vp/employees', { headers: H })); const ttb = emps.find(e => e.name === 'Trần Thị B');

  // 1b) 1.10.14: mức công tác phí riêng lấy từ bảng lương e-work (tháng gần nhất có ngày công tác)
  { const nva = emps.find(e => e.name === 'Nguyễn Văn A'); const pr = await J(r.get(BASE + '/api/vp/luong-ho-so', { headers: H })); if (!Array.isArray(pr)) console.log('HOSO', JSON.stringify(pr).slice(0, 300)); const P = id => pr.find(x => x.employeeId === id);
    ok(P(ttb.id) && P(ttb.id).tripRate === 0, 'Mức công tác phí riêng của B phải 0: ' + JSON.stringify(P(ttb.id)));
    ok(!P(nva.id) || P(nva.id).tripRate === 150000, 'Mức công tác phí riêng của A phải 150000: ' + JSON.stringify(P(nva.id)));
    ok(pr.filter(x => x.employeeId !== ttb.id && x.employeeId !== nva.id).every(x => x.tripRate == null), 'Người không có công tác trên e-work phải dùng mức chung');
    const pa = P(ttb.id); const rs0 = await r.put(BASE + '/api/vp/luong-ho-so/' + ttb.id, { headers: H, data: { ...pa, tripRate: null } }); ok(rs0.ok(), 'Lưu hồ sơ lương lỗi');
    const pr2 = await J(r.get(BASE + '/api/vp/luong-ho-so', { headers: H })); ok(pr2.find(x => x.employeeId === ttb.id).tripRate == null, 'Xóa mức riêng không lưu');
    await r.put(BASE + '/api/vp/luong-ho-so/' + ttb.id, { headers: H, data: { ...pa, tripRate: 0 } });
    const bad = await r.put(BASE + '/api/vp/luong-ho-so/' + ttb.id, { headers: H, data: { ...pa, tripRate: -1 } }); ok(bad.status() === 400, 'Nhận mức âm'); }

  // 2) KPI tháng trước: chưa chốt, trang ghi giờ tự chốt (0 giờ ngày 1 tháng sau)
  let k = await J(r.get(BASE + '/api/vp/kpi?month=' + PM, { headers: H }));
  ok(k.rows.length > 0 && k.rows.every(x => !x.locked), 'KPI tháng trước phải chưa chốt');
  ok(k.autoLockAt === thisMonth() + '-01', 'autoLockAt sai: ' + k.autoLockAt);
  ok(k.settings.autoLock === true && k.settings.autoLockDay === 1, 'Thiết lập tự chốt mặc định sai');
  await p.goto(BASE + '/#kpi'); await p.waitForTimeout(1500);
  ok((await p.textContent('body')).includes('tự chốt 0 giờ ngày'), 'Trang KPI không ghi giờ tự chốt');

  // 3) Tự chốt (bước tác vụ nền chạy qua dòng lệnh)
  let a = cli(['--tu-chot-kpi']); ok(a.code === 0 && a.out.includes('Đã tự chốt KPI ' + PM), 'Tự chốt lỗi: ' + a.out);
  k = await J(r.get(BASE + '/api/vp/kpi?month=' + PM, { headers: H }));
  ok(k.rows.every(x => x.locked && x.lockedBy === 'Hệ thống (tự chốt)'), 'Sau tự chốt chưa khóa hết / người chốt sai');
  a = cli(['--tu-chot-kpi']); ok(a.out.includes('Không có tháng cần tự chốt'), 'Chạy lại phải không chốt nữa: ' + a.out);

  // 4) Mở chốt để sửa: máy không tự chốt lại; chốt tay lại được
  let rs = await r.post(BASE + `/api/vp/kpi/${PM}/chot`, { headers: H, data: { lock: false } }); ok(rs.ok(), 'Mở chốt lỗi');
  k = await J(r.get(BASE + '/api/vp/kpi?month=' + PM, { headers: H })); ok(k.rows.every(x => !x.locked && !x.lockedBy), 'Mở chốt chưa mở hết');
  a = cli(['--tu-chot-kpi']); ok(a.out.includes('Không có tháng cần tự chốt'), 'Đã mở chốt để sửa thì không tự chốt lại: ' + a.out);
  rs = await r.post(BASE + `/api/vp/kpi/${PM}/chot`, { headers: H, data: { lock: true } }); ok(rs.ok(), 'Chốt tay lỗi');
  k = await J(r.get(BASE + '/api/vp/kpi?month=' + PM, { headers: H })); ok(k.rows.every(x => x.locked && x.lockedBy === 'Quản Trị'), 'Chốt tay: ' + JSON.stringify(k.rows.map(x => x.lockedBy)));

  // 5) Tắt tự chốt trong thiết lập KPI được lưu
  const ks = await J(r.get(BASE + '/api/vp/kpi-settings', { headers: H }));
  rs = await r.put(BASE + '/api/vp/kpi-settings', { headers: H, data: { ...ks, autoLock: false, autoLockDay: 3 } }); ok(rs.ok(), 'Lưu thiết lập KPI lỗi');
  const ks2 = await J(r.get(BASE + '/api/vp/kpi-settings', { headers: H })); ok(ks2.autoLock === false && ks2.autoLockDay === 3, 'Thiết lập tự chốt không lưu');

  // 6) Tháng còn làm trên e-work: thưởng lấy theo bảng lương e-work
  let pay = await J(r.get(BASE + '/api/vp/luong?month=2026-09', { headers: H }));
  let sb = pay.rows.find(x => x.employeeId === ttb.id);
  ok(sb && sb.kpiBonus === 1500000 && sb.kpiGrade === 'Theo bảng lương e-work', 'Thưởng theo e-work sai: ' + JSON.stringify(sb && { b: sb.kpiBonus, g: sb.kpiGrade }));
  ok(pay.settings.eworkBonus === true, 'Mặc định eworkBonus phải bật');
  const others = pay.rows.filter(x => x.employeeId !== ttb.id); ok(others.every(x => !x.kpiBonus), 'Người không có bảng lương e-work không được có thưởng');
  rs = await r.put(BASE + '/api/vp/luong-settings', { headers: H, data: { ...pay.settings, eworkBonus: false } }); ok(rs.ok(), 'Lưu thiết lập lương lỗi');
  pay = await J(r.get(BASE + '/api/vp/luong?month=2026-09', { headers: H })); sb = pay.rows.find(x => x.employeeId === ttb.id);
  ok(sb && !sb.kpiBonus, 'Tắt thưởng theo e-work mà vẫn lấy');
  await r.put(BASE + '/api/vp/luong-settings', { headers: H, data: { ...pay.settings, eworkBonus: true } });

  // 7) Thiết lập lương có ô chọn thưởng e-work
  await p.goto(BASE + '/#luong'); await p.waitForTimeout(1200);
  const setBtn = await p.$('[data-act="pay-set"]'); if (setBtn) { await setBtn.click(); await p.waitForTimeout(600); ok((await p.textContent('body')).includes('Thưởng tháng còn làm trên e-work'), 'Thiếu ô thưởng e-work trong thiết lập lương'); }
  else errs.push('Không thấy nút Thiết lập lương');

  await b.close();
  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'v110j ĐẠT');
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
