// Kiểm thử đầu-cuối bằng Playwright: node tests/e2e/smoke.js [http://127.0.0.1:5080]
// Yêu cầu máy chủ chạy với cơ sở dữ liệu trống (lần đầu sẽ khởi tạo hệ thống kèm dữ liệu mẫu).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const PW = 'Admin2026';
const errs = [];
const wait = ms => new Promise(r => setTimeout(r, ms));

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
    await p.click('#setup button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  } else await login(p, 'admin');
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
