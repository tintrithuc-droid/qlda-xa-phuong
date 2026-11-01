// Ảnh bổ sung cho HDSD trên điện thoại. Chạy sau shots.js trên cùng CSDL (đã có dữ liệu mẫu).
const H = require('./dt-helpers'); const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const { newPage, login, go, closeModal, click, shot, wait, MOB, BASE } = H;
const intoView = (p, sel, text) => p.evaluate(([s, t]) => { const e = [...document.querySelectorAll(s)].find(e => !t || e.innerText.includes(t)); if (e) e.scrollIntoView({ block: 'center' }); }, [sel, text]).then(() => wait(350));
(async () => {
  H.b = await chromium.launch({ args: ['--lang=vi-VN'] });
  const img = path.join(os.tmpdir(), 'anh-hien-truong.png'); fs.copyFileSync('/home/claude/qlda-ttts-hcm/src/QldaTtts.Web/wwwroot/icons/icon-512.png', img);
  let p = await newPage(MOB);
  await p.goto(BASE + '/'); await p.waitForSelector('#login');
  await shot(p, 'dt-dang-nhap-so', undefined, [{ sel: '#lg_user', n: 1 }, { sel: '#lg_pw', n: 2 }, { sel: '#login button[type=submit]', n: 3 }]);
  await login(p, 'giamsat'); await go(p, 'hien-truong');
  await shot(p, 'dt-bo-cuc', undefined, [{ sel: '#top [data-act=menu]', n: 1 }, { sel: '#top select', n: 2 }, { sel: '#top [data-act=account]', n: 3, pos: 'tr' }, { sel: '.tiles', n: 4 }, { sel: '.tabbar', n: 5, pad: 0 }]);
  // Ghi nhật ký
  await click(p, '.tile', 'Ghi nhật ký');
  await shot(p, 'dt-nk-1', undefined, [{ sel: '#ov label', text: 'Gói thầu', n: 1 }, { sel: '#ov label', text: 'Ngày', n: 2 }, { sel: '#ov label', text: 'Thời tiết', n: 3 }, { sel: '#ov label', text: 'Số nhân công', n: 4 }]);
  await p.selectOption('#ov select >> nth=0', { index: 1 }).catch(() => {});
  await intoView(p, '#ov label', 'Công việc thực hiện');
  const ta = await p.$$('#ov textarea'); if (ta[0]) await ta[0].fill('Đào đất hố móng M1–M4 | 18,5 | m3\nĐổ bê tông lót móng | 2,4 | m3');
  await shot(p, 'dt-nk-2', undefined, [{ sel: '#ov label', text: 'Công việc thực hiện', n: 5 }, { sel: '#ov label', text: 'Vướng mắc', n: 6 }]);
  await p.setInputFiles('#f_photos_new', [img]); await wait(900);
  await intoView(p, '#ov label', 'Hình ảnh hiện trường');
  await shot(p, 'dt-nk-3', undefined, [{ sel: '#ov label', text: 'Hình ảnh hiện trường', n: 7 }, { sel: '#ov button', text: 'Lưu', n: 8 }]);
  await closeModal(p);
  // Cập nhật tiến độ nhanh
  await click(p, '.tile', 'Cập nhật tiến độ');
  await shot(p, 'dt-td-nhanh', undefined, [{ sel: '#ov label', text: 'Hạng mục', n: 1 }, { sel: '#ov label', text: 'Tiến độ', nth: 0, n: 2 }, { sel: '#ov button', text: 'Lưu', n: 3 }]);
  await closeModal(p);
  // Nhật ký, tiến độ, khối lượng, tổng quan
  await go(p, 'nhat-ky'); await shot(p, 'dt-nhat-ky-ds', undefined, [{ sel: '.content button', text: 'Ghi nhật ký', n: 1 }, { sel: '.content select', n: 2 }]);
  await go(p, 'tien-do'); await intoView(p, '.content [data-act]', 'Cập nhật');
  await shot(p, 'dt-tien-do', undefined, [{ sel: '.content button', text: 'Cập nhật', n: 4 }]);
  await go(p, 'khoi-luong'); await shot(p, 'dt-khoi-luong');
  await go(p, 'tong-quan'); await shot(p, 'dt-tong-quan');
  await intoView(p, '.card', 'Cảnh báo và việc cần xử lý'); await shot(p, 'dt-canh-bao');
  // Dự án
  await go(p, 'du-an'); await shot(p, 'dt-du-an-ds', undefined, [{ sel: '.content select', n: 1 }, { sel: '[data-act=open-project]', n: 2 }]);
  await click(p, '[data-act=open-project]'); await wait(500); await shot(p, 'dt-du-an-ct');
  // Menu, tài khoản
  await go(p, 'hien-truong'); await click(p, '#top [data-act=menu]'); await wait(400);
  await shot(p, 'dt-menu-day-du', undefined, [{ sel: '#side .nav', n: 6, pad: 2 }]);
  await p.mouse.click(370, 600); await wait(300); await go(p, 'hien-truong');
  await click(p, '#top [data-act=account]'); await shot(p, 'dt-tai-khoan', undefined, [{ sel: '#ov [data-act=chpw]', n: 1 }, { sel: '#ov [data-act=logout]', n: 2 }]);
  await click(p, '#ov [data-act=chpw]'); await shot(p, 'dt-doi-mk'); await closeModal(p);
  await go(p, 'huong-dan'); await wait(800); await shot(p, 'dt-huong-dan');
  await p.context().close();
  // Lãnh đạo xem trên điện thoại
  p = await newPage(MOB); await login(p, 'lanhdao'); await go(p, 'tong-quan'); await shot(p, 'dt-ld-tong-quan');
  await go(p, 'bao-cao'); await shot(p, 'dt-ld-bao-cao');
  await p.context().close();
  await H.b.close();
})().catch(e => { console.error(e); process.exit(1); });
