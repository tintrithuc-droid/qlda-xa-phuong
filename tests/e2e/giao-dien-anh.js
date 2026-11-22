// Chụp ảnh các màn hình chính để so sánh phong cách giao diện: node tests/e2e/giao-dien-anh.js <thư mục ảnh> [style] [http://127.0.0.1:5080]
// Cần CSDL trống (khởi tạo kèm dữ liệu mẫu và dữ liệu e-work mẫu).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2], STYLE = process.argv[3] || '', BASE = process.argv[4] || 'http://127.0.0.1:5080';
fs.mkdirSync(OUT, { recursive: true });
const PW = 'Admin2026', H = { 'X-QLDA': '1' };
function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, timezoneId: 'Asia/Ho_Chi_Minh', geolocation: { latitude: 10.0343, longitude: 105.7470 }, permissions: ['geolocation'] });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  // Đặt phong cách của đơn vị (Quản trị → Thông tin đơn vị) như khi triển khai thật
  const setStyle = async () => { if (STYLE) { const cur = await (await p.request.get(BASE + '/api/branding')).json(); await p.request.put(BASE + '/api/branding', { headers: H, data: { ...Object.fromEntries(Object.entries(cur).filter(([k, v]) => typeof v === 'string')), style: STYLE } }); await p.reload(); await p.waitForSelector('#app', { timeout: 15000 }); } };
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  if (STYLE) await p.evaluate(s => document.documentElement.dataset.style = s, STYLE);
  await p.screenshot({ path: `${OUT}/01-khoi-tao.png` });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.check('#su_sample'); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  await p.request.post(BASE + '/api/vp/import-ework', { headers: H, multipart: { file: { name: 'ework.json', mimeType: 'application/json', buffer: fs.readFileSync(path.join(__dirname, '../fixtures/ework_mau.json')) } } });
  await setStyle();
  const shots = [['02-tong-quan', 'tong-quan'], ['03-du-an', 'du-an'], ['04-goi-thau', 'goi-thau'], ['05-tien-do', 'tien-do'], ['06-thanh-toan', 'thanh-toan'], ['07-bao-cao', 'bao-cao'],
    ['08-diem-danh', 'van-phong'], ['09-bang-cong', 'diem-danh'], ['10-de-xuat', 'de-xuat'], ['11-nhan-su', 'nhan-su'], ['12-quan-tri', 'quan-tri']];
  for (const [n, r] of shots) { await p.evaluate(r => { try { vpReset && vpReset(); } catch {} location.hash = r; }, r); await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/${n}.png` }); }
  // Biểu mẫu thêm dự án
  await p.evaluate(() => location.hash = 'du-an'); await p.waitForTimeout(600);
  const add = await p.$('[data-act="add-proj"], [data-act="add-project"], button.primary'); if (add) { await add.click(); await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/13-bieu-mau.png` }); await p.keyboard.press('Escape'); }
  // Chế độ tối
  await p.evaluate(() => UI.set('mode', 'dark')); await p.evaluate(() => location.hash = 'tong-quan'); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/14-tong-quan-toi.png` });
  await p.evaluate(() => UI.set('mode', 'light'));
  // Di động
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, storageState: await ctx.storageState() });
  const mp = await m.newPage(); await mp.goto(BASE + '/#tong-quan'); await mp.waitForSelector('#app', { timeout: 15000 }); await mp.waitForTimeout(900); await mp.screenshot({ path: `${OUT}/15-di-dong.png` });
  await mp.evaluate(() => location.hash = 'van-phong'); await mp.waitForTimeout(900); await mp.screenshot({ path: `${OUT}/16-di-dong-diem-danh.png` });
  // Đăng xuất → trang đăng nhập
  await p.evaluate(() => { localStorage.clear(); }); await ctx.clearCookies(); await p.goto(BASE + '/'); await p.waitForSelector('#login', { timeout: 15000 }); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/00-dang-nhap.png` });
  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'Chụp xong, không lỗi trang');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
