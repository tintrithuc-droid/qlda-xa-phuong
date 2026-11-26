// Kiểm thử bản 1.8.5, 1.8.6: lọc Năm, Trạng thái ở danh sách dự án; thiết lập Lĩnh vực dự án CNTT (đổi tên chức năng, ẩn chức năng
// chỉ dùng cho xây dựng, nạp danh mục CNTT, ô Lĩnh vực của dự án), trả lại lĩnh vực xây dựng sau khi kiểm thử.
// node tests/e2e/v186.js [http://127.0.0.1:5080]   (chạy sau smoke.js)
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

  // 1. Danh sách dự án: lọc Năm (mặc định năm nay), Trạng thái (mặc định đang thực hiện)
  await go('du-an');
  const f = await p.evaluate(() => ({ y: $('[data-f=pjy]').value, s: $('[data-f=pjs]').value, n: projListRows().length, all: projects().length,
    done: (S.f.pjy = '*', S.f.pjs = 'done', projListRows().every(r => PJ_DONE.includes(r.status))), every: (S.f.pjs = '*', projListRows().length) }));
  await p.evaluate(() => { S.f.pjy = ''; S.f.pjs = ''; render(); });
  check(f.y === new Date().getFullYear().toString() && f.s === 'run', 'Danh sách dự án mặc định năm nay, đang thực hiện');
  check(f.n <= f.all && f.done && f.every === f.all, 'Lọc Đã hoàn thành đúng nhóm; Tất cả năm, tất cả trạng thái đủ dự án');

  // 2. Chọn lĩnh vực CNTT
  check((await nav()).includes('Nhật ký thi công') && (await nav()).includes('Giải phóng mặt bằng'), 'Lĩnh vực xây dựng (mặc định): menu như cũ');
  await p.evaluate(() => { S.tab.qt = 'org'; location.hash = 'quan-tri'; }); await p.waitForSelector('#br_field');
  await p.selectOption('#br_field', 'cntt'); await p.click('[data-act=brand-save]');
  await p.waitForFunction(() => BR.field === 'cntt' && Object.entries(IT_CATS).every(([t, l]) => l.every(v => catalog(t).includes(v))), null, { timeout: 60000 }); await p.waitForTimeout(1500);
  const m = await nav();
  check(m.includes('Nhật ký triển khai') && m.includes('Hạng mục, khối lượng công việc') && m.includes('Nghiệm thu, vận hành thử, bảo hành'), 'CNTT: đổi tên chức năng trên menu');
  check(!m.includes('Giải phóng mặt bằng') && !m.includes('Mô hình hóa công trình'), 'CNTT: ẩn Giải phóng mặt bằng, Mô hình hóa công trình');
  await go('gpmb'); check(await p.evaluate(() => S.route) !== 'gpmb', 'CNTT: không mở được trang Giải phóng mặt bằng');
  const cats = await p.evaluate(() => ({ st: catalog('Trạng thái dự án'), u: catalog('Đơn vị tính'), k: catalog('Loại gói thầu'), used: D('packages').map(k => k.type) }));
  check(cats.st.includes('Đang triển khai') && cats.u.includes('Bản quyền') && cats.k.includes('Thuê dịch vụ CNTT'), 'CNTT: nạp danh mục mặc định');
  check(cats.used.every(t => !t || cats.k.includes(t)), 'CNTT: loại gói thầu đang dùng vẫn còn trong danh mục');
  // 3. Biểu mẫu dự án: ô Lĩnh vực, nhãn phạm vi triển khai; giá trị cũ không còn trong danh mục vẫn giữ khi lưu
  const pid = await p.evaluate(() => projects()[0].id);
  await go('du-an'); await p.evaluate(i => { S.sel.project = i; S.tab.proj = 'info'; render(); }, pid); await p.waitForTimeout(300);
  const kind0 = await p.evaluate(i => get('projects', i).projectKind, pid);
  await p.click('[data-act=edit-projects]'); await p.waitForSelector('#f_field');
  const lbl = await p.evaluate(() => [...document.querySelectorAll('#mform label')].map(l => l.textContent));
  check(lbl.some(x => x.includes('Địa điểm, phạm vi triển khai')) && lbl.some(x => x.includes('Vai trò của đơn vị')), 'CNTT: nhãn biểu mẫu dự án theo dự án CNTT');
  await p.selectOption('#f_field', 'Chuyển đổi số'); await p.click('#mform [type=submit]'); await p.waitForSelector('#mform', { state: 'detached' });
  const sv = await p.evaluate(i => get('projects', i), pid);
  check(sv.field === 'Chuyển đổi số' && sv.projectKind === kind0, 'CNTT: lưu ô Lĩnh vực, giữ nguyên Loại dự án cũ');
  // 4. Nhật ký triển khai: không có ô thời tiết
  await go('nhat-ky'); check((await p.textContent('h1')) === 'Nhật ký triển khai', 'CNTT: trang Nhật ký triển khai');
  if (await p.$('[data-act=add-diary]')) { await p.click('[data-act=add-diary]'); await p.waitForSelector('#mform');
    check(!(await p.$('#f_weather')), 'CNTT: nhật ký không có ô thời tiết'); await p.keyboard.press('Escape'); }
  await p.screenshot({ path: SHOTS + '/v186-cntt.png' });
  // 5. Trả lại lĩnh vực xây dựng cho các bài kiểm thử khác
  await p.evaluate(() => { S.tab.qt = 'org'; location.hash = 'quan-tri'; }); await p.waitForSelector('#br_field');
  await p.selectOption('#br_field', 'xd'); await p.click('[data-act=brand-save]'); await p.waitForFunction(() => BR.field === 'xd', null, { timeout: 15000 });
  check((await nav()).includes('Giải phóng mặt bằng'), 'Trả lại lĩnh vực xây dựng: menu như cũ');

  console.log(`\n${ok.length} đạt, ${errs.length} lỗi`); if (errs.length) { console.log(errs.join('\n')); process.exitCode = 1; }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
