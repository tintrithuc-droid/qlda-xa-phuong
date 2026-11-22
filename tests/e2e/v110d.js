// Kiểm thử bản 1.10.2 (lệnh thiết lập trên máy chủ: thông tin đơn vị, nạp e-work với mật khẩu ban đầu chung, khóa chép chấm công):
// node tests/e2e/v110d.js [BASE] [tên CSDL] — cần CSDL trống, máy chủ chạy bằng /tmp/claude-0/run.sh <tên CSDL>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'v110d';
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
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v110d-'));
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request;

  // 1) Thông tin đơn vị: gộp, giữ mục cũ, bỏ qua mục sai và lĩnh vực
  await r.put(BASE + '/api/branding', { headers: H, data: { address: 'Địa chỉ cũ giữ nguyên' } });
  const bj = path.join(tmp, 'tt.json');
  fs.writeFileSync(bj, JSON.stringify({ appName: 'e-work', bannerTitle: 'e-work giải pháp điều hành số', unitName: 'Tri Thức số hóa công việc', reportOrg: 'Công ty Cổ phần Tin học Tri Thức', style: 'tech', color: 'tim', field: 'cntt', khongCo: 'x' }));
  let c = cli(['--thong-tin-don-vi', bj]);
  ok(c.code === 0 && c.out.includes('Đã cập nhật'), 'Lệnh thông tin đơn vị lỗi: ' + c.out);
  ok(c.out.includes('khongCo') && c.out.includes("'field'"), 'Không báo mục bỏ qua: ' + c.out);
  let br = await (await r.get(BASE + '/api/branding')).json();
  ok(br.appName === 'e-work' && br.bannerTitle === 'e-work giải pháp điều hành số' && br.unitName === 'Tri Thức số hóa công việc' && br.reportOrg === 'Công ty Cổ phần Tin học Tri Thức' && br.style === 'tech', 'Thông tin đơn vị chưa đổi: ' + JSON.stringify(br));
  ok(br.address === 'Địa chỉ cũ giữ nguyên', 'Mất mục cũ khi gộp: ' + br.address);
  ok(br.color === 'navy' && br.field === 'xd', 'Nhận giá trị sai (màu/lĩnh vực): ' + br.color + ' ' + br.field);

  // Bản 1.10.3: dữ liệu thật có mô tả đề xuất, vị trí điểm danh dài hơn cột (lỗi 22001 trên máy chủ Tri Thức)
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/ework_luutru.json'), 'utf8').replace(/^\uFEFF/, ''));
  const LONG = 'Mô tả đề xuất rất dài. '.repeat(40); // ~920 ký tự
  fx.dexuat.push({ ...fx.dexuat[0], Id: 'dx-dai', RefObjectDescription: LONG, LyDo: 'Lý do ngắn' });
  fx.chamcong[0].ViTriDiemDanh = 'Số 1 đường dài '.repeat(30);
  const FX = path.join(tmp, 'ework_dai.json'); fs.writeFileSync(FX, JSON.stringify(fx));
  // 2) Nạp e-work: mật khẩu chung yếu bị từ chối, không ghi gì
  c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk.csv')], { QLDA_MAT_KHAU_CHUNG: '123' });
  ok(c.code !== 0, 'Chấp nhận mật khẩu chung yếu');
  let emps = await (await r.get(BASE + '/api/vp/employees', { headers: H })).json();
  ok(emps.length === 0, 'Đã nạp dù mật khẩu chung bị từ chối');
  c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk.csv')], { QLDA_MAT_KHAU_CHUNG: 'TriThuc2026' });
  ok(c.code === 0 && c.out.includes('Đã chuyển'), 'Lệnh nạp e-work lỗi: ' + c.out);
  ok(!c.out.includes('TriThuc2026'), 'In mật khẩu chung ra màn hình');
  const csv = fs.existsSync(path.join(tmp, 'tk.csv')) ? fs.readFileSync(path.join(tmp, 'tk.csv'), 'utf8') : '';
  ok(csv.charCodeAt(0) === 0xFEFF && csv.includes('ttb') && !csv.includes('TriThuc2026') && csv.includes('mật khẩu ban đầu chung'), 'Tệp tài khoản sai: ' + csv);
  emps = await (await r.get(BASE + '/api/vp/employees', { headers: H })).json();
  ok(emps.some(e => e.name === 'Trần Thị B'), 'Chưa nạp nhân sự');
  const reqs = await (await r.get(BASE + '/api/vp/requests', { headers: H })).json().catch(() => null);
  const rq = Array.isArray(reqs) ? reqs.find(x => (x.reason || '').includes('Mô tả đề xuất rất dài')) : null;
  ok(rq && rq.title.length <= 300 && rq.reason.includes(LONG.trim()) && rq.reason.startsWith('Lý do ngắn'), 'Đề xuất mô tả dài không giữ đủ nội dung: ' + JSON.stringify(rq && { t: rq.title.length, r: (rq.reason || '').length }));
  ok(c.out.includes('Cắt bớt Attendance.Site'), 'Không báo cắt vị trí điểm danh dài: ' + c.out.slice(0, 500));
  const logs = (await (await r.get(BASE + '/api/data', { headers: H })).json()).logs;
  ok(JSON.stringify(logs).includes('dòng lệnh trên máy chủ'), 'Không ghi nhật ký lệnh máy chủ');
  // Đăng nhập bằng mật khẩu chung, bị bắt đổi
  const ctx2 = await b.newContext(); const q2 = ctx2.request;
  ok((await q2.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: 'TriThuc2026' } })).ok(), 'Không đăng nhập được bằng mật khẩu chung');
  ok((await q2.get(BASE + '/api/vp/employees', { headers: H })).status() >= 400, 'Chưa đổi mật khẩu mà vẫn dùng được');
  ok((await q2.post(BASE + '/api/auth/change-password', { headers: H, data: { old: 'TriThuc2026', password: 'Rieng2026x' } })).ok(), 'Đổi mật khẩu lỗi');
  // Nạp lại không sinh trùng, không đổi mật khẩu đã đổi
  c = cli(['--nhap-ework', FX, '--tai-khoan-ra', path.join(tmp, 'tk2.csv')]);
  const csv2 = fs.existsSync(path.join(tmp, 'tk2.csv')) ? fs.readFileSync(path.join(tmp, 'tk2.csv'), 'utf8') : '';
  ok(c.code === 0 && csv2.includes('tài khoản đã có') && !csv2.includes('mật khẩu ban đầu chung') && c.out.includes('0 tài khoản mới'), 'Nạp lại sinh tài khoản mới: ' + c.out);
  const ctx3 = await b.newContext();
  ok((await ctx3.request.post(BASE + '/api/auth/login', { headers: H, data: { username: 'ttb', password: 'Rieng2026x' } })).ok(), 'Nạp lại làm mất mật khẩu đã đổi');

  // 3) Khóa chép chấm công: ghi ra tệp, không in khóa, dùng được với đường chép
  const kf = path.join(tmp, 'khoa.txt');
  c = cli(['--tao-khoa-chep', kf, '--tu-ngay', '2026-11-23']);
  const key = fs.existsSync(kf) ? fs.readFileSync(kf, 'utf8').trim() : '';
  ok(c.code === 0 && /^[0-9a-f]{48}$/.test(key), 'Không tạo được tệp khóa: ' + c.out);
  ok(!c.out.includes(key), 'In khóa ra màn hình');
  const ctx4 = await b.newContext();
  ok((await ctx4.request.get(BASE + '/api/vp/sync/pending', { headers: { 'X-Sync-Key': key } })).ok(), 'Khóa tạo bằng lệnh không dùng được');
  ok((await ctx4.request.get(BASE + '/api/vp/sync/pending', { headers: { 'X-Sync-Key': 'sai' } })).status() === 403, 'Khóa sai vẫn chép được');
  // 1.10.4: script chép báo lại "đã chép" phải kèm X-QLDA (chặn CSRF), như chep-cham-cong-ework.ps1
  const ackBody = { items: [{ id: 'khong-co', eworkId: null }] };
  ok((await ctx4.request.post(BASE + '/api/vp/sync/ack', { headers: { 'X-Sync-Key': key }, data: ackBody })).status() === 400, 'Thiếu X-QLDA mà vẫn nhận');
  const ack = await ctx4.request.post(BASE + '/api/vp/sync/ack', { headers: { 'X-Sync-Key': key, 'X-QLDA': '1' }, data: ackBody });
  ok(ack.ok(), 'Báo đã chép lỗi: ' + ack.status());
  const vs = await (await r.get(BASE + '/api/vp/settings', { headers: H })).json();
  ok(JSON.stringify(vs).includes('2026-11-23'), 'Không lưu ngày bắt đầu chép');
  c = cli(['--tao-khoa-chep', '/khong/co/thu-muc/k.txt']);
  ok(c.code !== 0, 'Không báo lỗi khi thư mục không có');

  await b.close();
  if (errs.length) { console.log('LỖI:\n' + errs.join('\n')); process.exit(1); }
  console.log('v110d: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
