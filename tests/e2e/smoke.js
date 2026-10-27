// Kiểm thử đầu-cuối bằng Playwright: node tests/e2e/smoke.js [http://127.0.0.1:5080]
// Yêu cầu máy chủ chạy với cơ sở dữ liệu trống (lần đầu sẽ khởi tạo hệ thống kèm dữ liệu mẫu).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const PW = 'Admin2026';
const errs = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
// Mã TOTP (RFC 6238) như ứng dụng Google/Microsoft Authenticator, để kiểm thử xác thực 2 lớp
function totp(secret, offset = 0) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}

function watch(p, tag) {
  p.on('pageerror', e => errs.push(`${tag} PAGEERR ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(`${tag} CONSOLE ${m.text()}`); });
  p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400 && !p._expectFail) errs.push(`${tag} HTTP ${r.status()} ${r.request().method()} ${r.url()}`); });
}
async function go(p, route) { await p.evaluate(r => location.hash = r, route); await p.waitForTimeout(400); }
async function login(p, u, pw = PW) {
  await p.goto(BASE + '/'); await p.waitForSelector('#login, #setup, #app', { timeout: 15000 });
  if (await p.$('#login')) { await p.fill('#lg_user', u); await p.fill('#lg_pw', pw); await p.click('#login button[type=submit]'); await p.waitForSelector('#app', { timeout: 15000 }); }
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); watch(p, 'admin');
  await p.goto(BASE + '/'); await p.waitForSelector('#login, #setup', { timeout: 15000 });
  if (await p.$('#setup')) {
    await p.fill('#su_name', 'Nguyễn Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW);
    await p.click('#setup button[type=submit]');
  } else throw new Error('Cần cơ sở dữ liệu trống');
  // Tài khoản quản trị bắt buộc thiết lập xác thực 2 lớp ngay sau khởi tạo
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); await p.screenshot({ path: `${SHOTS}/mfa-enroll.png` });
  const secret = await p.evaluate(() => S.mfaStep.secret);
  p._expectFail = true; await p.fill('#mf_code', '000000'); await p.click('#mfa button[type=submit]'); await p.waitForTimeout(400); p._expectFail = false;
  if (!(await p.textContent('#mf_err')).trim()) errs.push('Không báo lỗi khi nhập sai mã 2 lớp');
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]');
  await p.waitForSelector('#mfa .rcodes', { timeout: 10000 }); await p.screenshot({ path: `${SHOTS}/mfa-codes.png` });
  const rcodes = await p.evaluate(() => S.mfaStep.codes);
  if (rcodes.length !== 10) errs.push('Số mã khôi phục: ' + rcodes.length);
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const counts = await p.evaluate(() => Object.fromEntries(Object.entries(Store.data).map(([k, v]) => [k, v.length])));
  console.log('Số bản ghi sau khởi tạo:', JSON.stringify(counts));

  const routes = ['tong-quan', 'du-an', 'mo-hinh', 'goi-thau', 'tien-do', 'nhat-ky', 'khoi-luong', 'thanh-toan', 'bao-cao', 'quan-tri', 'hien-truong', 'doi-chieu'];
  for (const r of routes) {
    await go(p, r); await p.screenshot({ path: `${SHOTS}/desk-${r}.png`, fullPage: true });
    if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) errs.push('desk OVERFLOW ' + r);
  }

  // Dự án: xem chi tiết các tab
  await go(p, 'du-an'); await p.click('tr.click'); await p.waitForTimeout(300);
  for (const t of ['tasks', 'legal', 'status']) { await p.click(`[data-g=proj][data-id=${t}]`); await p.waitForTimeout(200); }

  // Nhật ký thi công kèm ảnh hiện trường (tải lên kho tệp)
  const img = path.join(os.tmpdir(), 'qlda-test.png'); fs.copyFileSync(path.join(__dirname, '../../src/QldaTtts.Web/wwwroot/icons/icon-512.png'), img);
  const nd0 = await p.evaluate(() => Store.data.diaries.length);
  await go(p, 'nhat-ky'); await p.click('[data-act=add-diary]'); await p.waitForTimeout(200);
  await p.selectOption('#f_packageId', { index: 1 }); await p.fill('#f_works', 'Đổ bê tông móng M1 | 12 | m3');
  await p.setInputFiles('#f_photos_new', img);
  await p.click('#mform [type=submit]'); await p.waitForTimeout(1500);
  const diary = await p.evaluate(() => Store.data.diaries.slice(-1)[0]);
  const nd1 = await p.evaluate(() => Store.data.diaries.length);
  console.log('Nhật ký:', nd0, '→', nd1, '| ảnh:', diary.photos && diary.photos[0] && diary.photos[0].url);
  if (nd1 !== nd0 + 1 || !diary.photos?.[0]?.url?.startsWith('/api/files/')) errs.push('Nhật ký/ảnh không lưu được');
  else { const r = await p.request.get(BASE + diary.photos[0].url); if (r.status() !== 200) errs.push('Không tải lại được ảnh ' + r.status()); }

  // Tiến độ, khối lượng, thanh toán
  await go(p, 'tien-do'); await p.click('[data-act=upd-sched]'); await p.fill('#f_progress', '90'); await p.click('#mform [type=submit]'); await p.waitForTimeout(500);
  await go(p, 'khoi-luong'); await p.click('[data-act=add-vol]'); await p.selectOption('#f_boqId', { index: 0 }); await p.fill('#f_doneQty', '10'); await p.fill('#f_acceptedQty', '5'); await p.click('#mform [type=submit]'); await p.waitForTimeout(500);
  for (const t of ['nt', 'th']) { await p.click(`[data-g=kl][data-id=${t}]`); await p.waitForTimeout(200); }
  await go(p, 'thanh-toan'); for (const t of ['kh', 'hs', 'th']) { await p.click(`[data-g=tt][data-id=${t}]`); await p.waitForTimeout(200); }
  await go(p, 'bao-cao'); for (const v of ['tiendo', 'hopdong', 'khoiluong', 'thoigian']) { await p.selectOption('[data-f=bct]', v); await p.waitForTimeout(250); }

  // Mô hình hóa: tải tệp mô hình mới
  await go(p, 'mo-hinh');
  const nm0 = await p.evaluate(() => Store.data.models.length);
  const addBtn = await p.$('[data-act=add-model]');
  if (addBtn) {
    await addBtn.click(); await p.waitForTimeout(200);
    const ifc = path.join(os.tmpdir(), 'NhaDieuHanh.ifc'); fs.writeFileSync(ifc, 'ISO-10303-21;\nHEADER;ENDSEC;DATA;ENDSEC;END-ISO-10303-21;\n');
    await p.setInputFiles('#f_file', ifc);
    const sel = await p.$('#f_itemId'); if (sel) await p.selectOption('#f_itemId', { index: 1 }).catch(() => {});
    await p.click('#mform [type=submit]'); await p.waitForTimeout(1200);
    const nm1 = await p.evaluate(() => Store.data.models.length);
    console.log('Tệp mô hình:', nm0, '→', nm1);
    if (nm1 !== nm0 + 1) errs.push('Không thêm được tệp mô hình');
  } else errs.push('Không thấy nút thêm tệp mô hình');

  // Quản trị: thêm người dùng, phân quyền nhóm, nhật ký
  await go(p, 'quan-tri');
  await p.click('[data-act=add-user]'); await p.waitForTimeout(200);
  await p.fill('#f_username', 'canbo1'); await p.fill('#f_name', 'Cán bộ thử nghiệm'); await p.selectOption('#f_groupId', 'g-tech'); await p.fill('#f_pw', 'Canbo2026');
  await p.click('#mform [type=submit]'); await p.waitForTimeout(600);
  if (!await p.evaluate(() => Store.data.users.some(u => u.username === 'canbo1'))) errs.push('Không thêm được người dùng');
  if (await p.evaluate(() => Store.data.users.some(u => 'passwordHash' in u || 'pw' in u))) errs.push('Lộ mật khẩu băm ra giao diện');
  for (const t of ['groups', 'cats', 'logs', 'sys']) { await p.click(`[data-g=qt][data-id=${t}]`); await p.waitForTimeout(250); await p.screenshot({ path: `${SHOTS}/desk-qt-${t}.png`, fullPage: true }); }
  await p.click('[data-g=qt][data-id=groups]'); await p.click('[data-act=edit-groups]'); await p.waitForTimeout(200); await p.click('#mform [type=submit]'); await p.waitForTimeout(400);
  await p.waitForTimeout(2000);
  const nlogs = await p.evaluate(() => Store.data.logs.length); console.log('Nhật ký hệ thống:', nlogs);

  // Sao lưu
  await p.click('[data-g=qt][data-id=sys]');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), p.click('[data-act=backup]')]);
  const bk = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  console.log('Sao lưu:', dl.suggestedFilename(), Object.keys(bk.data).length, 'tập dữ liệu');
  const rs = await p.evaluate(async o => { const r = await fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: JSON.stringify(o) }); return [r.status, await r.json()]; }, bk);
  console.log('Phục hồi:', rs[0], JSON.stringify(rs[1]));
  if (rs[0] !== 200) errs.push('Phục hồi lỗi ' + JSON.stringify(rs));

  // Bảo mật: gọi API ghi không có header chống CSRF phải bị chặn
  p._expectFail = true;
  const raw = await p.evaluate(async () => (await fetch('/api/data/projects/x1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status);
  p._expectFail = false;
  if (raw !== 400) errs.push('Thiếu chặn CSRF: ' + raw);

  // Tài khoản tư vấn giám sát (bị giới hạn quyền) trên điện thoại
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const m = await ctx2.newPage(); watch(m, 'giamsat');
  await login(m, 'giamsat');
  for (const r of ['hien-truong', 'nhat-ky', 'tien-do']) {
    await go(m, r); await m.screenshot({ path: `${SHOTS}/mob-${r}.png` });
    if (await m.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) errs.push('mob OVERFLOW ' + r);
  }
  m._expectFail = true;
  const denied = await m.evaluate(async () => (await fetch('/api/data/catalogs/c-x', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: '{"type":"x","value":"y"}' })).status);
  if (denied !== 403) errs.push('Giám sát ghi được danh mục: ' + denied);
  m._expectFail = false;
  console.log('Giám sát thấy', await m.evaluate(() => Store.data.projects.length), 'dự án, logs', await m.evaluate(() => Store.data.logs.length));

  // Quản trị đặt lại mật khẩu: phiên đang mở của giám sát phải hết hiệu lực
  const r1 = await p.evaluate(async () => (await fetch('/api/users/u-giamsat/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: JSON.stringify({ password: 'Moi2026abc' }) })).status);
  m._expectFail = true;
  const r2 = await m.evaluate(async () => (await fetch('/api/data')).status);
  m._expectFail = false;
  console.log('Đặt lại mật khẩu:', r1, '→ phiên cũ của giám sát:', r2);
  if (r1 !== 200 || r2 !== 401) errs.push('Phiên cũ vẫn dùng được sau khi đặt lại mật khẩu');

  // Tên đăng nhập không tồn tại: báo sai thông tin (401), không lỗi máy chủ
  const ctx4 = await b.newContext(); const q4 = await ctx4.newPage();
  const nx = await q4.request.post(BASE + '/api/auth/login', { headers: { 'X-QLDA': '1' }, data: { username: 'khongtontai', password: 'abc12345' } });
  if (nx.status() !== 401) errs.push('Đăng nhập tài khoản không tồn tại trả ' + nx.status());

  // Xác thực 2 lớp: đăng nhập lại quản trị bằng mã khôi phục, mã đã dùng không dùng lại được
  const ctx5 = await b.newContext({ viewport: { width: 1280, height: 860 } }); const a2 = await ctx5.newPage(); watch(a2, 'admin2');
  await a2.goto(BASE + '/'); await a2.waitForSelector('#login'); await a2.fill('#lg_user', 'admin'); await a2.fill('#lg_pw', PW); await a2.click('#login button[type=submit]');
  await a2.waitForSelector('#mfa #mf_code'); await a2.screenshot({ path: `${SHOTS}/mfa-verify.png` });
  a2._expectFail = true;
  if ((await a2.evaluate(async () => (await fetch('/api/data')).status)) !== 401) errs.push('Chưa nhập mã 2 lớp mà đã vào được dữ liệu');
  a2._expectFail = false;
  await a2.click('#mf_alt'); await a2.fill('#mf_code', rcodes[0]); await a2.click('#mfa button[type=submit]'); await a2.waitForSelector('#app', { timeout: 15000 });
  const rc = await ctx5.request.post(BASE + '/api/auth/logout', { headers: { 'X-QLDA': '1' } });
  await ctx5.request.post(BASE + '/api/auth/login', { headers: { 'X-QLDA': '1' }, data: { username: 'admin', password: PW } });
  const reuse = await ctx5.request.post(BASE + '/api/auth/mfa', { headers: { 'X-QLDA': '1' }, data: { code: rcodes[0], recovery: true } });
  if (reuse.status() !== 400 || rc.status() !== 200) errs.push('Mã khôi phục dùng lại được: ' + reuse.status());

  // Tài khoản quản trị thứ hai: thiết lập 2 lớp qua API, quản trị chính đặt lại thì phiên của người đó hết hiệu lực
  const cu = await p.evaluate(async () => (await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: JSON.stringify({ username: 'qt2', name: 'Quản trị 2', groupId: 'g-admin', password: 'Admin2026' }) })).json());
  const ctx6 = await b.newContext(); const rq = ctx6.request, H = { 'X-QLDA': '1' };
  const ch = await (await rq.post(BASE + '/api/auth/login', { headers: H, data: { username: 'qt2', password: PW } })).json();
  if (ch.mfa !== 'enroll' || !ch.secret) errs.push('Quản trị mới không bị yêu cầu thiết lập 2 lớp: ' + JSON.stringify(ch).slice(0, 80));
  const ok2 = await rq.post(BASE + '/api/auth/mfa', { headers: H, data: { code: totp(ch.secret) } });
  const d1 = (await rq.get(BASE + '/api/data')).status();
  const rs2 = await p.evaluate(async id => (await fetch('/api/users/' + id + '/reset-2fa', { method: 'POST', headers: { 'X-QLDA': '1' } })).status, cu.id);
  const d2 = (await rq.get(BASE + '/api/data')).status();
  console.log('Quản trị 2: bật 2 lớp', ok2.status(), '→ dữ liệu', d1, '; đặt lại 2 lớp', rs2, '→ phiên cũ', d2);
  if (ok2.status() !== 200 || d1 !== 200 || rs2 !== 200 || d2 !== 401) errs.push('Luồng đặt lại 2 lớp sai');
  await p.evaluate(() => { S.tab.qt = 'users'; return Store.load(); }); await go(p, 'quan-tri'); await p.screenshot({ path: `${SHOTS}/mfa-users.png` });

  // Đăng nhập sai nhiều lần bị tạm khóa
  const ctx3 = await b.newContext(); const q = await ctx3.newPage(); q._expectFail = true;
  let last;
  for (let i = 0; i < 6; i++) last = await q.request.post(BASE + '/api/auth/login', { headers: { 'X-QLDA': '1' }, data: { username: 'ketoan', password: 'sai' + i } });
  console.log('Sau 6 lần sai:', last.status());
  if (last.status() !== 423) errs.push('Không tạm khóa khi nhập sai nhiều lần');

  // Đăng xuất
  await p.click('[data-act=account]').catch(() => {}); await p.waitForTimeout(200);
  if (await p.$('[data-act=logout]')) { await p.click('[data-act=logout]'); await p.waitForSelector('#login', { timeout: 5000 }); }

  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'KHÔNG CÓ LỖI');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
