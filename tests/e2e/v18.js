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
    const s = (await r.post(BASE + '/api/auth/login', { ...H, data: { username: u, password: pw } })).status(); if (s !== 200) errs.push('Đăng nhập ' + u + ': ' + s); return { c, r }; };
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

  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'KHÔNG CÓ LỖI');
  await b.close(); process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
