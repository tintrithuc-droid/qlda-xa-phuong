// Ảnh minh họa bản 1.8.1 (chạy sau shots.js, shots-v17.js, shots-v18.js, cùng CSDL):
// thẻ Thông tin đơn vị, giao diện (logo, ảnh nền trang đăng nhập), trang đăng nhập có ảnh nền, ô chọn dự án có ô gõ tìm.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const { wait, totp, shot } = require('./hd-lib');
const BASE = process.env.BASE || 'http://127.0.0.1:5080', PW = 'Admin2026';
const SECRET = fs.readFileSync(path.join(os.tmpdir(), 'hdsd-secret'), 'utf8').trim();
const DESK = { viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.5, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' };
const H = { 'X-QLDA': '1' };
let b;
async function newPage(o) { const c = await b.newContext(o); const p = await c.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message)); return p; }
async function login(p, u) {
  await p.goto(BASE + '/'); await p.waitForSelector('#login,#app', { timeout: 20000 });
  if (await p.$('#login')) {
    await p.fill('#lg_user', u); await p.fill('#lg_pw', PW); await p.click('#login button[type=submit]');
    await p.waitForSelector('#app,#mfa', { timeout: 20000 });
    if (await p.$('#mfa')) { await p.fill('#mf_code', await totp(SECRET)); await p.click('#mfa button[type=submit]'); await p.waitForSelector('#app', { timeout: 20000 }); }
  }
  await wait(500);
}
const hideToast = p => p.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.hidden = true; });

(async () => {
  b = await chromium.launch();
  let p = await newPage(DESK); await login(p, 'admin');

  // 1. Thông tin đơn vị: tải logo và ảnh nền trang đăng nhập
  await p.evaluate(() => { S.tab.qt = 'org'; location.hash = 'quan-tri'; scrollTo(0, 0); }); await p.waitForSelector('#br_loginTitle');
  await p.setInputFiles('#br_logo', '/tmp/hdsd-them/Logo-don-vi-mau.png'); await wait(1200);
  await p.setInputFiles('#br_loginbg', '/tmp/hdsd-mau/Anh-hien-truong-mong-M1.jpg'); await wait(1500); await hideToast(p);
  await shot(p, 'qt-don-vi', 'full', [{ sel: '#brform', n: 1 }, { sel: '[data-act=brand-save]', n: 2 }, { sel: '[data-act=brand-reset]', n: 3 }, { sel: '.brand-prev', n: 4 }, { sel: 'label:has(#br_logo)', n: 5 }, { sel: '.bg-prev', n: 6 }, { sel: 'label:has(#br_loginbg)', n: 7 }]);
  { const q = await newPage(DESK); await q.goto(BASE + '/'); await q.waitForSelector('#login'); await wait(1000); await shot(q, 'qt-dang-nhap-don-vi'); await q.context().close(); }
  await p.evaluate(async h => { for (const k of ['logo', 'loginbg']) await fetch('/api/branding/' + k, { method: 'DELETE', headers: h }); }, H);

  // 2. Ô chọn dự án có ô gõ tìm (minh họa khi đơn vị có nhiều dự án)
  await p.reload(); await p.waitForSelector('#gpid'); await p.evaluate(() => { location.hash = 'tong-quan'; scrollTo(0, 0); }); await wait(800);
  await p.evaluate(() => {
    const s = document.querySelector('#gpid');
    ['Trường Mầm non Hoa Sen, điểm ấp Thạnh Lợi', 'Nâng cấp đường giao thông nông thôn ấp Phú Lợi', 'Cầu bê tông kênh Ba Thước', 'Nhà văn hóa ấp Tân Hưng',
      'Chỉnh trang khu trung tâm hành chính xã', 'Đường giao thông liên ấp Thạnh Hòa – Thạnh Phú', 'Trạm y tế xã, hạng mục nhà khám bệnh', 'Kè chống sạt lở bờ sông ấp Mỹ Phước']
      .forEach((t, i) => s.add(new Option(t, 'demo' + i)));
  });
  await p.click('#gpid'); await p.waitForSelector('.ss-pop input'); await p.keyboard.type('duong giao', { delay: 60 }); await wait(400);
  await shot(p, 'chung-tim-du-an', undefined, [{ sel: '#gpid', n: 1 }, { sel: '.ss-pop input', n: 2 }, { sel: '.ss-pop ul', n: 3 }]);
  await p.keyboard.press('Escape');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
