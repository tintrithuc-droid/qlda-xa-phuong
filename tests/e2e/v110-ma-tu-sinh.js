// Kiểm thử bản 1.10.27: mã dự án DA-<năm>-<STT 2 số>, mã gói thầu <mã dự án>-GT<STT 2 số> tự sinh, không trùng, vẫn sửa được, mã cũ giữ nguyên.
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
  ok((await (await put('projects', 'pj-cu', { ...base, code: '15/2025/HĐ-TT' })).json()).code === '15/2025/HĐ-TT', 'Dự án cũ bị đổi mã');

  // 1) Biểu mẫu Thêm dự án điền sẵn mã DA-<năm>-01
  await p.evaluate(async () => { await Store.load(); location.hash = 'du-an'; });
  await p.waitForTimeout(500);
  await p.evaluate(() => ACT['add-project']());
  await p.waitForSelector('#mform #f_code');
  ok(await p.inputValue('#f_code') === DA(1), 'Biểu mẫu chưa điền sẵn mã ' + DA(1) + ': ' + await p.inputValue('#f_code'));
  await p.fill('#f_name', 'Dự án thử 1'); await p.fill('#f_tmdt', '5000000');
  await p.click('#mform button[type=submit]'); await p.waitForSelector('#mform', { state: 'detached', timeout: 10000 });
  const p1 = await p.evaluate(() => D('projects').find(x => x.name === 'Dự án thử 1'));
  ok(p1 && p1.code === DA(1), 'Lưu dự án 1 sai mã: ' + (p1 && p1.code));

  // 2) Để trống mã: máy chủ tự cấp số kế tiếp
  const j2 = await (await put('projects', 'pj-2', { ...base, code: '' })).json();
  ok(j2.code === DA(2), 'Mã trống chưa được cấp ' + DA(2) + ': ' + j2.code);
  // 3) Hai người cùng lưu mã tự sinh trùng: người sau được số kế tiếp
  const j3 = await (await put('projects', 'pj-3', { ...base, code: DA(2) })).json();
  ok(j3.code === DA(3), 'Mã tự sinh trùng chưa được cấp số kế: ' + j3.code);
  // 4) Mã gõ tay trùng: báo lỗi
  ok((await put('projects', 'pj-4', { ...base, code: 'HD-01' })).status() === 200, 'Mã gõ tay không lưu được');
  const d5 = await put('projects', 'pj-5', { ...base, code: 'hd-01' });
  ok(d5.status() === 409 && (await d5.json()).message.includes('đã có'), 'Mã gõ tay trùng không báo lỗi: ' + d5.status());
  // 5) Sửa dự án: để trống mã thì giữ mã cũ; đổi sang mã đã có thì báo lỗi
  ok((await (await put('projects', 'pj-3', { ...base, name: 'Đổi tên', code: '' })).json()).code === DA(3), 'Sửa dự án làm mất mã');
  ok((await put('projects', 'pj-3', { ...base, code: 'HD-01' })).status() === 409, 'Đổi sang mã trùng không báo lỗi');
  ok((await put('projects', 'pj-3', { ...base, code: 'HD-02' })).status() === 200, 'Không sửa được mã dự án');

  // 6) Gói thầu: biểu mẫu điền sẵn <mã dự án>-GT01, đổi dự án thì đổi mã gợi ý
  await p.evaluate(async () => { await Store.load(); });
  const pk = { name: 'Gói', type: 'Tư vấn', estimate: 1000, status: 'Đang thực hiện' };
  await p.evaluate(id => { S.pid = id; }, 'pj-2');
  await p.evaluate(() => pkgForm(null)); await p.waitForSelector('#mform #f_code');
  ok(await p.inputValue('#f_code') === DA(2) + '-GT01', 'Biểu mẫu gói thầu chưa điền sẵn mã: ' + await p.inputValue('#f_code'));
  await p.selectOption('#f_projectId', p1.id); await p.dispatchEvent('#f_projectId', 'change');
  ok(await p.inputValue('#f_code') === DA(1) + '-GT01', 'Đổi dự án chưa đổi mã gói gợi ý: ' + await p.inputValue('#f_code'));
  await p.fill('#f_code', 'GOI-RIENG'); await p.selectOption('#f_projectId', 'pj-2'); await p.dispatchEvent('#f_projectId', 'change');
  ok(await p.inputValue('#f_code') === 'GOI-RIENG', 'Mã gói gõ tay bị ghi đè khi đổi dự án');
  await p.click('#mform [data-close]');
  const g1 = await (await put('packages', 'gt-1', { ...pk, projectId: 'pj-2', code: '' })).json();
  ok(g1.code === DA(2) + '-GT01', 'Gói trống mã chưa được cấp: ' + g1.code);
  const g2 = await (await put('packages', 'gt-2', { ...pk, projectId: 'pj-2', code: DA(2) + '-GT01' })).json();
  ok(g2.code === DA(2) + '-GT02', 'Gói trùng mã tự sinh chưa được số kế: ' + g2.code);
  ok((await put('packages', 'gt-3', { ...pk, projectId: 'pj-2', code: 'Gói số 1' })).status() === 200, 'Mã gói gõ tay không lưu được');
  ok((await put('packages', 'gt-4', { ...pk, projectId: 'pj-2', code: 'gói số 1' })).status() === 409, 'Mã gói gõ tay trùng trong dự án không báo lỗi');
  ok((await put('packages', 'gt-5', { ...pk, projectId: 'pj-3', code: 'Gói số 1' })).status() === 200, 'Cùng ký hiệu ở dự án khác phải lưu được');
  // số thứ tự gói không nhỏ hơn số gói đang có (3 gói -> GT04)
  ok((await (await put('packages', 'gt-6', { ...pk, projectId: 'pj-2', code: '' })).json()).code === DA(2) + '-GT04', 'Số thứ tự gói sai');
  // dự án cũ: gói theo mã cũ
  ok((await (await put('packages', 'gt-7', { ...pk, projectId: 'pj-cu', code: '' })).json()).code === '15/2025/HĐ-TT-GT01', 'Gói của dự án cũ sai mã');

  await b.close();
  if (errs.length) { console.error('LỖI:\n- ' + errs.join('\n- ')); process.exit(1); }
  console.log('v110-ma-tu-sinh: ĐẠT');
})().catch(e => { console.error(e); process.exit(1); });
