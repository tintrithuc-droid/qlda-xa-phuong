// Dựng PDF Hướng dẫn sử dụng e-work Tri Thức theo vai trò: node docs/hdsd-tt/build.js [thư mục ra]
// Ra: "HDSD e-work Tri Thuc - <Vai tro> - V1.10.4.pdf" và vai-tro.json (để nạp sẵn vào trang Hướng dẫn sử dụng, hdsd/ của gói cài).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { ROLES, CHAPTERS } = require('./content');
const OUT = process.argv[2] || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const SHOTS = path.join(__dirname, 'shots'), VER = '1.10.14', DATE = '24/11/2026';
const CAP = { 'dang-nhap': 'Trang đăng nhập', 'diem-danh': 'Trang Điểm danh: giờ vào, ra, nhắc việc, KPI tạm tính, phép còn lại',
  'de-xuat': 'Trang Đề xuất', 'cong-viec': 'Việc của tôi: nhắc việc quá hạn, KPI tạm tính, các nút thao tác', 'kpi': 'KPI tháng của tôi',
  'phieu-luong': 'Phiếu lương, xác nhận hoặc gửi kiến nghị', 'giao-viec': 'Việc của phòng tôi phụ trách', 'duyet': 'Đề xuất chờ tôi duyệt',
  'nhan-su': 'Hồ sơ nhân sự', 'bang-luong': 'Bảng lương tháng: chốt, duyệt chi, xuất bảng lương kế toán', 'duyet-chi': 'Bảng lương đã duyệt chi: xuất danh sách chuyển khoản ngân hàng',
  'qt-nguoi-dung': 'Quản trị hệ thống' };
const img = id => { const f = path.join(SHOTS, id + '.png'); return fs.existsSync(f) ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : null; };

function html(k) {
  const role = ROLES[k], chs = CHAPTERS.filter(c => c.roles.includes(k));
  const toc = chs.map((c, i) => `<li><span>${i + 1}. ${c.title}</span></li>`).join('');
  const body = chs.map((c, i) => { const s = c.shot && img(c.shot);
    return `<section><h2>${i + 1}. ${c.title}</h2>${c.html}${s ? `<figure><img src="${s}"><figcaption>Hình ${i + 1}. ${CAP[c.shot] || ''}</figcaption></figure>` : ''}</section>`; }).join('');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>

  body { font-family: 'Inter','Segoe UI','Noto Sans',Arial,sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1f2933; }
  .cover { height: 245mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
  .cover .top { border-left: 6px solid #0f766e; padding-left: 14px; color: #0f766e; font-weight: 600; letter-spacing: .02em; }
  .cover h1 { font-size: 30pt; line-height: 1.15; margin: 0 0 10px; color: #0b3b38; }
  .cover .role { display: inline-block; background: #0f766e; color: #fff; padding: 6px 16px; border-radius: 6px; font-size: 15pt; font-weight: 600; }
  .cover .intro { font-size: 12pt; color: #3e4c59; max-width: 150mm; margin-top: 18px; }
  .cover .foot { color: #52606d; font-size: 10pt; border-top: 1px solid #d9e2ec; padding-top: 10px; }
  .toc { page-break-after: always; } .toc ol { list-style: none; padding: 0; } .toc li { padding: 6px 0; border-bottom: 1px dotted #cbd2d9; font-size: 11.5pt; }
  h2 { color: #0b3b38; font-size: 15pt; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin: 0 0 10px; }
  section { page-break-before: always; } section:first-of-type { page-break-before: auto; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0 12px; font-size: 9.8pt; page-break-inside: avoid; }
  th, td { border: 1px solid #cbd2d9; padding: 5px 7px; vertical-align: top; text-align: left; } th { background: #e6f4f1; color: #0b3b38; }
  .note { background: #fff8e6; border-left: 4px solid #e8a317; padding: 7px 11px; border-radius: 4px; }
  figure { margin: 12px 0 0; page-break-inside: avoid; } figure img { width: 100%; border: 1px solid #d9e2ec; border-radius: 6px; }
  figcaption { text-align: center; font-size: 9pt; color: #52606d; font-style: italic; margin-top: 4px; }
  code { background: #f0f4f8; padding: 1px 4px; border-radius: 3px; } li { margin: 3px 0; }
  </style></head><body>
  <div class="cover"><div class="top">CÔNG TY CỔ PHẦN TIN HỌC TRI THỨC</div>
    <div><h1>Hướng dẫn sử dụng<br>e-work Tri Thức</h1><span class="role">Dành cho ${role.name}</span><p class="intro">${role.intro}</p></div>
    <div class="foot">Phiên bản phần mềm ${VER} · Ban hành ngày ${DATE} · https://trithuc.qlda.trithucsoft.vn<br>Ảnh minh họa dùng dữ liệu mẫu.</div></div>
  <div class="toc"><h2>Nội dung</h2><ol>${toc}</ol></div>${body}</body></html>`;
}

(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const list = [];
  for (const k of Object.keys(ROLES)) {
    const role = ROLES[k], name = `HDSD e-work Tri Thuc - ${role.file} - V${VER}.pdf`;
    await p.setContent(html(k), { waitUntil: 'load' });
    await p.pdf({ path: path.join(OUT, name), format: 'A4', printBackground: true, displayHeaderFooter: true,
      headerTemplate: '<div></div>', footerTemplate: `<div style="font-size:8pt;color:#7b8794;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>HDSD e-work Tri Thức · ${role.name}</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`,
      margin: { top: '16mm', bottom: '18mm', left: '16mm', right: '16mm' } });
    list.push({ file: role.file, title: `Hướng dẫn sử dụng dành cho ${role.name}`, groups: [role.group], content: role.intro });
    console.log('PDF', name);
  }
  fs.writeFileSync(path.join(OUT, 'vai-tro.json'), JSON.stringify(list, null, 2));
  await b.close();
})();
