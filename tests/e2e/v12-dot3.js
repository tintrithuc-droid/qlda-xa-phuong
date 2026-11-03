// Kiểm thử bản 1.2 đợt 3 (góp ý TT Thủy sản): quy trình trình duyệt hồ sơ, xuất báo cáo PDF/CSV.
// Chạy sau smoke.js trên cùng máy chủ: node tests/e2e/v12-dot3.js [http://127.0.0.1:5080]
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const H = { headers: { 'X-QLDA': '1' } };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const who = async u => { const c = await b.newContext({ acceptDownloads: true }); const r = c.request;
    const s = (await r.post(BASE + '/api/auth/login', { ...H, data: { username: u, password: 'Admin2026' } })).status(); if (s !== 200) errs.push('Đăng nhập ' + u + ': ' + s); return { c, r }; };
  const kt = await who('kythuat'), ld = await who('lanhdao');
  const act = (u, id, action, note) => u.r.post(BASE + '/api/approvals', { ...H, data: { collection: 'addenda', id, action, note } });
  const put = (u, o) => u.r.put(BASE + '/api/data/addenda/' + o.id, { ...H, data: o });
  const exp = (what, got, want) => { if (got !== want) errs.push(`${what}: ${got} (cần ${want})`); };

  // 1) Cán bộ kỹ thuật lập phụ lục: không tự đặt "Đã duyệt"; lưu thì ở Soạn thảo
  const pl = { id: 'pl-thu', contractId: 'c1', number: 'PL-THU', date: '2026-11-01', content: 'Thử quy trình', valueChange: 5e9, daysChange: 10 };
  exp('Tự đặt đã duyệt', (await put(kt, { ...pl, status: 'Đã duyệt' })).status(), 403);
  const r1 = await put(kt, pl); exp('Lưu phụ lục', r1.status(), 200); exp('Trạng thái khi lưu', (await r1.json()).status, 'Soạn thảo');
  // 2) Không có quyền duyệt; trình duyệt; đang chờ duyệt thì không sửa được
  exp('Kỹ thuật tự duyệt', (await act(kt, 'pl-thu', 'approve')).status(), 403);
  exp('Trình duyệt', (await act(kt, 'pl-thu', 'submit')).status(), 200);
  exp('Sửa khi chờ duyệt', (await put(kt, { ...pl, valueChange: 9e9, status: 'Chờ duyệt' })).status(), 403);
  // 3) Lãnh đạo Ban: trả lại phải có ý kiến; người lập sửa, trình lại; duyệt
  exp('Trả lại không ý kiến', (await act(ld, 'pl-thu', 'return', '')).status(), 400);
  exp('Trả lại', (await act(ld, 'pl-thu', 'return', 'Bổ sung văn bản đề nghị của nhà thầu')).status(), 200);
  exp('Sửa sau khi bị trả lại', (await put(kt, { ...pl, content: 'Thử quy trình (đã bổ sung)', status: 'Soạn thảo' })).status(), 200);
  exp('Trình lại', (await act(kt, 'pl-thu', 'submit')).status(), 200);
  const ap = await act(ld, 'pl-thu', 'approve', 'Đồng ý'); exp('Duyệt', ap.status(), 200); exp('Trạng thái sau duyệt', (await ap.json()).record.status, 'Đã duyệt');
  // 4) Đã duyệt thì khóa với người lập; người duyệt thu hồi được
  exp('Sửa khi đã duyệt', (await put(kt, { ...pl, status: 'Đã duyệt' })).status(), 403);
  exp('Xóa khi đã duyệt', (await kt.r.delete(BASE + '/api/data/addenda/pl-thu', H)).status(), 403);
  exp('Thu hồi không lý do', (await act(ld, 'pl-thu', 'recall', '')).status(), 400);
  exp('Thu hồi', (await act(ld, 'pl-thu', 'recall', 'Điều chỉnh lại giá trị')).status(), 200);
  const d = await (await kt.r.get(BASE + '/api/data')).json();
  const hs = d.approvals.filter(a => a.recordId === 'pl-thu').map(a => a.action);
  exp('Lịch sử trình duyệt', hs.length, 5);
  if (!d.approvals.some(a => a.recordId === 'pl-thu' && a.action === 'Trả lại' && a.note === 'Bổ sung văn bản đề nghị của nhà thầu')) errs.push('Lịch sử thiếu ý kiến trả lại');

  // 5) Giao diện Lãnh đạo Ban: màn hình Trình duyệt hồ sơ, số hồ sơ chờ duyệt, duyệt bằng nút
  const p = await ld.c.newPage(); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await act(kt, 'pl-thu', 'submit');
  await p.goto(BASE + '/#trinh-duyet'); await p.waitForSelector('#app'); await p.waitForTimeout(600);
  const badge = await p.textContent('#nav a[href="#trinh-duyet"]'); if (!/\d/.test(badge)) errs.push('Menu không hiện số hồ sơ chờ duyệt: ' + badge);
  await p.screenshot({ path: __dirname + '/shots/v12-trinh-duyet.png', fullPage: true });
  await p.click('[data-act=wf][data-id="addenda|pl-thu|approve"]'); await p.waitForTimeout(200);
  await p.fill('#f_note', 'Đồng ý điều chỉnh'); await p.click('#mform [type=submit]'); await p.waitForTimeout(600);
  exp('Duyệt bằng nút trên màn hình', await p.evaluate(() => get('addenda', 'pl-thu').status), 'Đã duyệt');
  await p.click('button[data-g="td2"][data-id="ls"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: __dirname + '/shots/v12-lich-su-duyet.png', fullPage: true });

  // 6) Báo cáo: In / Xuất PDF và Xuất CSV
  await p.evaluate(() => location.hash = 'bao-cao'); await p.waitForTimeout(500);
  const html = await p.evaluate(() => reportPrintHTML(reportNow()));
  if (!html.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM') || !html.includes('THỦ TRƯỞNG ĐƠN VỊ') || !html.includes('<tfoot>')) errs.push('Trang in báo cáo thiếu quốc hiệu, khung ký hoặc dòng tổng');
  fs.writeFileSync(__dirname + '/shots/v12-bao-cao-in.html', html);
  const pp = await b.newPage(); await pp.setContent(html); await pp.pdf({ path: __dirname + '/shots/v12-bao-cao.pdf', format: 'A4', landscape: true, printBackground: true }); await pp.close();
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=export-report-csv]')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  if (csv.charCodeAt(0) !== 0xfeff || !csv.includes('Mã dự án') || !csv.includes('Tổng cộng')) errs.push('Tệp CSV sai: ' + csv.slice(0, 80));
  console.log('CSV:', dl.suggestedFilename(), csv.split('\r\n').length, 'dòng');

  await b.close();
  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'KHÔNG CÓ LỖI'); process.exit(errs.length ? 1 : 0);
})();
