// Chụp ảnh các màn hình chính để so sánh phong cách giao diện: node tests/e2e/giao-dien-anh.js <thư mục ảnh> [style] [http://127.0.0.1:5080]
// Cần CSDL trống (khởi tạo kèm dữ liệu mẫu và dữ liệu e-work mẫu).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// TT=1: thông tin Công ty CP Tin học Tri Thức, lĩnh vực CNTT, không nạp dữ liệu mẫu xã/phường
const TT = process.env.TT === '1';
const BR_TT = { appName: 'Quản lý dự án, văn phòng', orgShort: 'Tin học Tri Thức', orgName: 'Công ty Cổ phần Tin học Tri Thức', unitName: 'Hệ thống quản lý dự án và văn phòng',
  bannerTitle: 'Quản lý dự án, văn phòng Tri Thức', bannerText: 'Tri Thức số hóa công việc. Điểm danh, đề xuất, bảng công, lịch công tác, thông báo, KPI và dự án trên một hệ thống.', address: 'Tầng 3, Tòa nhà An Phú Plaza, 117-119 Lý Chính Thắng, P. Võ Thị Sáu, Q.3, TP.HCM', footer: '© {năm} Công ty Cổ phần Tin học Tri Thức',
  reportOrg: 'Công ty Cổ phần Tin học Tri Thức', support: 'Hỗ trợ: quản trị hệ thống Tri Thức', field: 'cntt', bannerDeco: '0', printNation: '1', signReport: 'GIÁM ĐỐC', signApprove: 'BAN GIÁM ĐỐC' };
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
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', geolocation: { latitude: 10.0343, longitude: 105.7470 }, permissions: ['geolocation'] });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  // Đặt phong cách của đơn vị (Quản trị → Thông tin đơn vị) như khi triển khai thật
  const setStyle = async () => { if (STYLE) { const cur = await (await p.request.get(BASE + '/api/branding')).json(); await p.request.put(BASE + '/api/branding', { headers: H, data: { ...Object.fromEntries(Object.entries(cur).filter(([k, v]) => typeof v === 'string')), ...(TT ? BR_TT : {}), style: STYLE } }); await p.reload(); await p.waitForSelector('#app', { timeout: 15000 }); } };
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  if (STYLE) await p.evaluate(s => document.documentElement.dataset.style = s, STYLE);
  await p.screenshot({ path: `${OUT}/01-khoi-tao.png` });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); if (TT) await p.uncheck('#su_sample').catch(() => {}); else await p.check('#su_sample'); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  await p.request.post(BASE + '/api/vp/import-ework', { headers: H, multipart: { file: { name: 'ework.json', mimeType: 'application/json', buffer: fs.readFileSync(path.join(__dirname, '../fixtures/ework_mau.json')) } } });
  // Gắn tài khoản quản trị với một hồ sơ nhân sự để màn Điểm danh hiện đồng hồ, nút điểm danh như nhân viên thật
  { const depts = await (await p.request.get(BASE + '/api/vp/departments', { headers: H })).json(); const uid = await p.evaluate(() => S.user.id);
    await p.request.put(BASE + '/api/vp/employees/ns-admin', { headers: H, data: { name: 'Quản Trị', userId: uid, departmentId: depts[0] && depts[0].id, status: 'Đang làm việc', attendance: true } }); }
  await setStyle();
  const shots = [['02-tong-quan', 'tong-quan'], ['03-du-an', 'du-an'], ['04-goi-thau', 'goi-thau'], ['05-tien-do', 'tien-do'], ['06-thanh-toan', 'thanh-toan'], ['07-bao-cao', 'bao-cao'],
    ['08-diem-danh', 'van-phong'], ['09-bang-cong', 'diem-danh'], ['10-de-xuat', 'de-xuat'], ['11-nhan-su', 'nhan-su'], ['12-quan-tri', 'quan-tri'], ['17-lich-hop', 'lich-hop'], ['18-thong-bao', 'thong-bao'], ['23-kpi', 'kpi'], ['24-ework-cu', 'ework-cu']];
  for (const [n, r] of shots) { await p.evaluate(r => { try { vpReset && vpReset(); } catch {} location.hash = r; }, r); await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/${n}.png` }); }
  // Biểu mẫu thêm dự án
  await p.evaluate(() => location.hash = 'du-an'); await p.waitForTimeout(600);
  const add = await p.$('[data-act="add-proj"], [data-act="add-project"], button.primary'); if (add) { await add.click(); await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/13-bieu-mau.png` }); await p.keyboard.press('Escape'); }
  // Chế độ tối
  await p.evaluate(() => UI.set('mode', 'dark')); await p.evaluate(() => location.hash = 'tong-quan'); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/14-tong-quan-toi.png` });
  await p.evaluate(() => UI.set('mode', 'light'));
  // Di động
  const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', geolocation: { latitude: 10.0343, longitude: 105.7470 }, permissions: ['geolocation'], isMobile: true, hasTouch: true, storageState: await ctx.storageState() });
  const mp = await m.newPage(); await mp.goto(BASE + '/#tong-quan'); await mp.waitForSelector('#app', { timeout: 15000 }); await mp.waitForTimeout(900); await mp.screenshot({ path: `${OUT}/15-di-dong.png` });
  for (const [n, r] of [['16-di-dong-diem-danh', 'van-phong'], ['19-di-dong-de-xuat', 'de-xuat'], ['20-di-dong-lich', 'lich-hop'], ['21-di-dong-thong-bao', 'thong-bao'], ['22-di-dong-bang-cong', 'diem-danh']]) { await mp.evaluate(r => location.hash = r, r); await mp.waitForTimeout(900); await mp.screenshot({ path: `${OUT}/${n}.png` }); }
  // SIDES=blue,night,...: ảnh so sánh màu nền menu và trang đăng nhập (Thông tin đơn vị → Màu nền menu)
  for (const sd of (process.env.SIDES || '').split(',').filter(Boolean)) {
    const cur = await (await p.request.get(BASE + '/api/branding')).json();
    await p.request.put(BASE + '/api/branding', { headers: H, data: { ...Object.fromEntries(Object.entries(cur).filter(([k, v]) => typeof v === 'string')), sideBg: sd } });
    await p.reload(); await p.waitForSelector('#app', { timeout: 15000 }); await p.evaluate(() => location.hash = 'van-phong'); await p.waitForTimeout(900);
    if (await p.evaluate(() => document.documentElement.dataset.sidebg) !== sd) errs.push('Màu nền menu không đổi: ' + sd);
    await p.screenshot({ path: `${OUT}/m-${sd}-van-phong.png` });
    await mp.reload(); await mp.waitForSelector('#app', { timeout: 15000 }); await mp.evaluate(() => location.hash = 'van-phong'); await mp.waitForTimeout(700);
    await mp.click('#tabbar [data-act="menu"]'); await mp.waitForTimeout(500); await mp.screenshot({ path: `${OUT}/m-${sd}-dt-menu.png` });
    await mp.mouse.click(380, 400); await mp.waitForTimeout(200);
    const lc = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN' }); const lp = await lc.newPage();
    await lp.goto(BASE + '/'); await lp.waitForSelector('#login', { timeout: 15000 }); await lp.waitForTimeout(500); await lp.screenshot({ path: `${OUT}/m-${sd}-dang-nhap.png` }); await lc.close();
    const lm = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'vi-VN' }); const lq = await lm.newPage();
    await lq.goto(BASE + '/'); await lq.waitForSelector('#login', { timeout: 15000 }); await lq.waitForTimeout(500); await lq.screenshot({ path: `${OUT}/m-${sd}-dt-dang-nhap.png` }); await lm.close();
  }
  // Hộp Giao diện: người dùng tự chọn màu nền menu, không ảnh hưởng đơn vị
  if (STYLE === 'tech') {
    await p.evaluate(() => ACT.appearance()); await p.waitForTimeout(400);
    const lab = await p.$('input[data-ap="sidebg"][value="peach"]'); if (!lab) errs.push('Hộp Giao diện thiếu mục Màu nền menu');
    else { await p.click('label:has(input[data-ap="sidebg"][value="peach"])'); await p.waitForTimeout(400);
      await p.screenshot({ path: `${OUT}/26-hop-giao-dien-mau-nen.png` });
      if (await p.evaluate(() => document.documentElement.dataset.sidebg) !== 'peach') errs.push('Người dùng chọn Cam nhạt nhưng menu không đổi');
      await p.click('label:has(input[data-ap="sidebg"][value="unit"])'); await p.waitForTimeout(300); }
    await p.keyboard.press('Escape');
  }
  // Đăng xuất → trang đăng nhập
  await p.evaluate(() => { localStorage.clear(); }); await ctx.clearCookies(); await p.goto(BASE + '/'); await p.waitForSelector('#login', { timeout: 15000 }); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/00-dang-nhap.png` });
  // Trang đăng nhập trên điện thoại 360px và 390px: không được tràn ngang
  for (const w of [360, 390]) { const mc = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true }); const lp = await mc.newPage();
    await lp.goto(BASE + '/'); await lp.waitForSelector('#login', { timeout: 15000 }); await lp.waitForTimeout(300);
    const sw = await lp.evaluate(() => document.documentElement.scrollWidth); if (sw > w) errs.push(`Trang đăng nhập tràn ngang ở ${w}px: ${sw}px`);
    if (w === 390) await lp.screenshot({ path: `${OUT}/25-di-dong-dang-nhap.png` }); await mc.close(); }
  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'Chụp xong, không lỗi trang');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
