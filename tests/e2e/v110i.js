const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const BASE = process.argv[2] || 'http://127.0.0.1:5080', DB = process.argv[3] || 'v110i';
const APP = path.join(__dirname, '../../src/QldaTtts.Web');
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
function cli(args, extraEnv = {}) {
  const env = { ...process.env, Database__Provider: 'PostgreSQL', ConnectionStrings__PostgreSQL: `Host=127.0.0.1;Database=${DB};Username=qlda;Password=qlda`,
    Storage__FilesPath: '/tmp/qlda-app/files', Storage__BackupPath: '/tmp/qlda-app/bk', ASPNETCORE_URLS: 'http://127.0.0.1:5999', ...extraEnv };
  const r = spawnSync('dotnet', ['bin/Release/net8.0/QldaTtts.Web.dll', ...args], { cwd: APP, env, encoding: 'utf8', timeout: 120000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const thisMonth = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);
// Bản 1.10.7: lịch nghỉ chọn ngày, chọn loại, chọn nội dung; ngày lễ theo luật tự áp dụng
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('Lỗi trang: ' + e.message));
  await p.goto(BASE + '/'); await p.waitForSelector('#setup', { timeout: 15000 });
  await p.fill('#su_name', 'Quản Trị'); await p.fill('#su_pw', PW); await p.fill('#su_pw2', PW); await p.click('#setup button[type=submit]');
  await p.waitForSelector('#mfa .qr svg', { timeout: 30000 }); const secret = await p.evaluate(() => S.mfaStep.secret);
  await p.fill('#mf_code', totp(secret)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#mfa .rcodes');
  await p.check('#rc_ok'); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 30000 });
  const r = p.request, get = async () => (await r.get(BASE + '/api/vp/settings', { headers: H })).json();
  // dữ liệu kiểu e-work: Chủ nhật, thứ Bảy nghỉ theo phiên, một ngày phát sinh
  const vs0 = await get();
  ok((await r.put(BASE + '/api/vp/settings', { headers: H, data: { ...vs0, saturday: 'cach-tuan', saturdayAnchor: '2026-10-10',
    holidays: ['2026-03-20 Nghỉ thư giãn', '2026-10-04 Chủ Nhật', '2026-10-03 Nghỉ theo phiên', '2026-10-17 Nghỉ luân phiên'] } })).ok(), 'Nạp lịch nghỉ mẫu lỗi');
  const ts = await (await r.get(BASE + '/api/vp/timesheet?month=2026-10', { headers: H })).json();
  ok(ts.standard === 24, 'Công chuẩn 10/2026 với dữ liệu kiểu e-work: ' + ts.standard);
  await p.evaluate(() => { location.hash = 'diem-danh'; }); await p.waitForTimeout(1200);
  await p.click('[data-act="tab"][data-g="dd"][data-id="thiet-lap"]'); await p.waitForSelector('#vd_date', { timeout: 10000 });
  ok(await p.isChecked('#vs_autoLegal'), 'Tự áp dụng lễ chưa bật sẵn');
  await p.selectOption('#vs_dayYear', '2026'); await p.waitForTimeout(1500);
  const txt = await p.textContent('.card:has(#vd_date)');
  ok(/Quốc khánh/.test(txt) && /Theo luật/.test(txt), 'Chưa hiện ngày lễ theo luật');
  ok(/Nghỉ thư giãn/.test(txt), 'Chưa hiện ngày phát sinh');
  ok(/3 ngày Chủ nhật, thứ Bảy/.test(txt), 'Chưa gom ngày Chủ nhật, thứ Bảy chép từ e-work: ' + (txt.match(/Có thêm[^.]*/) || [''])[0]);
  // thêm nửa ngày chiều Tất niên
  await p.fill('#vd_date', '2026-12-31'); await p.selectOption('#vd_kind', 'off-c'); await p.selectOption('#vd_text', 'Tất niên');
  await p.click('[data-act="vp-day-add"]'); await p.waitForTimeout(1500);
  let vs = await get(); ok(vs.holidays.includes('2026-12-31:c Tất niên'), 'Thêm Tất niên lỗi: ' + JSON.stringify(vs.holidays));
  // nội dung khác, đi làm bù
  await p.waitForSelector('#vd_date'); await p.fill('#vd_date', '2026-12-26'); await p.selectOption('#vd_kind', 'work');
  await p.selectOption('#vd_text', '__khac'); ok(await p.isVisible('#vd_other'), 'Không hiện ô ghi rõ'); await p.fill('#vd_other', 'Làm bù 02/01/2027');
  await p.click('[data-act="vp-day-add"]'); await p.waitForTimeout(1500);
  vs = await get(); ok(vs.workdays.includes('2026-12-26 Làm bù 02/01/2027'), 'Thêm ngày làm bù lỗi: ' + JSON.stringify(vs.workdays));
  ok(vs.saturday === 'cach-tuan', 'Thêm ngày làm đổi thiết lập thứ Bảy');
  // xóa, bỏ ngày CN/T7 chép từ e-work
  await p.waitForSelector('#vd_date'); await p.selectOption('#vs_dayYear', '2026'); await p.waitForTimeout(800);
  await p.click('[data-act="vp-day-del"][data-id="2026-03-20|off"]'); await p.waitForTimeout(1500);
  vs = await get(); ok(!vs.holidays.some(h => h.startsWith('2026-03-20')), 'Xóa ngày lỗi');
  await p.waitForSelector('#vd_date'); await p.click('[data-act="vp-day-sat-clear"]'); await p.waitForTimeout(1500);
  vs = await get(); ok(vs.holidays.length === 1 && vs.holidays[0] === '2026-12-31:c Tất niên', 'Bỏ ngày CN/T7 lỗi: ' + JSON.stringify(vs.holidays));
  const ts2 = await (await r.get(BASE + '/api/vp/timesheet?month=2026-10', { headers: H })).json();
  ok(ts2.standard === 24, 'Công chuẩn 10/2026 sau khi bỏ CN/T7: ' + ts2.standard);
  await b.close();
  if (errs.length) { console.log('LỖI:\n' + errs.join('\n')); process.exit(1); }
  console.log('v110i: ĐẠT');
})().catch(e => { console.error(e); process.exit(2); });
