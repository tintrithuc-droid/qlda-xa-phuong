// Ảnh minh họa các chức năng nâng cấp theo phần mềm TTTS (chạy sau shots.js và shots-v17.js, cùng CSDL):
// mã kiểm tra đăng nhập, menu theo giai đoạn, danh mục nhà thầu và đơn vị giám sát, nghiệm thu sản phẩm tư vấn,
// lưu nháp và chuyển duyệt, theo dõi hồ sơ, chuông thông báo, Trung tâm cảnh báo, tài khoản thuộc đơn vị, dữ liệu đầu kỳ.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.env.BASE || 'http://127.0.0.1:5080', PW = 'Admin2026';
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const T = '/tmp/hdsd-them/';
const wait = ms => new Promise(r => setTimeout(r, ms));
const DESK = { viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.5, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' };
const MOB = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' };
let b, SECRET = fs.readFileSync(path.join(os.tmpdir(), 'hdsd-secret'), 'utf8').trim(), lastStep = Math.floor(Date.now() / 30000);
async function totp() {
  while (Math.floor(Date.now() / 30000) <= lastStep) await wait(1000);
  const step = lastStep = Math.floor(Date.now() / 30000);
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of SECRET) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
async function newPage(opts) { const c = await b.newContext(opts); const p = await c.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message)); return p; }
// Tài khoản do quản trị tạo phải đặt mật khẩu riêng ở lần đăng nhập đầu: chụp màn hình một lần, rồi đổi sang mật khẩu tạm và đổi lại
async function pwFirst(p) {
  if (!(await p.$('#pwfirst'))) return;
  const f = path.join(__dirname, 'shots', 'chung-doi-mat-khau-lan-dau.png');
  if (!fs.existsSync(f)) await p.screenshot({ path: f });
  await p.evaluate(async pw => { for (const [o, n] of [[pw, pw + 'x'], [pw + 'x', pw]]) await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: JSON.stringify({ old: o, password: n }) }); }, PW);
  await p.reload(); await p.waitForSelector('#app', { timeout: 20000 });
}
async function login(p, u) {
  await p.goto(BASE + '/'); await p.waitForSelector('#login,#app', { timeout: 20000 });
  if (await p.$('#login')) {
    await p.fill('#lg_user', u); await p.fill('#lg_pw', PW); await p.click('#login button[type=submit]');
    await p.waitForSelector('#app,#mfa,#pwfirst', { timeout: 20000 }); await pwFirst(p);
    if (await p.$('#mfa')) { await p.fill('#mf_code', await totp()); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 20000 }); }
  }
  await wait(500);
}
async function go(p, r) { await closeModal(p); await p.evaluate(r => { location.hash = r; scrollTo(0, 0); }, r); await wait(600); }
async function closeModal(p) { for (let i = 0; i < 3 && await p.$('#ov:not([hidden])'); i++) { const c = await p.$('#ov [data-close]'); if (c) await c.click(); else await p.keyboard.press('Escape'); await wait(200); } }
async function tab(p, label) { await p.click(`.content [data-act=tab]:text-is("${label}")`); await wait(400); }
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
async function shot(p, name, clip, a) {
  const vp = p.viewportSize(), tall = typeof clip === 'string' && clip.startsWith('#ov') && vp.width > 1000;
  if (tall) { await p.setViewportSize({ width: vp.width, height: 1900 }); await wait(300); }
  if (clip === 'full') { await p.evaluate(() => scrollTo(0, 0)); await wait(300); }
  if (a) await ann(p, a);
  const file = path.join(OUT, name + '.png');
  if (clip === 'full') await p.screenshot({ path: file, fullPage: true });
  else if (clip) {
    const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return { x: x.left + scrollX, y: x.top + scrollY, w: x.width, h: x.height }; }, clip);
    if (!r) throw new Error('Không thấy vùng ' + clip);
    const m = 18; await p.screenshot({ path: file, fullPage: true, clip: { x: Math.max(0, r.x - m), y: Math.max(0, r.y - m), width: r.w + 2 * m, height: r.h + 2 * m } });
  } else await p.screenshot({ path: file });
  await p.evaluate(() => document.querySelectorAll('.hd-ann').forEach(x => x.remove())); if (tall) await p.setViewportSize(vp); console.log('✓', name);
}
const scrollIn = (p, sel, text) => p.evaluate(([s, t]) => { const e = [...document.querySelectorAll(s)].find(e => !t || e.innerText.includes(t)); if (e) e.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); }, [sel, text]).then(() => wait(300));
const wfDo = async (p, id, note) => { await p.click(`[data-act=wf][data-id="${id}"]`); await wait(300); if (note && await p.$('#f_note')) await p.fill('#f_note', note); await p.click('#mform [type=submit]'); await wait(900); };

const pick = (p, sel, val) => p.evaluate(([s, v]) => { const e = document.querySelector(s); if (e) { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, [sel, val]);

(async () => {
  b = await chromium.launch({ args: ['--lang=vi-VN'] });
  let p;

  // ===== Đăng nhập sai nhiều lần: mã kiểm tra =====
  p = await newPage(DESK); await p.goto(BASE + '/'); await p.waitForSelector('#login');
  for (let i = 0; i < 3; i++) { await p.fill('#lg_user', 'nguyenvana'); await p.fill('#lg_pw', 'MatKhauSai1'); await p.click('#login button[type=submit]'); await wait(900); }
  await p.waitForSelector('#lg_cap:not([hidden])', { timeout: 5000 }).catch(() => { });
  await p.fill('#lg_pw', ''); await shot(p, 'chung-ma-kiem-tra', '#login', [{ sel: '#lg_capimg', n: 1 }, { sel: '#lg_capnew', n: 2 }, { sel: '#lg_capv', n: 3 }]);
  await p.context().close();

  // ===== Cán bộ kỹ thuật: menu theo giai đoạn, danh mục nhà thầu, gói thầu chọn nhà thầu =====
  p = await newPage(DESK); await login(p, 'kythuat');
  await p.evaluate(async () => {
    await Store.put('orgs', { id: 'o-gs1', kind: 'gs', name: 'Công ty Cổ phần Tư vấn Xây dựng Miền Tây', shortName: 'TVXD Miền Tây', taxCode: '1800987654', address: 'Số 12 đường 30/4, phường Ninh Kiều, thành phố Cần Thơ', representative: 'Lê Thị Hoa', repTitle: 'Giám đốc', phone: '0292 3812 345', certNo: 'CAT-00054321', certGrade: 'II', active: true });
    await Store.put('orgs', { id: 'o-nt2', kind: 'nt', name: 'Công ty TNHH Tư vấn Thiết kế Cửu Long', shortName: 'TVTK Cửu Long', taxCode: '1801112233', address: 'Số 5 đường Trần Hưng Đạo, phường Cái Khế, thành phố Cần Thơ', representative: 'Phạm Minh Tâm', repTitle: 'Giám đốc', phone: '0292 3765 432', active: true });
    await Store.put('packages', { id: 'k-tv04', projectId: 'p1', code: 'TV04', name: 'Tư vấn khảo sát, lập báo cáo kinh tế - kỹ thuật mở rộng tuyến', type: 'Tư vấn', method: 'Chỉ định thầu rút gọn', estimate: 450000000, status: 'Đang thực hiện hợp đồng', duration: '120 ngày', phase: 'cb', contractorIds: ['o-nt2'], supervisorIds: [] });
    await Store.put('contracts', { id: 'c-tv04', packageId: 'k-tv04', projectId: 'p1', number: '15/2026/HĐ-TV04', contractor: 'Công ty TNHH Tư vấn Thiết kế Cửu Long', signDate: '2026-09-01', value: 432000000, start: '2026-09-05', end: '2027-01-31', ctype: 'Trọn gói' });
  });
  await go(p, 'cb-goi-thau'); await wait(300);
  await shot(p, 'kt-menu-giai-doan', undefined, [{ sel: '.nav .sub', text: 'Chuẩn bị đầu tư', n: 1 }, { sel: '.nav .sub', text: 'Thực hiện đầu tư', n: 2 }, { sel: '.content h1 .pill', n: 3 }, { sel: '.content .tabs', n: 4 }]);
  await go(p, 'goi-thau'); await p.evaluate(() => { S.tab.gt = 'nt'; render(); }); await wait(300);
  await p.click('[data-act=add-org][data-id=nt]'); await wait(500);
  for (const [k, v] of [['name', 'Công ty TNHH Xây dựng Thuận Phát'], ['shortName', 'Thuận Phát'], ['taxCode', '1801654321'], ['address', 'Số 88 Quốc lộ 91, phường Thới An Đông, thành phố Cần Thơ'], ['phone', '0292 3888 999'], ['representative', 'Trần Văn Bình'], ['repTitle', 'Giám đốc'], ['bankAccount', '0111 0000 12345'], ['bankName', 'Ngân hàng TMCP Ngoại thương Việt Nam, chi nhánh Cần Thơ'], ['certNo', 'CAT-00012345'], ['certGrade', 'II'], ['field', 'Thi công công trình giao thông, hạ tầng kỹ thuật']]) await p.fill('#f_' + k, v);
  await shot(p, 'kt-them-nha-thau', '#ov .mform'); await p.click('#mform [type=submit]'); await wait(800);
  await shot(p, 'kt-danh-muc-nha-thau', undefined, [{ sel: '.content .tabs button', text: 'Danh mục nhà thầu', n: 1 }, { sel: '.content .tabs button', text: 'Danh mục đơn vị giám sát', n: 2 }, { sel: '[data-act=add-org]', n: 3 }, { sel: '.content tr.click', n: 4 }]);
  await p.evaluate(() => { S.tab.gt = 'pkg'; render(); }); await wait(300);
  const kid = await p.evaluate(() => (D('packages').find(x => x.code === 'XL01') || {}).id);
  await p.evaluate(id => ACT['edit-packages'](id), kid); await wait(600);
  await p.fill('#f__ct', 'Công ty TNHH Xây dựng Thuận Phát'); await p.check('#f__sv input[value="o-gs1"]');
  await shot(p, 'kt-goi-thau-chon-nha-thau', '#ov .mform', [{ sel: '#f_phase', n: 1 }, { sel: '#f__ct', n: 2 }, { sel: '#f__jv', n: 3 }, { sel: '#f__sv', n: 4 }]);
  await p.click('#mform [type=submit]'); await wait(1000); await closeModal(p);
  await p.evaluate(id => ACT['open-pkg'](id), kid); await wait(600);
  await scrollIn(p, '.content .card', 'Nhà thầu và đơn vị giám sát');
  await shot(p, 'kt-the-nha-thau', undefined, [{ sel: '.content .card', text: 'Nhà thầu và đơn vị giám sát', n: 1 }]);

  // ===== Nghiệm thu sản phẩm tư vấn (chuẩn bị đầu tư) =====
  const cid = await p.evaluate(async () => {
    const c = get('contracts', 'c-tv04'); const v = contractValue(c);
    if (!D('boq').some(b => b.contractId === c.id)) for (const [code, name, r] of [['SP01', 'Nhiệm vụ và phương án khảo sát xây dựng', .2], ['SP02', 'Báo cáo kinh tế - kỹ thuật đầu tư xây dựng', .55], ['SP03', 'Dự toán xây dựng công trình', .25]])
      await Store.put('boq', { id: 'b-' + c.id + '-' + code, contractId: c.id, code, name, unit: 'Sản phẩm', qty: 1, price: Math.round(v * r) });
    return c.id; });
  await go(p, 'cb-thanh-toan'); await p.evaluate(id => { S.f.ttcb = id; S.tab.ttcb = 'nt'; render(); }, cid); await wait(500);
  await p.click('.content [data-act=vb-new]'); await wait(600);
  const ins = await p.$$('#ov .vb-grid tbody input'); const vals = await p.$$eval('#ov .vb-grid tbody tr td:nth-child(3)', t => t.map(x => +x.textContent.replace(/\D/g, '')));
  await ins[0].fill(String(vals[0])); await ins[1].fill(String(Math.round(vals[1] / 2))); await p.fill('#f_number', '05/2026/BB-NT');
  await p.evaluate(() => document.querySelector('#ov .vb-grid tbody').dispatchEvent(new Event('input', { bubbles: true })));
  await shot(p, 'kt-lap-dot-san-pham', '#ov .mform', [{ sel: '#f_number', n: 1 }, { sel: '#ov .vb-grid', n: 2 }]);
  await p.click('#mform [type=submit]'); await wait(1000); await closeModal(p);
  await p.click(`.content [data-act=wf][data-id$="|submit"]`); await wait(400); if (await p.$('#f_note')) await p.fill('#f_note', 'Trình duyệt nghiệm thu sản phẩm đợt 1'); await p.click('#mform [type=submit]'); await wait(900);
  await shot(p, 'kt-nghiem-thu-san-pham', 'full', [{ sel: '.content .tabs button', text: 'Nghiệm thu sản phẩm', n: 1 }, { sel: '[data-act=add-cbsp]', n: 2 }, { sel: '.content [data-act=vb-new]', n: 3 }, { sel: '.content table', n: 4 }, { sel: '.vb-list .vb', n: 5 }]);
  await p.click('.content [data-act=vb-new]'); await wait(600);
  { const i2 = await p.$$('#ov .vb-grid tbody input'); await i2[0].fill('50000000'); await p.fill('#f_name', 'Đợt 2'); }
  await p.click('#mform [type=submit]'); await wait(500);
  await shot(p, 'kt-chan-vuot-gia-tri', '#ov .mform', [{ sel: '#ov .vb-grid tbody tr.bad', n: 1 }, { sel: '#mform_err', n: 2 }]); await closeModal(p);

  // ===== Lưu nháp, lưu và chuyển duyệt, chuyển đích danh, theo dõi hồ sơ =====
  await go(p, 'goi-thau'); await p.evaluate(() => ACT['add-addendum']('c1')); await wait(600);
  await p.fill('#f_number', 'PL03'); await p.fill('#f_date_t', '20/11/2026'); await p.press('#f_date_t', 'Enter'); await p.fill('#f_content', 'Bổ sung rãnh thoát nước dọc đoạn Km1+200 – Km1+450'); await p.fill('#f_valueChange', '95000000');
  await shot(p, 'chung-luu-nhap', '#ov .mform', [{ sel: '#mform footer button', text: 'Lưu nháp', n: 1 }, { sel: '#mform [data-send="1"]', n: 2 }]);
  await p.click('#mform [data-send="1"]'); await p.waitForSelector('#f_assignTo', { timeout: 10000 }); await wait(300);
  { const o = await p.$$eval('#f_assignTo option', x => x.map(y => y.value).filter(Boolean)); if (o.length) await p.selectOption('#f_assignTo', o[0]); }
  await p.fill('#f_note', 'Kèm văn bản đề nghị số 52/CV-NT của nhà thầu');
  await shot(p, 'chung-chuyen-duyet', '#ov .mform', [{ sel: '#ov .mform p, #ov .mform .small', n: 1 }, { sel: '#f_assignTo', n: 2 }, { sel: '#f_note', n: 3 }]);
  await p.click('#mform [type=submit]'); await wait(1000);
  await go(p, 'trinh-duyet'); await p.evaluate(() => { S.tab.td2 = 'chuyen'; render(); }); await wait(400);
  await shot(p, 'chung-theo-doi-ho-so', undefined, [{ sel: '.content .tabs', n: 1 }, { sel: '.content td', text: 'giữ', n: 2 }, { sel: '[data-act=wf]', text: 'Rút lại', n: 3 }, { sel: '[data-act=wf]', text: 'In phiếu trình', n: 4 }]);
  await p.context().close();

  // ===== Lãnh đạo Ban: chuông thông báo, duyệt đợt sản phẩm, Trung tâm cảnh báo =====
  p = await newPage(DESK); await login(p, 'lanhdao'); await go(p, 'tong-quan'); await wait(400);
  await p.click('[data-act=wf-bell]'); await wait(400);
  await shot(p, 'chung-chuong', undefined, [{ sel: '.top [data-act=wf-bell]', n: 1 }, { sel: '#ov .mform', n: 2 }]); await closeModal(p);
  await go(p, 'canh-bao'); await wait(500);
  await shot(p, 'chung-canh-bao', undefined, [{ sel: '.content .toolbar', n: 1 }, { sel: '.content [data-act=alert-go]', n: 2 }, { sel: '.content .head .btn', n: 3 }]);
  await p.context().close();

  // ===== Quản trị: tài khoản thuộc đơn vị, dữ liệu đầu kỳ =====
  p = await newPage(DESK); await login(p, 'admin'); await go(p, 'quan-tri'); await wait(400);
  await p.click('[data-act=add-user]'); await wait(500);
  await p.fill('#f_username', 'thuanphat.kt'); await p.fill('#f_name', 'Nguyễn Thành Công'); await p.fill('#f_unit', 'Công ty TNHH Xây dựng Thuận Phát');
  await pick(p, '#f_groupId', 'g-site'); await pick(p, '#f_orgId', await p.evaluate(() => (D('orgs').find(o => o.name === 'Công ty TNHH Xây dựng Thuận Phát') || {}).id || ''));
  await shot(p, 'qt-tai-khoan-don-vi', '#ov .mform', [{ sel: '#f_orgId', n: 1 }]); await closeModal(p);
  await p.evaluate(() => { S.tab.qt = 'dk'; render(); }); await wait(600);
  await shot(p, 'qt-du-lieu-dau-ky', 'full', [{ sel: '.content .tabs button', text: 'Dữ liệu đầu kỳ', n: 1 }, { sel: '[data-act=dk-tpl]', n: 2 }]);
  // Tài khoản mới do quản trị tạo: lần đăng nhập đầu phải đặt mật khẩu riêng
  const nu = 'hd-moi' + Date.now() % 100000;
  await p.evaluate(async ({ nu, pw }) => {
    const g = (D('users').find(u => u.username === 'kythuat') || D('users').find(u => u.username !== 'admin')).groupId;
    await api('POST', '/api/users', { username: nu, name: 'Nguyễn Văn Mới', groupId: g, password: pw });
  }, { nu, pw: PW });
  const f1 = path.join(OUT, 'chung-doi-mat-khau-lan-dau.png'); if (fs.existsSync(f1)) fs.unlinkSync(f1);
  const q = await newPage(DESK); await login(q, nu); console.log(fs.existsSync(f1) ? '✓ chung-doi-mat-khau-lan-dau' : '✗ chung-doi-mat-khau-lan-dau');
  await q.context().close();
  await p.context().close();
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
