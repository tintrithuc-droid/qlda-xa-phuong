// Kiểm thử bản 1.8.10: menu Quản trị hệ thống chỉ dành cho nhóm toàn quyền (cả giao diện và máy chủ).
// Chạy sau smoke.js, v15.js: node tests/e2e/v1810.js [http://127.0.0.1:5080]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const SHOTS = path.join(__dirname, 'shots');
const H = { headers: { 'X-QLDA': '1' } };
const ok = [], errs = [];
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
  const who = async u => { const c = await b.newContext(); const r = c.request;
    const s = (await r.post(BASE + '/api/auth/login', { ...H, data: { username: u, password: 'Admin2026' } })).status(); if (s !== 200) errs.push('Đăng nhập ' + u + ': ' + s);
    if (u !== 'admin' && (await r.get(BASE + '/api/data', H)).status() === 403)
      for (const [o, n] of [['Admin2026', 'Admin2026tmp'], ['Admin2026tmp', 'Admin2026']]) await r.post(BASE + '/api/auth/change-password', { ...H, data: { old: o, password: n } });
    return { c, r }; };
  const ad = await who('admin');
  const sec = fs.existsSync(SHOTS + '/admin-totp.txt') ? fs.readFileSync(SHOTS + '/admin-totp.txt', 'utf8').trim() : '';
  if (sec) { let m = await ad.r.post(BASE + '/api/auth/mfa', { ...H, data: { code: totp(sec) } });
    if (m.status() !== 200) { await new Promise(r => setTimeout(r, 31000 - Date.now() % 30000)); m = await ad.r.post(BASE + '/api/auth/mfa', { ...H, data: { code: totp(sec) } }); }
    if (m.status() !== 200) errs.push('Mã 2 lớp quản trị: ' + m.status()); }
  const d0 = await (await ad.r.get(BASE + '/api/data', H)).json();
  // Nhóm mẫu không còn quyền Quản trị hệ thống
  const bad = d0.groups.filter(g => !g.admin && (g.perms || {})['quan-tri'] && g.perms['quan-tri'] !== 'none').map(g => g.id);
  check(bad.length === 0, 'Các nhóm không phải quản trị không có quyền Quản trị hệ thống' + (bad.length ? ' (' + bad.join(', ') + ')' : ''));
  // Quản trị cố gán "Xem và cập nhật" Quản trị hệ thống cho nhóm Lãnh đạo Ban: máy chủ lưu thành "Không truy cập"
  const gl = d0.groups.find(g => g.id === 'g-lead');
  const pr = await ad.r.put(BASE + '/api/data/groups/g-lead', { ...H, data: { ...gl, perms: { ...gl.perms, 'quan-tri': 'edit' } } });
  const gl2 = pr.status() === 200 ? await pr.json() : {};
  check(pr.status() === 200 && (gl2.perms || {})['quan-tri'] === 'none', 'Máy chủ không cho nhóm thường giữ quyền Quản trị hệ thống');
  // Quản trị vẫn thấy menu Quản trị hệ thống
  const pa = await ad.c.newPage(); await pa.goto(BASE + '/#tong-quan'); await pa.waitForSelector('#app', { timeout: 15000 }); await pa.waitForTimeout(700);
  check(await pa.evaluate(() => !!document.querySelector('nav a[href="#quan-tri"], a[href="#quan-tri"]')), 'Quản trị thấy menu Quản trị hệ thống');
  // Lãnh đạo Ban, Cán bộ kỹ thuật: không thấy menu, không mở được trang, máy chủ từ chối
  for (const u of ['lanhdao', 'kythuat']) {
    const x = await who(u); const p = await x.c.newPage(); const pe = [];
    p.on('pageerror', e => pe.push(e.message));
    await p.goto(BASE + '/#quan-tri'); await p.waitForSelector('#app', { timeout: 15000 }); await p.waitForTimeout(800);
    const v = await p.evaluate(() => ({ menu: !!document.querySelector('a[href="#quan-tri"]'), dm: !!document.querySelector('a[href="#doi-chieu"]'), route: S.route, can: can('quan-tri') }));
    check(!v.menu && !v.dm && !v.can && v.route !== 'quan-tri', u + ': không thấy menu Quản trị hệ thống, không mở được trang');
    const d = await (await x.r.get(BASE + '/api/data', H)).json();
    check((d.logs || []).length === 0 && !(d.users || []).some(z => 'mfaSecret' in z || 'passwordHash' in z || 'failedLogins' in z), u + ': không nhận nhật ký hoạt động, chi tiết tài khoản');
    const g = d0.groups.find(z => z.id === 'g-tech');
    const s1 = (await x.r.put(BASE + '/api/data/groups/g-tech', { ...H, data: g })).status();
    const s2 = (await x.r.post(BASE + '/api/users', { ...H, data: { username: 'thu' + u, name: 'Thử', groupId: 'g-tech', password: 'Admin2026abc' } })).status();
    const s3 = (await x.r.put(BASE + '/api/data/catalogs/thu-' + u, { ...H, data: { id: 'thu-' + u, type: 'Đơn vị tính', value: 'thử', order: 999 } })).status();
    check(s1 === 403 && s2 === 403 && s3 === 403, u + ': máy chủ từ chối sửa nhóm, tạo tài khoản, sửa danh mục (' + [s1, s2, s3].join(',') + ')');
    check(pe.length === 0, u + ': trang không lỗi' + (pe.length ? ' ' + pe[0] : ''));
    await x.c.close();
  }
  // Hộp phân quyền nhóm không còn dòng Quản trị hệ thống
  await pa.evaluate(() => { location.hash = 'quan-tri'; }); await pa.waitForTimeout(600);
  await pa.evaluate(() => { S.tab.qt = 'groups'; render(); }); await pa.waitForTimeout(400);
  const eb = await pa.$('[data-act="edit-groups"][data-id="g-lead"]');
  if (eb) { await eb.click(); await pa.waitForTimeout(400); check(await pa.evaluate(() => !!document.querySelector('input[name="perm_du-an"]') && !document.querySelector('input[name="perm_quan-tri"]')), 'Hộp phân quyền nhóm không có dòng Quản trị hệ thống'); }
  else check(false, 'Tìm nút sửa nhóm');
  await b.close();
  console.log(`\n${ok.length} đạt, ${errs.length} lỗi`); errs.forEach(e => console.log(' - ' + e));
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
