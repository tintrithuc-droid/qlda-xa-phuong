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
// Mã TOTP như ứng dụng xác thực; mỗi mã chỉ dùng một lần nên chờ sang chu kỳ 30 giây mới khi cần
let SECRET = '', lastStep = 0;
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
async function login(p, u) {
  await p.goto(BASE + '/'); await p.waitForSelector('#login,#app', { timeout: 20000 });
  if (await p.$('#login')) {
    await p.fill('#lg_user', u); await p.fill('#lg_pw', PW); await p.click('#login button[type=submit]');
    await p.waitForSelector('#app,#mfa', { timeout: 20000 });
    if (await p.$('#mfa')) { await p.fill('#mf_code', await totp()); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 20000 }); }
  }
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
  const vp = p.viewportSize(), tall = typeof clip === 'string' && clip.startsWith('#ov') && vp.width > 1000;
  if (tall) { await p.setViewportSize({ width: vp.width, height: 1900 }); await wait(300); }
  if (a) await ann(p, a);
  const file = path.join(OUT, name + '.png');
  if (clip === 'full') await p.screenshot({ path: file, fullPage: true });
  else if (clip) {
    const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return { x: x.left + scrollX, y: x.top + scrollY, w: x.width, h: x.height }; }, clip);
    if (!r) throw new Error('Không thấy vùng ' + clip);
    const m = 18; await p.screenshot({ path: file, fullPage: true, clip: { x: Math.max(0, r.x - m), y: Math.max(0, r.y - m), width: r.w + 2 * m, height: r.h + 2 * m } });
  } else await p.screenshot({ path: file });
  await clearAnn(p); if (tall) await p.setViewportSize(vp); console.log('✓', name);
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
  await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  // Xác thực 2 lớp: thiết lập ngay sau khởi tạo
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); SECRET = await p.evaluate(() => S.mfaStep.secret);
  await p.setViewportSize({ width: 1440, height: 1000 });
  await shot(p, 'qt-2lop-thiet-lap', '#mfa', [{ sel: '.mfa-steps .qr', n: 1 }, { sel: '.otp-key', n: 2 }, { sel: '#mf_code', n: 3 }, { sel: '#mfa button[type=submit]', n: 4 }]);
  await p.fill('#mf_code', await totp()); await p.click('#mfa button[type=submit]');
  await p.waitForSelector('#mfa .rcodes', { timeout: 15000 });
  await shot(p, 'qt-2lop-ma-khoi-phuc', '#mfa', [{ sel: '.rcodes', n: 1 }, { sel: '#rc_dl', n: 2 }, { sel: '#rc_pr', n: 3 }, { sel: '#mfa label.checks', n: 4 }, { sel: '#mfa button[type=submit]', n: 5 }]);
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 }); await wait(800);
  await p.setViewportSize({ width: 1440, height: 860 });
  await p.evaluate(() => fetch('/api/auth/logout', { method: 'POST', headers: { 'X-QLDA': '1' } })); await p.goto(BASE + '/'); await p.waitForSelector('#login');
  await shot(p, 'chung-dang-nhap', undefined, [{ sel: '#lg_user', n: 1 }, { sel: '#lg_pw', n: 2 }, { sel: '#login button[type=submit]', n: 3 }]);
  await p.fill('#lg_user', 'admin'); await p.fill('#lg_pw', PW); await p.click('#login button[type=submit]'); await p.waitForSelector('#mf_code');
  await shot(p, 'qt-2lop-dang-nhap', '#mfa', [{ sel: '#mf_code', n: 1 }, { sel: '#mfa button[type=submit]', n: 2 }, { sel: '#mf_alt', n: 3 }]);
  await p.click('#mf_alt'); await wait(200); await shot(p, 'qt-2lop-ma-khoi-phuc-dang-nhap', '#mfa');
  await p.context().close();

  // ===== Tệp đính kèm mẫu, hạn bảo lãnh, ảnh nhật ký có chú thích =====
  { const M = '/tmp/hdsd-mau/'; const f64 = n => ({ name: n, b64: fs.readFileSync(M + n).toString('base64') });
    p = await newPage(DESK); await login(p, 'admin');
    await p.evaluate(async F => {
      const up = async (col, rid, n, kind, ref) => { const f = F[n]; const bin = Uint8Array.from(atob(f.b64), c => c.charCodeAt(0));
        const fd = new FormData(); fd.append('file', new File([bin], n, { type: n.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg' }));
        fd.append('collection', col); fd.append('recordId', rid); if (kind) fd.append('kind', kind); if (ref) fd.append('ref', ref);
        const r = await fetch('/api/attachments', { method: 'POST', headers: { 'X-QLDA': '1' }, body: fd }); if (!r.ok) throw new Error('upload ' + n + ' ' + r.status); return r.json(); };
      const add = d => Days => { const x = new Date(TODAY); x.setDate(x.getDate() + Days); return x.toISOString().slice(0, 10); };
      const plus = add();
      const pr = D('projects').find(x => x.name.includes('Dự án thành phần 1')) || D('projects')[0];
      // văn bản pháp lý chính của dự án
      const L = t => D('legal').find(l => l.projectId === pr.id && !l.packageId && l.type === t);
      let qd = L('Quyết định phê duyệt dự án'); if (!qd) qd = await Store.put('legal', { projectId: pr.id, packageId: '', type: 'Quyết định phê duyệt dự án', number: '1245/QĐ-TTTS', date: pr.start || TODAY, issuer: 'Trung tâm Thủy sản TP.HCM', title: 'Phê duyệt dự án ' + pr.name });
      await up('legal', qd.id, 'QD-phe-duyet-du-an-so-1245-QD-TTTS.pdf');
      let ct = L('Quyết định chủ trương đầu tư'); if (!ct) ct = await Store.put('legal', { projectId: pr.id, packageId: '', type: 'Quyết định chủ trương đầu tư', number: '312/QĐ-UBND', date: '2025-03-12', issuer: 'UBND Thành phố Hồ Chí Minh', title: 'Chủ trương đầu tư ' + pr.name });
      await up('legal', ct.id, 'QD-chu-truong-dau-tu-so-312-QD-UBND.pdf'); await up('legal', ct.id, 'Giay-phep-xay-dung.pdf');
      const gp = await Store.put('legal', { projectId: pr.id, packageId: '', type: (catalog('Loại hồ sơ pháp lý').find(x => /giấy phép/i.test(x)) || 'Giấy phép xây dựng'), number: '86/GPXD', date: '2025-08-20', issuer: 'Sở Xây dựng TP.HCM', title: 'Giấy phép xây dựng ' + pr.code, validUntil: plus(18) });
      await up('legal', gp.id, 'Giay-phep-xay-dung.pdf');
      // gói thầu XL01: KHLCNT, KQLCNT, hợp đồng, bảo lãnh, BOQ, nghiệm thu, thanh toán
      const k = D('packages').find(x => x.projectId === pr.id && /XL01/.test(x.code)) || D('packages').find(x => /XL01/.test(x.code));
      const c = D('contracts').find(x => x.packageId === k.id);
      for (const [t, n] of [['Kế hoạch lựa chọn nhà thầu', 'QD-phe-duyet-KHLCNT.pdf'], ['Kết quả lựa chọn nhà thầu', 'QD-phe-duyet-KQLCNT-XL01.pdf']]) {
        let l = D('legal').find(x => x.packageId === k.id && x.type === t); if (!l) l = await Store.put('legal', { projectId: k.projectId, packageId: k.id, type: t, number: (t.startsWith('Kế') ? '58' : '97') + '/QĐ-BQL', date: '2025-06-10', issuer: 'Ban QL Trung tâm Thủy sản TP.HCM', title: 'Phê duyệt ' + (t.startsWith('Kế') ? 'KHLCNT' : 'kết quả LCNT gói ') + k.code });
        await up('legal', l.id, n); }
      await Store.put('contracts', { ...c, guaranteeUntil: plus(21), advanceGuaranteeUntil: plus(75), guarantee: c.guarantee || 'BL 0215/2025 – Vietcombank CN TP.HCM' });
      await up('contracts', c.id, 'Hop-dong-XL01-da-ky.pdf', 'Hợp đồng đã ký'); await up('contracts', c.id, 'Bao-lanh-thuc-hien-hop-dong.pdf', 'Bảo lãnh thực hiện hợp đồng'); await up('contracts', c.id, 'Bao-lanh-tam-ung.pdf', 'Bảo lãnh tạm ứng');
      await up('contracts', c.id, 'Bien-ban-nghiem-thu-dot-1.pdf', 'Bảng khối lượng hợp đồng');
      for (const per of [...new Set(D('volumes').filter(v => v.contractId === c.id).map(v => v.period))].slice(0, 2)) await up('contracts', c.id, 'Bien-ban-nghiem-thu-dot-1.pdf', 'Biên bản nghiệm thu', per);
      for (const pay of D('payments').filter(x => x.contractId === c.id).slice(0, 3)) { await up('payments', pay.id, 'Ho-so-de-nghi-thanh-toan-dot-1.pdf', 'Hồ sơ đề nghị thanh toán'); if (pay.status === 'Đã thanh toán') await up('payments', pay.id, 'Uy-nhiem-chi-KBNN.pdf', 'Chứng từ Kho bạc'); }
      // nhật ký: trang đã ký + ảnh có chú thích
      for (const d of D('diaries').filter(x => x.packageId === k.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2)) {
        await up('diaries', d.id, 'Trang-nhat-ky-da-ky.pdf', 'Trang nhật ký đã ký');
        const ph = [...(d.photos || [])];
        for (const [n, cap] of [['Anh-hien-truong-mong-M1.jpg', 'Bê tông móng M1, nhìn từ trục 1'], ['Anh-hien-truong-cot-truc-A.jpg', 'Cốp pha cột trục A']]) {
          const f = F[n]; const bin = Uint8Array.from(atob(f.b64), c => c.charCodeAt(0)); const ph1 = await storePhoto(new File([bin], n, { type: 'image/jpeg' })); ph.push({ ...ph1, caption: cap, date: d.date, by: 'Nguyễn Văn Giám Sát' }); }
        await Store.put('diaries', { ...d, photos: ph }); }
      // tiến độ: ảnh và báo cáo khi cập nhật
      const sc = D('schedule').find(x => x.packageId === k.id && x.progress > 0); if (sc) await up('schedule', sc.id, 'Bao-cao-tuan-44.pdf', 'Cập nhật tiến độ', TODAY);
      // công việc: văn bản giao việc
      const tk = D('tasks').find(x => x.projectId === pr.id); if (tk) await up('tasks', tk.id, 'QD-phe-duyet-KHLCNT.pdf', 'Văn bản giao việc');
      // một tệp gỡ nhầm nằm trong thùng rác
      const tr = await up('legal', gp.id, 'Bao-cao-tuan-44.pdf'); await fetch('/api/attachments/' + tr.id, { method: 'DELETE', headers: { 'X-QLDA': '1' } });
      await fetch('/api/backup/auto', { method: 'POST', headers: { 'X-QLDA': '1' } });
    }, Object.fromEntries(fs.readdirSync(M).map(n => [n, f64(n)])));
    await p.context().close(); }

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
  await click(p, '.content [data-act=att-all]'); await shot(p, 'chung-ds-tep', '#ov .mform'); await closeModal(p);
  { const rows = await p.$$('.content tr'); for (const r of rows) { if ((await r.innerText()).includes('Giấy phép')) { await (await r.$('[data-act=edit-legal]')).click(); break; } } await wait(400);
    await p.setInputFiles('#ov .attdrop input[type=file]', '/tmp/hdsd-mau/Giay-phep-xay-dung.pdf'); await wait(300);
    await shot(p, 'chung-dinh-kem', '#ov .mform', [{ sel: '#ov .attbox > .attlist li', n: 1 }, { sel: '#ov .attdrop', n: 2 }, { sel: '#ov .attnew li', n: 3 }]); await closeModal(p); }
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
  await go(p, 'du-an'); await click(p, '.content tr.click', 'Dự án thành phần 1');
  await scrollTo(p, '.card', 'Văn bản pháp lý chính'); await shot(p, 'kt-van-ban-chinh', undefined, [{ sel: '.card', text: 'Văn bản pháp lý chính', n: 1 }, { sel: '.card [data-act=add-legal]', n: 2 }]);
  await click(p, '[data-act=edit-projects]'); await shot(p, 'kt-them-du-an', '#ov .mform', [{ sel: '#ov .fld', text: 'Số quyết định phê duyệt dự án', n: 1 }, { sel: '#f_decAtt', n: 2 }]); await closeModal(p);
  await go(p, 'mo-hinh'); await shot(p, 'kt-mo-hinh', undefined, [{ sel: '.content select', n: 1 }, { sel: '[data-act=add-model]', n: 2 }, { sel: '[data-act=model-ver]', n: 3 }, { sel: '[data-act=model-hist]', n: 4 }]);
  await click(p, '[data-act=add-model]'); await shot(p, 'kt-tai-mo-hinh', '#ov .mform'); await closeModal(p);
  await click(p, '[data-act=model-hist]'); await shot(p, 'kt-lich-su-mo-hinh', '#ov .mform'); await closeModal(p);
  await scrollTo(p, '.card', 'Thông tin các hạng mục'); await shot(p, 'kt-hang-muc', undefined, [{ sel: '[data-act=add-item]', n: 1 }, { sel: '[data-act=edit-items]', n: 2 }]);
  await click(p, '[data-act=add-item]'); await shot(p, 'kt-them-hang-muc', '#ov .mform'); await closeModal(p);
  await go(p, 'goi-thau'); await shot(p, 'kt-goi-thau', undefined, [{ sel: '.toolbar', n: 1 }, { sel: '.head .btn.primary', n: 2 }, { sel: '.content tr.click', n: 3 }]);
  await click(p, '.head .btn.primary'); await shot(p, 'kt-them-goi-thau', '#ov .mform'); await closeModal(p);
  await click(p, '.content tr.click', 'XL01'); await shot(p, 'kt-chi-tiet-goi-thau', 'full', [{ sel: '[data-act=edit-packages]', n: 1 }, { sel: '.card', text: 'Thông tin hợp đồng', n: 2 }, { sel: '[data-act=goto-kl]', n: 3 }, { sel: '.card', text: 'Điều chỉnh, phụ lục', n: 4 }, { sel: '.card', text: 'Hồ sơ pháp lý gói thầu', n: 5 }]);
  await click(p, '[data-act=add-addendum]'); await shot(p, 'kt-them-phu-luc', '#ov .mform'); await closeModal(p);
  await click(p, '[data-act=edit-contracts]'); await shot(p, 'kt-sua-hop-dong', '#ov .mform', [{ sel: '#ov .fld', text: 'Bảo lãnh thực hiện HĐ hiệu lực đến', n: 1 }, { sel: '#f_att0', n: 2 }]); await closeModal(p);
  await go(p, 'tien-do'); await scrollTo(p, '.card', 'Theo dõi tiến độ'); await tab(p, 'Theo gói thầu');
  await scrollTo(p, '.card', 'Biểu đồ tiến độ'); await shot(p, 'kt-gantt', undefined, [{ sel: '[data-act=upd-sched]', n: 1 }, { sel: '[data-act=sched-more]', n: 2 }, { sel: '.gtoday', n: 3, pad: 6 }]);
  await click(p, '[data-act=upd-sched]'); await shot(p, 'kt-cap-nhat-tien-do', '#ov .mform'); await closeModal(p);
  await click(p, '[data-act=sched-more]'); await shot(p, 'kt-chi-tiet-tien-do', '#ov .mform'); await closeModal(p);
  await go(p, 'tien-do'); await click(p, '[data-act=add-sched]'); await shot(p, 'kt-lap-ke-hoach', '#ov .mform'); await closeModal(p);
  await go(p, 'nhat-ky'); await shot(p, 'kt-nhat-ky', undefined, [{ sel: '.toolbar', n: 1 }, { sel: '.head .btn.primary', n: 2 }, { sel: '[data-act=diary-photo]', n: 3 }, { sel: '[data-act=edit-diaries]', n: 4 }]);
  await click(p, '.head .btn.primary'); await shot(p, 'kt-ghi-nhat-ky', '#ov .mform'); await closeModal(p);
  await click(p, '[data-act=diary-photo]'); await shot(p, 'kt-anh-nhat-ky', '#ov .mform', [{ sel: '#ov [data-cap]', n: 1 }, { sel: '#ov figure label', n: 2 }, { sel: '#ov .fld', text: 'Thêm ảnh', n: 3 }]); await closeModal(p);
  await go(p, 'khoi-luong'); await p.selectOption('.content select >> nth=0', { index: 2 }).catch(() => { }); await wait(400);
  await shot(p, 'kt-khoi-luong', undefined, [{ sel: '.content select', n: 1 }, { sel: '.content .tabs', n: 2 }, { sel: '[data-act=add-boq]', n: 3 }, { sel: '.card [data-act=add-vol]', n: 4 }, { sel: '[data-act=att-boq]', n: 5 }]);
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
  await click(p, '[data-act=pay-done]'); await shot(p, 'ke-xac-nhan-chi', '#ov .mform'); await closeModal(p);
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
  await click(p, '[data-act=diary-photo]'); await shot(p, 'gs-anh-nhat-ky', '#ov .mform', [{ sel: '#ov [data-cap]', n: 1 }, { sel: '#ov figure label', n: 2 }, { sel: '#ov .fld', text: 'Thêm ảnh', n: 3 }]); await closeModal(p);
  await go(p, 'tien-do'); await scrollTo(p, '.card', 'Biểu đồ tiến độ'); await shot(p, 'gs-tien-do', undefined, [{ sel: '[data-act=upd-sched]', n: 1 }]);
  await p.context().close();

  // ===== Quản trị hệ thống =====
  p = await newPage(DESK); await login(p, 'admin');
  // Quản trị thứ hai đã bật 2 lớp (để minh họa nút Đặt lại 2 lớp)
  { const H = { 'X-QLDA': '1' };
    await p.evaluate(async pw => fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: JSON.stringify({ username: 'quantri2', name: 'Trần Văn Quản Trị', unit: 'Ban QL Trung tâm Thủy sản', groupId: 'g-admin', password: pw }) }), PW);
    const c2 = await b.newContext(); const ch = await (await c2.request.post(BASE + '/api/auth/login', { headers: H, data: { username: 'quantri2', password: PW } })).json();
    const keep = [SECRET, lastStep]; SECRET = ch.secret; lastStep = 0; const cd = await totp(); [SECRET, lastStep] = keep;
    await c2.request.post(BASE + '/api/auth/mfa', { headers: H, data: { code: cd } }); await c2.close();
    await p.evaluate(() => Store.load()); }
  await go(p, 'quan-tri'); await shot(p, 'qt-nguoi-dung', 'full', [{ sel: '.content .tabs', n: 1 }, { sel: '[data-act=add-user]', n: 2 }, { sel: '[data-act=edit-users]', n: 3 }, { sel: '[data-act=reset-pw]', n: 4 }, { sel: '[data-act=lock-user]', n: 5 }, { sel: 'th', text: 'Xác thực 2 lớp', n: 6 }, { sel: '[data-act=reset-2fa]', n: 7 }]);
  await click(p, '[data-act=reset-2fa]'); await shot(p, 'qt-2lop-dat-lai', '#ov .mform'); await p.click('#cf_no'); await wait(200);
  await click(p, '[data-act=account]'); await shot(p, 'qt-2lop-tai-khoan', '#ov .mform', [{ sel: '.mfa-state', n: 1 }, { sel: '[data-act=new-rc]', n: 2 }]); await closeModal(p);
  await click(p, '[data-act=add-user]'); await shot(p, 'qt-them-nguoi-dung', '#ov .mform'); await closeModal(p);
  { const rp = await p.$$('[data-act=reset-pw]'); await rp[1].click(); await wait(400); } await shot(p, 'qt-dat-lai-mat-khau', '#ov .mform'); await closeModal(p);
  await tab(p, 'Nhóm và phân quyền'); await shot(p, 'qt-nhom-quyen', undefined, [{ sel: '[data-act=add-group]', n: 1 }, { sel: '[data-act=edit-groups]', n: 2, nth: 2 }]);
  const eg = await p.$$('[data-act=edit-groups]'); await eg[2].click(); await wait(400); await shot(p, 'qt-phan-quyen', '#ov .mform'); await closeModal(p);
  await tab(p, 'Danh mục dùng chung'); await shot(p, 'qt-danh-muc', undefined, [{ sel: '.card', text: 'Loại danh mục', n: 1 }, { sel: '[data-act=add-cat]', n: 2 }]);
  await tab(p, 'Nhật ký hoạt động'); await shot(p, 'qt-nhat-ky-he-thong', undefined, [{ sel: '.card select', n: 1 }, { sel: '[data-act=export-logs]', n: 2 }]);
  await tab(p, 'Kho tệp, thùng rác'); await wait(800);
  await shot(p, 'qt-kho-tep', 'full', [{ sel: '.content .grid.g4', n: 1 }, { sel: '.card', text: 'Tệp đính kèm theo loại dữ liệu', n: 2 }, { sel: '.card', text: 'Tệp không còn sử dụng', n: 3 }, { sel: '[data-act=att-restore]', n: 4 }, { sel: '[data-act=att-purge]', n: 5 }]);
  await tab(p, 'Sao lưu, hệ thống'); await wait(800);
  await shot(p, 'qt-sao-luu', 'full', [{ sel: '[data-act=backup]', n: 1 }, { sel: '[data-act=backup-full]', n: 2 }, { sel: '[data-act=restore]', n: 3 }, { sel: '[data-act=backup-now]', n: 4 }, { sel: '.card:has([data-act=backup-now]) table', n: 5 }]);
  await go(p, 'doi-chieu'); await shot(p, 'qt-doi-chieu');
  await p.context().close();

  // ===== Bản 1.0: thông tin đơn vị, logo, hướng dẫn sử dụng =====
  { const T = '/tmp/hdsd-them/';
    p = await newPage(DESK); await login(p, 'admin');
    // hướng dẫn dạng video cho Cán bộ kỹ thuật và TVGS
    await p.evaluate(async v => { const bin = Uint8Array.from(atob(v), c => c.charCodeAt(0));
      const g = await Store.put('guides', { title: 'Video: Ghi nhật ký thi công tại hiện trường', category: 'Video hướng dẫn', order: 10, groups: ['g-tech', 'g-site'], content: 'Video 9 giây minh họa các bước ghi nhật ký thi công trên điện thoại: chọn gói thầu, nhập công việc, chụp ảnh hiện trường và lưu.' });
      const fd = new FormData(); fd.append('file', new File([bin], 'Video-ghi-nhat-ky-thi-cong.mp4', { type: 'video/mp4' })); fd.append('collection', 'guides'); fd.append('recordId', g.id); fd.append('kind', 'Video');
      const r = await fetch('/api/attachments', { method: 'POST', headers: { 'X-QLDA': '1' }, body: fd }); if (!r.ok) throw new Error('upload video ' + r.status); await Store.load();
    }, fs.readFileSync(T + 'Video-ghi-nhat-ky-thi-cong.mp4').toString('base64'));
    await go(p, 'quan-tri'); await tab(p, 'Thông tin đơn vị, giao diện');
    await p.setInputFiles('#br_logo', T + 'Logo-don-vi-mau.png'); await wait(1200); await p.evaluate(() => { $('#toast').hidden = true; });
    await shot(p, 'qt-don-vi', 'full', [{ sel: '#brform', n: 1 }, { sel: '[data-act=brand-save]', n: 2 }, { sel: '[data-act=brand-reset]', n: 3 }, { sel: '.brand-prev', n: 4 }, { sel: 'label:has(#br_logo)', n: 5 }]);
    { const q = await newPage(DESK); await q.goto(BASE + '/'); await q.waitForSelector('#login'); await wait(800); await shot(q, 'qt-dang-nhap-don-vi'); await q.context().close(); }
    await go(p, 'huong-dan'); await wait(800);
    await shot(p, 'qt-huong-dan', undefined, [{ sel: '[data-act=add-guide]', n: 1 }, { sel: '.toolbar input[type=search]', n: 2 }, { sel: '.toolbar select', n: 3 }, { sel: '.guide-groups', n: 4 }, { sel: '[data-act=edit-guides]', n: 5 }, { sel: '.guide-doc', n: 6 }]);
    await click(p, '[data-act=add-guide]'); await shot(p, 'qt-them-huong-dan', '#ov .mform'); await closeModal(p);
    await p.evaluate(() => fetch('/api/branding/logo', { method: 'DELETE', headers: { 'X-QLDA': '1' } }));
    await p.context().close();
    p = await newPage(DESK); await login(p, 'kythuat'); await go(p, 'huong-dan'); await wait(1200);
    await p.evaluate(() => { const v = document.querySelector('.guide-video video'); if (v) v.currentTime = 4; }); await wait(800);
    await shot(p, 'chung-huong-dan', 'full', [{ sel: '.side .nav a[href="#huong-dan"]', n: 1 }, { sel: '.toolbar input[type=search]', n: 2 }, { sel: '.guide-doc', n: 3 }, { sel: '.guide-video', n: 4 }]);
    await p.context().close(); }

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
