// Ảnh minh họa các chức năng bản 1.5 – 1.7 (chạy ngay sau shots.js, cùng CSDL):
// kế hoạch tiến độ trình duyệt, nhập Excel, Gantt, đợt nghiệm thu, xác nhận của TVGS, chặn thanh toán vượt nghiệm thu,
// Quản trị chính, bước kiểm tra, hộp Giao diện, xem trước PDF, điện thoại.
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
async function login(p, u) {
  await p.goto(BASE + '/'); await p.waitForSelector('#login,#app', { timeout: 20000 });
  if (await p.$('#login')) {
    await p.fill('#lg_user', u); await p.fill('#lg_pw', PW); await p.click('#login button[type=submit]');
    await p.waitForSelector('#app,#mfa', { timeout: 20000 });
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

(async () => {
  b = await chromium.launch({ args: ['--lang=vi-VN'] });
  let p;

  // ===== Cán bộ kỹ thuật: kế hoạch tiến độ, nhập Excel, Gantt, đợt nghiệm thu =====
  p = await newPage(DESK); await login(p, 'kythuat');
  await p.evaluate(async () => {
    const pk = D('packages').find(x => x.code === 'XL01') || D('packages')[0];
    for (const [id, name, a, z, w] of [['s-hd1', 'Thảm bê tông nhựa đoạn Km2+100 – Km3+400', '2026-11-15', '2027-01-31', 12], ['s-hd2', 'Lắp đặt hệ thống chiếu sáng nhánh rẽ', '2026-12-01', '2027-02-28', 6]])
      await Store.put('schedule', { id, projectId: pk.projectId, packageId: pk.id, name, planStart: a, planEnd: z, progress: 0, weight: w, history: [] });
    S.f.tdk = pk.id; render();
  });
  await go(p, 'tien-do'); await wait(400);
  await shot(p, 'kt-tien-do-chua-duyet', undefined, [{ sel: '.head p', n: 1 }, { sel: '.head [data-act=imp]', n: 2 }, { sel: '.head [data-act=add-sched]', n: 3 }]);
  await scrollIn(p, '.card', 'Biểu đồ tiến độ');
  await p.evaluate(() => { const r = [...document.querySelectorAll('.gplan.pend')].pop(); if (r) r.scrollIntoView({ block: 'center' }); }); await wait(300);
  await shot(p, 'kt-gantt-cho-duyet', undefined, [{ sel: '.gplan.pend', n: 1 }, { sel: '[data-act=wf]', text: 'Trình duyệt', n: 2 }]);
  // trình 1 kế hoạch để Lãnh đạo Ban duyệt
  await wfDo(p, 'schedule|s-hd1|submit', 'Kế hoạch thi công lớp thảm đoạn cuối tuyến');
  // nhập kế hoạch tiến độ từ Excel
  await go(p, 'tien-do'); await p.click('.head [data-act=imp]'); await wait(400);
  await p.setInputFiles('#imp_file', T + 'Ke-hoach-tien-do-XL01.xlsx'); await wait(900);
  await shot(p, 'kt-nhap-excel-tien-do', '#ov .mform', [{ sel: '#ov [data-act=imp-tpl]', n: 1 }, { sel: '#ov label[for=imp_file]', n: 2 }, { sel: '#imp_res .pill.bad', n: 3 }, { sel: '#imp_res .pill.warn', n: 4 }, { sel: '#imp_save', n: 5 }]);
  await closeModal(p);
  // Gantt: thang thời gian, hôm nay, thu gọn gói thầu
  await go(p, 'tien-do'); await p.evaluate(() => { S.f.tdk = ''; render(); }); await wait(400); await scrollIn(p, '.card', 'Biểu đồ tiến độ');
  await p.click('[data-act=gt-zoom][data-id=quy]').catch(() => { }); await wait(500);
  await shot(p, 'kt-gantt-cong-cu', undefined, [{ sel: '.gseg', n: 1 }, { sel: '[data-act=gt-today]', n: 2 }, { sel: '[data-act=gt-all]', n: 3 }, { sel: '.grow-row.pk .gtog', n: 4 }, { sel: '.gtoday', n: 5, pad: 6 }]);
  await p.click('[data-act=gt-zoom][data-id=thang]').catch(() => { }); await wait(300);
  // nhập khối lượng nghiệm thu từ Excel
  await go(p, 'khoi-luong'); await p.evaluate(() => { S.f.klc = 'c1'; S.tab.kl = 'nt'; render(); }); await wait(400);
  await p.click('.card [data-act=imp]'); await wait(400);
  await p.setInputFiles('#imp_file', T + 'Khoi-luong-nghiem-thu-XL01.xlsx'); await wait(900);
  await shot(p, 'kt-nhap-excel-khoi-luong', '#ov .mform', [{ sel: '#imp_res .pill.bad', n: 1 }, { sel: '#imp_res .pill.warn', n: 2 }, { sel: '#imp_save', n: 3 }]);
  await closeModal(p);
  // trình đợt nghiệm thu đã lập
  await go(p, 'khoi-luong'); await p.evaluate(() => { S.f.klc = 'c1'; S.tab.kl = 'nt'; render(); }); await wait(400);
  const vbId = await p.evaluate(() => (D('vbatches').filter(x => x.contractId === 'c1').sort(by('date', -1))[0] || {}).id);
  await p.click(`[data-act=wf][data-id="vbatches|${vbId}|submit"]`); await wait(300); await p.fill('#f_note', 'Đề nghị TVGS xác nhận khối lượng đợt 4');
  await shot(p, 'kt-trinh-dot', '#ov .mform'); await p.click('#mform [type=submit]'); await wait(900);
  await shot(p, 'kt-dot-cho-xac-nhan', undefined, [{ sel: '.vb-list .pill', n: 1 }]);
  await p.context().close();

  // ===== Tư vấn giám sát: xác nhận khối lượng đợt nghiệm thu =====
  p = await newPage(DESK); await login(p, 'giamsat'); await go(p, 'trinh-duyet'); await wait(400);
  await shot(p, 'gs-xac-nhan', undefined, [{ sel: '.side .nav a[href="#trinh-duyet"]', n: 1 }, { sel: '.content .tabs button', text: 'Chờ tôi xử lý', n: 2 }, { sel: '[data-act=wf]', text: 'Xác nhận khối lượng', n: 3 }, { sel: '[data-act=wf]', text: 'Trả lại', n: 4 }]);
  await p.click(`[data-act=wf][data-id="vbatches|${vbId}|check"]`); await wait(300); if (await p.$('#f_note')) await p.fill('#f_note', 'Đã đối chiếu hiện trường, khối lượng đúng');
  await shot(p, 'gs-xac-nhan-hop', '#ov .mform'); await p.click('#mform [type=submit]'); await wait(900);
  await p.context().close();

  // ===== Kế toán: cảnh báo vượt nghiệm thu; hồ sơ để Lãnh đạo trả lại =====
  p = await newPage(DESK); await login(p, 'ketoan'); await go(p, 'thanh-toan'); await tab(p, 'Hồ sơ thanh toán');
  await p.click('[data-act=add-pay]'); await wait(300);
  const pick = await p.evaluate(() => { for (const c of D('contracts')) { const live = x => x.contractId === c.id && x.status !== 'Từ chối' && !wfReturned('payments', x);
      const room = contractValue(c) - sum(D('payments').filter(live), payAmt), accRoom = contractAcc(c.id) - sum(D('payments').filter(x => live(x) && payIsVol(x)), 'amount');
      if (accRoom > 0 && room - accRoom > 3e8) return { id: c.id, amt: Math.ceil((accRoom + 2e8) / 1e6) * 1e6 }; } return null; });
  await p.selectOption('#f_contractId', pick.id); await p.fill('#f_number', 'TT-09');
  await p.selectOption('#f_kind', 'Thanh toán khối lượng');
  await p.fill('#f_amount', String(pick.amt)); await p.fill('#f_content', 'Thanh toán khối lượng hoàn thành đợt 5');
  await p.click('#mform [type=submit]'); await wait(700);
  await shot(p, 'ke-vuot-nghiem-thu', '#ov .mform', [{ sel: '#mform_err', n: 1 }, { sel: '#ov .fld', text: 'Trạng thái', n: 2 }]);
  await closeModal(p);
  await p.evaluate(async () => { await Store.put('payments', { id: 'tt-tl', contractId: 'c1', number: 'TT-XL01-08', date: TODAY, kind: 'Thanh toán khối lượng', amount: 150000000, content: 'Thanh toán khối lượng nền đường bổ sung', status: 'Đề nghị' }); });
  await go(p, 'thanh-toan'); await tab(p, 'Hồ sơ thanh toán'); await wfDo(p, 'payments|tt-tl|submit', 'Trình kèm bảng xác định giá trị khối lượng');
  await p.context().close();

  // ===== Lãnh đạo Ban: duyệt kế hoạch tiến độ, đợt nghiệm thu; trả lại hồ sơ thanh toán =====
  p = await newPage(DESK); await login(p, 'lanhdao'); await go(p, 'trinh-duyet'); await wait(400);
  await shot(p, 'ld-cho-duyet-17', undefined, [{ sel: 'td', text: 'Nghiệm thu Đợt', n: 1 }, { sel: 'td', text: 'Kế hoạch Thảm', n: 2 }, { sel: `[data-act=wf][data-id="vbatches|${vbId}|approve"]`, n: 3 }]);
  await wfDo(p, `vbatches|${vbId}|approve`, 'Đồng ý');
  await wfDo(p, 'schedule|s-hd1|approve', 'Đồng ý kế hoạch');
  await wfDo(p, 'payments|tt-tl|return', 'Bổ sung biên bản nghiệm thu đợt 4 đã duyệt trước khi trình');
  await p.context().close();
  p = await newPage(DESK); await login(p, 'ketoan'); await go(p, 'thanh-toan'); await tab(p, 'Hồ sơ thanh toán'); await wait(300);
  await p.evaluate(() => { const r = [...document.querySelectorAll('.content tr')].find(t => t.innerText.includes('TT-XL01-08')); if (r) r.scrollIntoView({ block: 'center' }); }); await wait(300);
  await shot(p, 'ke-bi-tra-lai', undefined, [{ sel: '.content tr', text: 'TT-XL01-08', n: 1 }]);
  await p.context().close();

  // ===== Quản trị: Quản trị chính, bước kiểm tra, quyền kiểm tra, hộp Giao diện, xem PDF, báo cáo JSON =====
  p = await newPage(DESK); await login(p, 'admin');
  await go(p, 'quan-tri'); await wait(400);
  await shot(p, 'qt-quan-tri-chinh', 'full', [{ sel: '.pill', text: 'Quản trị chính', n: 1 }, { sel: '[data-act=owner-to]', n: 2 }]);
  await go(p, 'trinh-duyet'); await wait(400);
  await shot(p, 'qt-buoc-kiem-tra', '.content .card:has([data-act=wf-check])', [{ sel: '[data-act=wf-check][data-id=vbatches]', n: 1, pad: 6 }]);
  await go(p, 'quan-tri'); await tab(p, 'Nhóm và phân quyền'); { const eg = await p.$$('[data-act=edit-groups]'); await eg[eg.length > 4 ? 4 : 1].click(); await wait(400); }
  await shot(p, 'qt-quyen-kiem-tra', '#ov .mform', [{ sel: '#ov table.perm th', text: 'Kiểm tra', n: 1 }]); await closeModal(p);
  await p.click('[data-act=appearance]').catch(async () => { await p.click('[data-act=account]'); await wait(300); await p.click('#ov [data-act=appearance]'); }); await wait(500);
  await shot(p, 'chung-hop-giao-dien', '#ov .mform'); await closeModal(p);
  await go(p, 'du-an'); await p.click('.content tr.click').catch(() => { }); await wait(500); await tab(p, 'Hồ sơ pháp lý').catch(() => { });
  await p.click('[data-act=att-pdf]').catch(() => { }); await wait(2500);
  await shot(p, 'chung-xem-pdf');
  await closeModal(p);
  await go(p, 'bao-cao'); await wait(400);
  await shot(p, 'chung-bao-cao-17', undefined, [{ sel: '[data-act=export-report]', n: 1 }, { sel: '[data-act=export-report-pdf]', n: 2 }, { sel: '[data-act=export-report-csv]', n: 3 }, { sel: '[data-act=export-report-json]', n: 4 }]);
  await p.context().close();

  // ===== Điện thoại: Gantt thu gọn, dòng tổng có tên cột =====
  p = await newPage(MOB); await login(p, 'kythuat'); await go(p, 'tien-do'); await scrollIn(p, '.card', 'Biểu đồ tiến độ');
  await shot(p, 'dt-gantt');
  await go(p, 'khoi-luong'); await p.evaluate(() => { S.f.klc = 'c1'; S.tab.kl = 'hd'; render(); }); await wait(400);
  await p.evaluate(() => { const f = document.querySelector('.content tfoot, .content .tfoot, .content tr.foot'); if (f) f.scrollIntoView({ block: 'center' }); }); await wait(300);
  await shot(p, 'dt-tong-cong');
  await p.context().close();
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
