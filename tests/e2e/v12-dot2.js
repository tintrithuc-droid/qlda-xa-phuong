// Kiểm thử bản 1.2 đợt 2 (góp ý TT Thủy sản): ô ngày dd/mm/yyyy trên máy cài tiếng Anh, bảng nhập công việc nhật ký,
// phân trang, nút giao diện sáng/tối. Chạy sau smoke.js trên cùng máy chủ: node tests/e2e/v12-dot2.js [http://127.0.0.1:5080]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
(async () => {
  const b = await chromium.launch();
  // Giả lập máy cài trình duyệt tiếng Anh (Mỹ): đây là trường hợp ô ngày gốc hiện mm/dd/yyyy
  const ctx = await b.newContext({ locale: 'en-US', viewport: { width: 1400, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#login'); await p.fill('#lg_user', 'ubnd'); await p.fill('#lg_pw', 'Admin2026');
  await p.click('#login button[type=submit]'); await p.waitForSelector('#app', { timeout: 15000 });

  // 1) Đọc ngày kiểu Việt Nam
  const y = new Date().getFullYear();
  const cases = [['03/11/2026', '2026-11-03'], ['3/11', `${y}-11-03`], ['3-11-26', '2026-11-03'], ['03112026', '2026-11-03'], ['31/02/2026', null], ['13/13/2026', null], ['', '']];
  const got = await p.evaluate(cs => cs.map(([t]) => parseVNDate(t)), cases);
  cases.forEach(([t, want], i) => { if (got[i] !== want) errs.push(`parseVNDate("${t}") = ${got[i]}, cần ${want}`); });

  // 2) Bộ lọc ngày ở Báo cáo: hiện dd/mm/yyyy, gõ ngày thì lọc theo ngày
  await p.evaluate(() => location.hash = 'bao-cao'); await p.waitForTimeout(500);
  const ph = await p.getAttribute('.toolbar .dx-t', 'placeholder');
  if (ph !== 'dd/mm/yyyy') errs.push('Ô ngày không hiện dd/mm/yyyy: ' + ph);
  await p.fill('.toolbar .dx-t >> nth=0', '20/10/2026'); await p.keyboard.press('Tab'); await p.waitForTimeout(400);
  const nkf = await p.evaluate(() => S.f.bcf); if (nkf !== '2026-10-20') errs.push('Lọc từ ngày sai: ' + nkf);
  const shown = await p.inputValue('.toolbar .dx-t >> nth=0'); if (shown !== '20/10/2026') errs.push('Ô ngày hiển thị lại sai: ' + shown);
  await p.screenshot({ path: __dirname + '/shots/v12-bao-cao-loc-ngay.png' });

  // 3) Phân trang: bảng hơn 20 dòng có thanh phân trang, bấm trang sau ra dòng 21–
  await p.evaluate(() => { location.hash = 'thanh-toan'; S.tab.tt = 'kh'; }); await p.waitForTimeout(500); await p.evaluate(() => render()); await p.waitForTimeout(300);
  const pg1 = await p.textContent('.pager'); if (!/1–20 \/ 2\d dòng/.test(pg1)) errs.push('Không có phân trang kế hoạch thanh toán: ' + pg1);
  await p.click('.pager [data-p="2"] >> nth=0'); await p.waitForTimeout(300);
  const pg2 = await p.textContent('.pager'); if (!/^21–/.test(pg2.trim())) errs.push('Bấm trang sau không chuyển trang: ' + pg2);
  await p.screenshot({ path: __dirname + '/shots/v12-phan-trang.png', fullPage: true });

  // 4) Nút giao diện: Tự động → Sáng → Tối, nhớ sau khi tải lại
  await p.click('[data-act=theme]'); await p.click('[data-act=theme]'); await p.waitForTimeout(200);
  const th = await p.evaluate(() => document.documentElement.getAttribute('data-theme')); if (th !== 'dark') errs.push('Không chuyển được giao diện tối: ' + th);
  await p.reload(); await p.waitForSelector('#app');
  const th2 = await p.evaluate(() => document.documentElement.getAttribute('data-theme')); if (th2 !== 'dark') errs.push('Không nhớ giao diện tối sau khi tải lại');
  await p.screenshot({ path: __dirname + '/shots/v12-giao-dien-toi.png' });
  await p.click('[data-act=theme]'); await p.waitForTimeout(200);
  if (await p.evaluate(() => document.documentElement.hasAttribute('data-theme'))) errs.push('Không quay lại chế độ tự động');

  // 5) Bảng nhập công việc trên điện thoại: đọc, thêm dòng, kiểm tra khối lượng phải là số
  const m = await (await b.newContext({ ...require('playwright').devices['iPhone 13'], locale: 'en-US' })).newPage(); m.on('pageerror', e => errs.push('PAGEERR(dt) ' + e.message));
  await m.goto(BASE + '/'); await m.waitForSelector('#login'); await m.fill('#lg_user', 'ubnd'); await m.fill('#lg_pw', 'Admin2026'); await m.click('#login button[type=submit]'); await m.waitForSelector('#app');
  const wk = await m.evaluate(async () => {
    openForm({ title: 'Thử', fields: [{ key: 'date', label: 'Ngày', type: 'date', def: '2026-11-03' }, { key: 'works', label: 'Công việc thực hiện', type: 'works', req: true }], value: { works: 'Đổ bê tông | 12 | m3\nLắp cống D600 | 24 | m' }, onSave: v => { window._saved = v; return false; } });
    await new Promise(r => setTimeout(r, 50));
    return { rows: document.querySelectorAll('#f_works .wk-row').length, d: document.querySelector('#f_date_t').value };
  });
  if (wk.rows !== 2) errs.push('Bảng công việc không đọc được nhật ký cũ: ' + wk.rows);
  if (wk.d !== '03/11/2026') errs.push('Ô ngày trong biểu mẫu hiện sai: ' + wk.d);
  await m.click('.wk-add'); await m.fill('#f_works .wk-row >> nth=2 >> .wk-n', 'Đào hố ga | rãnh'); await m.fill('#f_works .wk-row >> nth=2 >> .wk-q', 'abc');
  await m.screenshot({ path: __dirname + '/shots/v12-nhat-ky-dien-thoai.png', fullPage: true });
  await m.click('#mform [type=submit]'); await m.waitForTimeout(200);
  if (!/phải là số/.test(await m.textContent('#mform_err'))) errs.push('Không báo lỗi khối lượng không phải số');
  await m.fill('#f_works .wk-row >> nth=2 >> .wk-q', '1,5'); await m.fill('#f_works .wk-row >> nth=2 >> .wk-u', 'cái');
  await m.click('#mform [type=submit]'); await m.waitForTimeout(200);
  const sv = await m.evaluate(() => window._saved && window._saved.works);
  if (sv !== 'Đổ bê tông | 12 | m3\nLắp cống D600 | 24 | m\nĐào hố ga / rãnh | 1.5 | cái') errs.push('Lưu bảng công việc sai: ' + JSON.stringify(sv));

  await b.close();
  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'KHÔNG CÓ LỖI'); process.exit(errs.length ? 1 : 0);
})();
