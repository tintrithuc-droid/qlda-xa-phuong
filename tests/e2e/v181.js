// Kiểm thử bản 1.8.1: quản trị tự thiết lập giao diện đơn vị (trang đăng nhập, ảnh nền, màu chủ đạo, biểu tượng trình duyệt, mẫu in)
// node tests/e2e/v181.js [http://127.0.0.1:5080]   (chạy sau smoke.js)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const PW = process.env.ADMIN_PW || 'Admin2026', USER = process.env.ADMIN_USER || 'admin';
const errs = [], ok = [];
const check = (cond, msg) => { (cond ? ok : errs).push(msg); console.log((cond ? 'ĐẠT  ' : 'LỖI  ') + msg); };
// Ảnh PNG 1x1 (logo) và ảnh PNG ngang nhỏ (ảnh nền)
function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(x => parseInt(x, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  // Chạy sau smoke.js: quản trị đã bật xác thực 2 lớp (mã bí mật ở shots/admin-totp.txt)
  const H = { headers: { 'X-QLDA': '1' } };
  const lr = await ctx.request.post(BASE + '/api/auth/login', { ...H, data: { username: USER, password: PW } });
  if (lr.status() !== 200) throw new Error('Đăng nhập quản trị: ' + lr.status());
  const sec = fs.existsSync(SHOTS + '/admin-totp.txt') ? fs.readFileSync(SHOTS + '/admin-totp.txt', 'utf8').trim() : '';
  // Mỗi mã 2 lớp chỉ dùng một lần: bài chạy ngay trước có thể đã dùng mã của 30 giây này, khi đó chờ sang mã kế tiếp
  if (sec) { let m = await ctx.request.post(BASE + '/api/auth/mfa', { ...H, data: { code: totp(sec) } });
    if (m.status() !== 200) { await new Promise(r => setTimeout(r, 31000 - Date.now() % 30000)); m = await ctx.request.post(BASE + '/api/auth/mfa', { ...H, data: { code: totp(sec) } }); }
    if (m.status() !== 200) throw new Error('Mã 2 lớp: ' + m.status()); }
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#app', { timeout: 30000 });

  // 1. Trang mở ra đã có tiêu đề, tệp kê khai ứng dụng theo đơn vị
  const html0 = await (await p.request.get(BASE + '/')).text();
  check(/<title>[^<]+ – [^<]+<\/title>/.test(html0) && html0.includes('/api/branding/manifest.webmanifest'), 'Trang chính có tiêu đề theo đơn vị và tệp kê khai động');
  const man0 = await (await p.request.get(BASE + '/api/branding/manifest.webmanifest')).json();
  check(man0.theme_color === '#0d2a57' && Array.isArray(man0.icons), 'Tệp kê khai mặc định: màu xanh hành chính');

  // 2. Quản trị thiết lập các mục mới
  await p.evaluate(() => { S.tab.qt = 'org'; location.hash = 'quan-tri'; }); await p.waitForSelector('#br_loginTitle');
  const secs = await p.$$eval('#brform h3.br-sec', a => a.map(x => x.textContent));
  check(secs.length === 7 && secs.includes('Phân hệ sử dụng') && secs.includes('Lĩnh vực dự án') && secs.includes('Trang đăng nhập') && secs.includes('Báo cáo và mẫu in'), 'Thẻ Thông tin đơn vị chia 7 nhóm: ' + secs.join(', '));
  await p.fill('#br_orgShort', 'Tin học Tri Thức'); await p.fill('#br_appName', 'Quản lý dự án tư vấn');
  await p.fill('#br_orgName', 'Công ty Cổ phần Tin học Tri Thức'); await p.fill('#br_unitName', 'Tư vấn giám sát');
  await p.fill('#br_loginTitle', 'Đăng nhập Tri Thức'); await p.fill('#br_loginHint', 'Dùng tài khoản công ty cấp.');
  await p.fill('#br_forgotText', 'Quên mật khẩu: gọi phòng Kỹ thuật.');
  await p.selectOption('#br_bannerDeco', '0'); await p.selectOption('#br_color', 'teal'); await p.selectOption('#br_printNation', '0');
  await p.fill('#br_place', 'Cần Thơ'); await p.fill('#br_signReport', 'GIÁM ĐỐC'); await p.fill('#br_signApprove', 'BAN GIÁM ĐỐC');
  await p.click('[data-act=brand-save]'); await p.waitForTimeout(800);
  check(await p.evaluate(() => document.documentElement.dataset.color) === 'teal', 'Màu chủ đạo của đơn vị áp dụng ngay cho người dùng chưa tự chọn màu');
  check(await p.evaluate(() => document.title) === 'Quản lý dự án tư vấn – Tin học Tri Thức', 'Tiêu đề thẻ trình duyệt đổi ngay');

  // 3. Logo và ảnh nền
  const lg = path.join(os.tmpdir(), 'logo-tt.png'), bg = path.join(os.tmpdir(), 'nen-dang-nhap.png');
  fs.writeFileSync(lg, PNG); fs.writeFileSync(bg, PNG);
  await p.setInputFiles('#br_logo', lg); await p.waitForTimeout(1000);
  await p.setInputFiles('#br_loginbg', bg); await p.waitForTimeout(1000);
  const brNow = await p.evaluate(() => BR);
  check(!!brNow.logo && !!brNow.loginBg, 'Tải được logo và ảnh nền trang đăng nhập');
  check((await p.getAttribute('#favicon', 'href')) === brNow.logo, 'Biểu tượng thẻ trình duyệt dùng logo đơn vị');
  check(await p.$('.bg-prev:not(.none)') !== null, 'Thẻ quản trị hiện ảnh xem trước nền đăng nhập');
  await p.screenshot({ path: `${SHOTS}/v181-quan-tri-giao-dien.png`, fullPage: true });
  const man1 = await (await p.request.get(BASE + '/api/branding/manifest.webmanifest')).json();
  check(man1.theme_color === '#0a3431' && man1.icons[0].src === brNow.logo && man1.name.includes('Tri Thức'), 'Tệp kê khai theo đơn vị: tên, màu, biểu tượng');
  const html1 = await (await p.request.get(BASE + '/')).text();
  check(html1.includes('<title>Quản lý dự án tư vấn – Tin học Tri Thức</title>') && html1.includes('content="#0a3431"') && html1.includes(`href="${brNow.logo}"`), 'Máy chủ dựng sẵn tiêu đề, màu, biểu tượng khi mở trang');

  // 4. Mẫu in
  const pr = await p.evaluate(() => ({ h: printHead(), d: printDate('2026-11-18') }));
  check(!pr.h.includes('CỘNG HÒA') && pr.h.includes('CÔNG TY CỔ PHẦN TIN HỌC TRI THỨC'), 'Mẫu in bỏ quốc hiệu khi đơn vị chọn Không');
  check(pr.d === 'Cần Thơ, ngày 18 tháng 11 năm 2026', 'Dòng địa danh, ngày tháng: ' + pr.d);
  check(await p.evaluate(() => DK_RC_SIGN()[2]) === 'BAN GIÁM ĐỐC', 'Chức danh ký bảng đối soát theo thiết lập');

  // 5. Tùy chọn màu riêng của người dùng
  check(await p.evaluate(() => UI.clean({ color: 'navy' }).color) === 'unit', 'Tùy chọn cũ (xanh hành chính mặc định) chuyển sang Theo đơn vị');
  check(await p.evaluate(() => UI.clean({ color: 'navy', v: 2 }).color) === 'navy', 'Người đã tự chọn màu vẫn giữ màu của mình');
  await p.click('[data-act=appearance]'); await p.waitForSelector('.ap');
  const swl = await p.$$eval('.ap .swatches label', a => a.map(x => x.textContent.trim()));
  check(swl[0].startsWith('Theo đơn vị'), 'Hộp thoại Giao diện có lựa chọn Theo đơn vị: ' + swl[0]);
  await p.screenshot({ path: `${SHOTS}/v181-hop-thoai-giao-dien.png` });
  await p.click('.ap [data-close]');

  // 6. Trang đăng nhập (khách)
  const anon = await b.newContext({ viewport: { width: 1400, height: 900 } }); const ap = await anon.newPage();
  await ap.goto(BASE + '/'); await ap.waitForSelector('#login');
  check((await ap.textContent('#login h2')) === 'Đăng nhập Tri Thức' && (await ap.textContent('#login .form-head p')) === 'Dùng tài khoản công ty cấp.', 'Khung đăng nhập dùng tiêu đề, dòng hướng dẫn mới');
  check((await ap.textContent('#login')).includes('Quên mật khẩu: gọi phòng Kỹ thuật.'), 'Dòng quên mật khẩu theo thiết lập');
  check(await ap.$('.auth.plain .art.has-bg') !== null && await ap.$('.drum-mark') === null, 'Banner dùng ảnh nền, bỏ họa tiết trống đồng và vạch màu');
  check(await ap.evaluate(() => document.documentElement.dataset.color) === 'teal', 'Trang đăng nhập dùng màu chủ đạo của đơn vị');
  await ap.screenshot({ path: `${SHOTS}/v181-dang-nhap.png` });
  const mob = await b.newContext({ viewport: { width: 390, height: 844 } }); const mp = await mob.newPage();
  await mp.goto(BASE + '/'); await mp.waitForSelector('#login');
  check(await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Trang đăng nhập trên điện thoại không tràn ngang');
  await mp.screenshot({ path: `${SHOTS}/v181-dang-nhap-dt.png` });
  const ar = anon.request;
  check((await ar.post(BASE + '/api/branding/loginbg', { headers: { 'X-QLDA': '1' }, multipart: { file: { name: 'a.png', mimeType: 'image/png', buffer: PNG } } })).status() === 401, 'Khách không tải được ảnh nền');
  check((await ar.get(BASE + brNow.loginBg)).status() === 200, 'Khách xem được ảnh nền (trang đăng nhập)');

  // 7. Giá trị không hợp lệ bị bỏ qua; xóa ảnh nền; khôi phục mặc định
  const put = await (await p.request.put(BASE + '/api/branding', { headers: { 'X-QLDA': '1' }, data: { ...brNow, color: 'tim-hong', printNation: 'x' } })).json();
  check(put.color === 'navy' && put.printNation === '1', 'Màu, cờ không hợp lệ bị bỏ qua (dùng mặc định)');
  await p.evaluate(() => api('PUT', '/api/branding', { ...BR }).then(setBrand));
  const del = await (await p.request.delete(BASE + '/api/branding/loginbg', { headers: { 'X-QLDA': '1' } })).json();
  check(del.loginBg === null && !!del.logo, 'Xóa ảnh nền, logo giữ nguyên');
  const logs = await (await p.request.get(BASE + '/api/data')).json();
  check((logs.logs || []).some(l => /Ảnh nền trang đăng nhập/.test(l.target || '')), 'Nhật ký hoạt động ghi thao tác ảnh nền');

  // 8. Ô chọn nhiều mục có ô gõ tìm (không dấu vẫn tìm được)
  await p.evaluate(() => { const s = document.createElement('select'); s.id = 'ss_test'; s.setAttribute('aria-label', 'Dự án thử');
    s.innerHTML = Array.from({ length: 15 }, (_, i) => `<option value="p${i}">${i === 7 ? 'Đường giao thông nông thôn ấp Phú Lợi' : 'Dự án số ' + i}</option>`).join('');
    s.onchange = () => { window._ssChanged = s.value; }; document.querySelector('#app').prepend(s); });
  await p.click('#ss_test'); await p.waitForSelector('.ss-pop input');
  const n15 = await p.$$eval('.ss-pop li', a => a.map(x => x.textContent)); check(n15.length === 15, 'Bấm ô chọn dự án mở danh sách kèm ô tìm');
  await p.keyboard.type('duong giao thong'); await p.waitForTimeout(100);
  check(await p.$$eval('.ss-pop li[data-k]', a => a.length) === 1, 'Gõ không dấu lọc đúng dự án');
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  check(await p.evaluate(() => window._ssChanged === 'p7' && !document.querySelector('.ss-pop')), 'Chọn bằng phím Enter, ô chọn nhận giá trị và đóng danh sách');
  await p.evaluate(() => document.querySelector('#ss_test').remove());

  await b.close();
  console.log(`\n${ok.length} đạt, ${errs.length} lỗi`); if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
