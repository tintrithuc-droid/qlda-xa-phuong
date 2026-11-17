// Kiểm thử bản 1.8 (nâng cấp theo phần mềm QLDA TTTS HCM, 17/11/2026).
// Đợt 1: mã kiểm tra đăng nhập, đổi mật khẩu lần đầu, phục hồi đúng thời điểm, Trung tâm cảnh báo, tiến độ gói tư vấn, vượt giá gói thầu, giờ UTC.
// Đợt 2: nhập bảng giá Mẫu số 11B, biên bản nghiệm thu hai tầng tiêu đề, tiến độ dạng biểu đồ ngang; dữ liệu đầu kỳ; đối soát hợp đồng.
// Đợt 3: quy trình duyệt tự thiết lập, lưu nháp, theo dõi hồ sơ; danh mục nhà thầu, giám sát; menu giai đoạn; nghiệm thu sản phẩm tư vấn.
// Chạy sau smoke.js trên cùng máy chủ: node tests/e2e/v18.js [http://127.0.0.1:5080]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const FX = path.join(__dirname, 'fixtures');
const H = { headers: { 'X-QLDA': '1' } };
const wait = ms => new Promise(r => setTimeout(r, ms));
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
  const check = (cond, msg) => { if (!cond) errs.push(msg); };
  const exp = (what, got, want) => { if (got !== want) errs.push(`${what}: ${JSON.stringify(got)} (cần ${JSON.stringify(want)})`); };
  const who = async (u, pw = 'Admin2026') => { const c = await b.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 900 } }); const r = c.request;
    const s = (await r.post(BASE + '/api/auth/login', { ...H, data: { username: u, password: pw } })).status(); if (s !== 200) errs.push('Đăng nhập ' + u + ': ' + s);
    if (['ketoan', 'giamsat', 'lanhdao', 'kythuat', 'nt18'].includes(u) && (await r.get(BASE + '/api/data', H)).status() === 403) {
      for (const [o, n] of [[pw, pw + 'tmp'], [pw + 'tmp', pw]]) { const x = await r.post(BASE + '/api/auth/change-password', { ...H, data: { old: o, password: n } }); if (x.status() !== 200) errs.push('Đổi mật khẩu lần đầu ' + u + ': ' + x.status()); } }
    return { c, r }; };
  const page = async (u, route) => { const p = await u.c.newPage(); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    await p.goto(BASE + '/#' + route); await p.waitForSelector('#app, #pwfirst', { timeout: 15000 }); await p.waitForTimeout(700); return p; };
  const go = async (p, route, f) => { await p.evaluate(([r, f]) => { Object.assign(S.f, f || {}); if (location.hash === '#' + r) render(); else location.hash = r; }, [route, f]); await wait(700); };
  const shot = (p, n) => p.screenshot({ path: `${SHOTS}/v18-${n}.png`, fullPage: true }).catch(() => {});
  const ad = await who('admin');
  const sec = fs.readFileSync(SHOTS + '/admin-totp.txt', 'utf8').trim();
  for (let i = 0; i < 3; i++) { if ((await ad.r.post(BASE + '/api/auth/mfa', { ...H, data: { code: totp(sec) } })).status() === 200) break; if (i === 2) errs.push('Mã 2 lớp quản trị'); await wait(31000 - Date.now() % 30000); }
  const data = async u => (await u.r.get(BASE + '/api/data')).json();

  /* ===== ĐỢT 1 ===== */
  // 1. Mã kiểm tra: tên đăng nhập khác (chưa sai lần nào) vẫn đăng nhập bình thường; mã kiểm tra là ảnh, không lộ chữ
  const cap = await (await (await b.newContext()).request.get(BASE + '/api/auth/captcha', H)).json();
  check(cap.id && /^data:image\/svg\+xml;base64,/.test(cap.img || ''), 'Mã kiểm tra không phải ảnh: ' + JSON.stringify(cap).slice(0, 80));
  const kt = await who('kythuat');
  // 2. Tài khoản mới do quản trị tạo: phải đổi mật khẩu ở lần đầu, chưa đổi thì không lấy được dữ liệu
  const NU = 'moi' + Date.now().toString(36);
  const groups = (await data(ad)).groups; const gTech = groups.find(g => g.id === 'g-tech');
  const cr = await ad.r.post(BASE + '/api/users', { ...H, data: { username: NU, name: 'Cán bộ mới', password: 'BanDau2026', groupId: gTech.id } });
  exp('Tạo tài khoản mới', cr.status(), 200);
  const nu = await who(NU, 'BanDau2026');
  const st = await (await nu.r.get(BASE + '/api/auth/state')).json();
  check(st.user && st.user.mustChangePassword, 'Tài khoản mới không bị yêu cầu đổi mật khẩu: ' + JSON.stringify(st.user || st).slice(0, 120));
  exp('Dữ liệu khi chưa đổi mật khẩu', (await nu.r.get(BASE + '/api/data')).status(), 403);
  const pf = await page(nu, 'tong-quan'); await pf.waitForSelector('#pwfirst', { timeout: 8000 }).catch(() => errs.push('Không hiện màn hình đặt mật khẩu lần đầu'));
  await shot(pf, '1-doi-mat-khau-lan-dau');
  exp('Đổi trùng mật khẩu cũ', (await nu.r.post(BASE + '/api/auth/change-password', { ...H, data: { old: 'BanDau2026', password: 'BanDau2026' } })).status(), 400);
  exp('Đổi mật khẩu lần đầu', (await nu.r.post(BASE + '/api/auth/change-password', { ...H, data: { old: 'BanDau2026', password: 'RiengToi2026' } })).status(), 200);
  exp('Dữ liệu sau khi đổi', (await nu.r.get(BASE + '/api/data')).status(), 200);
  await pf.close();

  // 3. Trung tâm cảnh báo
  const pa = await page(ad, 'canh-bao');
  const nAl = await pa.evaluate(() => alerts({ all: true }).length);
  check(nAl > 0, 'Trung tâm cảnh báo không có cảnh báo nào trên dữ liệu mẫu');
  check(await pa.$('[data-act=export-alerts]'), 'Trung tâm cảnh báo thiếu nút xuất Excel');
  await shot(pa, '2-trung-tam-canh-bao');
  // 4. Giờ máy chủ trả về có múi giờ UTC (Z)
  const logs = (await data(ad)).logs || [];
  check(logs.length && /Z$/.test(String(logs[0].ts || '')), 'Mốc giờ nhật ký thiếu múi giờ: ' + JSON.stringify(logs[0] || {}).slice(0, 140));

  // 5. Gói thầu tư vấn: tiến độ theo giá trị thanh toán; giá HĐ vượt giá gói thầu báo đỏ
  const put = (u, col, o) => u.r.put(BASE + `/api/data/${col}/${o.id}`, { ...H, data: o });
  exp('Gói tư vấn', (await put(kt, 'packages', { id: 'k18tv', projectId: 'p1', code: 'TV-18', name: 'Tư vấn giám sát thử 1.8', type: 'Tư vấn', estimate: 100e6 })).status(), 200);
  exp('HĐ tư vấn', (await put(kt, 'contracts', { id: 'c18tv', packageId: 'k18tv', projectId: 'p1', number: 'HD-TV18', contractor: 'Công ty tư vấn thử', value: 110e6, start: '2026-01-01', end: '2027-12-31', signDate: '2026-01-01' })).status(), 200);
  await pa.evaluate(() => Store.load()); await wait(600);
  await go(pa, 'goi-thau'); await pa.evaluate(() => { S.sel.pkg = 'k18tv'; render(); }); await wait(500);
  const pkgTxt = await pa.textContent('#app');
  check(/Vượt giá gói thầu 10/.test(pkgTxt), 'Không báo vượt giá gói thầu');
  check(/Theo giá trị nghiệm thu, thanh toán/.test(pkgTxt), 'Gói tư vấn chưa tính tiến độ theo giá trị');
  check(await pa.evaluate(() => alerts({ all: true }).some(a => a.kid === 'k18tv' && /vượt giá gói thầu/i.test(a.text))), 'Không có cảnh báo hợp đồng vượt giá gói thầu');
  await shot(pa, '3-goi-tu-van');

  /* ===== ĐỢT 2: nhập Excel thực tế ===== */
  const total = 1537982682;
  exp('Gói xây lắp', (await put(kt, 'packages', { id: 'k18xl', projectId: 'p1', code: 'XL-18', name: 'Xây lắp thử Mẫu 11B', type: 'Xây lắp', estimate: total })).status(), 200);
  exp('HĐ xây lắp', (await put(kt, 'contracts', { id: 'c18xl', packageId: 'k18xl', projectId: 'p1', number: 'TEST-11B/2026', contractor: 'Nhà thầu thử nghiệm', value: total, start: '2026-10-11', end: '2026-12-19', signDate: '2026-10-01' })).status(), 200);
  await pa.evaluate(() => Store.load()); await wait(600);
  check(await pa.evaluate(() => catalog('Đơn vị tính').includes('100m2') && catalog('Đơn vị tính').includes('1 cấu kiện')), 'Danh mục Đơn vị tính chưa có 100m2, 1 cấu kiện');
  await go(pa, 'khoi-luong', { klc: 'c18xl' });
  const openImp = async (key, file) => { await pa.click(`[data-act=imp][data-id="${key}"]`); await pa.waitForSelector('#imp_file', { state: 'attached' });
    await pa.setInputFiles('#imp_file', path.join(FX, file)); await wait(900); return pa.textContent('#imp_res'); };
  let prev = await openImp('boq|c18xl', 'mau11b.xlsx');
  check(/6 dòng, 6 dòng hợp lệ/.test(prev), 'Xem trước Mẫu 11B sai số dòng: ' + prev.slice(0, 200));
  check(/Khớp giá trị hợp đồng/.test(prev), 'Không báo khớp giá trị hợp đồng: ' + prev.slice(0, 300));
  check(/2 nhóm công việc/.test(prev), 'Không nhận 2 nhóm công việc');
  check(/Thêm đơn vị "bao"/.test(prev), 'Không báo thêm đơn vị mới "bao"');
  await shot(pa, '4-xem-truoc-11b');
  await pa.click('#imp_save'); await pa.waitForSelector('#imp_save', { state: 'detached', timeout: 20000 }); await wait(800);
  const bq = await pa.evaluate(() => D('boq').filter(x => x.contractId === 'c18xl').sort(byCode).map(x => [x.code, x.section, x.unit]));
  exp('Số công việc sau khi nhập Mẫu 11B', bq.length, 6);
  exp('Thứ tự mã hiệu', bq.map(x => x[0]).join(','), '1.1,1.2,1.10,1.11,2.1,2.2');
  check(bq[0] && bq[0][1] === '1. PHẦN ĐƯỜNG GIAO THÔNG' && bq[5] && bq[5][1] === '2. PHẦN THOÁT NƯỚC', 'Nhóm công việc sai: ' + JSON.stringify(bq.map(x => x[1])));
  check(await pa.evaluate(() => catalog('Đơn vị tính').includes('bao')), 'Chưa thêm đơn vị "bao" vào danh mục');
  const grp = await pa.$$eval('tbody tr.grp', t => t.map(x => x.textContent));
  check(grp.length === 2 && /PHẦN ĐƯỜNG GIAO THÔNG/.test(grp[0]), 'Bảng khối lượng không hiện dòng nhóm: ' + grp.join(' | '));
  await shot(pa, '5-bang-khoi-luong-nhom');
  // Nhập lại cùng tệp: cập nhật, không nhân đôi
  prev = await openImp('boq|c18xl', 'mau11b.xlsx'); check(/sẽ cập nhật/.test(prev), 'Nhập lại không báo cập nhật');
  await pa.click('#imp_save'); await pa.waitForSelector('#imp_save', { state: 'detached', timeout: 20000 }); await wait(600);
  exp('Nhập lại không nhân đôi', await pa.evaluate(() => D('boq').filter(x => x.contractId === 'c18xl').length), 6);
  // Biên bản nghiệm thu có tiêu đề hai tầng, khớp theo STT
  await go(pa, 'khoi-luong', { klc: 'c18xl' }); await pa.evaluate(() => { S.tab.kl = 'nt'; render(); }); await wait(400);
  prev = await openImp('vol|c18xl', 'bbnt-dot1.xlsx');
  check(/4 dòng, 3 dòng hợp lệ/.test(prev), 'Xem trước biên bản nghiệm thu sai: ' + prev.slice(0, 240));
  await pa.click('#imp_save'); await pa.waitForSelector('#imp_save', { state: 'detached', timeout: 20000 }); await wait(800);
  const vols = await pa.evaluate(() => D('volumes').filter(v => v.contractId === 'c18xl').map(v => [get('boq', v.boqId).code, v.doneQty, v.acceptedQty]).sort());
  exp('Khối lượng từ biên bản', JSON.stringify(vols), JSON.stringify([['1.10', 5, 5], ['1.2', 1.55862, 1.5], ['2.1', 4.4944, 4.4944]]));
  // Tiến độ dạng biểu đồ ngang: ngày thứ theo ngày khởi công
  await go(pa, 'tien-do', { tdk: 'k18xl' });
  await pa.click('[data-act=imp][data-id^="sched"]'); await pa.waitForSelector('#imp_file', { state: 'attached' });
  await pa.selectOption('#f_packageId', 'k18xl'); // ngày khởi công lấy sẵn từ hợp đồng: 11/10/2026
  await pa.setInputFiles('#imp_file', path.join(FX, 'tien-do-gantt.xlsx')); await wait(900);
  prev = await pa.textContent('#imp_res');
  check(/3 dòng, 3 dòng hợp lệ/.test(prev), 'Xem trước tiến độ Gantt sai: ' + prev.slice(0, 200));
  check(prev.includes('16/10/2026') && prev.includes('19/11/2026') && prev.includes('08/12/2026'), 'Quy đổi ngày thứ sai: ' + prev.slice(0, 400));
  await shot(pa, '6-tien-do-gantt');
  await pa.click('#imp_save'); await pa.waitForSelector('#imp_save', { state: 'detached', timeout: 20000 }); await wait(600);
  const sc = await pa.evaluate(() => D('schedule').filter(s => s.packageId === 'k18xl').map(s => [s.name, s.planStart, s.planEnd]));
  check(sc.length === 3 && sc.some(s => s[1] === '2026-11-19' && s[2] === '2026-12-08'), 'Tiến độ lưu sai: ' + JSON.stringify(sc));

  // Dữ liệu đầu kỳ: kiểm tra trước, ghi nhận, nhập lại không nhân đôi
  const dkBody = dry => ({ dryRun: dry, cutoff: '2026-10-31', basis: 'Biên bản bàn giao thử nghiệm', sheets: {
    projects: [{ line: 5, code: 'DK-01', name: 'Đường giao thông ấp thử nghiệm', tmdt: 5000000000, start: '2026-01-10', end: '2027-06-30' }],
    packages: [{ line: 5, projectCode: 'DK-01', code: 'XL-01', name: 'Thi công xây dựng', type: 'Xây lắp', estimate: 4000000000 }],
    contracts: [{ line: 5, projectCode: 'DK-01', packageCode: 'XL-01', number: 'DK-HD-01/2026', contractor: 'Công ty xây dựng thử', value: 3900000000, signDate: '2026-03-01', start: '2026-03-05', end: '2026-12-31' }],
    boq: [{ line: 5, contractNumber: 'DK-HD-01/2026', code: '1.1', section: '1. PHẦN NỀN', name: 'Đào đất', unit: 'm3', qty: 1000, price: 150000 },
          { line: 6, contractNumber: 'DK-HD-01/2026', code: '1.2', section: '1. PHẦN NỀN', name: 'Đắp cát', unit: 'm3', qty: 800, price: 300000 }],
    volumes: [{ line: 5, contractNumber: 'DK-HD-01/2026', boqCode: '1.1', doneQty: 600, acceptedQty: 500 }, { line: 6, contractNumber: 'DK-HD-01/2026', boqCode: '1.2', acceptedQty: 200 }],
    payments: [{ line: 5, contractNumber: 'DK-HD-01/2026', number: 'TU-01', kind: 'Tạm ứng', amount: 500000000, paidDate: '2026-03-20' }],
    capitals: [{ line: 5, projectCode: 'DK-01', year: 2026, kind: 'Kế hoạch vốn năm', source: 'Ngân sách xã/phường', amount: 2000000000, number: '15/QĐ-UBND', date: '2026-01-15' }] } });
  let dk = await ad.r.post(BASE + '/api/opening/import', { ...H, data: dkBody(true) }); let dkj = await dk.json();
  exp('Kiểm tra đầu kỳ', dk.status(), 200); check(!(dkj.errors || []).length, 'Đầu kỳ báo lỗi: ' + JSON.stringify(dkj.errors).slice(0, 400));
  check(!(await data(ad)).projects.some(p => p.code === 'DK-01'), 'Kiểm tra trước đã ghi dữ liệu');
  dk = await ad.r.post(BASE + '/api/opening/import', { ...H, data: dkBody(false) }); dkj = await dk.json();
  exp('Ghi nhận đầu kỳ', dk.status(), 200); check(!(dkj.errors || []).length, 'Ghi nhận đầu kỳ báo lỗi: ' + JSON.stringify(dkj.errors).slice(0, 400));
  dk = await ad.r.post(BASE + '/api/opening/import', { ...H, data: dkBody(false) }); exp('Nhập lại đầu kỳ', dk.status(), 200);
  const dd = await data(ad); const dc = dd.contracts.find(c => c.number === 'DK-HD-01/2026');
  check(dc, 'Không có hợp đồng đầu kỳ');
  if (dc) {
    exp('Hạng mục BOQ đầu kỳ', dd.boq.filter(x => x.contractId === dc.id).length, 2);
    const bt = dd.vbatches.filter(x => x.contractId === dc.id);
    check(bt.length === 1 && bt[0].name === 'Lũy kế đến 31/10/2026' && bt[0].status === 'Đã duyệt', 'Đợt nghiệm thu đầu kỳ sai: ' + JSON.stringify(bt));
    exp('Khối lượng đầu kỳ', dd.volumes.filter(x => x.contractId === dc.id).length, 2);
    const py = dd.payments.filter(x => x.contractId === dc.id);
    check(py.length === 1 && py[0].status === 'Đã thanh toán', 'Thanh toán đầu kỳ sai: ' + JSON.stringify(py));
    exp('Kế hoạch vốn đầu kỳ', dd.capitals.filter(x => x.projectId === dc.projectId).length, 1);
  }
  // Màn hình Dữ liệu đầu kỳ và bảng đối soát
  await go(pa, 'quan-tri'); await pa.evaluate(() => { S.tab.qt = 'dk'; render(); }); await wait(500);
  const dkt = await pa.textContent('#content');
  check(/Bảng đối soát theo hợp đồng/.test(dkt) && dkt.includes('DK-HD-01/2026'), 'Màn hình đầu kỳ thiếu bảng đối soát: ' + dkt.slice(0, 300));
  const rr = await pa.evaluate(() => dkReconRows('', '2026-10-31').find(r => String(r[2]).includes('DK-HD-01')));
  check(rr, 'Không có dòng đối soát của hợp đồng đầu kỳ');
  await shot(pa, '7-du-lieu-dau-ky');
  // Tải mẫu kèm dữ liệu rồi đọc lại bằng bộ đọc của màn hình: đủ 13 trang, có hợp đồng đầu kỳ
  const [dl] = await Promise.all([pa.waitForEvent('download', { timeout: 30000 }), pa.click('[data-act=dk-tpl][data-id=data]')]);
  const tplPath = path.join(SHOTS, 'v18-mau-dau-ky.xlsx'); await dl.saveAs(tplPath);
  const tplB64 = fs.readFileSync(tplPath).toString('base64');
  const rd = await pa.evaluate(async b64 => { const wb = XLSX.read(b64, { type: 'base64' }); const u8 = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0)); const r = dkRead(u8); return { n: wb.SheetNames.length, c: (r.sheets && r.sheets.contracts || []).map(x => x.number) }; }, tplB64);
  exp('Số trang mẫu đầu kỳ', rd.n >= 13, true); check(rd.c.includes('DK-HD-01/2026'), 'Mẫu kèm dữ liệu thiếu hợp đồng đầu kỳ: ' + JSON.stringify(rd).slice(0, 200));

  /* ===== ĐỢT 3 ===== */
  // Quy trình duyệt tự thiết lập: phụ lục hợp đồng qua 3 bước (kế toán kiểm tra, TVGS thẩm định trả về bước trước, lãnh đạo duyệt)
  // smoke.js cố ý nhập sai mật khẩu kế toán nhiều lần: quản trị đặt lại mật khẩu (xóa luôn yêu cầu mã kiểm tra của tài khoản)
  for (const un of ['ketoan', 'giamsat', 'lanhdao']) { const uu = (await data(ad)).users.find(u => u.username === un);
    exp('Quản trị đặt lại mật khẩu ' + un, (await ad.r.post(BASE + '/api/users/' + uu.id + '/reset-password', { ...H, data: { password: 'Admin2026' } })).status(), 200); }
  const ld = await who('lanhdao'), ke = await who('ketoan'), gs = await who('giamsat');
  const act = (u, col, id, action, note, assignTo) => u.r.post(BASE + '/api/approvals', { ...H, data: { collection: col, id, action, note, assignTo } });
  const us = (await data(ad)).users, uid = n => (us.find(x => x.username === n) || {}).id;
  let cfg = await (await ad.r.get(BASE + '/api/workflow', H)).json();
  exp('Quy trình mặc định phụ lục bật', cfg.flows.addenda.enabled, true);
  exp('Quy trình hợp đồng mặc định tắt', cfg.flows.contracts.enabled, false);
  cfg.flows.addenda = { enabled: true, steps: [
    { key: 'kt', label: 'Kế toán kiểm tra', verb: 'Kiểm tra đạt', groups: ['g-acc'], users: [], dueDays: 2 },
    { key: 'gs', label: 'Tư vấn giám sát thẩm định', verb: 'Thẩm định đạt', groups: [], users: [uid('giamsat')], returnTo: 'prev', noteRequired: true },
    { key: 'approve', label: 'Lãnh đạo Ban duyệt', verb: 'Duyệt', groups: [], users: [] }] };
  cfg.flows.contracts = { enabled: true, steps: [{ key: 'approve', label: 'Lãnh đạo Ban duyệt hợp đồng', verb: 'Duyệt', minAmount: 1e9 }] };
  exp('Cán bộ không sửa được quy trình', (await kt.r.put(BASE + '/api/workflow', { ...H, data: cfg })).status(), 403);
  exp('Quản trị lưu quy trình', (await ad.r.put(BASE + '/api/workflow', { ...H, data: cfg })).status(), 200);
  const pl = { id: 'pl18a', contractId: 'c18xl', number: 'PL-18A', date: '2026-11-10', content: 'Bổ sung khối lượng', valueChange: 50000000, daysChange: 10 };
  exp('Lập phụ lục', (await put(kt, 'addenda', pl)).status(), 200);
  exp('Chuyển đích danh cho người không xử lý bước', (await act(kt, 'addenda', 'pl18a', 'submit', '', uid('lanhdao'))).status(), 400);
  exp('Chuyển duyệt cho kế toán', (await act(kt, 'addenda', 'pl18a', 'submit', '', uid('ketoan'))).status(), 200);
  let lg = (await data(ad)).approvals.filter(a => a.recordId === 'pl18a').sort((a, b) => b.at.localeCompare(a.at));
  check(lg[0] && lg[0].step === 'kt' && lg[0].assignee === uid('ketoan') && lg[0].due, 'Lần chuyển duyệt chưa ghi bước, người nhận, hạn: ' + JSON.stringify(lg[0]));
  exp('Lãnh đạo xử lý bước của kế toán', (await act(ld, 'addenda', 'pl18a', 'check')).status(), 403);
  exp('Kế toán kiểm tra đạt', (await act(ke, 'addenda', 'pl18a', 'check', 'Đủ hồ sơ')).status(), 200);
  exp('Kế toán rút lại khi bước sau chưa xử lý', (await act(ke, 'addenda', 'pl18a', 'withdraw')).status(), 200);
  exp('Kế toán chuyển lại', (await act(ke, 'addenda', 'pl18a', 'check', 'Đủ hồ sơ')).status(), 200);
  exp('TVGS thẩm định không ghi ý kiến', (await act(gs, 'addenda', 'pl18a', 'check')).status(), 400);
  exp('TVGS trả về bước trước', (await act(gs, 'addenda', 'pl18a', 'return', 'Bổ sung bản vẽ')).status(), 200);
  let a18 = (await data(ad)).addenda.find(x => x.id === 'pl18a');
  exp('Trả về bước kế toán (vẫn đang xử lý)', a18.status, 'Chờ kiểm tra');
  // Kế toán xử lý trên giao diện: thẻ Chờ tôi xử lý, chuông thông báo
  const pk = await page(ke, 'trinh-duyet'); await wait(400);
  const tdt = await pk.textContent('#content');
  check(/Chờ kế toán kiểm tra/.test(tdt) && tdt.includes('PL-18A'), 'Thẻ Chờ tôi xử lý chưa có phụ lục: ' + tdt.slice(0, 300));
  check(await pk.$('.top .bell .bcnt'), 'Chuông thông báo chưa có số việc');
  await shot(pk, '8-cho-toi-xu-ly');
  await pk.click('[data-act=wf][data-id="addenda|pl18a|check"]'); await pk.waitForSelector('#f_assignTo');
  check((await pk.$$eval('#f_assignTo option', o => o.map(x => x.textContent))).some(t => /giám sát/i.test(t) || t.length > 3), 'Không có danh sách chuyển cho bước sau');
  await pk.fill('#f_note', 'Đã bổ sung'); await pk.click('#mform [type=submit]'); await pk.waitForSelector('#mform', { state: 'detached', timeout: 10000 }); await wait(400);
  exp('TVGS thẩm định đạt', (await act(gs, 'addenda', 'pl18a', 'check', 'Đạt')).status(), 200);
  a18 = (await data(ad)).addenda.find(x => x.id === 'pl18a'); exp('Sang bước cuối', a18.status, 'Chờ duyệt');
  exp('Lãnh đạo duyệt', (await act(ld, 'addenda', 'pl18a', 'approve', '')).status(), 200);
  exp('Phụ lục đã duyệt', (await data(ad)).addenda.find(x => x.id === 'pl18a').status, 'Đã duyệt');
  // Hợp đồng: chỉ hợp đồng từ 1 tỷ phải duyệt; đã duyệt vẫn gia hạn bảo lãnh, ghi chú được
  const hd = { id: 'c18n', packageId: 'k18xl', projectId: 'p1', number: 'HD-18N', contractor: 'Nhà thầu nhỏ', value: 500000000, start: '2026-11-01', end: '2026-12-31' };
  exp('Lập hợp đồng nhỏ', (await put(kt, 'contracts', hd)).status(), 200);
  exp('Hợp đồng mới ở trạng thái soạn thảo', (await data(kt)).contracts.find(x => x.id === 'c18n').status, 'Soạn thảo');
  exp('Ghi nhận hợp đồng dưới 1 tỷ', (await act(kt, 'contracts', 'c18n', 'submit')).status(), 200);
  let c18 = (await data(kt)).contracts.find(x => x.id === 'c18n'); exp('Hợp đồng dưới 1 tỷ được ghi nhận ngay', c18.status, 'Đã duyệt');
  exp('Sửa ghi chú hợp đồng đã duyệt', (await put(kt, 'contracts', { ...c18, note: 'Gia hạn bảo lãnh', guaranteeUntil: '2027-03-01' })).status(), 200);
  exp('Sửa giá trị hợp đồng đã duyệt', (await put(kt, 'contracts', { ...c18, note: 'Gia hạn bảo lãnh', guaranteeUntil: '2027-03-01', value: 600000000 })).status(), 403);
  exp('Lập hợp đồng lớn', (await put(kt, 'contracts', { ...hd, id: 'c18l', number: 'HD-18L', value: 2000000000 })).status(), 200);
  exp('Chuyển duyệt hợp đồng lớn', (await act(kt, 'contracts', 'c18l', 'submit')).status(), 200);
  exp('Hợp đồng lớn chờ duyệt', (await data(kt)).contracts.find(x => x.id === 'c18l').status, 'Chờ duyệt');
  // Loại hồ sơ tắt quy trình: kế hoạch thanh toán ghi nhận ngay
  exp('Lập kế hoạch thanh toán', (await put(ke, 'payplans', { id: 'kh18', contractId: 'c18n', phase: 'Đợt 1', planDate: '2026-12-01', amount: 100000000 })).status(), 200);
  exp('Kế hoạch thanh toán ghi nhận ngay', (await data(ke)).payplans.find(x => x.id === 'kh18').status, 'Đã duyệt');
  // Quy trình riêng của dự án: dự án p1 tắt duyệt phụ lục
  cfg = await (await ad.r.get(BASE + '/api/workflow', H)).json(); cfg.projects = { p1: { addenda: { enabled: false, steps: [{ key: 'approve', label: 'Duyệt' }] } } };
  exp('Lưu quy trình riêng của dự án', (await ad.r.put(BASE + '/api/workflow', { ...H, data: cfg })).status(), 200);
  exp('Phụ lục dự án p1', (await put(kt, 'addenda', { id: 'pl18p', contractId: 'c18n', number: 'PL-P1', date: '2026-11-12', content: 'Gia hạn', valueChange: 0, daysChange: 5 })).status(), 200);
  exp('Phụ lục dự án tắt quy trình được ghi nhận ngay', (await data(kt)).addenda.find(x => x.id === 'pl18p').status, 'Đã duyệt');
  // Biểu mẫu: Lưu nháp và Lưu và chuyển duyệt
  const pt = await page(kt, 'goi-thau'); await wait(300);
  await pt.evaluate(() => ACT['add-addendum'](D('contracts').find(c => c.number === 'DK-HD-01/2026').id)); await pt.waitForSelector('#mform');
  const btns = await pt.$$eval('#mform footer button', b => b.map(x => x.textContent.trim()));
  check(btns.includes('Lưu nháp') && btns.includes('Lưu và chuyển duyệt'), 'Biểu mẫu chưa có Lưu nháp / Lưu và chuyển duyệt: ' + btns.join(','));
  await pt.fill('#f_number', 'PL-18B'); await pt.fill('#f_date_t', '12/11/2026'); await pt.press('#f_date_t', 'Enter'); await pt.fill('#f_content', 'Điều chỉnh đơn giá');
  await pt.click('[data-send="1"]'); await pt.waitForSelector('#f_assignTo', { timeout: 10000 }); await wait(300);
  check(/Chuyển duyệt/.test(await pt.textContent('#mform header')), 'Không mở bước chuyển duyệt sau khi lưu');
  await pt.click('#mform [type=submit]'); await pt.waitForSelector('#mform', { state: 'detached', timeout: 10000 }); await wait(400);
  check(((await data(kt)).addenda.find(x => x.number === 'PL-18B') || {}).status === 'Chờ kiểm tra', 'Lưu và chuyển duyệt chưa chuyển hồ sơ');
  // Thẻ Tôi đã chuyển, phiếu trình
  await go(pt, 'trinh-duyet'); await pt.evaluate(() => { S.tab.td2 = 'chuyen'; render(); }); await wait(300);
  check((await pt.textContent('#content')).includes('PL-18B'), 'Thẻ Tôi đã chuyển chưa có phụ lục vừa chuyển');
  await shot(pt, '9-toi-da-chuyen');
  // Quản trị: màn hình thiết lập quy trình
  await pa.reload(); await pa.waitForSelector('#app'); await wait(600);
  await go(pa, 'trinh-duyet'); await pa.evaluate(() => { S.tab.td2 = 'qt'; render(); }); await wait(300);
  check(/Tư vấn giám sát thẩm định/.test(await pa.textContent('#content')), 'Màn hình thiết lập quy trình chưa hiện các bước');
  await pa.click('[data-act=wf-edit][data-id=addenda]'); await pa.waitForSelector('#wfe_on'); await shot(pa, '10-thiet-lap-quy-trinh');
  await pa.click('[data-act=wfe-save]'); await pa.waitForSelector('#wfe_on', { state: 'detached', timeout: 10000 });

  /* ===== ĐỢT 3: danh mục nhà thầu, đơn vị giám sát; tài khoản thuộc đơn vị ===== */
  exp('Thêm nhà thầu vào danh mục', (await put(ad, 'orgs', { id: 'o18nt', kind: 'nt', name: 'Công ty Xây dựng Thử Nghiệm', taxCode: '1801234567', representative: 'Nguyễn Văn A', active: true })).status(), 200);
  exp('Thêm đơn vị giám sát', (await put(ad, 'orgs', { id: 'o18gs', kind: 'gs', name: 'Công ty Tư vấn Giám sát Thử Nghiệm', active: true })).status(), 200);
  const pk18 = { projectId: 'p1', method: 'Chỉ định thầu rút gọn', status: 'Đang thực hiện hợp đồng' };
  exp('Gói thầu chọn đơn vị không có trong danh mục', (await put(ad, 'packages', { ...pk18, id: 'k18bad', code: 'BAD', name: 'Sai', type: 'Xây lắp', estimate: 1e8, contractorIds: ['khong-co'] })).status(), 400);
  exp('Gói tư vấn chuẩn bị đầu tư', (await put(ad, 'packages', { ...pk18, id: 'k18cb', code: 'CBQ1', name: 'Tư vấn lập báo cáo kinh tế - kỹ thuật thử', type: 'Tư vấn', estimate: 4e8, phase: 'cb', contractorIds: ['o18nt'], supervisorIds: [] })).status(), 200);
  exp('Gói thi công chọn nhà thầu và giám sát', (await put(ad, 'packages', { ...pk18, id: 'k18dt', code: 'DTQ1', name: 'Thi công thử nghiệm', type: 'Xây lắp', estimate: 9e8, phase: 'dt', contractorIds: ['o18nt'], supervisorIds: ['o18gs'] })).status(), 200);
  const nu18 = await ad.r.post(BASE + '/api/users', { ...H, data: { username: 'nt18', name: 'Cán bộ nhà thầu', groupId: 'g-site', password: 'Admin2026', orgId: 'o18nt' } });
  exp('Tạo tài khoản thuộc nhà thầu', nu18.status(), 200);
  const nt18 = await who('nt18'); const dn18 = await data(nt18);
  exp('Tài khoản biết đơn vị của mình', dn18.orgId, 'o18nt');
  exp('Tài khoản nhà thầu chỉ thấy gói thầu của đơn vị', (dn18.packages || []).map(k => k.id).sort().join(','), 'k18cb,k18dt');
    check((await ad.r.delete(BASE + '/api/data/orgs/o18nt', H)).status() !== 200, 'Xóa được nhà thầu đang được chọn ở gói thầu');

  /* ===== ĐỢT 3: giai đoạn chuẩn bị đầu tư, nghiệm thu sản phẩm tư vấn theo giá trị ===== */
  exp('Hợp đồng tư vấn', (await put(kt, 'contracts', { id: 'c18cb', packageId: 'k18cb', projectId: 'p1', number: 'HD-CBQ1', contractor: 'Công ty Xây dựng Thử Nghiệm', value: 300000000, start: '2026-10-01', end: '2027-03-31' })).status(), 200);
  exp('Sản phẩm 1', (await put(kt, 'boq', { id: 'b18a', contractId: 'c18cb', code: 'SP1', name: 'Báo cáo kinh tế - kỹ thuật', unit: 'Sản phẩm', qty: 1, price: 200000000 })).status(), 200);
  exp('Sản phẩm 2', (await put(kt, 'boq', { id: 'b18b', contractId: 'c18cb', code: 'SP2', name: 'Hồ sơ thiết kế bản vẽ thi công', unit: 'Sản phẩm', qty: 1, price: 100000000 })).status(), 200);
  exp('Đợt nghiệm thu sản phẩm', (await put(kt, 'vbatches', { id: 'vb18', contractId: 'c18cb', name: 'Đợt 1', number: 'BB-01', date: '2026-11-15' })).status(), 200);
  exp('Nghiệm thu đủ sản phẩm 1', (await put(kt, 'volumes', { id: 'v18a', contractId: 'c18cb', boqId: 'b18a', batchId: 'vb18', date: '2026-11-15', period: 'Đợt 1', doneQty: 1, acceptedQty: 1 })).status(), 200);
  exp('Đợt 2', (await put(kt, 'vbatches', { id: 'vb18b', contractId: 'c18cb', name: 'Đợt 2', number: 'BB-02', date: '2026-11-16' })).status(), 200);
  exp('Chặn nghiệm thu vượt giá trị sản phẩm', (await put(kt, 'volumes', { id: 'v18b', contractId: 'c18cb', boqId: 'b18a', batchId: 'vb18b', date: '2026-11-16', period: 'Đợt 2', doneQty: 0.5, acceptedQty: 0.5 })).status(), 409);
  exp('Trình đợt nghiệm thu sản phẩm', (await act(kt, 'vbatches', 'vb18', 'submit')).status(), 200);
  exp('Đợt sản phẩm tư vấn bỏ bước giám sát xác nhận', (await data(kt)).vbatches.find(x => x.id === 'vb18').status, 'Chờ duyệt');
  exp('Lãnh đạo duyệt đợt', (await act(ld, 'vbatches', 'vb18', 'approve')).status(), 200);
  exp('Đợt sản phẩm đã duyệt', (await data(kt)).vbatches.find(x => x.id === 'vb18').status, 'Đã duyệt');
  // Giao diện: menu theo giai đoạn, danh mục đơn vị, nghiệm thu sản phẩm
  const pc18 = await page(kt, 'goi-thau'); await go(pc18, 'cb-goi-thau', { kq: 'Q1' });
  check(/Chuẩn bị đầu tư/.test(await pc18.textContent('#nav')) && /Thực hiện đầu tư/.test(await pc18.textContent('#nav')), 'Menu chưa chia theo giai đoạn');
  let tx18 = await pc18.textContent('#content'); check(tx18.includes('CBQ1') && !tx18.includes('DTQ1'), 'Mục Chuẩn bị đầu tư › Gói thầu chưa đúng giai đoạn');
  await go(pc18, 'goi-thau', { kq: 'Q1' }); tx18 = await pc18.textContent('#content'); check(tx18.includes('DTQ1') && !tx18.includes('CBQ1'), 'Mục Thực hiện đầu tư › Gói thầu chưa đúng giai đoạn');
  check(tx18.includes('Giám sát: Công ty Tư vấn Giám sát Thử Nghiệm'), 'Danh sách gói thầu chưa hiện đơn vị giám sát');
  await pc18.evaluate(() => ACT['open-pkg']('k18dt')); await wait(500);
  check(/Nhà thầu và đơn vị giám sát/.test(await pc18.textContent('#content')), 'Chi tiết gói thầu chưa có thẻ nhà thầu, giám sát');
  await pc18.evaluate(() => { S.sel.pkg = null; S.tab.gt = 'nt'; S.f.kq = ''; render(); }); await wait(300);
  check((await pc18.textContent('#content')).includes('1801234567'), 'Danh mục nhà thầu chưa hiện mã số thuế'); await shot(pc18, '11-danh-muc-nha-thau');
  await pc18.evaluate(() => { S.tab.gt = 'pkg'; }); await go(pc18, 'cb-thanh-toan', { ttcb: 'c18cb' }); await pc18.evaluate(() => { S.tab.ttcb = 'nt'; render(); }); await wait(300);
  tx18 = await pc18.textContent('#content'); check(tx18.includes('Sản phẩm theo hợp đồng') && tx18.includes('Đã nghiệm thu đủ'), 'Nghiệm thu sản phẩm chưa hiện tình trạng sản phẩm');
  check((await pc18.textContent('#top')).includes('Chuẩn bị đầu tư'), 'Tiêu đề chưa ghi giai đoạn');
  await shot(pc18, '12-nghiem-thu-san-pham');
  await pc18.evaluate(() => ACT['vb-new']('c18cb')); await pc18.waitForSelector('#mform .vb-grid');
  await pc18.fill('#mform tr[data-b=b18b] input', '150000000'); await pc18.click('#mform [type=submit]'); await wait(500);
  check(/vượt giá trị sản phẩm/.test(await pc18.textContent('#mform_err')), 'Biểu mẫu chưa chặn nghiệm thu vượt giá trị sản phẩm');
  await pc18.fill('#mform tr[data-b=b18b] input', '60000000'); await pc18.click('#mform [type=submit]'); await pc18.waitForSelector('#mform', { state: 'detached', timeout: 10000 }); await wait(400);
  check((await data(kt)).volumes.some(v => v.boqId === 'b18b' && Math.abs(v.acceptedQty - 0.6) < 1e-9), 'Chưa lưu giá trị nghiệm thu sản phẩm 2');
  // Khối lượng (thực hiện đầu tư) không liệt kê hợp đồng tư vấn chuẩn bị đầu tư
  await go(pc18, 'khoi-luong'); check(!(await pc18.$$eval('[data-f=klc] option', o => o.map(x => x.textContent))).some(x => x.includes('HD-CBQ1')), 'Quản lý khối lượng còn hợp đồng chuẩn bị đầu tư');

  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'KHÔNG CÓ LỖI');
  await b.close(); process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
