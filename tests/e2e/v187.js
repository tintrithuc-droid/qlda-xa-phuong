// Kiểm thử bản 1.8.7: gói tư vấn giai đoạn thực hiện đầu tư nghiệm thu theo sản phẩm (như chuẩn bị đầu tư), mục menu
// Nghiệm thu, thanh toán tư vấn, cột Thực hiện HĐ theo tiến độ gói thầu, tiêu đề theo giai đoạn. Chỉ đọc, không đổi dữ liệu.
// node tests/e2e/v187.js [http://127.0.0.1:5080]   (chạy sau smoke.js)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const PW = process.env.ADMIN_PW || 'Admin2026', USER = process.env.ADMIN_USER || 'admin';
const errs = [], ok = [];
const check = (cond, msg) => { (cond ? ok : errs).push(msg); console.log((cond ? 'ĐẠT  ' : 'LỖI  ') + msg); };
function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(x => parseInt(x, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}

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
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto(BASE + '/'); await p.waitForSelector('#app', { timeout: 30000 });
  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(500); };
  const nav = () => p.evaluate(() => [...document.querySelectorAll('#nav a span:first-of-type')].map(s => s.textContent));

  // 1. Menu, tiêu đề theo giai đoạn
  await go('goi-thau');
  check(await p.evaluate(() => $('#top').textContent.includes('Thực hiện đầu tư › Gói thầu và hợp đồng')), 'Tiêu đề: Thực hiện đầu tư › Gói thầu và hợp đồng');
  check((await nav()).includes('Nghiệm thu, thanh toán tư vấn'), 'Menu Thực hiện đầu tư có Nghiệm thu, thanh toán tư vấn');
  // 2. Cột Thực hiện HĐ dùng tiến độ gói thầu
  const col = await p.evaluate(() => D('packages').filter(k => pkgPhase(k) === 'dt' && contractOfPkg(k.id)).every(k => { const tr = [...document.querySelectorAll('tbody tr')].find(t => t.textContent.includes(k.name)); return !tr || tr.textContent.includes(Math.round(pkgTrack(k).v) + '%'); }));
  check(col, 'Cột Thực hiện HĐ khớp tiến độ gói thầu');
  // 3. Gói tư vấn thực hiện đầu tư: nghiệm thu theo sản phẩm
  const tv = await p.evaluate(() => { const k = D('packages').find(k => pkgPhase(k) === 'dt' && isTVPkg(k) && contractOfPkg(k.id)); return k && k.id; });
  check(!!tv, 'Dữ liệu mẫu có gói tư vấn thực hiện đầu tư đã có hợp đồng');
  if (tv) {
    await p.evaluate(id => goPkg(id), tv); await p.waitForTimeout(600);
    const t = await p.evaluate(() => $('#app').innerText);
    check(t.includes('Nghiệm thu sản phẩm') && !t.includes('Giá trị khối lượng thực hiện'), 'Chi tiết gói tư vấn có Nghiệm thu sản phẩm, không có khối lượng thi công');
    await p.click('button[data-act="goto-kl"]'); await p.waitForTimeout(800);
    check(await p.evaluate(() => location.hash === '#tv-thanh-toan' && $('#app').innerText.includes('Sản phẩm theo hợp đồng')), 'Mở Nghiệm thu sản phẩm ở Nghiệm thu, thanh toán tư vấn');
  }
  // 4. Quản lý khối lượng chỉ còn hợp đồng thi công, mua sắm, phi tư vấn
  await go('khoi-luong');
  check(await p.evaluate(() => { const s = $('[data-f=klc]'); return !s || [...s.options].every(o => !contractProd(get('contracts', o.value))); }), 'Quản lý khối lượng không liệt kê hợp đồng tư vấn');
  // 5. Gói thi công giữ Khối lượng, Tiến độ
  const tc = await p.evaluate(() => { const k = D('packages').find(k => pkgPhase(k) === 'dt' && !isTVPkg(k) && contractOfPkg(k.id)); return k && k.id; });
  if (tc) { await p.evaluate(id => goPkg(id), tc); await p.waitForTimeout(600);
    check(await p.evaluate(() => !!document.querySelector('button[data-act="goto-td"]') && $('#app').innerText.includes('Giá trị khối lượng thực hiện')), 'Gói thi công giữ Khối lượng, Tiến độ'); }
  // 6. Chuẩn bị đầu tư vẫn như cũ
  await go('cb-thanh-toan');
  check(await p.evaluate(() => $('#app').innerText.includes('Nghiệm thu sản phẩm')), 'Chuẩn bị đầu tư › Nghiệm thu, thanh toán vẫn chạy');
  await p.screenshot({ path: SHOTS + '/v187.png' });
  await b.close();
  console.log(`\n${ok.length} đạt, ${errs.length} lỗi`); if (errs.length) { console.log(errs.join('\n')); process.exitCode = 1; }
})().catch(e => { console.error(e); process.exit(2); });
