// Kiểm thử chế độ cho thuê nhiều xã/phường (bản 1.6): trang quản lý thuê bao, cấp xã, mã khởi tạo,
// cách ly dữ liệu, phiên đăng nhập, tệp giữa các xã, tạm khóa, hết hạn, tên miền.
// Máy chủ chạy với Tenancy__Enabled=true, Tenancy__BaseDomain=qlda.test; đã tạo quản trị nền tảng bằng
//   dotnet QldaTtts.Web.dll --tao-quan-tri-nen-tang tri    (mật khẩu tạm truyền vào biến PORTAL_PW)
// Chạy: PORTAL_PW=XXXX-XXXX-XXXX node tests/e2e/thue-bao.js [http://127.0.0.1:8090]
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

(async () => {
  const portal = client('quantri.' + DOMAIN);
  console.log('Trang quản lý thuê bao');
  exp('Chưa đăng nhập không xem được danh sách', (await portal.get('/api/portal/tenants')).status, 401);
  exp('Sai mật khẩu', (await portal.post('/api/portal/login', { username: 'tri', password: 'sai-mat-khau-1' })).status, 401);
  let r = await portal.post('/api/portal/login', { username: 'tri', password: PW });
  if (r.json && r.json.mfa === 'enroll') {
    exp('Lần đầu: nhận mã QR bật 2 lớp', !!r.json.qrSvg, true);
    process.env.PORTAL_TOTP = r.json.secret;
    r = await portal.post('/api/portal/login', { username: 'tri', password: PW, code: totp(r.json.secret), ticket: r.json.ticket });
  } else if (r.json && r.json.mfa === 'verify') {
    r = await portal.post('/api/portal/login', { username: 'tri', password: PW, code: totp(process.env.PORTAL_TOTP_SECRET || '') });
  }
  exp('Đăng nhập quản trị nền tảng (mật khẩu + mã 2 lớp)', r.status, 200);
  exp('Trang nền tảng không mở API nghiệp vụ', (await portal.get('/api/data')).status, 404);
  exp('Trang nền tảng hiện giao diện quản lý', /nentang\.js/.test((await portal.get('/')).text), true);

  const A = 'a' + RUN + '-tan-hoa', B = 'b' + RUN + '-an-lac';
  exp('Mã xã không hợp lệ bị từ chối', (await portal.post('/api/portal/tenants', { code: 'Quản Trị', name: 'x' })).status, 400);
  exp('Mã dành riêng bị từ chối', (await portal.post('/api/portal/tenants', { code: 'quantri', name: 'x' })).status, 400);
  exp('Tên con của công ty bị từ chối', (await portal.post('/api/portal/tenants', { code: 'webmail', name: 'x' })).status, 400);
  const ca = await portal.post('/api/portal/tenants', { code: A, name: 'xã Tân Hòa', contact: 'Ông A – 0909', expiresAt: '2030-12-31' });
  exp('Tạo xã A', ca.status, 200);
  const cb = await portal.post('/api/portal/tenants', { code: B, name: 'phường An Lạc', hosts: `qlda.${B}.gov.test` });
  exp('Tạo xã B (có tên miền riêng)', cb.status, 200);
  exp('Không tạo trùng mã', (await portal.post('/api/portal/tenants', { code: A, name: 'trùng' })).status, 409);
  const tokA = ca.json.setupToken, tokB = cb.json.setupToken;
  exp('Mã khởi tạo dạng XXXX-XXXX-XXXX', /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(tokA), true);

  console.log('Cổng HTTPS hỏi tên miền');
  exp('Tên miền xã A được cấp chứng chỉ', (await client('x').get(`/api/tls-ask?domain=${A}.${DOMAIN}`)).status, 200);
  exp('Tên miền riêng xã B được cấp chứng chỉ', (await client('x').get(`/api/tls-ask?domain=qlda.${B}.gov.test`)).status, 200);
  exp('Tên miền lạ không được cấp', (await client('x').get(`/api/tls-ask?domain=la.${DOMAIN}`)).status, 404);
  exp('Tên miền lạ báo không tìm thấy đơn vị', (await client('la.' + DOMAIN).get('/')).status, 404);

  console.log('Khởi tạo tài khoản quản trị của xã bằng mã');
  const xa = client(A + '.' + DOMAIN), xb = client('qlda.' + B + '.gov.test');
  let st = await xa.get('/api/auth/state');
  exp('Xã A chưa khởi tạo, yêu cầu mã', st.json.initialized === false && st.json.setupToken === true, true);
  const setup = (c, token) => c.post('/api/auth/setup', { name: 'Quản trị', username: 'admin', password: 'Admin2026', groups: [], catalogs: [], token });
  exp('Khởi tạo không có mã bị chặn', (await setup(xa)).status, 403);
  exp('Khởi tạo bằng mã của xã khác bị chặn', (await setup(xa, tokB)).status, 403);
  exp('Trang quản lý thuê bao không mở trên tên miền xã', (await xa.get('/api/portal/tenants')).status, 404);
  const sa = await setup(xa, tokA.toLowerCase().replace(/-/g, ' '));
  exp('Khởi tạo xã A bằng đúng mã (không phân biệt hoa thường, dấu gạch)', sa.status, 200);
  exp('Quản trị xã bắt buộc bật 2 lớp', sa.json && sa.json.mfa, 'enroll');
  const secA = sa.json.secret;
  exp('Ứng dụng xác thực hiện tên xã', /Tân Hòa|T%C3%A2n%20H%C3%B2a/.test(sa.json.otpauthUri), true);
  exp('Hoàn tất 2 lớp xã A', (await xa.post('/api/auth/mfa', { code: totp(secA) })).status, 200);
  exp('Dùng lại mã khởi tạo sau khi đã khởi tạo', (await setup(xa, tokA)).status, 409);
  const sb = await setup(xb, tokB);
  exp('Khởi tạo xã B qua tên miền riêng', sb.status, 200);
  exp('Hoàn tất 2 lớp xã B', (await xb.post('/api/auth/mfa', { code: totp(sb.json.secret) })).status, 200);

  console.log('Cách ly dữ liệu');
  exp('Xã A tạo dự án', (await xa.put('/api/data/projects/p-rieng-a', { id: 'p-rieng-a', code: 'DA-A', name: 'Dự án riêng của xã A' })).status, 200);
  const boundary = '----qlda' + RUN;
  const file = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="bien-ban-A.pdf"\r\nContent-Type: application/pdf\r\n\r\n`), Buffer.from('%PDF-1.4 bien ban xa A'), Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const up = await xa.req('POST', '/api/files', file, { 'Content-Type': 'multipart/form-data; boundary=' + boundary });
  exp('Xã A tải tệp lên', up.status, 200);
  exp('Xã A mở được tệp của mình', (await xa.get('/api/files/' + up.json.id)).status, 200);
  const dB = await xb.get('/api/data');
  exp('Xã B không thấy dự án của xã A', dB.json.projects.some(p => p.id === 'p-rieng-a'), false);
  exp('Xã B chỉ thấy tài khoản của mình', dB.json.users.length, 1);
  exp('Xã B không mở được tệp của xã A', (await xb.get('/api/files/' + up.json.id)).status, 404);
  exp('Xã B tạo dự án cùng mã bản ghi không ảnh hưởng xã A', (await xb.put('/api/data/projects/p-rieng-a', { id: 'p-rieng-a', code: 'DA-B', name: 'Của xã B' })).status, 200);
  exp('Dự án xã A giữ nguyên', (await xa.get('/api/data')).json.projects.find(p => p.id === 'p-rieng-a').name, 'Dự án riêng của xã A');
  exp('Tên đơn vị trên giao diện xã A điền sẵn', (await xa.get('/api/branding')).json.orgName, 'Ủy ban nhân dân xã Tân Hòa');

  console.log('Phiên đăng nhập không dùng chéo giữa các xã');
  const stolen = client(B + '.' + DOMAIN); Object.assign(stolen.jar, xa.jar);
  exp('Cookie xã A mang sang xã B: không đăng nhập được', (await stolen.get('/api/auth/state')).json.user, null);
  exp('Cookie xã A mang sang xã B: không đọc được dữ liệu', (await stolen.get('/api/data')).status, 401);
  const toPortal = client('quantri.' + DOMAIN); Object.assign(toPortal.jar, xa.jar);
  exp('Cookie xã A mang sang trang quản lý thuê bao: bị từ chối', (await toPortal.get('/api/portal/tenants')).status, 401);

  console.log('Tạm khóa, hết hạn, thống kê');
  exp('Tạm khóa xã B', (await portal.post(`/api/portal/tenants/${B}/lock`, { reason: 'Chưa gia hạn hợp đồng.' })).status, 200);
  await new Promise(r => setTimeout(r, 300));
  const lk = await xb.get('/api/data');
  exp('Xã B tạm khóa: chặn truy cập', lk.status, 403);
  exp('Thông báo lý do tạm khóa', /Chưa gia hạn hợp đồng/.test(lk.json && lk.json.message), true);
  exp('Xã A vẫn hoạt động', (await xa.get('/api/data')).status, 200);
  exp('Mở lại xã B', (await portal.post(`/api/portal/tenants/${B}/unlock`)).status, 200);
  exp('Xã B dùng lại được', (await xb.get('/api/data')).status, 200);
  const y = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  exp('Đặt hạn xã B đã qua', (await portal.put(`/api/portal/tenants/${B}`, { name: 'phường An Lạc', hosts: `qlda.${B}.gov.test`, expiresAt: y })).status, 200);
  const ex = await xb.get('/');
  exp('Xã B hết hạn: báo hết hạn', ex.status === 403 && /Hết hạn/.test(ex.text), true);
  exp('Gia hạn xã B', (await portal.put(`/api/portal/tenants/${B}`, { name: 'phường An Lạc', hosts: `qlda.${B}.gov.test`, expiresAt: '2031-06-30' })).status, 200);
  exp('Xã B dùng lại sau gia hạn', (await xb.get('/api/data')).status, 200);
  const stt = await portal.get(`/api/portal/tenants/${A}/stats`);
  exp('Thống kê xã A', stt.status === 200 && stt.json.projects === 1 && stt.json.files >= 1 && stt.json.initialized, true);
  exp('Không cấp lại mã khi xã đã khởi tạo', (await portal.post(`/api/portal/tenants/${A}/setup-token`)).status, 409);
  exp('Đặt lại 2 lớp cho quản trị xã A (hỗ trợ)', (await portal.post(`/api/portal/tenants/${A}/reset-2fa`, { username: 'admin' })).status, 200);
  exp('Phiên cũ của xã A hết hiệu lực sau khi đặt lại', (await xa.get('/api/data')).status, 401);
  const relog = await xa.post('/api/auth/login', { username: 'admin', password: 'Admin2026' });
  exp('Đăng nhập lại xã A phải quét mã mới', relog.json && relog.json.mfa, 'enroll');
  const logs = (await portal.get('/api/portal/logs')).json;
  exp('Nhật ký nền tảng ghi việc tạo xã, khóa, đặt lại 2 lớp', ['Tạo xã mới', 'Tạm khóa xã', 'Đặt lại xác thực 2 lớp cho tài khoản của xã'].every(a => logs.some(l => l.action === a)), true);
  const list = (await portal.get('/api/portal/tenants')).json;
  exp('Danh sách xã đủ 2 đơn vị mới', [A, B].every(c => list.some(t => t.code === c && t.ready === 'Ready')), true);

  console.log(`\n${n - errs.length}/${n} kiểm tra đạt`);
  if (errs.length) { console.log('LỖI:\n - ' + errs.join('\n - ')); process.exit(1); }
  console.log('Thông tin dùng tiếp: PORTAL_TOTP_SECRET=' + (process.env.PORTAL_TOTP || '(đã bật trước)') + ' XA_A=' + A + ' XA_B=' + B);
})().catch(e => { console.error(e); process.exit(1); });
