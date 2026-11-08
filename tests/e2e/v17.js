// Kiểm thử bản 1.7 (bảng đề xuất V1.8, 06/11/2026): đợt nghiệm thu có trình duyệt và bước xác nhận của TVGS (mục 2, 27, 28, 30),
// nghiệm thu theo lũy kế (29), thanh toán không vượt giá trị nghiệm thu (31), trạng thái chỉ đổi qua trình duyệt (17),
// Quản trị chính (19), Excel có định dạng và tệp mẫu (20, 25), xuất JSON, xem trước PDF (26), Gantt (21–24).
// Chạy sau smoke.js và v15.js trên cùng máy chủ: node tests/e2e/v17.js [http://127.0.0.1:5080]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const H = { headers: { 'X-QLDA': '1' } };
const M = 1e6;
function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(x => parseInt(x, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
(async () => {
  const b = await chromium.launch(); const errs = [];
  const exp = (what, got, want) => { if (got !== want) errs.push(`${what}: ${JSON.stringify(got)} (cần ${JSON.stringify(want)})`); };
  const who = async (u, opt = {}) => { const c = await b.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 900 }, ...opt }); const r = c.request;
    const s = (await r.post(BASE + '/api/auth/login', { ...H, data: { username: u, password: 'Admin2026' } })).status(); if (s !== 200) errs.push('Đăng nhập ' + u + ': ' + s); return { c, r }; };
  const ad = await who('admin');
  const sec = fs.readFileSync(SHOTS + '/admin-totp.txt', 'utf8').trim();
  // mã vừa dùng ở v15.js không dùng lại được trong cùng 30 giây: lỗi thì chờ mã kế tiếp
  for (let i = 0; i < 3; i++) { if ((await ad.r.post(BASE + '/api/auth/mfa', { ...H, data: { code: totp(sec) } })).status() === 200) break; if (i === 2) errs.push('Mã 2 lớp quản trị'); await new Promise(r => setTimeout(r, 31000 - Date.now() % 30000)); }
  // smoke.js đã đổi mật khẩu tài khoản giám sát: đặt lại như các tài khoản mẫu khác
  const ug = (await (await ad.r.get(BASE + '/api/data')).json()).users.find(u => u.username === 'giamsat');
  exp('Đặt lại mật khẩu giám sát', (await ad.r.post(BASE + '/api/users/' + ug.id + '/reset-password', { ...H, data: { password: 'Admin2026' } })).status(), 200);
  const kt = await who('kythuat'), ld = await who('lanhdao'), ke = await who('ketoan'), gs = await who('giamsat');
  const put = (u, col, o) => u.r.put(BASE + `/api/data/${col}/${o.id}`, { ...H, data: o });
  const act = (u, col, id, action, note) => u.r.post(BASE + '/api/approvals', { ...H, data: { collection: col, id, action, note } });
  const data = async u => (await u.r.get(BASE + '/api/data')).json();
  const page = async (u, route) => { const p = await u.c.newPage(); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    await p.goto(BASE + '/#' + route); await p.waitForSelector('#app', { timeout: 15000 }); await p.waitForTimeout(700); return p; };

  // Hợp đồng thử trong dự án p1 (phạm vi của tài khoản giám sát): 1 công việc 100 m3 × 1 triệu = 100 triệu
  exp('Tạo gói', (await put(kt, 'packages', { id: 'k17', projectId: 'p1', code: 'XL-V17', name: 'Gói thử 1.7', estimate: 100 * M })).status(), 200);
  exp('Tạo hợp đồng', (await put(kt, 'contracts', { id: 'c17', packageId: 'k17', projectId: 'p1', number: 'HD-V17', contractor: 'Nhà thầu thử', value: 100 * M, start: '2026-01-01', end: '2027-06-30', signDate: '2026-01-01' })).status(), 200);
  exp('Bảng khối lượng', (await put(kt, 'boq', { id: 'boq-v17', contractId: 'c17', code: 'AB.17', name: 'Đào đất', unit: 'm3', qty: 100, price: M })).status(), 200);

  /* ---- Mục 27, 28, 30, 2: đợt nghiệm thu đi qua Dự thảo → Chờ TVGS xác nhận → Chờ duyệt → Đã duyệt ---- */
  exp('Lập đợt 1', (await put(kt, 'vbatches', { id: 'vb17a', contractId: 'c17', name: 'Đợt 1', date: '2026-10-30' })).status(), 200);
  exp('Trình đợt chưa có khối lượng', (await act(kt, 'vbatches', 'vb17a', 'submit')).status(), 409);
  exp('Ghi khối lượng đợt 1', (await put(kt, 'volumes', { id: 'v17a', contractId: 'c17', boqId: 'boq-v17', batchId: 'vb17a', date: '2026-10-30', period: 'Đợt 1', doneQty: 60, acceptedQty: 50 })).status(), 200);
  exp('Đặt thẳng trạng thái Đã duyệt khi lập (mục 17)', (await put(ld, 'vbatches', { id: 'vb17x', contractId: 'c17', name: 'Đợt X', status: 'Đã duyệt' })).status() >= 400, true);
  exp('Trình đợt 1', (await act(kt, 'vbatches', 'vb17a', 'submit')).status(), 200);
  let d = await data(kt);
  exp('Đợt 1 chờ TVGS xác nhận', d.vbatches.find(x => x.id === 'vb17a').status, 'Chờ kiểm tra');
  exp('Sửa khối lượng khi đợt đang trình (khóa)', (await put(kt, 'volumes', { ...d.volumes.find(v => v.id === 'v17a'), doneQty: 70 })).status() >= 400, true);
  exp('Lãnh đạo đổi trạng thái bằng lệnh sửa (mục 17)', (await put(ld, 'vbatches', { ...d.vbatches.find(x => x.id === 'vb17a'), status: 'Đã duyệt' })).status() >= 400, true);
  exp('Kế toán không xác nhận thay TVGS', (await act(ke, 'vbatches', 'vb17a', 'check')).status() >= 400, true);
  exp('TVGS xác nhận khối lượng', (await act(gs, 'vbatches', 'vb17a', 'check', 'Đúng hiện trường')).status(), 200);
  d = await data(kt); exp('Đợt 1 chờ duyệt', d.vbatches.find(x => x.id === 'vb17a').status, 'Chờ duyệt');

  /* ---- Mục 31: chưa duyệt đợt thì chưa trình được thanh toán khối lượng ---- */
  exp('Lập hồ sơ thanh toán khối lượng 45 triệu', (await put(ke, 'payments', { id: 'tt17a', contractId: 'c17', number: 'TT-17A', date: '2026-11-02', kind: 'Thanh toán khối lượng hoàn thành', amount: 45 * M, content: 'Đợt 1' })).status(), 200);
  let r = await act(ke, 'payments', 'tt17a', 'submit');
  exp('Trình khi đợt nghiệm thu chưa duyệt', r.status(), 409);
  if (!/nghiệm thu/.test((await r.json()).message || '')) errs.push('Thông báo chặn thanh toán vượt nghiệm thu chưa rõ');
  exp('Lãnh đạo duyệt đợt 1', (await act(ld, 'vbatches', 'vb17a', 'approve', 'Đồng ý')).status(), 200);
  exp('Trình 45 triệu (nghiệm thu 50 triệu)', (await act(ke, 'payments', 'tt17a', 'submit')).status(), 200);
  exp('Lập hồ sơ thứ hai 10 triệu', (await put(ke, 'payments', { id: 'tt17b', contractId: 'c17', number: 'TT-17B', date: '2026-11-03', kind: 'Thanh toán khối lượng hoàn thành', amount: 10 * M, content: 'Đợt 1 bổ sung' })).status(), 200);
  r = await act(ke, 'payments', 'tt17b', 'submit');
  exp('Trình lũy kế 55 triệu > 50 triệu', r.status(), 409);
  const msg = (await r.json()).message || '';
  if (!/5\.000\.000/.test(msg)) errs.push('Thông báo chưa nêu số còn được thanh toán (5 triệu): ' + msg);
  exp('Tạm ứng không bị giới hạn theo nghiệm thu', (await put(ke, 'payments', { id: 'tt17c', contractId: 'c17', number: 'TT-17C', date: '2026-11-03', kind: 'Tạm ứng', amount: 10 * M })).status(), 200);
  exp('Trình tạm ứng', (await act(ke, 'payments', 'tt17c', 'submit')).status(), 200);
  exp('Sửa trạng thái thanh toán bằng lệnh sửa (mục 17)', (await put(ld, 'payments', { ...(await data(ld)).payments.find(x => x.id === 'tt17a'), status: 'Đang trình KBNN' })).status() >= 400, true);

  /* ---- Mục 29: đợt 2 nghiệm thu bù phần thực hiện ở đợt 1, kiểm tra theo lũy kế ---- */
  exp('Lập đợt 2', (await put(kt, 'vbatches', { id: 'vb17b', contractId: 'c17', name: 'Đợt 2', date: '2026-11-05' })).status(), 200);
  let p = await page(kt, 'khoi-luong');
  await p.evaluate(() => { S.f.klc = 'c17'; S.tab.kl = 'nt'; render(); }); await p.waitForTimeout(400);
  // Hồ sơ thu hồi tạm ứng làm giảm giá trị đã thanh toán, không cộng thêm
  exp('Thu hồi tạm ứng trừ vào đã thanh toán', await p.evaluate(() => [payAmt({ kind: 'Thu hồi tạm ứng', amount: 5 }), payAmt({ kind: 'Tạm ứng', amount: 5 })].join()), '-5,5');
  const vb = await p.evaluate(() => ({ list: document.querySelectorAll('.vb-list .vb').length, txt: document.querySelector('.vb-list')?.innerText || '' }));
  exp('Danh sách đợt của hợp đồng', vb.list, 2);
  if (!/Đã nghiệm thu/.test(vb.txt) || !/Dự thảo/.test(vb.txt)) errs.push('Nhãn trạng thái đợt chưa đúng: ' + vb.txt.slice(0, 200));
  await p.evaluate(() => vbForm('c17', get('vbatches', 'vb17b'))); await p.waitForTimeout(300);
  // Đợt 2: thực hiện 0, nghiệm thu 10 (phần còn lại của đợt 1) → lũy kế 60/60: hợp lệ
  await p.fill('.vb-grid tbody tr:first-child [data-k=d]', '0'); await p.fill('.vb-grid tbody tr:first-child [data-k=a]', '15');
  await p.waitForTimeout(100);
  exp('Dòng vượt lũy kế được tô đỏ', await p.evaluate(() => document.querySelector('.vb-grid tbody tr').classList.contains('bad')), true);
  await p.click('#mform [type=submit]'); await p.waitForTimeout(400);
  if (!/vượt|lũy kế/i.test(await p.textContent('#mform_err'))) errs.push('Không chặn nghiệm thu vượt lũy kế thực hiện');
  await p.fill('.vb-grid tbody tr:first-child [data-k=a]', '10'); await p.click('#mform [type=submit]'); await p.waitForTimeout(800);
  exp('Lưu đợt 2 nghiệm thu bù', await p.evaluate(() => Store.data.volumes.filter(v => v.batchId === 'vb17b').map(v => v.acceptedQty).join()), '10');
  await p.screenshot({ path: SHOTS + '/v17-dot-nghiem-thu.png', fullPage: true });

  /* ---- Mục 25: tệp mẫu nhập có định dạng; nhập khối lượng gom vào đợt dự thảo ---- */
  await p.evaluate(() => ACT.imp('vol|c17')); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-act=imp-tpl]')]);
  const tpl = path.join(SHOTS, 'v17-mau-nhap.xlsx'); await dl.saveAs(tpl);
  const tinfo = await p.evaluate(async b64 => { await loadExcel(); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer);
    const ws = wb.getWorksheet('Du lieu'); const h = ws.getCell(1, 1);
    return { sheets: wb.worksheets.map(w => w.name).join(), head: h.value, fill: h.fill && h.fill.fgColor && h.fill.fgColor.argb, numFmt: ws.getCell(2, 3).numFmt, guide: !!wb.getWorksheet('Huong dan') }; }, fs.readFileSync(tpl).toString('base64'));
  exp('Tệp mẫu có trang hướng dẫn', tinfo.guide, true); exp('Tiêu đề cột bắt buộc', tinfo.head, 'Mã hiệu *');
  if (!tinfo.fill || !/#,##0/.test(tinfo.numFmt || '')) errs.push('Tệp mẫu chưa định dạng: ' + JSON.stringify(tinfo));
  await p.evaluate(() => closeModal());
  // Nhập 1 dòng vào "Đợt 3" (chưa có): phần mềm tự tạo đợt dự thảo
  await p.evaluate(() => ACT.imp('vol|c17')); await p.waitForTimeout(300);
  await p.evaluate(async () => { await loadExcel(); }); // cần SheetJS để đọc, ExcelJS để tạo tệp thử
  const xb = await p.evaluate(async () => { const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('a'); ws.addRow(['Mã hiệu', 'Khối lượng thực hiện trong kỳ', 'Khối lượng nghiệm thu', 'Đợt']);
    ws.addRow(['AB.17', 20, 25, 'Đợt 3']); ws.addRow(['AB.17', 5, 0, 'Đợt 3']); const buf = await wb.xlsx.writeBuffer(); return btoa(String.fromCharCode(...new Uint8Array(buf))); });
  const xf = path.join(SHOTS, 'v17-nhap.xlsx'); fs.writeFileSync(xf, Buffer.from(xb, 'base64'));
  await p.setInputFiles('#imp_file', xf); await p.waitForTimeout(600);
  const res = await p.textContent('#imp_res');
  if (!/vượt lũy kế thực hiện|Trùng mã hiệu/.test(res)) errs.push('Bảng kiểm tra nhập chưa báo lỗi lũy kế / trùng mã: ' + res.slice(0, 300));
  await p.screenshot({ path: SHOTS + '/v17-nhap-kiem-tra.png' });
  await p.evaluate(() => closeModal());
  const xb2 = await p.evaluate(async () => { const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('a'); ws.addRow(['Mã hiệu', 'Khối lượng thực hiện trong kỳ', 'Khối lượng nghiệm thu', 'Đợt']);
    ws.addRow(['AB.17', 20, 15, 'Đợt 3']); const buf = await wb.xlsx.writeBuffer(); return btoa(String.fromCharCode(...new Uint8Array(buf))); });
  fs.writeFileSync(xf, Buffer.from(xb2, 'base64'));
  await p.evaluate(() => ACT.imp('vol|c17')); await p.waitForTimeout(300); await p.setInputFiles('#imp_file', xf); await p.waitForTimeout(600);
  await p.click('#imp_save'); await p.waitForTimeout(1200);
  const b3 = await p.evaluate(() => { const b = Store.data.vbatches.find(x => x.contractId === 'c17' && x.name === 'Đợt 3'); return b ? { st: b.status || 'Soạn thảo', n: Store.data.volumes.filter(v => v.batchId === b.id).length } : null; });
  exp('Nhập Excel tạo đợt dự thảo', JSON.stringify(b3), JSON.stringify({ st: 'Soạn thảo', n: 1 }));

  /* ---- Mục 20 và xuất JSON: báo cáo Excel có định dạng ---- */
  await p.evaluate(() => location.hash = 'bao-cao'); await p.waitForTimeout(600);
  const [x1] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-act=export-report]')]);
  const xr = path.join(SHOTS, 'v17-bao-cao.xlsx'); await x1.saveAs(xr);
  const rinfo = await p.evaluate(async b64 => { const wb = new ExcelJS.Workbook(); await wb.xlsx.load(Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer); const ws = wb.worksheets[0];
    return { title: ws.getCell(2, 1).value, merged: ws.getCell(2, 1).isMerged, headFill: ws.getCell(5, 1).fill?.fgColor?.argb, frozen: ws.views[0]?.state }; }, fs.readFileSync(xr).toString('base64'));
  if (!rinfo.title || !rinfo.merged || !rinfo.headFill || rinfo.frozen !== 'frozen') errs.push('Báo cáo Excel chưa định dạng: ' + JSON.stringify(rinfo));
  const [j1] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-act=export-report-json]')]);
  const jr = path.join(SHOTS, 'v17-bao-cao.json'); await j1.saveAs(jr);
  try { const j = JSON.parse(fs.readFileSync(jr, 'utf8')); if (!Array.isArray(j.duLieu) || !j.tieuDe) errs.push('Tệp JSON thiếu dữ liệu'); } catch { errs.push('Tệp JSON không đọc được'); }

  /* ---- Mục 26: xem trước PDF ngay trên phần mềm ---- */
  const pdfAtt = await p.evaluate(() => Store.data.attachments.find(a => isPdf(a)));
  if (pdfAtt) {
    await p.evaluate(a => ACT['att-pdf']('/api/files/' + a.fileId + '|' + a.fileName), pdfAtt); await p.waitForTimeout(1500);
    exp('Khung xem PDF', await p.evaluate(() => !!document.querySelector('.pdfv .pdfpages')), true);
    await p.screenshot({ path: SHOTS + '/v17-xem-pdf.png' }); await p.evaluate(() => closeModal());
  } else errs.push('Không có tệp PDF đính kèm để thử xem trước');

  /* ---- Mục 21–24: Gantt ---- */
  await p.evaluate(() => location.hash = 'tien-do'); await p.waitForTimeout(800);
  const g1 = await p.evaluate(() => ({ tools: document.querySelectorAll('[data-act=gt-zoom]').length, sl: document.getElementById('gwrap').scrollLeft, pk: document.querySelectorAll('.grow-row.pk').length }));
  exp('Nút thu phóng Tuần/Tháng/Quý', g1.tools, 3);
  if (!g1.pk) errs.push('Gantt không có gói thầu');
  await p.click('[data-act=gt-zoom][data-id=tuan]'); await p.waitForTimeout(500);
  const g2 = await p.evaluate(() => { const w = document.getElementById('gwrap'); return { on: document.querySelector('[data-act=gt-zoom].on').dataset.id, wide: w.scrollWidth > w.clientWidth, sl: w.scrollLeft, sticky: getComputedStyle(document.querySelector('.grow-row .gl')).position }; });
  exp('Đang xem theo tuần', g2.on, 'tuan'); exp('Gantt theo tuần cuộn ngang', g2.wide, true); exp('Cột hạng mục đứng yên', g2.sticky, 'sticky');
  if (!(g2.sl > 0)) errs.push('Gantt chưa tự cuộn tới hôm nay');
  const kid = await p.evaluate(() => document.querySelector('.grow-row.pk').dataset.k);
  await p.click('.grow-row.pk .gtog'); await p.waitForTimeout(200);
  exp('Thu gọn gói thầu', await p.evaluate(k => [...document.querySelectorAll(`.grow-row[data-in="${k}"]`)].every(r => r.hidden), kid), true);
  await p.reload(); await p.waitForSelector('#gwrap'); await p.waitForTimeout(500);
  exp('Nhớ gói đã thu gọn', await p.evaluate(k => document.querySelector(`.grow-row.pk[data-k="${k}"]`).classList.contains('shut'), kid), true);
  exp('Nhớ thang thời gian', await p.evaluate(() => document.querySelector('[data-act=gt-zoom].on').dataset.id), 'tuan');
  await p.click('[data-act=gt-all][data-id="1"]'); await p.waitForTimeout(200);
  if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) errs.push('Trang tiến độ tràn ngang');
  await p.screenshot({ path: SHOTS + '/v17-gantt-tuan.png' });
  await p.click('[data-act=gt-zoom][data-id=thang]'); await p.waitForTimeout(400);
  await p.screenshot({ path: SHOTS + '/v17-gantt-thang.png' });
  await p.close();
  const km = await who('kythuat', { ...devices['iPhone 13'] });
  p = await page(km, 'tien-do');
  if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) errs.push('Tiến độ trên điện thoại tràn ngang');
  await p.evaluate(() => document.getElementById('gwrap').scrollIntoView()); await p.waitForTimeout(200);
  await p.screenshot({ path: SHOTS + '/v17-gantt-dien-thoai.png' }); await p.close();

  /* ---- Mục 19: Quản trị chính ---- */
  d = await data(ad);
  const owner = d.users.find(u => u.id === d.ownerId);
  exp('Quản trị chính là tài khoản admin', owner && owner.username, 'admin');
  p = await page(ad, 'quan-tri'); await p.waitForTimeout(300);
  await p.evaluate(() => { S.tab.qt = 'users'; render(); }); await p.waitForTimeout(400);
  if (!/Quản trị chính/.test(await p.textContent('#content'))) errs.push('Danh sách người dùng chưa hiện Quản trị chính');
  await p.screenshot({ path: SHOTS + '/v17-nguoi-dung.png', fullPage: true }); await p.close();
  // Bước kiểm tra cho hồ sơ thanh toán: quản trị bật, kế toán trình → chờ kiểm tra; tắt → chuyển sang chờ duyệt
  exp('Bật bước kiểm tra cho thanh toán', (await ad.r.post(BASE + '/api/data/wf-check', { ...H, data: { collection: 'payments', enabled: true } })).status(), 200);
  exp('Người không phải quản trị bật bước kiểm tra', (await kt.r.post(BASE + '/api/data/wf-check', { ...H, data: { collection: 'payments', enabled: false } })).status(), 403);
  await put(ke, 'payments', { id: 'tt17d', contractId: 'c17', number: 'TT-17D', date: '2026-11-04', kind: 'Tạm ứng', amount: 1 * M });
  await act(ke, 'payments', 'tt17d', 'submit');
  exp('Thanh toán vào bước kiểm tra', (await data(ke)).payments.find(x => x.id === 'tt17d').status, 'Chờ kiểm tra');
  await ad.r.post(BASE + '/api/data/wf-check', { ...H, data: { collection: 'payments', enabled: false } });
  exp('Tắt bước kiểm tra: hồ sơ sang chờ duyệt', (await data(ke)).payments.find(x => x.id === 'tt17d').status, 'Chờ duyệt');

  await b.close();
  if (errs.length) { console.log('LỖI:\n' + errs.join('\n')); process.exit(1); } else console.log('KHÔNG CÓ LỖI');
})().catch(e => { console.error(e); process.exit(1); });
