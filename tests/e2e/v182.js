// Kiểm thử bản 1.8.2 (rà soát để Tri Thức dùng thật): dữ liệu phân hệ không được xem không gửi xuống trình duyệt,
// biểu đồ Tổng quan đọc được khi có nhiều gói thầu, trang Danh mục chức năng chỉ dành cho quản trị.
// node tests/e2e/v182.js [http://127.0.0.1:5080]   (chạy sau smoke.js)
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
  const all = await p.evaluate(async () => (await fetch('/api/data', { headers: { 'X-QLDA': '1' } })).json());
  const n = k => (all[k] || []).length;
  check(n('capitals') && n('settlements') && n('clearances') && n('payplans') && n('diaries'), 'Quản trị nhận đủ vốn, quyết toán, GPMB, kế hoạch thanh toán, nhật ký');

  // 1. Tài khoản nhóm không được xem vốn, quyết toán, GPMB, thanh toán (nhóm g-site của dữ liệu mẫu)
  const g = await p.evaluate(() => Store.data.groups.find(x => x.id === 'g-site'));
  const U = 'kt182' + Date.now().toString(36).slice(-4);
  const cu = await p.evaluate(async u => (await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: JSON.stringify({ username: u, name: 'Nhà thầu kiểm thử', groupId: 'g-site', password: 'Tam2026abc' }) })).status, U);
  check(cu === 200, 'Tạo tài khoản nhóm nhà thầu');
  const c2 = await b.newContext({ viewport: { width: 1400, height: 900 } });
  await c2.request.post(BASE + '/api/auth/login', { ...H, data: { username: U, password: 'Tam2026abc' } });
  await c2.request.post(BASE + '/api/auth/change-password', { ...H, data: { old: 'Tam2026abc', password: 'Moi2026abc' } });
  await c2.request.post(BASE + '/api/auth/login', { ...H, data: { username: U, password: 'Moi2026abc' } });
  const d = await (await c2.request.get(BASE + '/api/data', H)).json();
  const m = (k, mod) => (d[k] || []).length === 0 || g.perms[mod] !== 'none';
  check(m('capitals', 'von') && m('settlements', 'quyet-toan') && m('clearances', 'gpmb') && m('payplans', 'thanh-toan'), 'Nhóm không được xem phân hệ thì không nhận dữ liệu phân hệ đó');
  check((d.diaries || []).length > 0, 'Nhóm được ghi nhật ký vẫn nhận nhật ký');
  check((d.contracts || []).length > 0 && (d.schedule || []).length > 0, 'Vẫn nhận hợp đồng, tiến độ để tính tiến độ');
  const hiddenCols = Object.entries({ capitals: 'von', settlements: 'quyet-toan', clearances: 'gpmb', payplans: 'thanh-toan' }).filter(([, mod]) => g.perms[mod] === 'none').map(([c]) => c);
  check(!(d.approvals || []).some(a => hiddenCols.includes(a.collection)) && !(d.attachments || []).some(a => hiddenCols.includes(a.collection)), 'Lịch sử duyệt, tệp đính kèm của phân hệ bị ẩn cũng không gửi');
  const p2 = await c2.newPage(); p2.on('pageerror', e => errs.push('NT PAGEERR ' + e.message));
  await p2.goto(BASE + '/'); await p2.waitForSelector('#app', { timeout: 30000 });
  for (const r of ['tong-quan', 'du-an', 'tien-do', 'nhat-ky', 'khoi-luong', 'nghiem-thu', 'canh-bao', 'hien-truong']) { await p2.evaluate(x => location.hash = x, r); await p2.waitForTimeout(300); }
  check(!(await p2.$('a[href="#doi-chieu"]')), 'Người dùng thường không thấy trang Danh mục chức năng');
  check(!!(await p.$('a[href="#doi-chieu"]')), 'Quản trị vẫn có trang Danh mục chức năng');

  // 2. Tổng quan với nhiều gói thầu: tối đa 15 cột mỗi biểu đồ, không có cột âm
  await p.evaluate(() => { const base = Store.data.packages[0], sch = Store.data.schedule.find(s => s.packageId === base.id);
    for (let i = 0; i < 60; i++) { Store.data.packages.push({ ...base, id: 'qa-k' + i, code: base.code }); if (sch) Store.data.schedule.push({ ...sch, id: 'qa-s' + i, packageId: 'qa-k' + i, progress: i }); } });
  await p.evaluate(() => { location.hash = 'du-an'; }); await p.waitForTimeout(200); await p.evaluate(() => { location.hash = 'tong-quan'; }); await p.waitForTimeout(500);
  const bars = await p.evaluate(() => { const svg = [...document.querySelectorAll('.card')].find(c => /Tiến độ gói thầu/.test(c.textContent))?.querySelector('svg.chart'); return svg ? { rects: svg.querySelectorAll('rect').length, neg: [...svg.querySelectorAll('rect')].some(r => +r.getAttribute('width') <= 0), lbl: [...svg.querySelectorAll('text')].map(t => t.textContent).filter(t => /\s/.test(t)).length } : null; });
  check(bars && bars.rects <= 30 && !bars.neg, 'Biểu đồ tiến độ gói thầu tối đa 15 gói, không có cột âm');
  check(bars && bars.lbl > 0, 'Gói thầu trùng mã ở nhiều dự án: nhãn ghi kèm mã dự án');
  await p.screenshot({ path: SHOTS + '/v182-tong-quan.png' });
  await p.evaluate(() => Store.load());

  console.log(`\n${ok.length} đạt, ${errs.length} lỗi`); if (errs.length) { console.log(errs.join('\n')); process.exitCode = 1; }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
