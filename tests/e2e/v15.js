// Kiểm thử bản 1.5 (đề xuất của bộ phận Triển khai 05/11/2026):
// mục 14 nhãn cột thẻ Tổng cộng trên điện thoại, mục 16 hồ sơ thanh toán bị trả lại, mục 15 trình duyệt kế hoạch tiến độ,
// mục 11, 13 nhập khối lượng hợp đồng, nghiệm thu, kế hoạch tiến độ từ Excel.
// Chạy sau smoke.js trên cùng máy chủ: node tests/e2e/v15.js [http://127.0.0.1:5080]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const H = { headers: { 'X-QLDA': '1' } };
const T = 1e9;
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
  const who = async (u, opt = {}) => { const c = await b.newContext({ acceptDownloads: true, ...opt }); const r = c.request;
    const s = (await r.post(BASE + '/api/auth/login', { ...H, data: { username: u, password: 'Admin2026' } })).status(); if (s !== 200) errs.push('Đăng nhập ' + u + ': ' + s); return { c, r }; };
  // Quản trị đã bật xác thực 2 lớp ở smoke.js (mã bí mật lưu ở shots/admin-totp.txt)
  const ad = await who('admin');
  const sec = fs.existsSync(SHOTS + '/admin-totp.txt') ? fs.readFileSync(SHOTS + '/admin-totp.txt', 'utf8').trim() : '';
  if (sec) { const m = await ad.r.post(BASE + '/api/auth/mfa', { ...H, data: { code: totp(sec) } }); if (m.status() !== 200) errs.push('Mã 2 lớp quản trị: ' + m.status()); }
  // smoke.js cố ý khóa tài khoản kế toán (nhập sai 6 lần): quản trị đặt lại mật khẩu để mở khóa
  const uk = (await (await ad.r.get(BASE + '/api/data')).json()).users.find(u => u.username === 'ketoan');
  exp('Mở khóa kế toán', (await ad.r.post(BASE + '/api/users/' + uk.id + '/reset-password', { ...H, data: { password: 'Admin2026' } })).status(), 200);
  const kt = await who('kythuat'), ld = await who('lanhdao'), ke = await who('ketoan');
  const put = (u, col, o) => u.r.put(BASE + `/api/data/${col}/${o.id}`, { ...H, data: o });
  const act = (u, col, id, action, note) => u.r.post(BASE + '/api/approvals', { ...H, data: { collection: col, id, action, note } });
  const page = async (u, route) => { const p = await u.c.newPage(); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    await p.goto(BASE + '/#' + route); await p.waitForSelector('#app', { timeout: 15000 }); await p.waitForTimeout(700); return p; };

  // Dữ liệu riêng cho kiểm thử: một dự án, một gói, một hợp đồng 100 tỷ chưa có bảng khối lượng
  exp('Tạo dự án', (await put(kt, 'projects', { id: 'p15', code: 'DA-V15', name: 'Thử bản 1.5', status: 'Đang thực hiện' })).status(), 200);
  exp('Tạo gói', (await put(kt, 'packages', { id: 'k15', projectId: 'p15', code: 'XL-V15', name: 'Gói thử 1.5', estimate: 100 * T })).status(), 200);
  exp('Tạo hợp đồng', (await put(kt, 'contracts', { id: 'c15', packageId: 'k15', projectId: 'p15', number: 'HD-V15', contractor: 'Nhà thầu thử', value: 100 * T, start: '2026-01-01', end: '2027-06-30', signDate: '2026-01-01' })).status(), 200);

  /* ---- Mục 16: hồ sơ thanh toán bị trả lại ---- */
  const pay = { id: 'tt15a', contractId: 'c15', number: 'TT-15A', date: '2026-11-01', kind: 'Tạm ứng', amount: 80 * T, content: 'Đợt 1' }; // bản 1.7: thanh toán khối lượng còn bị giới hạn theo giá trị nghiệm thu (kiểm thử ở v17.js)
  exp('Kế toán lập hồ sơ', (await put(ke, 'payments', pay)).status(), 200);
  exp('Trình hồ sơ', (await act(ke, 'payments', 'tt15a', 'submit')).status(), 200);
  exp('Lãnh đạo trả lại', (await act(ld, 'payments', 'tt15a', 'return', 'Thiếu biên bản nghiệm thu')).status(), 200);
  let p = await page(ke, 'thanh-toan');
  const r16 = await p.evaluate(async () => { const a = get('payments', 'tt15a');
    return { ret: !!wfReturned('payments', a), inproc: payInProc(a), pill: wfPill('payments', a).includes('Bị trả lại'),
      okNew: await (async () => { document.body.insertAdjacentHTML('beforeend', '<span id="mform_err"></span>'); const r = await payCheck({ contractId: 'c15', amount: 80e9, kind: 'Tạm ứng' }); document.getElementById('mform_err').remove(); return r; })() }; });
  exp('Nhận ra hồ sơ bị trả lại', r16.ret, true); exp('Không tính vào Đang đề nghị', r16.inproc, false); exp('Nhãn Bị trả lại', r16.pill, true);
  exp('Lập hồ sơ thay thế không bị chặn hạn mức', r16.okNew, true);
  const pay2 = { ...pay, id: 'tt15b', number: 'TT-15B' };
  exp('Lập hồ sơ thay thế', (await put(ke, 'payments', pay2)).status(), 200);
  exp('Trình hồ sơ thay thế', (await act(ke, 'payments', 'tt15b', 'submit')).status(), 200);
  const over = await act(ke, 'payments', 'tt15a', 'submit');
  exp('Trình lại hồ sơ cũ khi đã có hồ sơ thay thế (vượt hợp đồng)', over.status(), 409);
  if (!/vượt giá trị hợp đồng/.test((await over.json()).message || '')) errs.push('Thông báo vượt hạn mức chưa rõ');
  await p.close();

  /* ---- Mục 14: thẻ Tổng cộng có nhãn cột trên điện thoại ---- */
  const kem = await who('ketoan', { ...devices['iPhone 13'] });
  p = await page(kem, 'thanh-toan');
  const labels = await p.$$eval('.rt tfoot td', tds => tds.map(td => td.dataset.label || '').filter(Boolean));
  if (!labels.includes('Giá trị HĐ') || !labels.includes('Đã thanh toán') || !labels.includes('Còn lại')) errs.push('Thẻ Tổng cộng thiếu nhãn cột: ' + labels.join(', '));
  await p.evaluate(() => document.querySelector('.rt tfoot').scrollIntoView()); await p.waitForTimeout(200);
  await p.screenshot({ path: SHOTS + '/v15-tong-cong-dien-thoai.png' });
  // Mục 12: thẻ công việc nhật ký trên điện thoại: tên và nút xóa cùng tầng 1
  await p.evaluate(() => location.hash = 'nhat-ky'); await p.waitForTimeout(500);
  await p.evaluate(() => openForm({ title: 'Thử', fields: [{ key: 'works', label: 'Công việc', type: 'works', full: true }], value: { works: 'Đổ bê tông móng M1 | 12,5 | m3' }, onSave: () => false }));
  await p.waitForTimeout(300);
  const wk = await p.evaluate(() => { const r = document.querySelector('.wk-row'); if (!r) return null; const y = s => Math.round(r.querySelector(s).getBoundingClientRect().top); return { n: y('.wk-n'), del: y('.wk-del'), q: y('.wk-q') }; });
  if (!wk) errs.push('Không thấy bảng công việc nhật ký (kiểu trường works)');
  else { if (Math.abs(wk.n - wk.del) > 6) errs.push('Nút xóa không cùng tầng với tên công việc'); if (wk.q <= wk.n) errs.push('Khối lượng không xuống tầng 2'); }
  await p.screenshot({ path: SHOTS + '/v15-nhat-ky-dien-thoai.png' });
  await kem.c.close();

  /* ---- Mục 15: trình duyệt kế hoạch tiến độ ---- */
  const s1 = { id: 'sch15a', projectId: 'p15', packageId: 'k15', name: 'Đầu việc đã duyệt', planStart: '2026-01-01', planEnd: '2026-12-31', weight: 50, progress: 0, history: [], status: 'Soạn thảo' };
  const s2 = { ...s1, id: 'sch15b', name: 'Đầu việc chưa duyệt', planStart: '2026-02-01', planEnd: '2026-06-30' };
  exp('Kỹ thuật lập kế hoạch 1', (await put(kt, 'schedule', s1)).status(), 200);
  exp('Kỹ thuật lập kế hoạch 2', (await put(kt, 'schedule', s2)).status(), 200);
  exp('Tự đặt đã duyệt', (await put(kt, 'schedule', { ...s1, id: 'sch15x', status: 'Đã duyệt' })).status(), 403);
  const upd = (s, prog) => ({ ...s, progress: prog, history: [{ date: '2026-11-04', progress: prog, note: '', by: 'Kỹ thuật' }], actualStart: '2026-11-04' });
  exp('Cập nhật thực tế khi chưa duyệt', (await put(kt, 'schedule', upd(s1, 40))).status(), 403);
  exp('Trình kế hoạch 1', (await act(kt, 'schedule', 'sch15a', 'submit')).status(), 200);
  exp('Trình kế hoạch 2', (await act(kt, 'schedule', 'sch15b', 'submit')).status(), 200);
  exp('Kỹ thuật tự duyệt', (await act(kt, 'schedule', 'sch15a', 'approve')).status(), 403);
  exp('Lãnh đạo duyệt kế hoạch 1', (await act(ld, 'schedule', 'sch15a', 'approve', 'Đồng ý')).status(), 200);
  const a1 = await (await kt.r.get(BASE + '/api/data')).json(); const sa = a1.schedule.find(s => s.id === 'sch15a');
  exp('Cập nhật thực tế khi đã duyệt', (await put(kt, 'schedule', upd(sa, 40))).status(), 200);
  exp('Sửa nội dung kế hoạch đã duyệt', (await put(kt, 'schedule', { ...upd(sa, 40), planEnd: '2027-03-31' })).status(), 403);
  p = await page(kt, 'tien-do');
  const r15 = await p.evaluate(() => ({ pkg: pkgProgress('k15'), proj: projProgress('p15'), al: alerts().filter(a => a.mod === 'tien-do' && a.text.includes('Đầu việc chưa duyệt')).length,
    quick: SCHED().some(s => s.id === 'sch15b'), mine: wfMine().length }));
  exp('Tiến độ gói chỉ tính kế hoạch đã duyệt', Math.round(r15.pkg), 40); exp('Tiến độ dự án', Math.round(r15.proj), 40);
  exp('Không cảnh báo kế hoạch chưa duyệt', r15.al, 0); exp('Kế hoạch chưa duyệt không có trong danh sách cập nhật nhanh', r15.quick, false);
  const g = await p.evaluate(() => { const rows = [...document.querySelectorAll('.grow-row.draft')]; return rows.map(r => r.textContent); });
  if (!g.some(t => t.includes('Đầu việc chưa duyệt') && t.includes('Chờ duyệt'))) errs.push('Biểu đồ không hiện kế hoạch chờ duyệt: ' + g.join(' | '));
  await p.screenshot({ path: SHOTS + '/v15-tien-do-cho-duyet.png', fullPage: true }); await p.close();
  p = await page(ld, 'trinh-duyet');
  if (!(await p.$('[data-act=wf][data-id="schedule|sch15b|approve"]'))) errs.push('Trang Trình duyệt hồ sơ không có kế hoạch tiến độ chờ duyệt');
  await p.screenshot({ path: SHOTS + '/v15-trinh-duyet-tien-do.png', fullPage: true }); await p.close();

  /* ---- Mục 11, 13: nhập từ Excel ---- */
  p = await page(kt, 'khoi-luong');
  const xlsx = async aoa => Buffer.from(await p.evaluate(a => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(a), 'S'); return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' }); }, aoa), 'base64');
  const runImp = async (key, aoa, name, before) => {
    await p.evaluate(k => ACT.imp(k), key); await p.waitForSelector('#imp_file', { state: 'attached' });
    if (before) await before();
    await p.setInputFiles('#imp_file', { name, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: await xlsx(aoa) });
    await p.waitForSelector('#imp_res table, #imp_res .alert', { timeout: 5000 }); await p.waitForTimeout(200);
    const info = await p.evaluate(() => ({ txt: document.querySelector('#imp_res').innerText, btn: document.querySelector('#imp_save').textContent, dis: document.querySelector('#imp_save').disabled }));
    return info;
  };
  const save = async () => { await p.click('#imp_save'); await p.waitForFunction(() => document.querySelector('#ov').hidden, null, { timeout: 15000 }); await p.waitForTimeout(300); };
  // Tệp mẫu tải về được và đọc lại đúng cột
  const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => impTemplate('boq'))]);
  exp('Tên tệp mẫu', dl.suggestedFilename(), 'Mau nhap khoi luong hop dong.xlsx');
  // Bảng khối lượng: tiêu đề nằm ở dòng 3, số kiểu Việt Nam, một dòng lỗi, một dòng trùng mã, dòng tổng cộng bỏ qua
  let info = await runImp('boq|c15', [['BẢNG KHỐI LƯỢNG DỰ TOÁN'], [], ['STT', 'Mã hiệu', 'Nội dung công việc', 'ĐVT', 'Khối lượng', 'Đơn giá'],
    [1, 'AB.11', 'Đào nền đường', 'm3', '20.000', '1.500.000'], [2, 'AD.11', 'Móng cấp phối đá dăm', 'm3', 10000, 5000000], [3, 'AD.23', 'Mặt đường', 'm2', 'abc', 100000],
    [4, 'AB.11', 'Trùng mã', 'm3', 1, 1], [5, 'XL.01', 'Hạng mục khác', 'm2', '12,5', 800000], ['', 'Tổng cộng', '', '', '', '']], 'du-toan.xlsx');
  if (!/5 dòng, 3 dòng hợp lệ, 2 dòng lỗi/.test(info.txt)) errs.push('Kiểm tra bảng khối lượng sai: ' + info.txt.slice(0, 200));
  if (!/Chênh lệch/.test(info.txt)) errs.push('Không báo chênh lệch với giá trị hợp đồng');
  exp('Nút lưu bảng khối lượng', info.btn, 'Lưu 3 dòng hợp lệ');
  await p.screenshot({ path: SHOTS + '/v15-nhap-khoi-luong.png' });
  await save();
  const boq = await p.evaluate(() => D('boq').filter(x => x.contractId === 'c15').map(x => [x.code, x.qty, x.price]).sort());
  exp('Bảng khối lượng sau khi nhập', JSON.stringify(boq), JSON.stringify([['AB.11', 20000, 1500000], ['AD.11', 10000, 5000000], ['XL.01', 12.5, 800000]]));
  // Nhập lại AB.11 thì cập nhật dòng cũ
  info = await runImp('boq|c15', [['Mã hiệu', 'Nội dung công việc', 'Đơn vị tính', 'Khối lượng hợp đồng', 'Đơn giá (đồng)'], ['AB.11', 'Đào nền đường đất cấp II', 'm3', 21000, 1500000]], 'sua.xlsx');
  if (!/sẽ cập nhật/.test(info.txt)) errs.push('Không báo cập nhật mã đã có'); await save();
  exp('Cập nhật mã đã có', await p.evaluate(() => D('boq').filter(x => x.contractId === 'c15' && x.code === 'AB.11').map(x => x.qty).join()), '21000');
  // Nghiệm thu: khớp theo mã hiệu, ngày và đợt chung
  info = await runImp('vol|c15', [['Mã hiệu', 'Khối lượng thực hiện trong kỳ', 'Khối lượng nghiệm thu', 'Ngày', 'Đợt', 'Ghi chú'],
    ['AB.11', 5000, 4800, '', '', 'BB01'], ['AD.11', '2.000', 2500, '', '', ''], ['ZZ.99', 1, 1, '', '', ''], ['XL.01', 2, 2, '15/10/2026', 'Đợt 0', '']], 'nghiem-thu.xlsx',
    async () => { await p.fill('#f_period', 'Đợt 1'); });
  if (!/4 dòng, 2 dòng hợp lệ, 2 dòng lỗi/.test(info.txt)) errs.push('Kiểm tra nghiệm thu sai: ' + info.txt.slice(0, 200));
  await save();
  const vols = await p.evaluate(() => D('volumes').filter(v => v.contractId === 'c15').map(v => [get('boq', v.boqId).code, v.doneQty, v.acceptedQty, v.period, v.date]).sort());
  exp('Số dòng nghiệm thu', vols.length, 2);
  if (!vols.some(v => v[0] === 'XL.01' && v[3] === 'Đợt 0' && v[4] === '2026-10-15')) errs.push('Dòng có ngày, đợt riêng sai: ' + JSON.stringify(vols));
  if (!vols.some(v => v[0] === 'AB.11' && v[3] === 'Đợt 1')) errs.push('Dòng lấy đợt chung sai: ' + JSON.stringify(vols));
  // Kế hoạch tiến độ: ngày kiểu Excel và chữ, ngày kết thúc trước bắt đầu bị loại, tổng trọng số khác 100 chỉ nhắc
  info = await runImp('sched|k15', [['Tên công việc', 'Ngày bắt đầu', 'Ngày kết thúc', 'Trọng số (%)', 'Mã hạng mục công trình'],
    ['Đào móng', 46357, '20/12/2026', 30, ''], ['Bê tông móng', '2026-12-21', '15/01/2027', 30, 'KHONGCO'], ['Sai ngày', '10/01/2027', '01/01/2027', 10, ''], ['Ngày lạ', '31/02/2027', '01/03/2027', 5, '']], 'tien-do.xlsx');
  if (!/4 dòng, 2 dòng hợp lệ, 2 dòng lỗi/.test(info.txt)) errs.push('Kiểm tra kế hoạch tiến độ sai: ' + info.txt.slice(0, 300));
  if (!/tự quy về 100%/.test(info.txt)) errs.push('Không nhắc tổng trọng số khác 100%');
  await save();
  const ss = await p.evaluate(() => D('schedule').filter(s => s.packageId === 'k15' && /móng/.test(s.name)).map(s => [s.name, s.planStart, s.planEnd, s.status]).sort());
  exp('Kế hoạch tiến độ sau khi nhập', JSON.stringify(ss), JSON.stringify([['Bê tông móng', '2026-12-21', '2027-01-15', 'Soạn thảo'], ['Đào móng', '2026-12-01', '2026-12-20', 'Soạn thảo']]));
  exp('Kế hoạch mới nhập chưa tính vào tiến độ', Math.round(await p.evaluate(() => pkgProgress('k15'))), 40);
  await p.close();

  await b.close();
  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'KHÔNG CÓ LỖI'); process.exit(errs.length ? 1 : 0);
})();
