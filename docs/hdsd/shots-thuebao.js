// Ảnh minh họa HDSD nhà cung cấp dịch vụ (trang quản lý thuê bao) và màn hình xã khởi tạo bằng mã.
// Máy chủ thuê bao chạy với tên miền gốc qlda.test; trình duyệt mở <tên>.localhost:<PORT>, bộ chuyển tiếp đổi thành <tên>.qlda.test.
// Biến: PORT (mặc định 8092), PORTAL_USER/PORTAL_PW/PORTAL_SECRET: tài khoản quản trị nền tảng đã bật 2 lớp.
const { chromium } = require('playwright');
const http = require('http');
const { wait, totp, ann, shot } = require('./hd-lib');
const PORT = process.env.PORT || 8092, PW = 'Admin2026';
const U = h => `http://${h}.localhost:${PORT}`;
const DESK = { viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1.5, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' };
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
let b;
async function portalLogin(p, user, pw, secret) {
  await p.goto(U('quantri') + '/'); await p.waitForSelector('#lg');
  await p.fill('#u', user); await p.fill('#p', pw); await p.click('#lg button'); await wait(700);
  if (await p.$('#c')) { await p.fill('#c', await totp(secret)); await p.click('#lg button'); }
  await p.waitForSelector('.top', { timeout: 15000 }); await wait(400);
}
const api = (p, m, url, body) => p.evaluate(async ([m, url, body]) => { const r = await fetch(url, { method: m, headers: { 'Content-Type': 'application/json', 'X-QLDA': '1' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, json: await r.json().catch(() => null) }; }, [m, url, body]);

(async () => {
  b = await chromium.launch({ args: ['--lang=vi-VN'] });
  // ===== Người quản trị nền tảng đầu tiên thêm cán bộ vận hành =====
  let p = await (await b.newContext(DESK)).newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto(U('quantri') + '/'); await p.waitForSelector('#lg'); await wait(300);
  await shot(p, 'ns-dang-nhap', undefined, [{ sel: '#u', n: 1 }, { sel: '#p', n: 2 }, { sel: '#lg button', n: 3 }]);
  await portalLogin(p, process.env.PORTAL_USER || 'tri', process.env.PORTAL_PW, process.env.PORTAL_SECRET);
  // dọn các xã cũ của lần chụp trước (đang tạm khóa thì không xóa được qua giao diện; bỏ qua)
  await p.click('[data-tab=qt]'); await wait(500); await p.click('#qa_add'); await wait(300);
  await p.fill('#q_u', 'vanhanh'); await p.fill('#q_n', 'Nguyễn Văn Vận Hành');
  await shot(p, 'ns-them-quan-tri', '.dlg', [{ sel: '#q_u', n: 1 }, { sel: '#q_n', n: 2 }, { sel: '#qc', n: 3 }, { sel: '#qok', n: 4 }]);
  await p.fill('#qc', await totp(process.env.PORTAL_SECRET)); await p.click('#qok'); await wait(900);
  const vpw = (await p.textContent('.dlg .token')).trim();
  await shot(p, 'ns-mat-khau-tam', '.dlg', [{ sel: '.dlg .token', n: 1 }, { sel: '#cp', n: 2 }]);
  await p.context().close();

  // ===== Cán bộ vận hành đăng nhập lần đầu: quét mã 2 lớp =====
  p = await (await b.newContext(DESK)).newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto(U('quantri') + '/'); await p.waitForSelector('#lg');
  await p.fill('#u', 'vanhanh'); await p.fill('#p', vpw); await p.click('#lg button'); await p.waitForSelector('#c');
  const vsec = (await p.textContent('.login .code')).trim();
  await shot(p, 'ns-2lop-quet-ma', '.login', [{ sel: '.login .qr', n: 1 }, { sel: '.login .code', n: 2 }, { sel: '#c', n: 3 }]);
  await p.fill('#c', await totp(vsec)); await p.click('#lg button'); await p.waitForSelector('.top'); await wait(400);

  // ===== Thêm xã, mã khởi tạo =====
  await p.click('#add'); await wait(300);
  await p.fill('#f_name', 'xã Tân Hòa'); await p.dispatchEvent('#f_name', 'input');
  await p.fill('#f_exp', day(365)); await p.fill('#f_contact', 'Ông Trần Văn Bình, Phó Giám đốc Ban QLDA, 0909 123 456');
  await p.fill('#f_note', 'Hợp đồng thuê dịch vụ số 12/2026/HĐ-TT, thời hạn 12 tháng.');
  await shot(p, 'ns-them-xa', '.dlg', [{ sel: '#f_name', n: 1 }, { sel: '#f_code', n: 2 }, { sel: '#f_exp', n: 3 }, { sel: '#f_contact', n: 4 }, { sel: '#f_hosts', n: 5 }, { sel: '#f_ok', n: 6 }]);
  await p.click('#f_ok'); await p.waitForSelector('.dlg .token', { timeout: 60000 }); await wait(300);
  const token = (await p.textContent('.dlg .token')).trim();
  await shot(p, 'ns-ma-khoi-tao', '.dlg', [{ sel: '.dlg .token', n: 1 }, { sel: '#msg', n: 2 }, { sel: '#cp', n: 3 }]);
  await p.click('.dlg [data-x2]'); await wait(300);
  // hai xã nữa để danh sách có đủ trạng thái
  await api(p, 'POST', '/api/portal/tenants', { code: 'an-lac', name: 'phường An Lạc', expiresAt: day(18), contact: 'Bà Lê Thị Hoa, chuyên viên Ban QLDA' });
  await api(p, 'POST', '/api/portal/tenants', { code: 'my-phuoc', name: 'xã Mỹ Phước', expiresAt: day(200), contact: 'Ông Phạm Minh Tâm, Giám đốc Ban QLDA' });

  // ===== Xã Tân Hòa khởi tạo bằng mã =====
  const x = await (await b.newContext(DESK)).newPage(); x.on('pageerror', e => console.log('PAGEERR', e.message));
  await x.goto(U('tan-hoa') + '/?ma=' + token); await x.waitForSelector('#setup'); await x.fill('#su_name', 'Trần Văn Quản Trị'); await wait(300);
  await shot(x, 'xa-khoi-tao-ma', undefined, [{ sel: '#su_token', n: 1 }, { sel: '#su_name', n: 2 }, { sel: '#su_user', n: 3 }, { sel: '#su_pw', n: 4 }, { sel: '#setup label.checks', n: 5 }, { sel: '#setup button[type=submit]', n: 6 }]);
  await x.fill('#su_pw', PW); await x.fill('#su_pw2', PW); await x.check('#su_sample'); await x.click('#setup button[type=submit]');
  await x.waitForSelector('#mfa .qr svg', { timeout: 60000 }); const xs = await x.evaluate(() => S.mfaStep.secret);
  await x.fill('#mf_code', await totp(xs)); await x.click('#mfa button[type=submit]'); await x.waitForSelector('#rc_ok');
  await x.check('#rc_ok'); await x.click('#mfa button[type=submit]'); await x.waitForSelector('#app', { timeout: 30000 }); await wait(800);
  await x.evaluate(() => { location.hash = 'quan-tri'; }); await wait(600);
  await x.click('.content [data-act=tab]:text-is("Sao lưu, hệ thống")'); await wait(900);
  await shot(x, 'qt-sao-luu-thue-bao', 'full', [{ sel: '[data-act=backup]', n: 1 }, { sel: '[data-act=backup-full]', n: 2 }, { sel: '[data-act=restore]', n: 3 }, { sel: '[data-act=backup-now]', n: 4 }]);
  await x.evaluate(() => fetch('/api/auth/logout', { method: 'POST', headers: { 'X-QLDA': '1' } }));

  // ===== Danh sách xã, chi tiết, tạm khóa, đặt lại 2 lớp =====
  await p.click('#reload'); await wait(700);
  await shot(p, 'ns-danh-sach-xa', undefined, [{ sel: '.tabs', n: 1 }, { sel: '.cards', n: 2 }, { sel: '#q', n: 3 }, { sel: '#add', n: 4 }, { sel: '[data-open]', n: 5 }]);
  await p.click('[data-open="tan-hoa"]'); await p.waitForSelector('.stats', { timeout: 15000 }); await wait(300);
  await shot(p, 'ns-chi-tiet-xa', '.dlg', [{ sel: '.dlg .grid2', n: 1 }, { sel: '.stats', n: 2 }, { sel: '#a_edit', n: 3 }, { sel: '#a_lock', n: 4 }, { sel: '#a_2fa', n: 5 }]);
  await p.click('#a_2fa'); await wait(300); await p.fill('#ax', 'admin');
  await shot(p, 'ns-dat-lai-2lop', '.dlg'); await p.click('.dlg [data-x2]'); await wait(200);
  await p.click('[data-open="an-lac"]'); await wait(500); await p.click('#a_lock'); await wait(300);
  await p.fill('#ax', 'Đơn vị chưa gia hạn hợp đồng thuê dịch vụ. Đề nghị liên hệ Công ty CP Tin học Tri Thức.');
  await shot(p, 'ns-tam-khoa', '.dlg', [{ sel: '#ax', n: 1 }, { sel: '#axok', n: 2 }]);
  await p.click('#axok'); await wait(900);
  await x.goto(U('an-lac') + '/'); await wait(1500); await shot(x, 'xa-tam-khoa', '.c');
  await p.click('[data-open="an-lac"]'); await wait(500);
  await shot(p, 'ns-mo-lai', '.dlg', [{ sel: '#a_unlock', n: 1 }, { sel: '#a_token', n: 2 }]);
  await p.click('#a_unlock'); await wait(800);
  await p.click('[data-tab=qt]'); await wait(600);
  await shot(p, 'ns-quan-tri-vien', undefined, [{ sel: '#qa_add', n: 1 }, { sel: '[data-qe]', n: 2 }, { sel: '[data-qr]', n: 3 }, { sel: '[data-ql]', n: 4 }]);
  await p.click('[data-tab=log]'); await wait(600);
  await shot(p, 'ns-nhat-ky');
  await p.click('#pw'); await wait(300); await shot(p, 'ns-doi-mat-khau', '.dlg');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
