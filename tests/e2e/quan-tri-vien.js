// Kiểm thử màn hình Quản trị viên nền tảng (thêm, sửa tên, khóa/mở, đặt lại mật khẩu + 2 lớp).
// Chạy sau khi đã tạo quản trị nền tảng 'tri': PORTAL_PW=<mật khẩu tạm> node tests/e2e/quan-tri-vien.js [http://127.0.0.1:8090]
const http = require('http'), crypto = require('crypto');
const BASE = new URL(process.argv[2] || 'http://127.0.0.1:8090');
const DOMAIN = process.env.BASE_DOMAIN || 'qlda.test';
const PW = process.env.PORTAL_PW || '';
const RUN = Date.now().toString(36).slice(-4);
function totp(secret, offset = 0) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(x => parseInt(x, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset));
  const h = crypto.createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
/** Trình duyệt giả: một tên miền, một hộp cookie. */
function client(host) {
  const jar = {};
  const req = (method, path, body, extra = {}) => new Promise((ok, fail) => {
    const data = body === undefined ? null : Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body));
    const headers = { Host: host, 'X-QLDA': '1', Cookie: Object.entries(jar).map(([k, v]) => k + '=' + v).join('; '), ...extra };
    if (data && !extra['Content-Type']) headers['Content-Type'] = 'application/json';
    if (data) headers['Content-Length'] = data.length;
    const r = http.request({ host: BASE.hostname, port: BASE.port, method, path, headers }, res => {
      for (const c of res.headers['set-cookie'] || []) { const [kv] = c.split(';'); const i = kv.indexOf('='); const k = kv.slice(0, i), v = kv.slice(i + 1); if (v) jar[k] = v; else delete jar[k]; }
      const chunks = []; res.on('data', d => chunks.push(d)); res.on('end', () => {
        const text = Buffer.concat(chunks).toString(); let json = null; try { json = JSON.parse(text); } catch { }
        ok({ status: res.statusCode, json, text });
      });
    });
    r.on('error', fail); if (data) r.write(data); r.end();
  });
  return { host, jar, req, get: p => req('GET', p), post: (p, b) => req('POST', p, b ?? {}), put: (p, b) => req('PUT', p, b) };
}
const errs = []; let n = 0;
const exp = (what, got, want) => { n++; if (got !== want) errs.push(`${what}: ${JSON.stringify(got)} (cần ${JSON.stringify(want)})`); else console.log('  ✓ ' + what); };
async function login(c, u, pw, secret) {
  let r = await c.post('/api/portal/login', { username: u, password: pw });
  if (r.json && r.json.mfa === 'enroll') { secret = r.json.secret; r = await c.post('/api/portal/login', { username: u, password: pw, code: totp(secret), ticket: r.json.ticket }); }
  else if (r.json && r.json.mfa === 'verify') r = await c.post('/api/portal/login', { username: u, password: pw, code: totp(secret || '') });
  return { r, secret };
}
(async () => {
  const D = 'quantri.' + DOMAIN;
  const tri = client(D);
  console.log('Quản trị viên nền tảng');
  exp('Chưa đăng nhập không xem được danh sách quản trị viên', (await tri.get('/api/portal/admins')).status, 401);
  const L = await login(tri, 'tri', PW, process.env.PORTAL_TOTP_SECRET);
  exp('Đăng nhập tri', L.r.status, 200);
  const sTri = L.secret;
  let list = (await tri.get('/api/portal/admins')).json;
  exp('Danh sách có tri, đánh dấu là mình', list.some(a => a.username === 'tri' && a.self && a.active && a.twoFactor), true);

  const U = 'kt' + RUN;
  exp('Thêm thiếu mã 2 lớp bị từ chối', (await tri.post('/api/portal/admins', { username: U, name: 'Kỹ thuật' })).status, 403);
  exp('Thêm sai mã 2 lớp bị từ chối', (await tri.post('/api/portal/admins', { username: U, name: 'Kỹ thuật', code: '000000' })).status, 403);
  exp('Tên đăng nhập không hợp lệ bị từ chối', (await tri.post('/api/portal/admins', { username: 'Kỹ Thuật', name: 'x', code: totp(sTri) })).status, 400);
  let r = await tri.post('/api/portal/admins', { username: U, name: 'Kỹ thuật viên', code: totp(sTri) });
  exp('Thêm quản trị viên mới', r.status, 200);
  const pw1 = r.json && r.json.password;
  exp('Trả về mật khẩu tạm dạng XXXX-XXXX-XXXX', /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(pw1 || ''), true);
  exp('Không thêm trùng tên', (await tri.post('/api/portal/admins', { username: U, name: 'x', code: totp(sTri) })).status, 409);
  exp('Danh sách không lộ mật khẩu hay khóa 2 lớp', /passwordHash|totpSecret/i.test((await tri.get('/api/portal/admins')).text), false);

  const kt = client(D);
  const K = await login(kt, U, pw1);
  exp('Người mới đăng nhập, quét mã 2 lớp lần đầu', K.r.status, 200);
  exp('Người mới thấy danh sách xã', (await kt.get('/api/portal/tenants')).status, 200);
  exp('Sửa họ tên', (await tri.put('/api/portal/admins/' + U, { name: 'Nguyễn Kỹ Thuật' })).json?.name, 'Nguyễn Kỹ Thuật');

  exp('Không tự khóa mình', (await tri.post('/api/portal/admins/tri/lock', { code: totp(sTri) })).status, 400);
  exp('Không tự đặt lại cho mình', (await tri.post('/api/portal/admins/tri/reset', { code: totp(sTri) })).status, 400);
  exp('Khóa thiếu mã bị từ chối', (await tri.post(`/api/portal/admins/${U}/lock`, {})).status, 403);
  exp('Khóa người mới', (await tri.post(`/api/portal/admins/${U}/lock`, { code: totp(sTri) })).json?.active, false);
  exp('Phiên đang mở của người bị khóa bị thoát', (await kt.get('/api/portal/tenants')).status, 401);
  exp('Người bị khóa không đăng nhập được', (await kt.post('/api/portal/login', { username: U, password: pw1 })).status, 401);
  exp('Mở lại người mới', (await tri.post(`/api/portal/admins/${U}/unlock`, { code: totp(sTri) })).json?.active, true);

  r = await tri.post(`/api/portal/admins/${U}/reset`, { code: totp(sTri) });
  exp('Đặt lại mật khẩu và 2 lớp', r.status, 200);
  exp('Sau đặt lại: chưa bật 2 lớp', r.json?.admin?.twoFactor, false);
  exp('Mật khẩu cũ hết hiệu lực', (await kt.post('/api/portal/login', { username: U, password: pw1 })).status, 401);
  const K2 = await login(kt, U, r.json.password);
  exp('Đăng nhập lại bằng mật khẩu tạm mới, quét mã mới', K2.r.status, 200);

  // Người mới khóa tri, rồi tri không vào được; không khóa được người cuối cùng
  exp('Người mới khóa tri', (await kt.post('/api/portal/admins/tri/lock', { code: totp(K2.secret) })).json?.active, false);
  exp('tri bị thoát', (await tri.get('/api/portal/admins')).status, 401);
  exp('Không khóa được người cuối cùng còn hoạt động (chính mình)', (await kt.post(`/api/portal/admins/${U}/lock`, { code: totp(K2.secret) })).status, 400);
  exp('Mở lại tri', (await kt.post('/api/portal/admins/tri/unlock', { code: totp(K2.secret) })).json?.active, true);
  // Mã vừa dùng để xác nhận không dùng lại được cho đăng nhập: lấy mã của chu kỳ kế tiếp (ứng dụng chấp nhận lệch 1 chu kỳ)
  await tri.post('/api/portal/login', { username: 'tri', password: PW });
  exp('tri đăng nhập lại được', (await tri.post('/api/portal/login', { username: 'tri', password: PW, code: totp(sTri, 1) })).status, 200);
  exp('Dọn: tri khóa tài khoản thử', (await tri.post(`/api/portal/admins/${U}/lock`, { code: totp(sTri, 1) })).json?.active, false);

  const logs = (await tri.get('/api/portal/logs')).json;
  exp('Nhật ký ghi thêm, khóa, mở, đặt lại', ['Thêm quản trị viên nền tảng', 'Khóa quản trị viên nền tảng', 'Mở lại quản trị viên nền tảng', 'Đặt lại mật khẩu và xác thực 2 lớp cho quản trị viên nền tảng'].every(a => logs.some(l => l.action === a)), true);
  exp('Trang có thẻ Quản trị viên', /data-tab="qt"|Quản trị viên/.test((await tri.get('/js/nentang.js')).text), true);

  console.log(`\n${n - errs.length}/${n} kiểm tra đạt`);
  if (errs.length) { console.log('LỖI:\n - ' + errs.join('\n - ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
