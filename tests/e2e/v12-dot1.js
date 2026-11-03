// Kiểm thử bản 1.2 đợt 1 (lỗi đối chiếu TT Thủy sản): tiến độ theo giá trị hợp đồng, phụ lục chưa duyệt,
// tình trạng đợt kế hoạch thanh toán, cảnh báo quá hạn không tự mất.
// Chạy sau smoke.js trên cùng máy chủ: node tests/e2e/v12-dot1.js [http://127.0.0.1:5080]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#login'); await p.fill('#lg_user', 'ubnd'); await p.fill('#lg_pw', 'Admin2026');
  await p.click('#login button[type=submit]'); await p.waitForSelector('#app', { timeout: 15000 });
  const r = await p.evaluate(() => {
    const T = 1e9, d = Store.data, add = (c, xs) => d[c].push(...xs);
    const days = n => isoLocal(new Date(Date.now() + n * 864e5));
    // Ví dụ DA-BUG01 của TT Thủy sản: gói xây lắp 240 tỷ, gói mua sắm 5 tỷ, hạng mục Nhà điều hành có đầu việc ở cả 2 gói
    add('projects', [{ id: 'tp', code: 'DA-BUG01', name: 'Thử tiến độ', status: 'Đang thực hiện' }]);
    add('items', [{ id: 'ti', projectId: 'tp', code: 'NDH', name: 'Nhà điều hành 5 tầng' }]);
    add('packages', [{ id: 'tk1', projectId: 'tp', code: 'XL', estimate: 250 * T }, { id: 'tk2', projectId: 'tp', code: 'MS', estimate: 6 * T }]);
    add('contracts', [{ id: 'tc1', packageId: 'tk1', projectId: 'tp', number: 'HD-XL', value: 240 * T, start: days(-200), end: days(100) },
                      { id: 'tc2', packageId: 'tk2', projectId: 'tp', number: 'HD-MS', value: 5 * T, start: days(-200), end: days(100) }]);
    const s = (id, k, it, w, pr) => ({ id, projectId: 'tp', packageId: k, itemId: it, name: id, weight: w, progress: pr, planStart: days(-100), planEnd: days(100) });
    add('schedule', [s('s1', 'tk1', '', 80, 45), s('s2', 'tk1', 'ti', 20, 60), s('s3', 'tk2', 'ti', 80, 0), s('s4', 'tk2', '', 20, 0)]);
    const item = itemProgress(get('items', 'ti')), proj = projProgress('tp'), pkg = pkgProgress('tk1');
    // Phụ lục: chờ duyệt không cộng, đã duyệt mới cộng
    add('addenda', [{ id: 'ta1', contractId: 'tc1', number: 'PL1', valueChange: 10 * T, daysChange: 30, status: 'Chờ duyệt' }]);
    const cvPending = contractValue(get('contracts', 'tc1')), endPending = contractEnd(get('contracts', 'tc1')), pend = contractPending(get('contracts', 'tc1'));
    get('addenda', 'ta1').status = 'Đã duyệt';
    const cvOk = contractValue(get('contracts', 'tc1')), endOk = contractEnd(get('contracts', 'tc1'));
    get('addenda', 'ta1').status = 'Chờ duyệt';
    // Kế hoạch thanh toán: quá hạn 120 ngày chưa chi vẫn cảnh báo; đợt có hồ sơ đã chi là Đã thực hiện
    add('payplans', [{ id: 'tq1', contractId: 'tc1', phase: 'Đợt thử 120', planDate: days(-120), amount: 1.2 * T },
                     { id: 'tq2', contractId: 'tc1', phase: 'Đợt thử đã chi', planDate: days(-30), amount: 2 * T },
                     { id: 'tq3', contractId: 'tc1', phase: 'Đợt thử sắp', planDate: days(10), amount: 1 * T }]);
    add('payments', [{ id: 'tr1', contractId: 'tc1', number: 'TT-thu', date: days(-28), amount: 1.9 * T, status: 'Đã thanh toán', payPlanId: 'tq2' }]);
    const st = ['tq1', 'tq2', 'tq3'].map(id => planState(get('payplans', id)).t);
    const al = alerts().filter(a => a.mod === 'thanh-toan').map(a => a.text.replace(/<[^>]+>/g, ''));
    return { item, proj, pkg, cvPending, endPending, pend, cvOk, endOk, end0: get('contracts', 'tc1').end, st, al };
  });
  console.log(JSON.stringify(r, null, 1));
  const near = (a, b) => Math.abs(a - b) < 0.1;
  if (!near(r.item, 55.38)) errs.push('Tiến độ hạng mục ' + r.item + ' (cần 55,4%)');
  if (!near(r.proj, 47.02)) errs.push('Tiến độ dự án ' + r.proj + ' (cần 47,0%)');
  if (!near(r.pkg, 48)) errs.push('Tiến độ gói ' + r.pkg + ' (cần 48%)');
  if (r.cvPending !== 240e9 || r.endPending !== r.end0) errs.push('Phụ lục chờ duyệt vẫn cộng vào hợp đồng');
  if (r.pend.n !== 1 || r.pend.value !== 10e9) errs.push('Không hiện phụ lục chờ duyệt');
  if (r.cvOk !== 250e9 || r.endOk === r.end0) errs.push('Phụ lục đã duyệt không cộng vào hợp đồng');
  if (!r.st[0].startsWith('Quá hạn 120') || r.st[1] !== 'Đã thực hiện' || !r.st[2].startsWith('Còn 10 ngày')) errs.push('Tình trạng đợt sai: ' + r.st.join(' | '));
  if (!r.al.some(t => t.includes('Đợt thử 120') || /đợt kế hoạch thanh toán quá hạn/.test(t))) errs.push('Không cảnh báo đợt quá hạn 120 ngày');
  if (r.al.some(t => t.includes('Đợt thử đã chi'))) errs.push('Vẫn cảnh báo đợt đã chi');
  await b.close();
  console.log(errs.length ? 'LỖI:\n' + errs.join('\n') : 'KHÔNG CÓ LỖI'); process.exit(errs.length ? 1 : 0);
})();
