// Kiểm thử bản 1.10.27: mã dự án DA-<năm>-<STT 2 số>, mã gói thầu <mã dự án>-GT<STT 2 số> do máy cấp, khóa nhập (chỉ quản trị sửa mã đã có), không trùng, mã cũ giữ nguyên.
// node tests/e2e/v110-ma-tu-sinh.js [http://127.0.0.1:5080] — cần CSDL trống
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:5080';
const PW = 'Admin2026', H = { 'X-QLDA': '1' };
const errs = []; const ok = (c, m) => { if (!c) errs.push(m); };
function totp(secret) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const ch of secret) bits += A.indexOf(ch).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = require('crypto').createHmac('sha1', key).update(msg).digest(); const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request;
  const Y = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 4), DA = n => `DA-${Y}-${String(n).padStart(2, '0')}`;
  const put = (col, id, data) => r.put(`${BASE}/api/data/${col}/${id}`, { headers: H, data: { id, ...data } });
  const base = { name: 'Dự án', status: 'Đang thực hiện', tmdt: 1000000 };

  // Dự án cũ (mã theo số hợp đồng e-work) giữ nguyên, không ảnh hưởng số thứ tự
  // (dữ liệu cũ đến từ e-work/nhập đầu kỳ; ở đây tạo rồi quản trị đặt lại mã cũ)
  await put('projects', 'pj-cu', base);
  ok((await (await put('projects', 'pj-cu', { ...base, code: '15/2025/HĐ-TT' })).json()).code === '15/2025/HĐ-TT', 'Không đặt được mã cũ cho dự án cũ');

  // 1) Biểu mẫu Thêm dự án: ô mã khóa, hiện mã sẽ cấp DA-<năm>-01
  await p.evaluate(async () => { await Store.load(); location.hash = 'du-an'; });
  await p.waitForTimeout(500);
  await p.evaluate(() => ACT['add-project']());
  await p.waitForSelector('#mform #f_code');
  ok(await p.inputValue('#f_code') === DA(1), 'Biểu mẫu chưa hiện mã ' + DA(1) + ': ' + await p.inputValue('#f_code'));
  ok(await p.$eval('#f_code', e => e.readOnly), 'Ô mã dự án khi thêm mới chưa khóa');
  await p.fill('#f_name', 'Dự án thử 1'); await p.fill('#f_tmdt', '5000000');
  await p.click('#mform button[type=submit]'); await p.waitForSelector('#mform', { state: 'detached', timeout: 10000 });
  const p1 = await p.evaluate(() => D('projects').find(x => x.name === 'Dự án thử 1'));
  ok(p1 && p1.code === DA(1), 'Lưu dự án 1 sai mã: ' + (p1 && p1.code));

  // 2) Thêm mới: máy chủ bỏ qua mã gửi lên, luôn cấp số kế tiếp (kể cả hai người cùng lưu một mã)
  ok((await (await put('projects', 'pj-2', { ...base, code: '' })).json()).code === DA(2), 'Mã trống chưa được cấp ' + DA(2));
  ok((await (await put('projects', 'pj-3', { ...base, code: DA(2) })).json()).code === DA(3), 'Trùng mã tự sinh chưa được số kế');
  ok((await (await put('projects', 'pj-4', { ...base, code: 'HD-GO-TAY' })).json()).code === DA(4), 'Mã gõ tay khi thêm mới chưa bị bỏ qua');

  // 3) Quản trị sửa được mã của dự án đã có (không trùng); để trống thì giữ mã cũ
  ok((await (await put('projects', 'pj-4', { ...base, code: '' })).json()).code === DA(4), 'Sửa dự án làm mất mã');
  ok((await put('projects', 'pj-4', { ...base, code: DA(1) })).status() === 409, 'Quản trị đổi sang mã trùng không báo lỗi');
  ok((await (await put('projects', 'pj-4', { ...base, code: 'HD-02' })).json()).code === 'HD-02', 'Quản trị không sửa được mã');
  ok((await (await put('projects', 'pj-cu', { ...base, name: 'Đổi tên' })).json()).code === '15/2025/HĐ-TT', 'Sửa dự án cũ bị đổi mã');

  // 4) Gói thầu: ô mã khóa, hiện <mã dự án>-GT01, đổi dự án thì đổi theo
  await p.evaluate(async () => { await Store.load(); });
  const pk = { name: 'Gói', type: 'Tư vấn', estimate: 1000, status: 'Đang thực hiện' };
  await p.evaluate(id => { S.pid = id; }, 'pj-2');
  await p.evaluate(() => pkgForm(null)); await p.waitForSelector('#mform #f_code');
  ok(await p.inputValue('#f_code') === DA(2) + '-GT01', 'Biểu mẫu gói thầu chưa hiện mã: ' + await p.inputValue('#f_code'));
  ok(await p.$eval('#f_code', e => e.readOnly), 'Ô ký hiệu gói thầu chưa khóa');
  await p.selectOption('#f_projectId', p1.id); await p.dispatchEvent('#f_projectId', 'change');
  ok(await p.inputValue('#f_code') === DA(1) + '-GT01', 'Đổi dự án chưa đổi mã gói: ' + await p.inputValue('#f_code'));
  await p.click('#mform [data-close]');
  ok((await (await put('packages', 'gt-1', { ...pk, projectId: 'pj-2', code: '' })).json()).code === DA(2) + '-GT01', 'Gói chưa được cấp mã');
  ok((await (await put('packages', 'gt-2', { ...pk, projectId: 'pj-2', code: 'GOI-TAY' })).json()).code === DA(2) + '-GT02', 'Mã gói gõ tay chưa bị bỏ qua');
  ok((await (await put('packages', 'gt-3', { ...pk, projectId: 'pj-2', code: DA(2) + '-GT02' })).json()).code === DA(2) + '-GT03', 'Gói trùng mã chưa được số kế');
  ok((await (await put('packages', 'gt-3', { ...pk, projectId: 'pj-2', code: 'Gói số 1' })).json()).code === 'Gói số 1', 'Quản trị không sửa được ký hiệu gói');
  ok((await put('packages', 'gt-2', { ...pk, projectId: 'pj-2', code: 'gói số 1' })).status() === 409, 'Ký hiệu gói trùng trong dự án không báo lỗi');
  ok((await (await put('packages', 'gt-4', { ...pk, projectId: 'pj-2' })).json()).code === DA(2) + '-GT04', 'Số thứ tự gói sai');
  ok((await (await put('packages', 'gt-5', { ...pk, projectId: 'pj-cu' })).json()).code === '15/2025/HĐ-TT-GT01', 'Gói của dự án cũ sai mã');
  // chuyển gói sang dự án khác: cấp lại theo dự án mới
  ok((await (await put('packages', 'gt-4', { ...pk, projectId: 'pj-3', code: DA(2) + '-GT04' })).json()).code === DA(3) + '-GT01', 'Chuyển dự án chưa cấp lại mã gói');

  // 5) Người không phải quản trị: không sửa được mã đã có, ô mã khóa cả khi sửa
  const g = { id: 'g-ma', name: 'Cán bộ thử mã', perms: { 'du-an': 'edit', 'goi-thau': 'edit' } };
  ok((await r.put(`${BASE}/api/data/groups/g-ma`, { headers: H, data: g })).status() === 200, 'Không tạo được nhóm thử');
  ok((await r.post(BASE + '/api/users', { headers: H, data: { username: 'cbma', name: 'Cán bộ mã', password: 'BanDau2026', groupId: 'g-ma' } })).status() === 200, 'Không tạo được tài khoản thử');
  const cx = await b.newContext(); const q = cx.request;
  await q.post(BASE + '/api/auth/login', { headers: H, data: { username: 'cbma', password: 'BanDau2026' } });
  await q.post(BASE + '/api/auth/change-password', { headers: H, data: { old: 'BanDau2026', password: 'MatKhau2026x' } });
  const qput = (col, id, data) => q.put(`${BASE}/api/data/${col}/${id}`, { headers: H, data: { id, ...data } });
  const e1 = await qput('projects', 'pj-2', { ...base, code: 'SUA-TAY' });
  ok(e1.status() === 200 && (await e1.json()).code === DA(2), 'Cán bộ sửa được mã dự án: ' + e1.status());
  ok((await (await qput('packages', 'gt-1', { ...pk, projectId: 'pj-2', code: 'SUA-TAY' })).json()).code === DA(2) + '-GT01', 'Cán bộ sửa được ký hiệu gói');
  ok((await (await qput('projects', 'pj-6', { ...base, code: 'X' })).json()).code === DA(4), 'Cán bộ thêm dự án chưa được cấp mã');
  const cp = await cx.newPage(); cp.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await cp.goto(BASE + '/#du-an'); await cp.waitForSelector('#app', { timeout: 15000 }); await cp.waitForTimeout(700);
  await cp.evaluate(() => ACT['edit-projects']('pj-2')); await cp.waitForSelector('#mform #f_code');
  ok(await cp.$eval('#f_code', e => e.readOnly), 'Ô mã khi cán bộ sửa dự án chưa khóa');
  await cx.close();
  // quản trị: ô mã khi sửa dự án đã có mở được
  await p.evaluate(() => { closeModal(); ACT['edit-projects']('pj-2'); }); await p.waitForSelector('#mform #f_code');
  ok(!(await p.$eval('#f_code', e => e.readOnly)), 'Quản trị không sửa được ô mã khi sửa dự án');

  await b.close();
  if (errs.length) { console.error('LỖI:\n- ' + errs.join('\n- ')); process.exit(1); }
  console.log('v110-ma-tu-sinh: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
