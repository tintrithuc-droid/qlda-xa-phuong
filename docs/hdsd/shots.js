// Chụp màn hình minh họa cho bộ HDSD, có khung đỏ đánh số thứ tự thao tác.
// node shots.js  (máy chủ chạy ở 127.0.0.1:5080 với CSDL trống)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = 'http://127.0.0.1:5080', PW = 'Admin2026';
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
const DESK = { viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.5, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' };
const MOB = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' };
let b;

async function newPage(opts) { const c = await b.newContext(opts); const p = await c.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message)); return p; }
async function login(p, u) {
  await p.goto(BASE + '/'); await p.waitForSelector('#login,#app', { timeout: 20000 });
  if (await p.$('#login')) { await p.fill('#lg_user', u); await p.fill('#lg_pw', PW); await p.click('#login button[type=submit]'); await p.waitForSelector('#app', { timeout: 20000 }); }
  await wait(400);
}
async function go(p, r) { await closeModal(p); await p.evaluate(r => { location.hash = r; scrollTo(0, 0); }, r); await wait(500); }
async function closeModal(p) { for (let i = 0; i < 3 && await p.$('#ov:not([hidden])'); i++) { const c = await p.$('#ov [data-close]'); if (c) await c.click(); else await p.keyboard.press('Escape'); await wait(200); } }
async function tab(p, label) { await p.click(`.content [data-act=tab]:text-is("${label}")`); await wait(350); }
async function click(p, sel, text) { const els = await p.$$(sel); for (const e of els) { if (!text || (await e.innerText()).includes(text)) { await e.click(); await wait(400); return; } } throw new Error('Không thấy ' + sel + ' ' + (text || '')); }

// a: [{sel, text?, nth?, n}] → khung đỏ + số
async function ann(p, a) {
  await p.evaluate(list => {
    document.querySelectorAll('.hd-ann').forEach(x => x.remove());
    for (const it of list) {
      let els = [...document.querySelectorAll(it.sel)].filter(e => e.offsetParent !== null || e.getClientRects().length);
      if (it.text) els = els.filter(e => e.innerText.includes(it.text));
      const e = els[it.nth || 0]; if (!e) { console.error('ANN MISS ' + it.sel + ' ' + (it.text || '')); continue; }
      const r = e.getBoundingClientRect(), pad = it.pad ?? 4;
      const box = document.createElement('div'); box.className = 'hd-ann';
      Object.assign(box.style, { position: 'absolute', left: (r.left + scrollX - pad) + 'px', top: (r.top + scrollY - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px', border: '2.5px solid #d92d20', borderRadius: '7px', zIndex: 9999, pointerEvents: 'none', boxShadow: '0 0 0 2px rgba(255,255,255,.7)' });
      const n = document.createElement('div'); n.className = 'hd-ann'; n.textContent = it.n;
      const pos = it.pos || 'tl'; const nx = pos.includes('r') ? r.right + scrollX + pad - 12 : r.left + scrollX - pad - 12; const ny = r.top + scrollY - pad - 12;
      Object.assign(n.style, { position: 'absolute', left: nx + 'px', top: ny + 'px', width: '26px', height: '26px', borderRadius: '50%', background: '#d92d20', color: '#fff', font: '700 14px/26px "Be Vietnam Pro",Arial', textAlign: 'center', zIndex: 10000, pointerEvents: 'none', boxShadow: '0 0 0 2px #fff' });
      document.body.append(box, n);
    }
  }, a);
}
async function clearAnn(p) { await p.evaluate(() => document.querySelectorAll('.hd-ann').forEach(x => x.remove())); }
// clip: undefined = khung nhìn; 'full' = cả trang; selector = vùng phần tử (+ lề 18px)
async function shot(p, name, clip, a) {
  if (a) await ann(p, a);
  const file = path.join(OUT, name + '.png');
  if (clip === 'full') await p.screenshot({ path: file, fullPage: true });
  else if (clip) {
    const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return { x: x.left + scrollX, y: x.top + scrollY, w: x.width, h: x.height }; }, clip);
    if (!r) throw new Error('Không thấy vùng ' + clip);
    const m = 18; await p.screenshot({ path: file, fullPage: true, clip: { x: Math.max(0, r.x - m), y: Math.max(0, r.y - m), width: r.w + 2 * m, height: r.h + 2 * m } });
  } else await p.screenshot({ path: file });
  await clearAnn(p); console.log('✓', name);
}
async function scrollTo(p, sel, text) { await p.evaluate(([s, t]) => { const e = [...document.querySelectorAll(s)].find(e => !t || e.innerText.includes(t)); if (e) e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); }, [sel, text]); await wait(300); }

(async () => {
  b = await chromium.launch({ args: ['--lang=vi-VN'] });
  const img = path.join(os.tmpdir(), 'anh-hien-truong.png'); fs.copyFileSync('/home/claude/qlda-ttts-hcm/src/QldaTtts.Web/wwwroot/icons/icon-512.png', img);

  // ===== Khởi tạo hệ thống (CSDL trống) =====
  let p = await newPage(DESK);
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 20000 });
  await p.fill('#su_name', 'Nguyễn Văn Quản Trị');
  await shot(p, 'qt-khoi-tao', undefined, [{ sel: '#su_name', n: 1 }, { sel: '#su_user', n: 2 }, { sel: '#su_pw', n: 3 }, { sel: '#su_pw2', n: 4 }, { sel: '#setup label.checks', n: 5 }, { sel: '#setup button[type=submit]', n: 6 }]);
  await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 }); await wait(800);
  await p.evaluate(() => fetch('/api/auth/logout', { method: 'POST', headers: { 'X-QLDA': '1' } })); await p.goto(BASE + '/'); await p.waitForSelector('#login');
  await shot(p, 'chung-dang-nhap', undefined, [{ sel: '#lg_user', n: 1 }, { sel: '#lg_pw', n: 2 }, { sel: '#login button[type=submit]', n: 3 }]);
  await p.context().close();

  // ===== Các ảnh chung theo từng vai trò =====
  const roles = { qt: 'admin', ld: 'lanhdao', kt: 'kythuat', ke: 'ketoan', gs: 'giamsat' };
  for (const [k, u] of Object.entries(roles)) {
    p = await newPage(DESK); await login(p, u); await go(p, 'tong-quan');
    await shot(p, `${k}-giao-dien-chinh`, undefined, [{ sel: '.side .nav', n: 1, pad: 2 }, { sel: '.top .title', n: 2 }, { sel: '.top select', n: 3 }, { sel: '.top .mode', n: 4 }, { sel: '.top .who', n: 5, pos: 'tr' }, { sel: '.content', n: 6, pad: -6 }]);
    if (k === 'ld') {
      await shot(p, 'ld-tong-quan', 'full', [{ sel: '.kpis', n: 1 }, { sel: '.card', text: 'Dự án theo trạng thái', n: 2 }, { sel: '.card', text: 'Cảnh báo và việc cần xử lý', n: 3 }, { sel: '.card', text: 'Tình hình thực hiện các dự án', n: 4 }]);
      await click(p, '[data-act=account]'); await shot(p, 'chung-tai-khoan', '#ov .mform', [{ sel: '#ov [data-act=chpw]', n: 1 }, { sel: '#ov [data-act=logout]', n: 2 }]);
      await click(p, '#ov [data-act=chpw]'); await shot(p, 'chung-doi-mat-khau', '#ov .mform'); await closeModal(p);
    }
    if (k === 'gs') { await shot(p, 'gs-tong-quan', 'full'); }
    await p.context().close();
  }

  // ===== Lãnh đạo =====
  p = await newPage(DESK); await login(p, 'lanhdao');
  await go(p, 'du-an'); await shot(p, 'ld-du-an', undefined, [{ sel: '.toolbar input[type=search]', n: 1 }, { sel: '.toolbar select', n: 2 }, { sel: '.head .btn.primary', n: 3 }, { sel: '.content tr.click', n: 4, nth: 2 }]);
  await click(p, '.content tr.click', 'Dự án thành phần 1'); await shot(p, 'ld-du-an-chi-tiet', undefined, [{ sel: '.tabs', n: 1 }, { sel: '[data-act=edit-projects]', n: 2 }, { sel: '[data-act=back-project]', n: 3 }]);
  await tab(p, 'Tình trạng thực hiện'); await shot(p, 'ld-du-an-tinh-trang');
  await tab(p, 'Hồ sơ pháp lý'); await shot(p, 'ld-du-an-phap-ly', undefined, [{ sel: '[data-act=add-legal]', n: 1 }]);
  await click(p, '[data-act=add-legal]'); await shot(p, 'chung-them-ho-so-phap-ly', '#ov .mform'); await closeModal(p);
  await tab(p, 'Công việc'); await shot(p, 'ld-du-an-cong-viec', undefined, [{ sel: '[data-act=add-task]', n: 1 }, { sel: '[data-act=task-done]', n: 2 }]);
  await click(p, '[data-act=add-task]'); await shot(p, 'ld-them-cong-viec', '#ov .mform'); await closeModal(p);
  await go(p, 'tien-do'); await shot(p, 'ld-tien-do', undefined, [{ sel: '.card', text: 'Cảnh báo chậm tiến độ', n: 1 }]);
  await scrollTo(p, '.card', 'Theo dõi tiến độ'); await shot(p, 'ld-tien-do-theo-doi', undefined, [{ sel: '.content .tabs', n: 1 }]);
  await go(p, 'goi-thau'); await click(p, '.content tr.click'); await shot(p, 'ld-hop-dong', undefined, [{ sel: '.card', text: 'Thông tin hợp đồng', n: 1 }, { sel: '.card', text: 'Theo dõi tiến độ thực hiện hợp đồng', n: 2 }]);
  await go(p, 'thanh-toan'); await shot(p, 'ld-thanh-toan', undefined, [{ sel: '.kpis, .content .grid', n: 1 }, { sel: '.content .tabs', n: 2 }]);
  await go(p, 'bao-cao'); await shot(p, 'chung-bao-cao', undefined, [{ sel: '.content select', n: 1, nth: 0 }, { sel: '.content select', n: 2, nth: 1 }, { sel: '.content select', n: 3, nth: 2 }, { sel: '[data-act=export-report]', n: 4 }]);
  await p.selectOption('.content select >> nth=0', { index: 1 }).catch(() => { }); await wait(400); await shot(p, 'chung-bao-cao-tien-do');
  await p.context().close();

  // ===== Cán bộ kỹ thuật =====
  p = await newPage(DESK); await login(p, 'kythuat');
  await go(p, 'du-an'); await click(p, '.head .btn.primary'); await shot(p, 'kt-them-du-an', '#ov .mform'); await closeModal(p);
  await go(p, 'mo-hinh'); await shot(p, 'kt-mo-hinh', undefined, [{ sel: '.content select', n: 1 }, { sel: '[data-act=add-model]', n: 2 }, { sel: '[data-act=model-ver]', n: 3 }, { sel: '[data-act=model-hist]', n: 4 }]);
  await click(p, '[data-act=add-model]'); await shot(p, 'kt-tai-mo-hinh', '#ov .mform'); await closeModal(p);
  await click(p, '[data-act=model-hist]'); await shot(p, 'kt-lich-su-mo-hinh', '#ov .mform'); await closeModal(p);
  await scrollTo(p, '.card', 'Thông tin các hạng mục'); await shot(p, 'kt-hang-muc', undefined, [{ sel: '[data-act=add-item]', n: 1 }, { sel: '[data-act=edit-items]', n: 2 }]);
  await click(p, '[data-act=add-item]'); await shot(p, 'kt-them-hang-muc', '#ov .mform'); await closeModal(p);
  await go(p, 'goi-thau'); await shot(p, 'kt-goi-thau', undefined, [{ sel: '.toolbar', n: 1 }, { sel: '.head .btn.primary', n: 2 }, { sel: '.content tr.click', n: 3 }]);
  await click(p, '.head .btn.primary'); await shot(p, 'kt-them-goi-thau', '#ov .mform'); await closeModal(p);
  await click(p, '.content tr.click', 'XL01'); await shot(p, 'kt-chi-tiet-goi-thau', 'full', [{ sel: '[data-act=edit-packages]', n: 1 }, { sel: '.card', text: 'Thông tin hợp đồng', n: 2 }, { sel: '[data-act=goto-kl]', n: 3 }, { sel: '.card', text: 'Điều chỉnh, phụ lục', n: 4 }, { sel: '.card', text: 'Hồ sơ pháp lý gói thầu', n: 5 }]);
  await click(p, '[data-act=add-addendum]'); await shot(p, 'kt-them-phu-luc', '#ov .mform'); await closeModal(p);
  await click(p, '[data-act=edit-contracts]'); await shot(p, 'kt-sua-hop-dong', '#ov .mform'); await closeModal(p);
  await go(p, 'tien-do'); await scrollTo(p, '.card', 'Theo dõi tiến độ'); await tab(p, 'Theo gói thầu');
  await scrollTo(p, '.card', 'Biểu đồ tiến độ'); await shot(p, 'kt-gantt', undefined, [{ sel: '[data-act=upd-sched]', n: 1 }, { sel: '[data-act=sched-more]', n: 2 }, { sel: '.gtoday', n: 3, pad: 6 }]);
  await click(p, '[data-act=upd-sched]'); await shot(p, 'kt-cap-nhat-tien-do', '#ov .mform'); await closeModal(p);
  await click(p, '[data-act=sched-more]'); await shot(p, 'kt-chi-tiet-tien-do', '#ov .mform'); await closeModal(p);
  await go(p, 'tien-do'); await click(p, '[data-act=add-sched]'); await shot(p, 'kt-lap-ke-hoach', '#ov .mform'); await closeModal(p);
  await go(p, 'nhat-ky'); await shot(p, 'kt-nhat-ky', undefined, [{ sel: '.toolbar', n: 1 }, { sel: '.head .btn.primary', n: 2 }, { sel: '[data-act=diary-photo]', n: 3 }, { sel: '[data-act=edit-diaries]', n: 4 }]);
  await click(p, '.head .btn.primary'); await shot(p, 'kt-ghi-nhat-ky', '#ov .mform'); await closeModal(p);
  await go(p, 'khoi-luong'); await p.selectOption('.content select >> nth=0', { index: 2 }).catch(() => { }); await wait(400);
  await shot(p, 'kt-khoi-luong', undefined, [{ sel: '.content select', n: 1 }, { sel: '.content .tabs', n: 2 }, { sel: '[data-act=add-boq]', n: 3 }, { sel: '.card [data-act=add-vol]', n: 4 }]);
  await click(p, '[data-act=add-boq]'); await shot(p, 'kt-them-boq', '#ov .mform'); await closeModal(p);
  await click(p, '.card [data-act=add-vol]'); await shot(p, 'kt-cap-nhat-khoi-luong', '#ov .mform'); await closeModal(p);
  await tab(p, 'Theo dõi nghiệm thu'); await shot(p, 'kt-nghiem-thu');
  await tab(p, 'Tổng hợp'); await shot(p, 'kt-tong-hop-khoi-luong');
  await p.context().close();

  // ===== Kế toán =====
  p = await newPage(DESK); await login(p, 'ketoan');
  await go(p, 'thanh-toan'); await shot(p, 'ke-thanh-toan', undefined, [{ sel: '.content select', n: 1 }, { sel: '.content .tabs', n: 2 }, { sel: '.content .tw', n: 3 }]);
  await tab(p, 'Kế hoạch thanh toán'); await shot(p, 'ke-ke-hoach', undefined, [{ sel: '[data-act=add-plan]', n: 1 }, { sel: '[data-act=edit-payplans]', n: 2 }]);
  await click(p, '[data-act=add-plan]'); await shot(p, 'ke-them-ke-hoach', '#ov .mform'); await closeModal(p);
  await tab(p, 'Hồ sơ thanh toán'); await shot(p, 'ke-ho-so', undefined, [{ sel: '[data-act=add-pay]', n: 1 }, { sel: '[data-act=pay-done]', n: 2 }, { sel: '[data-act=edit-payments]', n: 3 }]);
  await click(p, '[data-act=add-pay]'); await shot(p, 'ke-lap-ho-so', '#ov .mform'); await closeModal(p);
  await tab(p, 'Tổng hợp'); await shot(p, 'ke-tong-hop', 'full');
  await go(p, 'khoi-luong'); await p.selectOption('.content select >> nth=0', { index: 2 }).catch(() => { }); await wait(300); await tab(p, 'Theo dõi nghiệm thu'); await shot(p, 'ke-nghiem-thu');
  await p.context().close();

  // ===== Tư vấn giám sát / Nhà thầu =====
  p = await newPage(DESK); await login(p, 'giamsat');
  await go(p, 'nhat-ky'); await shot(p, 'gs-nhat-ky', undefined, [{ sel: '.head .btn.primary', n: 1 }, { sel: '[data-act=diary-photo]', n: 2 }]);
  await click(p, '.head .btn.primary');
  await p.selectOption('#ov select >> nth=0', { index: 1 }).catch(() => { });
  await p.fill('#ov textarea >> nth=0', 'Đổ bê tông móng M1–M4 | 18,5 | m3\nLắp dựng cốp pha cột trục A | 42 | m2').catch(() => { });
  await p.setInputFiles('#ov input[type=file]', img).catch(() => { }); await wait(500);
  await shot(p, 'gs-ghi-nhat-ky', '#ov .mform'); await closeModal(p);
  await go(p, 'tien-do'); await scrollTo(p, '.card', 'Biểu đồ tiến độ'); await shot(p, 'gs-tien-do', undefined, [{ sel: '[data-act=upd-sched]', n: 1 }]);
  await p.context().close();

  // ===== Quản trị hệ thống =====
  p = await newPage(DESK); await login(p, 'admin');
  await go(p, 'quan-tri'); await shot(p, 'qt-nguoi-dung', undefined, [{ sel: '.content .tabs', n: 1 }, { sel: '[data-act=add-user]', n: 2 }, { sel: '[data-act=edit-users]', n: 3 }, { sel: '[data-act=reset-pw]', n: 4 }, { sel: '[data-act=lock-user]', n: 5 }]);
  await click(p, '[data-act=add-user]'); await shot(p, 'qt-them-nguoi-dung', '#ov .mform'); await closeModal(p);
  { const rp = await p.$$('[data-act=reset-pw]'); await rp[1].click(); await wait(400); } await shot(p, 'qt-dat-lai-mat-khau', '#ov .mform'); await closeModal(p);
  await tab(p, 'Nhóm và phân quyền'); await shot(p, 'qt-nhom-quyen', undefined, [{ sel: '[data-act=add-group]', n: 1 }, { sel: '[data-act=edit-groups]', n: 2, nth: 2 }]);
  const eg = await p.$$('[data-act=edit-groups]'); await eg[2].click(); await wait(400); await shot(p, 'qt-phan-quyen', '#ov .mform'); await closeModal(p);
  await tab(p, 'Danh mục dùng chung'); await shot(p, 'qt-danh-muc', undefined, [{ sel: '.card', text: 'Loại danh mục', n: 1 }, { sel: '[data-act=add-cat]', n: 2 }]);
  await tab(p, 'Nhật ký hoạt động'); await shot(p, 'qt-nhat-ky-he-thong', undefined, [{ sel: '.card select', n: 1 }, { sel: '[data-act=export-logs]', n: 2 }]);
  await tab(p, 'Sao lưu, hệ thống'); await shot(p, 'qt-sao-luu', 'full', [{ sel: '[data-act=backup]', n: 1 }, { sel: '[data-act=restore]', n: 2 }]);
  await go(p, 'doi-chieu'); await shot(p, 'qt-doi-chieu');
  await p.context().close();

  // ===== Điện thoại =====
  for (const [k, u] of [['gs', 'giamsat'], ['kt', 'kythuat']]) {
    p = await newPage(MOB);
    if (k === 'gs') { await p.goto(BASE + '/'); await p.waitForSelector('#login'); await shot(p, 'dt-dang-nhap'); }
    await login(p, u); await go(p, 'hien-truong');
    if (k === 'gs') {
      await shot(p, 'dt-hien-truong', undefined, [{ sel: '.tiles', n: 1 }, { sel: '.tabbar', n: 2, pad: 0 }]);
      await click(p, '.tile', 'Ghi nhật ký'); await shot(p, 'dt-ghi-nhat-ky'); await closeModal(p);
      await click(p, '.tile', 'Cập nhật tiến độ'); await shot(p, 'dt-cap-nhat-tien-do'); await closeModal(p);
      await click(p, '[data-act=menu]'); await wait(300); await shot(p, 'dt-menu');
      await go(p, 'nhat-ky'); await shot(p, 'dt-nhat-ky');
    } else { await go(p, 'du-an'); await shot(p, 'dt-du-an'); }
    await p.context().close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
