// Kiểm thử đầu-cuối bằng Playwright: node tests/e2e/smoke.js [http://127.0.0.1:5080]
// Yêu cầu máy chủ chạy với cơ sở dữ liệu trống (lần đầu sẽ khởi tạo hệ thống kèm dữ liệu mẫu).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const PW = 'Admin2026';
const errs = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
// Mã TOTP (RFC 6238) như ứng dụng Google/Microsoft Authenticator, để kiểm thử xác thực 2 lớp
function totp(secret, offset = 0) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}

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
    await p.click('#setup button[type=submit]');
  } else throw new Error('Cần cơ sở dữ liệu trống');
  // Tài khoản quản trị bắt buộc thiết lập xác thực 2 lớp ngay sau khởi tạo
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); await p.screenshot({ path: `${SHOTS}/mfa-enroll.png` });
  const secret = await p.evaluate(() => S.mfaStep.secret);
  p._expectFail = true; await p.fill('#mf_code', '000000'); await p.click('#mfa button[type=submit]'); await p.waitForTimeout(400); p._expectFail = false;
  if (!(await p.textContent('#mf_err')).trim()) errs.push('Không báo lỗi khi nhập sai mã 2 lớp');
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]');
  await p.waitForSelector('#mfa .rcodes', { timeout: 10000 }); await p.screenshot({ path: `${SHOTS}/mfa-codes.png` });
  const rcodes = await p.evaluate(() => S.mfaStep.codes);
  if (rcodes.length !== 10) errs.push('Số mã khôi phục: ' + rcodes.length);
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const counts = await p.evaluate(() => Object.fromEntries(Object.entries(Store.data).map(([k, v]) => [k, v.length])));
  console.log('Số bản ghi sau khởi tạo:', JSON.stringify(counts));

  const routes = ['tong-quan', 'du-an', 'mo-hinh', 'goi-thau', 'tien-do', 'nhat-ky', 'khoi-luong', 'thanh-toan', 'bao-cao', 'quan-tri', 'hien-truong', 'doi-chieu', 'von', 'gpmb', 'nghiem-thu', 'quyet-toan'];
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
  await p.selectOption('#f_packageId', { index: 1 }); await p.fill('#f_works .wk-n', 'Đổ bê tông móng M1'); await p.fill('#f_works .wk-q', '12'); await p.fill('#f_works .wk-u', 'm3');
  await p.setInputFiles('#f_photos_new', img);
  await p.click('#mform [type=submit]'); await p.waitForTimeout(1500);
  const diary = await p.evaluate(() => Store.data.diaries.slice(-1)[0]);
  const nd1 = await p.evaluate(() => Store.data.diaries.length);
  console.log('Nhật ký:', nd0, '→', nd1, '| ảnh:', diary.photos && diary.photos[0] && diary.photos[0].url);
  if (diary.works !== 'Đổ bê tông móng M1 | 12 | m3') errs.push('Bảng công việc nhật ký lưu sai: ' + diary.works);
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

  // ===== Đợt 1: tệp đính kèm ở mọi màn hình nhập liệu =====
  const pdf = path.join(os.tmpdir(), 'QD-phe-duyet.pdf'); fs.writeFileSync(pdf, '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
  const pdf2 = path.join(os.tmpdir(), 'Bao-lanh.pdf'); fs.copyFileSync(pdf, pdf2);
  const attN = () => p.evaluate(() => Store.data.attachments.length);
  const attOf = (col, id, kind) => p.evaluate(([c, i, k]) => Store.data.attachments.filter(a => a.collection === c && a.recordId === i && (!k || a.kind === k)).length, [col, id, kind]);
  const submit = async () => { await p.click('#mform [type=submit]'); try { await p.waitForSelector('#mform', { state: 'detached', timeout: 15000 }); } catch (e) { throw new Error('Biểu mẫu không đóng: ' + (await p.textContent('#mform_err').catch(() => '?'))); } await p.waitForTimeout(300); };
  // Phiên bản 1.1, chức năng Ban QLDA cấp xã: vai trò, hình thức quản lý; kế hoạch vốn, GPMB, nghiệm thu bảo hành, quyết toán
  {
    const al = await p.evaluate(() => alerts().map(a => a.mod));
    for (const m of ['von', 'gpmb', 'nghiem-thu', 'quyet-toan']) if (!al.includes(m)) errs.push('C0: thiếu cảnh báo mẫu của phân hệ ' + m);
    await p.evaluate(() => ACT['edit-projects']('p1')); await p.waitForTimeout(200);
    if (await p.inputValue('#f_boardRole') !== 'Chủ đầu tư' || !(await p.$('#f_mgmtForm')) || !(await p.$('#f_decisionMaker'))) errs.push('C1: biểu mẫu dự án thiếu vai trò/hình thức quản lý');
    await submit();
    await go(p, 'von');
    for (const t of ['kh', 'q', 'gn']) { await p.click(`[data-g=von][data-id=${t}]`); await p.waitForTimeout(200); await p.screenshot({ path: `${SHOTS}/v11-von-${t}.png`, fullPage: true }); }
    const n0 = await p.evaluate(() => Store.data.capitals.length);
    await p.evaluate(() => ACT['add-capitals']()); await p.waitForTimeout(200);
    await p.selectOption('#f_projectId', 'p2'); await p.selectOption('#f_kind', 'Bổ sung kế hoạch năm'); await p.fill('#f_amount', '1000000000'); await p.fill('#f_number', 'BS-01');
    await submit();
    const plan = await p.evaluate(() => capPlan('p2', TODAY.slice(0, 4)));
    console.log('Kế hoạch vốn:', n0, '→', await p.evaluate(() => Store.data.capitals.length), '| KH năm DA-02:', plan);
    if (await p.evaluate(() => Store.data.capitals.length) !== n0 + 1) errs.push('C2: không thêm được kế hoạch vốn');
    await go(p, 'gpmb');
    await p.evaluate(() => ACT['add-clearances']()); await p.waitForTimeout(200);
    await p.selectOption('#f_projectId', 'p3'); await p.fill('#f_name', 'Khu vực thử'); await p.fill('#f_households', '5'); await p.fill('#f_householdsPaid', '7');
    await p.click('#mform [type=submit]'); await p.waitForTimeout(300);
    if (!(await p.textContent('#mform_err')).includes('lớn hơn')) errs.push('C3: không chặn số hộ chi trả vượt số hộ');
    await p.fill('#f_householdsPaid', '2'); await submit();
    await go(p, 'nghiem-thu');
    await p.evaluate(() => ACT['add-acceptances']()); await p.waitForTimeout(200);
    await p.selectOption('#f_projectId', 'p2'); await p.selectOption('#f_packageId', 'k1'); await p.selectOption('#f_kind', 'Nghiệm thu giai đoạn thi công');
    await p.click('#mform [type=submit]'); await p.waitForTimeout(300);
    if (!(await p.textContent('#mform_err')).includes('không thuộc')) errs.push('C4: không chặn gói thầu khác dự án');
    await p.selectOption('#f_packageId', 'k4'); await p.fill('#f_warrantyMonths', '12'); await submit();
    await p.click('[data-g=nt][data-id=bh]'); await p.waitForTimeout(200); await p.screenshot({ path: `${SHOTS}/v11-bao-hanh.png`, fullPage: true });
    await go(p, 'quyet-toan');
    await p.evaluate(() => ACT['add-settlements']('p4')); await p.waitForTimeout(200); await p.click('#mform header [data-close]'); await p.waitForTimeout(200);
    const rep = await p.evaluate(() => ({ gn: buildReport('giaingan', {}).rows.length, qt: buildReport('quyettoan', {}).rows.length }));
    console.log('Báo cáo giải ngân:', rep.gn, 'dòng | quyết toán:', rep.qt, 'dòng');
    if (!rep.gn || !rep.qt) errs.push('C5: báo cáo giải ngân/quyết toán trống');
    const uc = await p.evaluate(() => UCS.reduce((n, g) => n + g[2].length, 0));
    if (uc !== 77) errs.push('C6: danh mục chức năng ' + uc + ' (cần 77)');
    // Lãnh đạo UBND xã chỉ xem: đọc được kế hoạch vốn, không ghi được
    const c = await b.newContext(); const r = c.request;
    await r.post(BASE + '/api/auth/login', { headers: { 'X-QLDA': '1' }, data: { username: 'ubnd', password: PW } });
    const d = await (await r.get(BASE + '/api/data')).json();
    const w = (await r.put(BASE + '/api/data/capitals/vk2', { headers: { 'X-QLDA': '1' }, data: { ...d.capitals.find(x => x.id === 'vk2'), amount: 1 } })).status();
    console.log('UBND xã: thấy', d.capitals.length, 'kế hoạch vốn | sửa:', w);
    if (!d.capitals.length || w !== 403) errs.push('C7: phân quyền Lãnh đạo UBND xã sai');
    await c.close();
  }

  const putFiles = (key, files) => p.setInputFiles(`#f_${key} input[type=file]`, files);
  const openP = async id => { await go(p, 'du-an'); await p.evaluate(i => { S.sel.project = i; S.tab.proj = 'info'; render(); }, id); await p.waitForTimeout(200); };
  // A1: Quyết định phê duyệt dự án kèm tệp ngay trong biểu mẫu dự án
  await openP('p1'); await p.click('[data-act=edit-projects]'); await p.waitForTimeout(200);
  if (!(await p.inputValue('#f_decNo')).includes('215/QĐ')) errs.push('A1: không nạp số QĐ phê duyệt hiện có');
  await p.fill('#f_decDate_t', '20/01/2025'); await putFiles('decAtt', [pdf]); await submit();
  if (await attOf('legal', 'l2') !== 1) errs.push('A1: tệp QĐ phê duyệt chưa gắn vào hồ sơ pháp lý l2');
  if (!(await p.textContent('#content')).includes('QD-phe-duyet.pdf')) errs.push('A1: Thông tin chung chưa hiện tệp QĐ');
  await p.screenshot({ path: `${SHOTS}/dot1-du-an-thong-tin.png`, fullPage: true });
  // A1: dự án mới nhập số QĐ + tệp → tự tạo hồ sơ pháp lý
  await p.evaluate(() => ACT['add-project']()); await p.waitForTimeout(200);
  await p.fill('#f_code', 'DA-TEST'); await p.fill('#f_name', 'Dự án kiểm thử đính kèm'); await p.fill('#f_tmdt', '1000000000');
  await p.fill('#f_decNo', '99/QĐ-UBND'); await p.fill('#f_decDate_t', '01/10/2026'); await putFiles('decAtt', [pdf, img]); await submit();
  const newP = await p.evaluate(() => Store.data.projects.find(x => x.code === 'DA-TEST'));
  const newL = await p.evaluate(id => Store.data.legal.find(l => l.projectId === id && l.type === 'Quyết định phê duyệt dự án'), newP && newP.id);
  if (!newL || await attOf('legal', newL.id) !== 2 || !newP.decision.includes('99/QĐ-UBND')) errs.push('A1: dự án mới không tạo được QĐ phê duyệt kèm 2 tệp');
  // A2: công việc + hoàn thành kèm kết quả
  await openP('p1'); await p.click('[data-g=proj][data-id=tasks]'); await p.waitForTimeout(200);
  await p.click('[data-act=add-task]'); await p.waitForTimeout(200); await p.fill('#f_name', 'Công việc thử đính kèm'); await p.fill('#f_due_t', '31/12/2026'); await putFiles('att', [pdf]); await submit();
  const tk = await p.evaluate(() => Store.data.tasks.find(t => t.name === 'Công việc thử đính kèm'));
  await p.click(`[data-act=task-done][data-id="${tk.id}"]`); await p.waitForTimeout(200); await putFiles('att', [pdf2]); await submit();
  if (await attOf('tasks', tk.id, 'Văn bản giao việc') !== 1 || await attOf('tasks', tk.id, 'Kết quả') !== 1) errs.push('A2: thiếu tệp giao việc / kết quả');
  if ((await p.evaluate(id => Store.data.tasks.find(t => t.id === id).status, tk.id)) !== 'Hoàn thành') errs.push('A2: chưa chuyển Hoàn thành');
  // Hồ sơ pháp lý nhiều tệp + hiệu lực
  await p.click('[data-g=proj][data-id=legal]'); await p.waitForTimeout(200); await p.click('[data-act=add-legal]'); await p.waitForTimeout(200);
  await p.selectOption('#f_type', 'Giấy phép xây dựng'); await p.fill('#f_number', 'GPXD-TEST'); await p.fill('#f_date_t', '01/01/2026'); await p.fill('#f_title', 'Giấy phép thử');
  await p.fill('#f_validUntil', await p.evaluate(() => addDays(TODAY, 20))); await putFiles('att', [pdf, pdf2, img]); await submit();
  const gp = await p.evaluate(() => Store.data.legal.find(l => l.number === 'GPXD-TEST'));
  if (await attOf('legal', gp.id) !== 3) errs.push('A0: hồ sơ pháp lý không nhận 3 tệp');
  // A3: hạng mục
  await go(p, 'mo-hinh'); const it = await p.evaluate(() => Store.data.items[0].id);
  await p.evaluate(id => ACT['edit-items'](id), it); await p.waitForTimeout(200); await putFiles('att', [pdf]); await submit();
  if (await attOf('items', it) !== 1) errs.push('A3: hạng mục chưa có tệp');
  // A4: gói thầu: QĐ KHLCNT (đã có l6) + QĐ KQLCNT
  await go(p, 'goi-thau'); await p.evaluate(() => { S.sel.pkg = 'k1'; render(); }); await p.waitForTimeout(200);
  await p.click('[data-act=edit-packages]'); await p.waitForTimeout(200);
  if (!(await p.inputValue('#f_khNo')).includes('61/QĐ-UBND')) errs.push('A4: không nạp số QĐ KHLCNT');
  await putFiles('khAtt', [pdf]); await putFiles('kqAtt', [pdf2]); await submit();
  if (await attOf('legal', 'l6') !== 1 || await attOf('legal', 'l7') !== 1) errs.push('A4: tệp KHLCNT/KQLCNT chưa gắn');
  // A5: hợp đồng: bản ký + bảo lãnh, hiệu lực bảo lãnh sắp hết → cảnh báo
  const cid = await p.evaluate(() => Store.data.contracts.find(c => c.packageId === 'k1').id);
  await p.click(`[data-act=edit-contracts]`); await p.waitForTimeout(200);
  await p.fill('#f_guaranteeUntil', await p.evaluate(() => addDays(TODAY, 15))); await putFiles('att0', [pdf]); await putFiles('att1', [pdf2]); await submit();
  if (await attOf('contracts', cid, 'Hợp đồng đã ký') !== 1 || await attOf('contracts', cid, 'Bảo lãnh thực hiện hợp đồng') !== 1) errs.push('A5: tệp hợp đồng/bảo lãnh chưa gắn');
  if (!(await p.evaluate(() => alerts().some(a => a.text.includes('Bảo lãnh thực hiện HĐ') && a.text.includes('sắp hết hiệu lực'))))) errs.push('B5: không cảnh báo bảo lãnh sắp hết hạn');
  if (!(await p.evaluate(() => alerts().some(a => a.text.includes('GPXD-TEST'))))) errs.push('B5: không cảnh báo giấy phép sắp hết hạn');
  await p.click('[data-act=edit-contracts]'); await p.waitForTimeout(300); await putFiles('att2', [img]); await p.screenshot({ path: `${SHOTS}/dot1-form-hop-dong.png` }); await p.click('#mform [data-close]'); await p.waitForTimeout(200);
  // A6: phụ lục
  await p.click('[data-act=add-addendum]'); await p.waitForTimeout(200); await p.fill('#f_number', 'PL-TEST'); await p.fill('#f_date_t', '01/10/2026'); await p.fill('#f_content', 'Điều chỉnh thử'); await putFiles('att', [pdf]); await submit();
  const ad = await p.evaluate(() => Store.data.addenda.find(a => a.number === 'PL-TEST'));
  if (await attOf('addenda', ad.id) !== 1) errs.push('A6: phụ lục chưa có tệp');
  await p.screenshot({ path: `${SHOTS}/dot1-hop-dong.png`, fullPage: true });
  // A7, A8: tiến độ được duyệt + ảnh cập nhật tiến độ
  await go(p, 'tien-do'); const sid = await p.evaluate(() => Store.data.schedule.find(s => s.progress < 100).id);
  await p.evaluate(id => ACT['edit-schedule'](id), sid); await p.waitForTimeout(200); await putFiles('att', [pdf]); await submit();
  await p.evaluate(id => ACT['upd-sched'](id), sid); await p.waitForTimeout(200); await p.fill('#f_progress', '55'); await putFiles('att', [img]); await submit();
  if (await attOf('schedule', sid, 'Kế hoạch tiến độ') !== 1 || await attOf('schedule', sid, 'Cập nhật tiến độ') !== 1) errs.push('A7/A8: tệp tiến độ chưa gắn');
  const today = await p.evaluate(() => TODAY);
  if ((await p.evaluate(id => Store.data.attachments.find(a => a.recordId === id && a.kind === 'Cập nhật tiến độ').ref, sid)) !== today) errs.push('A8: ảnh cập nhật chưa gắn theo ngày');
  // A9: nhật ký: trang đã ký + chú thích ảnh, bỏ ảnh
  await go(p, 'nhat-ky');
  await p.evaluate(id => ACT['edit-diaries'](id), diary.id); await p.waitForTimeout(200); await putFiles('att', [pdf]); await submit();
  await p.evaluate(id => ACT['diary-photo'](id), diary.id); await p.waitForTimeout(300);
  await p.fill('[data-cap="0"]', 'Móng M1 sau khi đổ'); await submit();
  const dph = await p.evaluate(id => Store.data.diaries.find(d => d.id === id).photos, diary.id);
  if (await attOf('diaries', diary.id) !== 1 || dph[0].caption !== 'Móng M1 sau khi đổ') errs.push('A9: thiếu trang nhật ký đã ký hoặc chú thích ảnh');
  // A10, A11: bảng khối lượng gốc + biên bản nghiệm thu theo đợt
  await p.evaluate(() => { S.tab.kl = 'hd'; }); await go(p, 'khoi-luong'); const kcid = await p.evaluate(() => pickContract('klc'));
  await p.click('[data-act=att-boq]'); await p.waitForTimeout(200); await putFiles('att', [pdf]); await submit();
  await p.click('[data-act=add-vol]'); await p.waitForTimeout(200); await p.selectOption('#f_boqId', { index: 0 }); await p.fill('#f_period', 'Đợt thử'); await p.fill('#f_doneQty', '1'); await putFiles('att', [pdf]); await submit();
  if (await attOf('contracts', kcid, 'Bảng khối lượng hợp đồng') !== 1) errs.push('A10: bảng khối lượng gốc chưa gắn');
  if ((await p.evaluate(c => Store.data.attachments.filter(a => a.recordId === c && a.kind === 'Biên bản nghiệm thu' && a.ref === 'Đợt thử').length, kcid)) !== 1) errs.push('A11: biên bản nghiệm thu đợt chưa gắn');
  // A12, A13: kế hoạch thanh toán, hồ sơ thanh toán nhiều tệp, chứng từ Kho bạc khi xác nhận đã chi
  await go(p, 'thanh-toan'); await p.click('[data-g=tt][data-id=kh]'); await p.waitForTimeout(200);
  const pp = await p.evaluate(() => Store.data.payplans[0].id);
  await p.evaluate(id => ACT['edit-payplans'](id), pp); await p.waitForTimeout(200); await putFiles('att', [pdf]); await submit();
  await p.click('[data-g=tt][data-id=hs]'); await p.waitForTimeout(200);
  await p.click('[data-act=add-pay]'); await p.waitForTimeout(200); await p.selectOption('#f_contractId', await p.evaluate(() => Store.data.contracts.find(c => contractValue(c) - sum(Store.data.payments.filter(x => x.contractId === c.id && x.status !== 'Từ chối'), 'amount') > 1e6).id)); await p.fill('#f_number', 'TT-TEST'); await p.fill('#f_amount', '1000'); await putFiles('att', [pdf, pdf2]); await submit();
  const pay = await p.evaluate(() => Store.data.payments.find(x => x.number === 'TT-TEST'));
  await p.evaluate(id => ACT['pay-done'](id), pay.id); await p.waitForTimeout(200); await putFiles('att', [pdf]); await submit();
  if (await attOf('payplans', pp) !== 1 || await attOf('payments', pay.id, 'Hồ sơ đề nghị thanh toán') !== 2 || await attOf('payments', pay.id, 'Chứng từ Kho bạc') !== 1) errs.push('A12/A13: tệp thanh toán chưa đủ');
  if ((await p.evaluate(id => Store.data.payments.find(x => x.id === id).status, pay.id)) !== 'Đã thanh toán') errs.push('A13: chưa chuyển Đã thanh toán');
  await p.screenshot({ path: `${SHOTS}/dot1-thanh-toan.png`, fullPage: true });
  // B2: gỡ tệp trong biểu mẫu → thùng rác → khôi phục; xóa bản ghi → tệp vào thùng rác
  await p.evaluate(id => ACT['edit-payments'](id), pay.id); await p.waitForTimeout(200);
  await p.click('#f_att li[data-aid] [data-attdel]'); await submit();
  if (await attOf('payments', pay.id, 'Hồ sơ đề nghị thanh toán') !== 1) errs.push('B2: gỡ tệp không được');
  await p.evaluate(id => { ACT.del(id, { dataset: { col: 'addenda' } }); }, ad.id); await p.waitForTimeout(300); await p.click('#cf_ok'); await p.waitForTimeout(800);
  if (await attOf('addenda', ad.id) !== 0) errs.push('B2: xóa bản ghi nhưng tệp còn hiện');
  console.log('Tệp đính kèm sau đợt 1:', await attN());
  await go(p, 'quan-tri'); await p.click('[data-g=qt][data-id=files]'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${SHOTS}/dot1-kho-tep.png`, fullPage: true });
  const trash = await p.evaluate(() => ADM.storage && ADM.storage.trash.length);
  if (trash !== 2) errs.push('B2: thùng rác có ' + trash + ' tệp (mong đợi 2)');
  const n0 = await attOf('payments', pay.id);
  const trPay = await p.evaluate(id => ADM.storage.trash.find(a => a.recordId === id).id, pay.id);
  await p.click(`[data-act=att-restore][data-id="${trPay}"]`); await p.waitForTimeout(1500);
  if (await attOf('payments', pay.id) !== n0 + 1) errs.push('B2: khôi phục tệp từ thùng rác không được');
  p._expectFail = true;
  const trAd = await p.evaluate(() => ADM.storage.trash.find(a => a.collection === 'addenda').id);
  const rr = await p.evaluate(async id => (await fetch('/api/attachments/' + id + '/restore', { method: 'POST', headers: { 'X-QLDA': '1' } })).status, trAd);
  p._expectFail = false;
  if (rr !== 409) errs.push('B2: khôi phục tệp của bản ghi đã xóa phải báo 409, nhận ' + rr);
  // B3: sao lưu lên máy chủ + bản đầy đủ .zip
  await p.click('[data-g=qt][data-id=sys]'); await p.waitForTimeout(800);
  await p.click('[data-act=backup-now]'); await p.waitForTimeout(2000);
  const nb = await p.evaluate(() => ADM.auto && ADM.auto.items.length);
  if (!nb) errs.push('B3: chưa có bản sao lưu trên máy chủ');
  await p.screenshot({ path: `${SHOTS}/dot1-sao-luu.png`, fullPage: true });
  const [zdl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('[data-act=backup-full]')]);
  const zbuf = fs.readFileSync(await zdl.path());
  const zfiles = (zbuf.toString('latin1').match(/files\/\d{4}\//g) || []).length;
  console.log('Sao lưu đầy đủ:', zdl.suggestedFilename(), Math.round(zbuf.length / 1024) + ' KB,', zfiles, 'mục tệp; bản tự động:', nb);
  if (zbuf.readUInt32LE(0) !== 0x04034b50 || zfiles < 10) errs.push('B3: tệp .zip không đúng');
  // B1: lấy mã tệp của dự án p2 để kiểm tra tài khoản giới hạn phạm vi (p1)
  await go(p, 'du-an'); await p.evaluate(() => { S.sel.project = 'p2'; S.tab.proj = 'info'; render(); }); await p.waitForTimeout(200);
  await p.click('[data-act=edit-projects]'); await p.waitForTimeout(200); await putFiles('decAtt', [pdf]); await submit();
  var fileP2 = await p.evaluate(() => Store.data.attachments.find(a => a.projectId === 'p2').fileId);
  var fileP1 = await p.evaluate(() => Store.data.attachments.find(a => a.recordId === 'l2').fileId);
  await p.evaluate(() => { S.tab.qt = 'users'; S.sel.project = null; });

  // Quản trị: thêm người dùng, phân quyền nhóm, nhật ký
  await go(p, 'quan-tri');
  await p.click('[data-act=add-user]'); await p.waitForTimeout(200);
  await p.fill('#f_username', 'canbo1'); await p.fill('#f_name', 'Cán bộ thử nghiệm'); await p.selectOption('#f_groupId', 'g-tech'); await p.fill('#f_pw', 'Canbo2026');
  await p.click('#mform [type=submit]');
  const userOk = await p.waitForFunction(() => Store.data.users.some(u => u.username === 'canbo1'), null, { timeout: 8000 }).then(() => true, () => false);
  if (!userOk) errs.push('Không thêm được người dùng: ' + (await p.evaluate(() => { const t = document.querySelector('#toast'); const e = document.querySelector('#mform_err'); return [(e && e.textContent) || '', t && !t.hidden ? t.textContent : ''].join(' | '); })));
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
  m._expectFail = true;
  const f2 = await m.evaluate(async id => (await fetch('/api/files/' + id)).status, fileP2);
  const f1 = await m.evaluate(async id => (await fetch('/api/files/' + id)).status, fileP1);
  const up2 = await m.evaluate(async () => { const fd = new FormData(); fd.append('file', new Blob(['x'], { type: 'text/plain' }), 'a.txt'); fd.append('collection', 'schedule'); fd.append('recordId', Store.data.schedule[0].id); return (await fetch('/api/attachments', { method: 'POST', headers: { 'X-QLDA': '1' }, body: fd })).status; });
  const up3 = await m.evaluate(async () => { const fd = new FormData(); fd.append('file', new Blob(['x'], { type: 'text/plain' }), 'a.txt'); fd.append('collection', 'payments'); fd.append('recordId', 'x'); return (await fetch('/api/attachments', { method: 'POST', headers: { 'X-QLDA': '1' }, body: fd })).status; });
  m._expectFail = false;
  console.log('B1 giám sát: tệp dự án ngoài phạm vi', f2, '; trong phạm vi', f1, '; đính kèm tiến độ', up2, '; đính kèm thanh toán', up3);
  if (f2 !== 403 || f1 !== 200 || up2 !== 200 || up3 !== 403) errs.push('B1: phân quyền tệp sai');
  if (await m.evaluate(() => Store.data.attachments.some(a => a.projectId && a.projectId !== 'p1'))) errs.push('B1: giám sát thấy tệp đính kèm dự án khác');
  console.log('Giám sát thấy', await m.evaluate(() => Store.data.projects.length), 'dự án, logs', await m.evaluate(() => Store.data.logs.length));

  // Quản trị đặt lại mật khẩu: phiên đang mở của giám sát phải hết hiệu lực
  const r1 = await p.evaluate(async () => (await fetch('/api/users/u-giamsat/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: JSON.stringify({ password: 'Moi2026abc' }) })).status);
  m._expectFail = true;
  const r2 = await m.evaluate(async () => (await fetch('/api/data')).status);
  m._expectFail = false;
  console.log('Đặt lại mật khẩu:', r1, '→ phiên cũ của giám sát:', r2);
  if (r1 !== 200 || r2 !== 401) errs.push('Phiên cũ vẫn dùng được sau khi đặt lại mật khẩu');

  // Tên đăng nhập không tồn tại: báo sai thông tin (401), không lỗi máy chủ
  const ctx4 = await b.newContext(); const q4 = await ctx4.newPage();
  const nx = await q4.request.post(BASE + '/api/auth/login', { headers: { 'X-QLDA': '1' }, data: { username: 'khongtontai', password: 'abc12345' } });
  if (nx.status() !== 401) errs.push('Đăng nhập tài khoản không tồn tại trả ' + nx.status());

  // Xác thực 2 lớp: đăng nhập lại quản trị bằng mã khôi phục, mã đã dùng không dùng lại được
  const ctx5 = await b.newContext({ viewport: { width: 1280, height: 860 } }); const a2 = await ctx5.newPage(); watch(a2, 'admin2');
  await a2.goto(BASE + '/'); await a2.waitForSelector('#login'); await a2.fill('#lg_user', 'admin'); await a2.fill('#lg_pw', PW); await a2.click('#login button[type=submit]');
  await a2.waitForSelector('#mfa #mf_code'); await a2.screenshot({ path: `${SHOTS}/mfa-verify.png` });
  a2._expectFail = true;
  if ((await a2.evaluate(async () => (await fetch('/api/data')).status)) !== 401) errs.push('Chưa nhập mã 2 lớp mà đã vào được dữ liệu');
  a2._expectFail = false;
  await a2.click('#mf_alt'); await a2.fill('#mf_code', rcodes[0]); await a2.click('#mfa button[type=submit]'); await a2.waitForSelector('#app', { timeout: 15000 });
  const rc = await ctx5.request.post(BASE + '/api/auth/logout', { headers: { 'X-QLDA': '1' } });
  await ctx5.request.post(BASE + '/api/auth/login', { headers: { 'X-QLDA': '1' }, data: { username: 'admin', password: PW } });
  const reuse = await ctx5.request.post(BASE + '/api/auth/mfa', { headers: { 'X-QLDA': '1' }, data: { code: rcodes[0], recovery: true } });
  if (reuse.status() !== 400 || rc.status() !== 200) errs.push('Mã khôi phục dùng lại được: ' + reuse.status());

  // Tài khoản quản trị thứ hai: thiết lập 2 lớp qua API, quản trị chính đặt lại thì phiên của người đó hết hiệu lực
  const cu = await p.evaluate(async () => (await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: JSON.stringify({ username: 'qt2', name: 'Quản trị 2', groupId: 'g-admin', password: 'Admin2026' }) })).json());
  const ctx6 = await b.newContext(); const rq = ctx6.request, H = { 'X-QLDA': '1' };
  const ch = await (await rq.post(BASE + '/api/auth/login', { headers: H, data: { username: 'qt2', password: PW } })).json();
  if (ch.mfa !== 'enroll' || !ch.secret) errs.push('Quản trị mới không bị yêu cầu thiết lập 2 lớp: ' + JSON.stringify(ch).slice(0, 80));
  const ok2 = await rq.post(BASE + '/api/auth/mfa', { headers: H, data: { code: totp(ch.secret) } });
  const d1 = (await rq.get(BASE + '/api/data')).status();
  const rs2 = await p.evaluate(async id => (await fetch('/api/users/' + id + '/reset-2fa', { method: 'POST', headers: { 'X-QLDA': '1' } })).status, cu.id);
  const d2 = (await rq.get(BASE + '/api/data')).status();
  console.log('Quản trị 2: bật 2 lớp', ok2.status(), '→ dữ liệu', d1, '; đặt lại 2 lớp', rs2, '→ phiên cũ', d2);
  if (ok2.status() !== 200 || d1 !== 200 || rs2 !== 200 || d2 !== 401) errs.push('Luồng đặt lại 2 lớp sai');
  await p.evaluate(() => { S.tab.qt = 'users'; return Store.load(); }); await go(p, 'quan-tri'); await p.screenshot({ path: `${SHOTS}/mfa-users.png` });

  // ===== Bản 1.0: thông tin đơn vị, giao diện và hướng dẫn sử dụng theo vai trò =====
  {
    // các phiên cũ đã bị đặt lại mật khẩu/2 lớp: đóng lại để không ghi nhận lỗi 401 khi tự làm mới
    m._expectFail = true; a2._expectFail = true; await m.context().close(); await a2.context().close();
    await p.evaluate(() => Store.load());
    const gd = await p.evaluate(() => Store.data.guides.map(g => ({ id: g.id, t: g.title, g: g.groups, n: Store.data.attachments.filter(a => a.collection === 'guides' && a.recordId === g.id).length })));
    console.log('Hướng dẫn nạp sẵn:', gd.length, gd.map(x => x.n).join(','));
    if (gd.length !== 7 || gd.some(x => x.n !== 1)) errs.push("Chưa nạp sẵn đủ 7 hướng dẫn kèm tệp PDF");
    // Thông tin đơn vị
    await p.evaluate(() => { S.tab.qt = 'org'; }); await go(p, 'quan-tri'); await p.waitForTimeout(300);
    await p.fill('#br_appName', 'Phần mềm QLDA thử nghiệm'); await p.fill('#br_orgShort', 'Đơn vị thử'); await p.fill('#br_footer', '© {năm} Đơn vị thử');
    await p.click('[data-act=brand-save]'); await p.waitForTimeout(600);
    if ((await p.textContent('#brand_app')) !== 'Phần mềm QLDA thử nghiệm' || (await p.textContent('#brand_org')) !== 'Đơn vị thử') errs.push('Thanh bên chưa đổi tên phần mềm/đơn vị');
    await p.setInputFiles('#br_logo', img); await p.waitForTimeout(1200);
    if (!(await p.$('#brandmark img'))) errs.push('Logo chưa hiện trên thanh bên');
    await p.screenshot({ path: `${SHOTS}/v10-don-vi.png`, fullPage: true });
    const anon = await b.newContext(); const ar = anon.request;
    const br = await (await ar.get(BASE + '/api/branding')).json(); const lg = (await ar.get(BASE + br.logo)).status();
    console.log('Thông tin đơn vị (khách):', br.appName, '| logo', lg);
    if (br.appName !== 'Phần mềm QLDA thử nghiệm' || lg !== 200) errs.push('Trang đăng nhập không lấy được thông tin đơn vị/logo');
    const ap = await anon.newPage(); await ap.goto(BASE + '/'); await ap.waitForSelector('#login');
    const foot = await ap.textContent('.auth-foot');
    if (!foot.includes('Đơn vị thử') || !foot.includes(String(new Date().getFullYear())) || !(await ap.$('.seal img'))) errs.push('Trang đăng nhập chưa dùng chân trang/logo mới: ' + foot);
    await ap.screenshot({ path: `${SHOTS}/v10-dang-nhap.png` });
    const denyBr = (await ar.put(BASE + '/api/branding', { headers: { 'X-QLDA': '1' }, data: { appName: 'x' } })).status();
    if (denyBr !== 401) errs.push('Khách sửa được thông tin đơn vị: ' + denyBr);
    // Hướng dẫn mới cho Tư vấn giám sát kèm video
    const mp4 = path.join(os.tmpdir(), 'Video-ghi-nhat-ky.mp4'); fs.writeFileSync(mp4, Buffer.alloc(2048, 1));
    await go(p, 'huong-dan'); await p.click('[data-act=add-guide]'); await p.waitForTimeout(200);
    await p.fill('#f_title', 'Video: ghi nhật ký trên điện thoại'); await p.fill('#f_category', 'Video hướng dẫn');
    await p.check('#f_groups input[value="g-site"]'); await p.fill('#f_content', 'Xem video 3 phút.'); await putFiles('att', [mp4]); await submit();
    const vg = await p.evaluate(() => Store.data.guides.find(g => g.title.startsWith('Video:')));
    if (!vg || vg.groups.join() !== 'g-site' || await attOf('guides', vg.id) !== 1) errs.push('Không thêm được hướng dẫn kèm video');
    if (!(await p.$('.guide-video video'))) errs.push('Trang hướng dẫn chưa hiện video');
    await p.screenshot({ path: `${SHOTS}/v10-huong-dan-qt.png`, fullPage: true });
    // Mỗi vai trò chỉ thấy hướng dẫn của mình
    const roleView = async (u, pw = PW) => { const c = await b.newContext(); const r = c.request;
      await r.post(BASE + '/api/auth/login', { headers: { 'X-QLDA': '1' }, data: { username: u, password: pw } });
      const d = await (await r.get(BASE + '/api/data')).json(); return { c, r, d }; };
    const gs = await roleView('giamsat', 'Moi2026abc'), ke = await roleView('ketoan');
    const gsT = gs.d.guides.map(g => g.title), keT = ke.d.guides.map(g => g.title);
    console.log('TVGS thấy:', gsT.length, '| Kế toán thấy:', keT.length);
    if (!gsT.some(t => t.includes('Tư vấn giám sát')) || !gsT.some(t => t.startsWith('Video:')) || gsT.some(t => t.includes('Kế toán') || t.includes('Quản trị'))) errs.push('TVGS thấy sai hướng dẫn: ' + gsT.join(' | '));
    if (keT.length !== 1 || !keT[0].includes('Kế toán')) errs.push('Kế toán thấy sai hướng dẫn: ' + keT.join(' | '));
    const keGuide = gd.find(x => x.t.includes('Kế toán')); const keFile = await p.evaluate(id => Store.data.attachments.find(a => a.collection === 'guides' && a.recordId === id).fileId, keGuide.id);
    const gsFile = await p.evaluate(id => Store.data.attachments.find(a => a.collection === 'guides' && a.recordId === id).fileId, vg.id);
    const s1 = (await gs.r.get(BASE + '/api/files/' + keFile)).status(), s2 = (await gs.r.get(BASE + '/api/files/' + gsFile)).status();
    const s3 = (await gs.r.put(BASE + '/api/data/guides/' + vg.id, { headers: { 'X-QLDA': '1' }, data: { ...vg, title: 'sửa trái phép' } })).status();
    console.log('TVGS mở tệp HDSD Kế toán:', s1, '| mở video của mình:', s2, '| sửa hướng dẫn:', s3);
    if (s1 !== 403 || s2 !== 200 || s3 !== 403) errs.push('Phân quyền tệp/sửa hướng dẫn sai');
    const gp = await gs.c.newPage(); await gp.goto(BASE + '/#huong-dan'); await gp.waitForSelector('.guide', { timeout: 15000 });
    if (await gp.$('[data-act=add-guide]')) errs.push('TVGS thấy nút thêm hướng dẫn');
    if ((await gp.$$('.guide-doc')).length !== 2 || !(await gp.$('.guide-video video'))) errs.push('TVGS không thấy tệp PDF/video của hướng dẫn');
    await gp.screenshot({ path: `${SHOTS}/v10-huong-dan-gs.png`, fullPage: true });
    await gs.c.close(); await ke.c.close(); await anon.close();
    // Khôi phục mặc định, xóa logo
    await p.evaluate(() => { S.tab.qt = 'org'; }); await go(p, 'quan-tri');
    await p.evaluate(() => api('PUT', '/api/branding', {}).then(setBrand)); await p.evaluate(() => api('DELETE', '/api/branding/logo').then(setBrand));
    const br2 = await p.evaluate(() => BR);
    if (br2.logo || br2.appName !== 'Quản lý dự án, nhiệm vụ') errs.push('Không khôi phục được thông tin mặc định');
  }

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
