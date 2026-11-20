// Kiểm thử bản 1.8.8: ô chọn gõ để tìm, nhóm theo dự án; hợp đồng chưa có số; nhà thầu theo giai đoạn; danh sách gói nhóm theo dự án;
// thanh toán tư vấn không trùng; dòng giới thiệu; dải các bước gói thầu. Chỉ đọc, không đổi dữ liệu.
// node tests/e2e/v188.js [http://127.0.0.1:5080]   (chạy sau smoke.js)
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

  // A. Nhãn gói thầu, hợp đồng: tên gói trước, nhóm theo dự án
  const lab = await p.evaluate(() => { const o = pkgOpts(''); const c = contractOpts('', ''); return { o: o[0], c: c[0], n: o.length }; });
  check(lab.o && lab.o[1].includes('(') && /– /.test(lab.o[2]), 'Mục chọn gói thầu ghi tên gói (ký hiệu) và nhóm theo dự án');
  check(lab.c && lab.c[1].includes(' · ') && /– /.test(lab.c[2]), 'Mục chọn hợp đồng ghi tên gói, nhà thầu, số hợp đồng, nhóm theo dự án');
  // Ô chọn dài có ô gõ để tìm (dựng thử 20 mục)
  const cb = await p.evaluate(() => { const box = document.createElement('div'); document.body.appendChild(box);
    const list = Array.from({ length: 20 }, (_, i) => ['v' + i, 'Gói số ' + i + (i === 7 ? ' Thẩm định giá' : ''), i < 10 ? 'DA001 – Dự án một' : 'DA002 – Dự án hai', i === 15 ? '99/HĐ-THTT' : '']);
    box.innerHTML = `<select id="t_sel">${opts(list, '', 'Tất cả')}</select>`; comboWire(box);
    return { inp: !!box.querySelector('.combo-in'), grp: box.querySelectorAll('optgroup').length }; });
  check(cb.inp && cb.grp === 2, 'Ô chọn trên 12 mục có ô gõ để tìm, có nhóm dự án');
  await p.click('.combo:has(#t_sel) .combo-in'); await p.keyboard.type('tham dinh gia'); await p.waitForTimeout(150);
  const vis = await p.evaluate(() => [...document.querySelectorAll('.combo-list:not([hidden]) .combo-o')].map(x => x.textContent));
  check(vis.length === 1 && vis[0].includes('Thẩm định giá'), 'Gõ không dấu tìm đúng tên gói');
  await p.fill('.combo-list:not([hidden]) .combo-q', '99/HĐ'); await p.waitForTimeout(150); await p.keyboard.press('Enter');
  check(await p.evaluate(() => document.querySelector('#t_sel').value === 'v15'), 'Tìm theo số hợp đồng, Enter chọn đúng');
  await p.evaluate(() => document.querySelector('#t_sel').closest('div').remove());

  // B. Hợp đồng chưa có số
  check(await p.evaluate(() => cNum({ number: '' }) === 'Chưa có số hợp đồng' && cNumH({ number: 'ABC' }) === 'ABC'), 'Hợp đồng chưa có số ghi "Chưa có số hợp đồng"');
  check(await p.evaluate(() => { const f = contractFields(); return !f.find(x => x.key === 'number').req && !f.find(x => x.key === 'signDate').req; }), 'Số hợp đồng, ngày ký không bắt buộc');
  const al = await p.evaluate(() => { const c = D('contracts')[0]; const o = c.number; c.number = ''; const a = alerts({ all: true }).some(x => x.cid === c.id && /chưa có số hợp đồng/.test(x.text)); c.number = o; return a; });
  check(al, 'Trung tâm cảnh báo nhắc hợp đồng chưa có số');

  // C. Nhà thầu của giai đoạn, danh mục ở Điều hành
  await go('goi-thau'); await p.evaluate(() => { S.tab.gt = 'nt'; render(); }); await p.waitForTimeout(300);
  check(await p.evaluate(() => $('#content h1').textContent.includes('Nhà thầu của giai đoạn')), 'Thẻ Nhà thầu của giai đoạn');
  check(await p.evaluate(() => { const ids = new Set(D('packages').filter(k => pkgPhase(k) === 'dt').flatMap(k => [...(k.contractorIds || []), ...(k.supervisorIds || [])]));
    return [...document.querySelectorAll('#content tbody tr[data-id]')].every(t => ids.has(t.dataset.id)); }), 'Chỉ liệt kê đơn vị có gói ở giai đoạn');
  await p.evaluate(() => { S.tab.gt = 'pkg'; });
  await go('danh-muc-don-vi');
  check(await p.evaluate(() => location.hash === '#danh-muc-don-vi' && $('#content').innerText.includes('Danh mục nhà thầu') && [...document.querySelectorAll('#nav a')].some(a => a.getAttribute('href') === '#danh-muc-don-vi')), 'Menu Điều hành › Danh mục nhà thầu, đơn vị giám sát');

  // D. Danh sách gói thầu nhóm theo dự án, tìm theo số hợp đồng
  await go('goi-thau');
  check(await p.evaluate(() => document.querySelectorAll('#content tr.grp').length > 0), 'Danh sách gói thầu có dòng nhóm theo dự án');
  const cnum = await p.evaluate(() => { const c = D('contracts').find(c => c.number && pkgPhase(pkgOf(c.packageId)) === 'dt'); return c && c.number; });
  if (cnum) { await p.fill('input[data-f=kq]', cnum); await p.waitForTimeout(500);
    check(await p.evaluate(() => document.querySelectorAll('#content tbody tr.click').length >= 1), 'Tìm gói thầu theo số hợp đồng'); await p.fill('input[data-f=kq]', ''); await p.waitForTimeout(400); }

  // E. Quản lý thanh toán không có hợp đồng tư vấn; dòng giới thiệu; loại thanh toán theo sản phẩm
  await go('thanh-toan');
  check(await p.evaluate(() => { const s = $('[data-f=ttc]'); return !!s && [...s.options].every(o => !o.value || !contractProd(get('contracts', o.value))); }), 'Quản lý thanh toán không liệt kê hợp đồng tư vấn');
  check(await p.evaluate(() => !!$('#content .intro')), 'Màn hình có dòng giới thiệu');
  check(await p.evaluate(() => { const c = D('contracts').find(c => contractProd(c)); return !c || (payKinds(c.id).includes('Thanh toán theo sản phẩm') && !payKinds(c.id).includes('Thanh toán khối lượng')); }), 'Hợp đồng tư vấn có loại Thanh toán theo sản phẩm');

  // F. Dải các bước của gói thầu
  const kid = await p.evaluate(() => (D('packages').find(k => contractOfPkg(k.id)) || {}).id);
  await p.evaluate(id => goPkg(id), kid); await p.waitForTimeout(600);
  check(await p.evaluate(() => document.querySelectorAll('.steps .st').length === 5), 'Chi tiết gói thầu có dải 5 bước');
  await p.screenshot({ path: SHOTS + '/v188-cac-buoc.png' });

  await b.close();
  console.log(`\n${ok.length} đạt, ${errs.length} lỗi`); errs.forEach(e => console.log('  - ' + e));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
