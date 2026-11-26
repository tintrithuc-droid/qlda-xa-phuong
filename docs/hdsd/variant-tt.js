// Bộ HDSD cho Công ty Cổ phần Tin học Tri Thức (https://trithuc.qlda.trithucsoft.vn): công ty tư vấn quản lý dự án, tư vấn giám sát.
// Dùng chung nội dung với bộ của xã, đổi tên nhóm quyền và từ ngữ theo cách Tri Thức đang dùng; nhân viên vừa giám sát, nhập liệu,
// vừa duyệt hồ sơ khi được người trình chọn đích danh; nhà thầu, chủ đầu tư là người ngoài.
// Dùng: HD_VARIANT=tt node build.js [qt|ld|kt|ke|gs|ub|dt]
const NAMES = {
  qt: ['Quản trị hệ thống', 'Quan tri he thong'],
  ld: ['Ban Giám đốc', 'Ban Giam doc'],
  kt: ['Nhân viên Tri Thức', 'Nhan vien Tri Thuc'],
  ke: ['Kế toán', 'Ke toan'],
  gs: ['Nhà thầu', 'Nha thau'],
  ub: ['Chủ đầu tư, khách hàng', 'Chu dau tu - Khach hang'],
};
// Thứ tự quan trọng: cụm dài trước, cụm ngắn sau
const MAP = [
  ['Ban Quản lý dự án đầu tư xây dựng xã/phường', 'Công ty Cổ phần Tin học Tri Thức'],
  ['Ban QLDA đầu tư xây dựng xã/phường', 'Công ty Cổ phần Tin học Tri Thức'],
  ['Phần mềm quản lý dự án đầu tư xây dựng', 'Phần mềm quản lý dự án tư vấn'],
  ['Tư vấn giám sát / Nhà thầu', 'Nhà thầu'],
  ['Lãnh đạo xã/phường', 'Chủ đầu tư, khách hàng'], ['Lãnh đạo UBND xã', 'Chủ đầu tư, khách hàng'],
  ['Lãnh đạo Ban', 'Ban Giám đốc'], ['lãnh đạo Ban', 'Ban Giám đốc'],
  ['Cán bộ kỹ thuật của Ban', 'Nhân viên Tri Thức'], ['Cán bộ kỹ thuật', 'Nhân viên Tri Thức'], ['cán bộ kỹ thuật', 'nhân viên Tri Thức'],
  ['Ban Quản lý dự án', 'công ty'], ['Ban QLDA', 'công ty'],
  ['Tư vấn giám sát xác nhận', 'Nhân viên giám sát xác nhận'], ['Tư vấn giám sát', 'Nhân viên giám sát'],
];
// «Ban» còn lại (chỉ Ban Quản lý dự án của xã) đổi thành «công ty»; đầu câu viết hoa
const rep = s => MAP.reduce((x, [a, b]) => x.split(a).join(b), s)
  .replace(/(^|[.!?:]\s+|\*\*|«|"|\n)?\bBan(?=[ ,.;)])(?! Giám đốc)/g, (m, pre) => pre !== undefined ? pre + 'Công ty' : 'công ty')
  .split('Vai trò của công ty').join('Vai trò của Ban');
const deep = v => typeof v === 'string' ? rep(v) : Array.isArray(v) ? v.map(deep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'img' || k === 'imgs2' ? x : deep(x)])) : v;

// Quyền mặc định theo nhóm của Tri Thức (thứ tự phân hệ như MODS trong content.js)
const E = 'Xem và cập nhật', V = 'Chỉ xem', N = 'Không truy cập';
const PERM = {
  qt: [E, E, E, E, E, E, E, E, E, E, E, E, E, E],
  ld: [V, E, V, V, V, V, V, V, V, V, V, V, V, V],
  kt: [V, E, E, E, E, E, E, E, E, E, E, E, V, N],
  ke: [V, V, E, N, N, V, N, N, V, V, E, E, V, N],
  gs: [V, V, N, N, V, N, E, E, E, V, N, N, N, N],
  ub: [V, V, V, V, N, N, V, N, N, V, V, V, V, N],
};
const SCOPE = { gs: 'chỉ các dự án được quản trị hệ thống giao', ub: 'chỉ các dự án được quản trị hệ thống giao' };

const chapter = (blocks, h1) => { const i = blocks.findIndex(b => b.h1 === h1); if (i < 0) return []; let j = blocks.findIndex((b, x) => x > i && b.h1); if (j < 0) j = blocks.length; return blocks.slice(i, j); };
const without = (blocks, h1) => { const c = chapter(blocks, h1); if (!c.length) return blocks; const i = blocks.indexOf(c[0]); return [...blocks.slice(0, i), ...blocks.slice(i + c.length)]; };
const insertBefore = (blocks, h1, add) => { const i = blocks.findIndex(b => b.h1 === h1); return i < 0 ? [...blocks, ...add] : [...blocks.slice(0, i), ...add, ...blocks.slice(i)]; };

module.exports = (ROLES, build) => {
  const R = {};
  for (const [k, r] of Object.entries(ROLES)) {
    if (k === 'ns') continue;
    R[k] = { ...r, prefix: 'HDSD Phan mem QLDA Tri Thuc', product: 'PHẦN MỀM QUẢN LÝ DỰ ÁN TƯ VẤN', code: 'HDSD-QLDA-TT-',
      top: ['CÔNG TY CỔ PHẦN TIN HỌC TRI THỨC', 'TƯ VẤN QUẢN LÝ DỰ ÁN, TƯ VẤN GIÁM SÁT'], coverSub: 'CÔNG TY CỔ PHẦN TIN HỌC TRI THỨC',
      v: 1, org: 'Công ty Cổ phần Tin học Tri Thức', glossary: [['BQLDA', 'Ban Quản lý dự án của chủ đầu tư'], ['TVGS', 'Tư vấn giám sát (nhân viên giám sát của Tri Thức)']] };
    if (NAMES[k]) { R[k].name = NAMES[k][0]; R[k].file = NAMES[k][1]; }
  }
  const tb = k => {
    let out = deep(build(k));
    // Bảng quyền mặc định và phạm vi dữ liệu theo nhóm của Tri Thức
    out.forEach(b => { if (b.table && /^Quyền mặc định của nhóm/.test(b.cap || '') && PERM[k]) b.table.rows = b.table.rows.map((r, i) => [r[0], r[1], PERM[k][i] || r[2]]); });
    out = out.map(b => b.p && /^Phạm vi dữ liệu:/.test(b.p) && SCOPE[k] ? { p: `Phạm vi dữ liệu: ${SCOPE[k]}.` } : b);
    if (k === 'kt') {
      // Nhân viên: giám sát xác nhận khối lượng, duyệt hồ sơ khi được người trình chọn đích danh
      const i = out.findIndex(b => b.p && /^Phạm vi dữ liệu:/.test(b.p));
      out.splice(i + 1, 0, { p: 'Nhân viên Tri Thức làm được mọi việc nghiệp vụ khi được phân công: lập và cập nhật dự án, gói thầu, hợp đồng, tiến độ, nhật ký, khối lượng, nghiệm thu, thanh toán. Ngoài ra nhân viên được cấp sẵn quyền **Kiểm tra hồ sơ** (giám sát xác nhận khối lượng nghiệm thu) và được **duyệt hồ sơ khi được giao**: người trình chọn đích danh người duyệt, mỗi người không tự duyệt hồ sơ do chính mình trình. Nhân viên không có quyền quản trị hệ thống và không sửa thẳng hồ sơ đã duyệt.' });
      const gs = deep(build('gs')), ld = deep(build('ld'));
      const confirm = chapter(gs, 'XÁC NHẬN KHỐI LƯỢNG NGHIỆM THU');
      const appr = chapter(ld, 'TRÌNH DUYỆT HỒ SƠ');
      const a = appr.findIndex(b => b.h2 === 'Duyệt, trả lại, từ chối hồ sơ'), z = appr.findIndex(b => b.h2 && /^Thu hồi/.test(b.h2));
      const duyet = [{ h1: 'DUYỆT HỒ SƠ KHI ĐƯỢC GIAO' },
        { p: 'Khi trình hồ sơ, người lập chọn đích danh người duyệt trong số Ban Giám đốc và nhân viên. Người được chọn thấy hồ sơ ở thẻ **Chờ tôi xử lý** của trang **Trình duyệt hồ sơ** và chuông thông báo; người khác không duyệt thay được. Mỗi người không tự duyệt hồ sơ do chính mình trình.' },
        ...appr.slice(a, z < 0 ? undefined : z),
        { note: 'Hồ sơ đã duyệt bị khóa. Cần điều chỉnh hồ sơ đã duyệt, đề nghị Ban Giám đốc **Thu hồi** hồ sơ về soạn thảo.' }];
      out = insertBefore(out, 'TRUNG TÂM CẢNH BÁO', [...confirm, ...duyet]);
    }
    if (k === 'gs') {
      // Nhà thầu là người ngoài: không xác nhận khối lượng (do nhân viên giám sát của Tri Thức xác nhận), được nhập khối lượng
      out = without(out, 'XÁC NHẬN KHỐI LƯỢNG NGHIỆM THU');
      out = out.filter(b => !(b.p && /^Ngoài các quyền trên, nhóm/.test(b.p)));
      const i = out.findIndex(b => b.p && /^Phạm vi dữ liệu:/.test(b.p));
      out.splice(i + 1, 0, { p: 'Tài khoản Nhà thầu do Tri Thức cấp cho cán bộ của nhà thầu thi công trên các dự án Tri Thức giám sát. Nhà thầu ghi nhật ký, cập nhật tiến độ, nhập khối lượng thực hiện; việc xác nhận khối lượng nghiệm thu do nhân viên giám sát của Tri Thức thực hiện.' });
    }
    if (k === 'ub') {
      const i = out.findIndex(b => b.p && /^Phạm vi dữ liệu:/.test(b.p));
      out.splice(i + 1, 0, { p: 'Tài khoản Chủ đầu tư, khách hàng do Tri Thức cấp để chủ đầu tư theo dõi trực tiếp các dự án Tri Thức đang tư vấn, giám sát: tiến độ, nhật ký, khối lượng, nghiệm thu, thanh toán. Tài khoản chỉ xem, không sửa dữ liệu.' });
    }
    return out;
  };
  return { ROLES: R, build: tb };
};
