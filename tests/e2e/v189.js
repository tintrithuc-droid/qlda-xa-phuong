// Kiểm thử bản 1.8.9: lưu vết tiến trình hồ sơ theo vai trò. A dòng thời gian; B thẻ Theo vai trò; C ngày làm việc, nhắc trước, báo cấp trên;
// D lịch sử thay đổi từng hồ sơ; E công việc theo người thực hiện. Đổi thử thiết lập quy trình rồi trả lại như cũ; sửa ghi chú một công việc.
// node tests/e2e/v189.js [http://127.0.0.1:5080]   (chạy sau smoke.js)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });
const PW = process.env.ADMIN_PW || 'Admin2026', USER = process.env.ADMIN_USER || 'admin';
const errs = [], ok = [];
const check = (cond, msg) => { (cond ? ok : errs).push(msg); console.log((cond ? 'ĐẠT  ' : 'LỖI  ') + msg); };
function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(x => parseInt(x, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const H = { headers: { 'X-QLDA': '1' } };
  const lr = await ctx.request.post(BASE + '/api/auth/login', { ...H, data: { username: USER, password: PW } });
  if (lr.status() !== 200) throw new Error('Đăng nhập quản trị: ' + lr.status());
  const sec = fs.existsSync(SHOTS + '/admin-totp.txt') ? fs.readFileSync(SHOTS + '/admin-totp.txt', 'utf8').trim() : '';
  if (sec) { let m = await ctx.request.post(BASE + '/api/auth/mfa', { ...H, data: { code: totp(sec) } });
    if (m.status() !== 200) { await new Promise(r => setTimeout(r, 31000 - Date.now() % 30000)); m = await ctx.request.post(BASE + '/api/auth/mfa', { ...H, data: { code: totp(sec) } }); }
    if (m.status() !== 200) throw new Error('Mã 2 lớp: ' + m.status()); }
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto(BASE + '/'); await p.waitForSelector('#app', { timeout: 30000 });
  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(500); };

  // C. Ngày làm việc: bỏ thứ Bảy, Chủ nhật, ngày nghỉ
  const wd = await p.evaluate(() => ({ a: wdBetween('2026-11-20', '2026-11-23', new Set()), b: wdBetween('2026-11-20', '2026-11-24', new Set(['2026-11-23'])),
    c: wdLate('2026-11-20', '2026-11-21'), d: wdLate('2026-11-20', '2026-11-20'), e: wdBetween('2026-11-23', '2026-11-20', new Set()) }));
  check(wd.a === 1 && wd.b === 1 && wd.e === -1, 'Đếm ngày làm việc bỏ thứ Bảy, Chủ nhật và ngày nghỉ');
  check(wd.c === 1 && wd.d === 0, 'Quá hạn vào ngày nghỉ vẫn tính trễ 1 ngày; đúng ngày hạn chưa trễ');
  // Thiết lập: ngày nghỉ, nhắc trước, báo cấp trên được lưu và chuẩn hóa ở máy chủ
  const cfg0 = await (await ctx.request.get(BASE + '/api/workflow', H)).json();
  const cfg1 = JSON.parse(JSON.stringify(cfg0));
  cfg1.holidays = ['2027-01-01', 'sai', '2027-01-01', '2026-12-31'];
  const st = cfg1.flows.payments.steps[0]; st.remindDays = 99; st.escalateDays = 3; st.escalateGroups = [cfg0 && (await p.evaluate(() => S.user.groupId))]; st.escalateUsers = ['', 'x'];
  const pr = await ctx.request.put(BASE + '/api/workflow', { ...H, data: cfg1 });
  const cfg2 = pr.status() === 200 ? await pr.json() : {};
  const s2 = cfg2.flows ? cfg2.flows.payments.steps[0] : {};
  check(JSON.stringify(cfg2.holidays) === '["2026-12-31","2027-01-01"]', 'Ngày nghỉ được lọc ngày sai, bỏ trùng, xếp theo ngày');
  check(s2.remindDays === 30 && s2.escalateDays === 3 && s2.escalateGroups.length === 1 && JSON.stringify(s2.escalateUsers) === '["x"]', 'Nhắc trước, trễ báo lên, người nhận được lưu và giới hạn');
  // Giao diện thiết lập: ô ngày nghỉ, ô nhắc trước, báo lên
  await p.evaluate(c => { Store.meta.wf = c; S.tab.td2 = 'qt'; }, cfg2); await go('trinh-duyet'); await p.evaluate(() => render()); await p.waitForTimeout(300);
  check(await p.evaluate(() => /Ngày nghỉ lễ, tết/.test(document.body.innerText) && !!document.querySelector('[data-act="wf-hol-rm"][data-id="2027-01-01"]')), 'Thiết lập quy trình có mục ngày nghỉ lễ, tết');
  check(await p.evaluate(() => /nhắc trước 30 ngày; trễ 3 ngày báo/.test(document.body.innerText)), 'Mô tả bước ghi nhắc trước, trễ báo lên');
  await p.click('[data-act="wf-edit"][data-id="payments"]'); await p.waitForTimeout(300);
  check(await p.evaluate(() => !!document.querySelector('[data-wfe="0|remindDays"]') && !!document.querySelector('[data-wfe="0|escalateDays"]') && document.querySelectorAll('[data-wfeg="0"]:checked').length === 1), 'Sửa bước có ô nhắc trước, trễ báo lên, chọn nhóm nhận báo');
  await p.evaluate(() => closeModal());
  check(await p.evaluate(() => wfEscTarget({ escalateGroups: [S.user.groupId] }) && !wfEscTarget({ escalateGroups: ['khac'], escalateUsers: [] })), 'Người thuộc nhóm nhận báo trễ hạn được báo');
  // trả thiết lập như cũ
  const rs = await ctx.request.put(BASE + '/api/workflow', { ...H, data: cfg0 });
  check(rs.status() === 200, 'Trả lại thiết lập quy trình như trước khi thử');
  await p.evaluate(c => { Store.meta.wf = c; }, await rs.json());

  // A. Dòng thời gian của hồ sơ đã qua trình duyệt
  const rec = await p.evaluate(() => { for (const col of Object.keys(WF)) { const r = D(col).find(x => wfLogs(col, x.id).some(a => a.route)); if (r) return col + '|' + r.id; } return null; });
  if (rec) {
    await p.evaluate(k => ACT.wf(k + '|history'), rec); await p.waitForTimeout(400);
    check(await p.evaluate(() => !!document.querySelector('#ov .tl .tl-i') && /Lập và chuyển duyệt/.test(document.querySelector('#ov').innerText) && /Người chuyển:/.test(document.querySelector('#ov').innerText)), 'Tiến trình xử lý: dòng thời gian từ người lập, người chuyển, thời gian');
    check(await p.evaluate(() => /giữ (trong ngày|\d+ ngày làm việc)/.test(document.querySelector('#ov').innerText)), 'Mỗi bước ghi thời gian giữ theo ngày làm việc');
    await p.evaluate(() => { const d = document.querySelector('#ov details.rhist'); d.open = true; d.dispatchEvent(new Event('toggle')); }); await p.waitForTimeout(800);
    check(await p.evaluate(() => !/Đang tải/.test(document.querySelector('#ov details.rhist').innerText)), 'Tiến trình có mục Lịch sử thay đổi, tải được');
    await p.screenshot({ path: SHOTS + '/v189-tien-trinh.png' });
    await p.evaluate(() => closeModal());
  } else check(false, 'Có hồ sơ đã chuyển duyệt để xem tiến trình (chạy sau smoke.js)');

  // D. Lịch sử thay đổi: sửa ghi chú một công việc, nhật ký ghi rõ "ghi chú"
  const tid = await p.evaluate(async () => { const t = D('tasks')[0]; if (!t) return null; await save('tasks', { ...t, note: 'Kiểm thử 1.8.9 ' + Date.now() }); return t.id; });
  if (tid) {
    const hs = await (await ctx.request.get(BASE + '/api/data/history/tasks/' + tid, H)).json();
    check(Array.isArray(hs) && hs[0] && hs[0].action === 'Cập nhật' && /\(ghi chú\)/.test(hs[0].target), 'Nhật ký từng hồ sơ ghi người, thời gian và thông tin đã đổi (ghi chú)');
    const bad = await ctx.request.get(BASE + '/api/data/history/khongco/' + tid, H);
    check(bad.status() === 400, 'Lịch sử thay đổi từ chối loại dữ liệu không có');
    await p.evaluate(id => ACT['edit-tasks'](id), tid); await p.waitForTimeout(300);
    check(await p.evaluate(() => !!document.querySelector('#mform details.rhist')), 'Biểu mẫu sửa hồ sơ có mục Lịch sử thay đổi');
    await p.evaluate(() => { const d = document.querySelector('#mform details.rhist'); d.open = true; d.dispatchEvent(new Event('toggle')); }); await p.waitForTimeout(800);
    check(await p.evaluate(() => /ghi chú/.test(document.querySelector('#mform details.rhist').innerText)), 'Mở Lịch sử thay đổi thấy lần sửa vừa rồi');
    await p.evaluate(() => closeModal());
  } else check(false, 'Có công việc để thử lịch sử thay đổi');

  // B. Theo vai trò
  await p.evaluate(() => { S.tab.td2 = 'vt'; S.f.vtg = ''; }); await go('tong-quan'); await go('trinh-duyet');
  check(await p.evaluate(() => [...document.querySelectorAll('.tabs button')].some(x => /Theo vai trò/.test(x.textContent))), 'Trình duyệt hồ sơ có thẻ Theo vai trò');
  const cards = await p.evaluate(() => [...document.querySelectorAll('.vtc button')].map(x => x.dataset.id));
  check(cards.includes('__tasks'), 'Có thẻ Công việc dự án');
  check(await p.evaluate(() => !!document.querySelector('[data-act="vt-xlsx"]')), 'Danh sách theo vai trò có nút Xuất Excel');
  const role = cards.find(x => x && x !== '__tasks');
  if (role) { await p.click(`.vtc button[data-id="${role}"]`); await p.waitForTimeout(300);
    check(await p.evaluate(r => S.f.vtg === r && document.querySelector('.vtc button.on') && /hồ sơ đang giữ/.test(document.body.innerText), role), 'Bấm thẻ vai trò lọc hồ sơ nhóm đó đang giữ'); }
  const dl = p.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await p.evaluate(() => ACT['vt-xlsx']()); const f = await dl;
  check(!!f && /HoSoDangXuLy_/.test(f.suggestedFilename()), 'Xuất Excel hồ sơ đang xử lý theo vai trò');
  await p.click('.vtc button[data-id="__tasks"]'); await p.waitForTimeout(300);
  check(await p.evaluate(() => /Công việc theo người thực hiện/.test(document.body.innerText)), 'Thẻ Công việc dự án mở bảng theo người thực hiện');
  await p.screenshot({ path: SHOTS + '/v189-theo-vai-tro.png' });
  // Thông báo, cảnh báo trễ hạn
  const al = await p.evaluate(() => { const c = Object.keys(WF).find(k => D(k).some(r => wfWaiting(k, r))); if (!c) return 'skip';
    const r = D(c).find(x => wfWaiting(c, x)); const l = wfState(c, r).last; if (!l) return 'skip'; const o = l.due; l.due = '2026-01-05';
    const a = alerts({ all: true }).some(x => x.kind === 'Trình duyệt' && /trễ hạn/.test(x.text)); l.due = o; return a; });
  check(al === true || al === 'skip', 'Trung tâm cảnh báo có hồ sơ trình duyệt trễ hạn');

  // E. Công việc theo người thực hiện trong dự án
  const pid = await p.evaluate(() => (D('tasks')[0] || {}).projectId);
  await p.evaluate(id => { S.sel.project = id; S.tab.proj = 'tasks'; S.f.tview = 'person'; }, pid); await go('tong-quan'); await go('du-an');
  check(await p.evaluate(() => /Công việc theo người thực hiện/.test(document.body.innerText) && /Việc trễ lâu nhất/.test(document.body.innerText)), 'Dự án: xem công việc theo người thực hiện (đang làm, quá hạn, đúng hạn, trễ lâu nhất)');
  await p.click('[data-act="tview"][data-id="list"]'); await p.waitForTimeout(300);
  check(await p.evaluate(() => /Công việc thuộc dự án/.test(document.body.innerText)), 'Chuyển lại xem danh sách công việc');

  // Điện thoại: không tràn ngang ở Theo vai trò
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => { S.tab.td2 = 'vt'; S.f.vtg = ''; }); await go('tong-quan'); await go('trinh-duyet');
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Điện thoại: thẻ Theo vai trò không tràn ngang');

  await b.close();
  console.log(`\n${ok.length} đạt, ${errs.length} lỗi`); if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
