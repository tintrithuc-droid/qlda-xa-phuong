// Nội dung bộ HDSD theo vai trò. Mỗi khối: h1/h2/h3/p/steps/bullets/img/imgs2/legend/table/note
const ROLES = {
  qt: { name: 'Quản trị hệ thống', file: 'Quan tri he thong', user: 'admin' },
  ld: { name: 'Lãnh đạo Ban', file: 'Lanh dao Ban', user: 'lanhdao' },
  kt: { name: 'Cán bộ kỹ thuật', file: 'Can bo ky thuat', user: 'kythuat' },
  ke: { name: 'Kế toán', file: 'Ke toan', user: 'ketoan' },
  gs: { name: 'Tư vấn giám sát / Nhà thầu', file: 'Tu van giam sat - Nha thau', user: 'giamsat' },
};
const MODS = ['Tổng quan', 'Quản lý dự án', 'Mô hình hóa công trình', 'Gói thầu và hợp đồng', 'Quản lý tiến độ', 'Nhật ký thi công', 'Quản lý khối lượng', 'Quản lý thanh toán', 'Báo cáo, thống kê', 'Quản trị hệ thống'];
const E = 'Xem và cập nhật', V = 'Chỉ xem', N = 'Không truy cập';
const PERM = {
  qt: [E, E, E, E, E, E, E, E, E, E],
  ld: [V, E, V, V, V, V, V, V, V, V],
  kt: [V, E, E, E, E, E, E, V, V, V],
  ke: [V, V, N, V, N, N, V, E, V, N],
  gs: [V, V, V, N, E, E, V, N, N, N],
};
const SCOPE = { qt: 'Tất cả dự án', ld: 'Tất cả dự án', kt: 'Tất cả dự án', ke: 'Tất cả dự án', gs: 'Chỉ các dự án được quản trị hệ thống giao (bộ dữ liệu mẫu: DA-TP01)' };
const PURPOSE = {
  qt: 'quản lý tài khoản người dùng, nhóm quyền, danh mục dùng chung, theo dõi nhật ký hoạt động, sao lưu và phục hồi dữ liệu, bảo đảm hệ thống vận hành ổn định và an toàn',
  ld: 'theo dõi tổng thể tình hình thực hiện các dự án, nắm bắt cảnh báo chậm tiến độ, chỉ đạo xử lý công việc, cập nhật thông tin dự án và khai thác báo cáo phục vụ điều hành',
  kt: 'quản lý thông tin dự án, tệp mô hình công trình, gói thầu và hợp đồng, lập và cập nhật tiến độ, ghi nhật ký thi công, quản lý khối lượng thực hiện và nghiệm thu',
  ke: 'lập kế hoạch thanh toán, lập và theo dõi hồ sơ thanh toán, xác nhận giá trị đã chi, đối chiếu khối lượng nghiệm thu và khai thác báo cáo giải ngân',
  gs: 'ghi nhật ký thi công kèm hình ảnh hiện trường, cập nhật tiến độ thực tế các hạng mục, tra cứu thông tin dự án, mô hình và khối lượng trong phạm vi được giao, kể cả trên điện thoại',
};

const img = (name, cap, w) => ({ img: name, cap, w });
const legend = rows => ({ legend: rows });

// ===== Phần chung =====
function common(k) {
  const r = ROLES[k], out = [];
  out.push({ h1: 'GIỚI THIỆU CHUNG' });
  out.push({ h2: 'Mục đích tài liệu' });
  out.push({ p: `Tài liệu này hướng dẫn cán bộ thuộc nhóm người dùng «${r.name}» sử dụng Phần mềm quản lý dự án đầu tư xây dựng của Ban Quản lý dự án – Trung tâm Thủy sản Thành phố Hồ Chí Minh (sau đây gọi là «phần mềm») để ${PURPOSE[k]}.` });
  out.push({ p: 'Nội dung được trình bày theo trình tự thao tác thực tế. Mỗi thao tác có hình minh họa chụp trực tiếp từ giao diện phần mềm; số liệu trên hình là dữ liệu mẫu dùng để chạy thử, được đánh dấu «(mẫu)».' });
  out.push({ h2: 'Đối tượng sử dụng và phạm vi quyền' });
  out.push({ p: `Tài khoản thuộc nhóm «${r.name}» được phân quyền mặc định như bảng dưới đây. Quản trị hệ thống có thể điều chỉnh quyền theo yêu cầu thực tế của Ban; khi đó phần mềm tự ẩn các chức năng không được phép sử dụng.` });
  out.push({ table: { head: ['TT', 'Phân hệ chức năng', 'Quyền mặc định'], widths: [800, 5200, 3000], rows: MODS.map((m, i) => [String(i + 1), m, PERM[k][i]]) }, cap: `Quyền mặc định của nhóm «${r.name}»` });
  out.push({ p: `Phạm vi dữ liệu: ${SCOPE[k]}.` });
  out.push({ h2: 'Quy ước trình bày' });
  out.push({ bullets: [
    'Khung đỏ có số thứ tự trên hình minh họa chỉ vị trí cần thao tác; bảng chú giải ngay dưới hình giải thích ý nghĩa từng số.',
    'Tên nút, thẻ, mục chọn trên giao diện được in đậm, ví dụ: nhấn nút **Lưu**.',
    'Ô nhập liệu có dấu * màu đỏ là thông tin bắt buộc; phần mềm không cho lưu khi còn bỏ trống.',
    'Ngày tháng nhập theo định dạng ngày/tháng/năm; số tiền tính bằng đồng, phần mềm tự hiển thị dấu chấm ngăn cách hàng nghìn.',
  ] });
  out.push({ h2: 'Yêu cầu về thiết bị' });
  out.push({ bullets: [
    'Máy tính: trình duyệt Google Chrome, Microsoft Edge hoặc Cốc Cốc phiên bản mới; độ phân giải màn hình khuyến nghị từ 1366 × 768 trở lên.',
    'Điện thoại: Android 7.0 trở lên (cài ứng dụng QLDA TTTS hoặc dùng trình duyệt Chrome); iPhone dùng trình duyệt Safari.',
    'Kết nối: mạng nội bộ của Ban hoặc kết nối Internet/VPN theo hướng dẫn của quản trị hệ thống. Địa chỉ truy cập do quản trị hệ thống cung cấp.',
  ] });

  out.push({ h1: 'BẮT ĐẦU SỬ DỤNG' });
  out.push({ h2: 'Đăng nhập hệ thống' });
  out.push({ steps: [
    'Mở trình duyệt, nhập địa chỉ phần mềm do quản trị hệ thống cung cấp.',
    'Nhập **Tên đăng nhập** (1) và **Mật khẩu** (2) được cấp.',
    'Nhấn nút **Đăng nhập** (3). Phần mềm mở trang làm việc phù hợp với quyền của tài khoản.',
  ] });
  out.push(img('chung-dang-nhap', 'Màn hình đăng nhập hệ thống', 16));
  out.push(legend([[1, 'Ô nhập tên đăng nhập'], [2, 'Ô nhập mật khẩu'], [3, 'Nút Đăng nhập']]));
  out.push({ note: 'Nhập sai mật khẩu 5 lần liên tiếp, tài khoản bị tạm khóa 15 phút để chống dò mật khẩu. Quên mật khẩu, đề nghị quản trị hệ thống đặt lại; không chia sẻ mật khẩu cho người khác.' });
  out.push({ h2: 'Giao diện làm việc chính' });
  out.push({ p: 'Sau khi đăng nhập, giao diện gồm thanh chức năng bên trái, thanh công cụ phía trên và vùng làm việc ở giữa.' });
  out.push(img(`${k}-giao-dien-chinh`, 'Bố cục giao diện làm việc chính', 16));
  out.push(legend([
    [1, 'Thanh chức năng: danh sách phân hệ được phép sử dụng, nhóm theo Điều hành – Nghiệp vụ – Khai thác – Tiện ích. Số màu đỏ bên phải là số việc cần chú ý (ví dụ hạng mục chậm tiến độ).'],
    [2, 'Tên trang đang mở.'],
    [3, 'Ô chọn dự án làm việc: chọn một dự án để mọi trang chỉ hiển thị số liệu của dự án đó; chọn «Tất cả dự án» để xem toàn bộ.'],
    [4, 'Trạng thái kết nối: «Đã kết nối máy chủ» nghĩa là dữ liệu được lưu tập trung và tự làm mới khoảng 30 giây một lần.'],
    [5, 'Tài khoản đang đăng nhập; nhấn vào để đổi mật khẩu hoặc đăng xuất.'],
    [6, 'Vùng làm việc của trang đang mở.'],
  ]));
  out.push({ h2: 'Đổi mật khẩu và đăng xuất' });
  out.push({ steps: [
    'Nhấn vào tên tài khoản ở góc trên bên phải màn hình. Hộp **Tài khoản** hiện thông tin người dùng.',
    'Chọn **Đổi mật khẩu** (1), nhập mật khẩu hiện tại, mật khẩu mới (tối thiểu 8 ký tự, có cả chữ và số) và nhập lại mật khẩu mới, sau đó nhấn **Lưu**.',
    'Kết thúc phiên làm việc, chọn **Đăng xuất** (2). Khi dùng máy tính dùng chung, luôn đăng xuất trước khi rời máy.',
  ] });
  out.push({ imgs2: ['chung-tai-khoan', 'chung-doi-mat-khau'], caps: ['Hộp thông tin tài khoản', 'Hộp đổi mật khẩu'] });
  out.push(legend([[1, 'Đổi mật khẩu'], [2, 'Đăng xuất khỏi hệ thống']]));
  return out;
}

const tail = (k, mobile) => {
  const out = [];
  if (mobile) out.push(...mobileSection(k));
  out.push({ h1: 'CÂU HỎI THƯỜNG GẶP VÀ HỖ TRỢ' });
  out.push({ table: { head: ['Tình huống', 'Cách xử lý'], widths: [3600, 5400], rows: [
    ['Không đăng nhập được, báo sai tên đăng nhập hoặc mật khẩu', 'Kiểm tra bộ gõ tiếng Việt và phím Caps Lock. Sau 5 lần sai tài khoản bị khóa 15 phút; liên hệ quản trị hệ thống nếu quên mật khẩu.'],
    ['Thông báo «Tài khoản đã bị khóa»', 'Tài khoản bị quản trị hệ thống khóa hoặc đang trong thời gian khóa tạm. Liên hệ quản trị hệ thống.'],
    ['Không thấy một chức năng trên thanh bên trái', 'Nhóm người dùng của tài khoản chưa được cấp quyền phân hệ đó. Đề nghị quản trị hệ thống xem lại phân quyền.'],
    ['Không thấy dữ liệu của một dự án', 'Kiểm tra ô chọn dự án ở thanh công cụ phía trên; nếu vẫn không thấy, tài khoản chưa được giao phạm vi dự án đó.'],
    ['Không xóa được một bản ghi', 'Bản ghi còn dữ liệu liên quan (ví dụ gói thầu còn hợp đồng, hợp đồng còn khối lượng). Xử lý các bản ghi liên quan trước.'],
    ['Màn hình báo mất kết nối', 'Kiểm tra mạng; phần mềm tự kết nối lại. Thông tin đang nhập dở trong hộp nhập liệu chưa được lưu cho đến khi nhấn Lưu thành công.'],
    ['Tải tệp đính kèm không được', 'Mỗi tệp tối đa 500 MB; phần mềm không nhận tệp chương trình (.exe, .bat…) vì lý do an toàn.'],
  ] }, cap: 'Một số tình huống thường gặp' });
  out.push({ p: 'Đầu mối hỗ trợ kỹ thuật: quản trị hệ thống của Ban Quản lý dự án; đơn vị phát triển phần mềm: Công ty Cổ phần Tin học Tri Thức. Khi báo lỗi, đề nghị ghi rõ tên đăng nhập, thời điểm, trang đang thao tác và chụp màn hình thông báo lỗi (nếu có).' });
  return out;
};

function mobileSection(k) {
  const out = [];
  out.push({ h1: 'SỬ DỤNG TRÊN ĐIỆN THOẠI' });
  out.push({ p: 'Phần mềm tự điều chỉnh giao diện cho màn hình điện thoại, phù hợp với cán bộ làm việc tại hiện trường. Có hai cách sử dụng:' });
  out.push({ bullets: [
    'Điện thoại Android: cài tệp ứng dụng QLDA_TTTS_v1.0.1.apk theo «Hướng dẫn cài ứng dụng trên điện thoại»; lần đầu mở ứng dụng, nhập địa chỉ máy chủ do quản trị hệ thống cung cấp.',
    'iPhone: mở Safari, truy cập địa chỉ phần mềm, nhấn nút Chia sẻ → **Thêm vào MH chính** để tạo biểu tượng như một ứng dụng.',
  ] });
  out.push({ h2: 'Trang Hiện trường' });
  out.push({ p: 'Sau khi đăng nhập trên điện thoại, chọn **Hiện trường** ở thanh dưới cùng. Trang gồm các ô thao tác nhanh (1) và thanh điều hướng (2) để chuyển giữa Tổng quan, Dự án, Hiện trường, Nhật ký và Menu đầy đủ.' });
  out.push({ imgs2: ['dt-dang-nhap', 'dt-hien-truong'], caps: ['Đăng nhập trên điện thoại', 'Trang Hiện trường'], mobile: true });
  out.push(legend([[1, 'Các ô thao tác nhanh: tra cứu dự án, cập nhật tiến độ, ghi nhật ký, hợp đồng, khối lượng, thanh toán, đổi mật khẩu, đăng xuất'], [2, 'Thanh điều hướng dưới cùng']]));
  out.push({ h2: 'Ghi nhật ký và chụp ảnh tại hiện trường' });
  out.push({ steps: [
    'Trên trang Hiện trường, chọn ô **Ghi nhật ký thi công**.',
    'Chọn gói thầu, ngày, ca làm việc, thời tiết; nhập số nhân công, máy móc và các công việc thực hiện (mỗi dòng một công việc theo mẫu «Nội dung | Khối lượng | Đơn vị»).',
    'Tại ô **Hình ảnh hiện trường**, chọn **Máy ảnh** để chụp trực tiếp hoặc chọn ảnh có sẵn trong máy; có thể chọn nhiều ảnh. Ảnh tự thu nhỏ còn tối đa 1920 điểm ảnh để tiết kiệm dung lượng.',
    'Nhấn **Lưu**. Nhật ký và ảnh được gửi ngay về máy chủ.',
  ] });
  out.push({ h2: 'Cập nhật tiến độ nhanh' });
  out.push({ steps: [
    'Trên trang Hiện trường, chọn ô **Cập nhật tiến độ**.',
    'Chọn hạng mục tiến độ (danh sách hiện kèm phần trăm hiện tại), nhập **Tiến độ thực tế lũy kế (%)** và ghi chú nếu có, nhấn **Lưu**.',
  ] });
  out.push({ imgs2: ['dt-ghi-nhat-ky', 'dt-cap-nhat-tien-do'], caps: ['Ghi nhật ký trên điện thoại', 'Cập nhật tiến độ trên điện thoại'], mobile: true });
  out.push({ imgs2: ['dt-nhat-ky', 'dt-menu'], caps: ['Danh sách nhật ký trên điện thoại', 'Menu chức năng đầy đủ'], mobile: true });
  out.push({ note: 'Trên điện thoại, các bảng dữ liệu tự chuyển thành dạng thẻ: mỗi dòng là một thẻ, nhãn cột hiện bên trái giá trị, không cần kéo ngang màn hình.' });
  return out;
}

// ===== Phần riêng theo vai trò =====
const S = {};

S.dashboard = (k, shotName) => [
  { h2: 'Theo dõi Tổng quan tình hình thực hiện' },
  { p: 'Trang **Tổng quan** tổng hợp số liệu của các dự án trong phạm vi được phân quyền, cập nhật tự động theo dữ liệu các bộ phận nhập.' },
  img(shotName, 'Trang Tổng quan tình hình thực hiện', 15),
  ...(shotName === 'ld-tong-quan' ? [legend([
    [1, 'Các chỉ tiêu chính: số dự án, tổng mức đầu tư, giá trị hợp đồng, giá trị đã giải ngân và số cảnh báo (ô đỏ khi có cảnh báo nghiêm trọng).'],
    [2, 'Biểu đồ: dự án theo trạng thái; tiến độ kế hoạch và thực tế từng gói thầu; giá trị hợp đồng; khối lượng thực hiện – nghiệm thu – thanh toán; đường cong S so sánh kế hoạch và thực tế.'],
    [3, 'Cảnh báo và việc cần xử lý: hạng mục quá hạn, chậm so với kế hoạch, công việc sắp đến hạn. Nhấn **Xem** để mở ngay nội dung cần xử lý.'],
    [4, 'Bảng tình hình thực hiện các dự án; nhấn tên dự án để mở chi tiết.'],
  ])] : []),
  { p: 'Muốn xem riêng một dự án, chọn dự án tại ô chọn dự án trên thanh công cụ phía trên; toàn bộ chỉ tiêu và biểu đồ tự tính lại theo dự án đã chọn.' },
];

S.reports = () => [
  { h1: 'KHAI THÁC BÁO CÁO, THỐNG KÊ' },
  { p: 'Phân hệ **Báo cáo, thống kê** cho phép lọc, tra cứu và xuất 05 loại báo cáo ra tệp Excel:' },
  { bullets: ['Báo cáo tổng hợp tình hình thực hiện dự án;', 'Báo cáo tiến độ thực hiện dự án và các gói thầu;', 'Báo cáo tình hình thực hiện hợp đồng;', 'Báo cáo khối lượng thực hiện, nghiệm thu và thanh toán;', 'Báo cáo tổng hợp theo dự án, gói thầu và thời gian.'] },
  { steps: [
    'Chọn **Báo cáo, thống kê** trên thanh chức năng.',
    'Chọn loại báo cáo (1), dự án (2), gói thầu (3); nhập khoảng thời gian «Từ – Đến» và từ khóa tra cứu nếu cần. Bảng số liệu hiển thị ngay bên dưới.',
    'Nhấn **Xuất Excel** (4) để tải tệp báo cáo về máy; tệp mở được bằng Microsoft Excel hoặc LibreOffice.',
  ] },
  img('chung-bao-cao', 'Trang Báo cáo, thống kê', 16),
  legend([[1, 'Chọn loại báo cáo'], [2, 'Lọc theo dự án'], [3, 'Lọc theo gói thầu'], [4, 'Xuất báo cáo ra Excel']]),
  img('chung-bao-cao-tien-do', 'Ví dụ báo cáo tiến độ thực hiện dự án và các gói thầu', 16),
  { note: 'Mẫu biểu báo cáo theo quy định của cơ quan quản lý nhà nước sẽ được bổ sung khi Ban cung cấp mẫu chính thức trong quá trình triển khai.' },
];

S.projectView = (edit) => [
  { h1: 'QUẢN LÝ DỰ ÁN' },
  { h2: 'Tra cứu danh sách dự án' },
  { p: 'Chọn **Quản lý dự án** trên thanh chức năng để xem danh sách các dự án kèm trạng thái, tổng mức đầu tư, số gói thầu, thời gian thực hiện và tiến độ.' },
  img('ld-du-an', 'Danh sách dự án', 16),
  legend([[1, 'Ô tìm kiếm theo mã, tên, địa điểm dự án'], [2, 'Lọc theo trạng thái dự án'], [3, 'Thêm dự án mới (chỉ hiện với tài khoản có quyền cập nhật)'], [4, 'Nhấn vào một dòng để mở chi tiết dự án']]),
  { h2: 'Xem chi tiết dự án' },
  { p: 'Trang chi tiết dự án gồm 04 thẻ (1): **Thông tin chung**, **Công việc**, **Hồ sơ pháp lý**, **Tình trạng thực hiện**. ' + (edit ? 'Nút **Sửa thông tin** (2) dùng để cập nhật thông tin dự án; nút **Danh sách dự án** (3) để quay lại.' : 'Nút **Danh sách dự án** (3) để quay lại.') },
  img('ld-du-an-chi-tiet', 'Thông tin chung của dự án', 16),
  legend([[1, 'Các thẻ thông tin của dự án'], [2, 'Sửa thông tin dự án'], [3, 'Quay lại danh sách dự án']]),
  { p: 'Thẻ **Tình trạng thực hiện** thể hiện các chỉ tiêu tiến độ, giá trị hợp đồng, giải ngân; đường cong S kế hoạch – thực tế của dự án; tình trạng từng gói thầu và các cảnh báo liên quan.' },
  img('ld-du-an-tinh-trang', 'Tình trạng thực hiện dự án', 16),
];

S.projectEdit = () => [
  { h2: 'Thêm mới, cập nhật thông tin dự án' },
  { steps: [
    'Tại danh sách dự án, nhấn **+ Thêm dự án**; hoặc tại trang chi tiết dự án, nhấn **Sửa thông tin**.',
    'Nhập mã dự án, tên dự án, trạng thái, tổng mức đầu tư (bắt buộc) và các thông tin: nhóm dự án, giai đoạn, nguồn vốn, thời gian, chủ đầu tư, địa điểm, quyết định phê duyệt, quy mô.',
    'Nhấn **Lưu**. Phần mềm ghi nhận người cập nhật và thời điểm vào nhật ký hoạt động.',
  ] },
  img('kt-them-du-an', 'Hộp nhập thông tin dự án', 12),
  { h2: 'Quản lý hồ sơ pháp lý dự án' },
  { steps: [
    'Mở chi tiết dự án, chọn thẻ **Hồ sơ pháp lý**, nhấn **+ Thêm hồ sơ** (1).',
    'Chọn loại hồ sơ (quyết định chủ trương đầu tư, quyết định phê duyệt dự án, giấy phép xây dựng…), nhập số hiệu, ngày ban hành, cơ quan ban hành, trích yếu; đính kèm tệp PDF hoặc ảnh scan.',
    'Nhấn **Lưu**. Tệp đính kèm được lưu trên máy chủ; nhấn tên tệp trong danh sách để mở hoặc tải về.',
  ] },
  img('ld-du-an-phap-ly', 'Danh sách hồ sơ pháp lý của dự án', 16),
  legend([[1, 'Thêm hồ sơ pháp lý']]),
  img('chung-them-ho-so-phap-ly', 'Hộp nhập hồ sơ pháp lý', 12),
  { h2: 'Giao và theo dõi công việc' },
  { steps: [
    'Mở chi tiết dự án, chọn thẻ **Công việc**, nhấn **+ Thêm công việc** (1).',
    'Nhập tên công việc, đơn vị hoặc người phụ trách, hạn hoàn thành, mức ưu tiên, trạng thái và ghi chú; nhấn **Lưu**.',
    'Khi công việc xong, nhấn **Hoàn thành** (2) trên dòng công việc. Công việc quá hạn được tô đỏ và đưa vào mục cảnh báo trên trang Tổng quan.',
  ] },
  img('ld-du-an-cong-viec', 'Danh sách công việc của dự án', 16),
  legend([[1, 'Thêm công việc'], [2, 'Đánh dấu hoàn thành công việc']]),
  img('ld-them-cong-viec', 'Hộp thêm công việc', 12),
];

S.scheduleView = () => [
  { h1: 'THEO DÕI TIẾN ĐỘ' },
  { p: 'Phân hệ **Quản lý tiến độ** hiển thị danh sách cảnh báo chậm tiến độ (1): hạng mục quá hạn (nền đỏ) và hạng mục chậm so với kế hoạch (nền vàng), kèm tỷ lệ thực tế so với kế hoạch đến ngày hiện tại.' },
  img('ld-tien-do', 'Cảnh báo chậm tiến độ', 16),
  legend([[1, 'Danh sách cảnh báo chậm tiến độ']]),
  { p: 'Phần **Theo dõi tiến độ** có hai cách xem (1): **Theo dự án** và **Theo gói thầu**, cho biết tiến độ kế hoạch đến nay, thực tế, chênh lệch và số hạng mục chậm. Bên dưới là **Biểu đồ tiến độ (Gantt)**: thanh nhạt là thời gian kế hoạch, phần đậm là khối lượng đã hoàn thành, đường đứt nét đỏ là ngày hiện tại.' },
  img('ld-tien-do-theo-doi', 'Theo dõi tiến độ và biểu đồ Gantt', 16),
  legend([[1, 'Chuyển cách xem theo dự án hoặc theo gói thầu']]),
];

S.contractView = () => [
  { h2: 'Tra cứu gói thầu và hợp đồng' },
  { p: 'Chọn **Gói thầu và hợp đồng**, nhấn vào một gói thầu để xem: thông tin hợp đồng (1) gồm số hợp đồng, nhà thầu, giá trị, thời gian, bảo lãnh, tạm ứng; theo dõi tiến độ thực hiện hợp đồng (2) so sánh tiến độ thời gian với tiến độ thi công, giá trị thực hiện, nghiệm thu và thanh toán; các phụ lục điều chỉnh và hồ sơ pháp lý của gói thầu.' },
  img('ld-hop-dong', 'Chi tiết gói thầu và hợp đồng', 16),
  legend([[1, 'Thông tin hợp đồng'], [2, 'Theo dõi tiến độ thực hiện hợp đồng và cảnh báo']]),
];

S.paymentView = () => [
  { h2: 'Theo dõi thanh toán, giải ngân' },
  { p: 'Phân hệ **Quản lý thanh toán** cho biết giá trị hợp đồng, đã thanh toán, đang đề nghị và kế hoạch năm (1). Các thẻ (2) cho phép xem chi tiết theo dõi đã thanh toán, kế hoạch thanh toán, hồ sơ thanh toán và tổng hợp theo quý.' },
  img('ld-thanh-toan', 'Theo dõi thanh toán', 16),
  legend([[1, 'Các chỉ tiêu thanh toán chính'], [2, 'Các thẻ theo dõi chi tiết']]),
];

// ===== Kỹ thuật =====
S.model = () => [
  { h1: 'MÔ HÌNH HÓA CÔNG TRÌNH' },
  { p: 'Phân hệ **Mô hình hóa công trình** lưu trữ tập trung các tệp mô hình (IFC, RVT, DWG, NWD, PDF…) theo dự án và hạng mục, quản lý phiên bản và thông tin hạng mục công trình. Phần mềm không dựng hay hiển thị mô hình 3D; tệp được tải về để mở bằng phần mềm chuyên dụng.' },
  img('kt-mo-hinh', 'Trang Mô hình hóa công trình', 16),
  legend([[1, 'Chọn dự án'], [2, 'Tải lên tệp mô hình mới'], [3, 'Cập nhật phiên bản mới cho tệp'], [4, 'Xem lịch sử các phiên bản']]),
  { h2: 'Tải lên tệp mô hình' },
  { steps: [
    'Chọn dự án (1), nhấn **+ Tải lên tệp mô hình** (2).',
    'Chọn tệp trên máy (tối đa 500 MB mỗi tệp); tên tệp tự lấy theo tệp đã chọn nếu để trống.',
    'Chọn định dạng, hạng mục công trình liên quan, nhập đơn vị lập và nội dung; nhấn **Lưu**.',
  ] },
  img('kt-tai-mo-hinh', 'Hộp tải lên tệp mô hình', 12),
  { h2: 'Cập nhật phiên bản và tra cứu lịch sử' },
  { steps: [
    'Trên dòng tệp mô hình, nhấn **Cập nhật phiên bản** (3), chọn tệp mới và ghi nội dung thay đổi so với phiên bản trước; nhấn **Lưu**. Số phiên bản tự tăng (v1, v2, v3…).',
    'Nhấn **Lịch sử** (4) để xem toàn bộ các phiên bản: ngày, đơn vị lập, nội dung thay đổi, dung lượng; nhấn biểu tượng tệp để tải phiên bản cần xem.',
  ] },
  img('kt-lich-su-mo-hinh', 'Lịch sử phiên bản tệp mô hình', 12),
  { h2: 'Quản lý thông tin hạng mục công trình' },
  { steps: [
    'Tại phần **Thông tin các hạng mục công trình**, nhấn **+ Thêm hạng mục** (1) hoặc **Sửa** (2) trên dòng hạng mục.',
    'Nhập mã, tên hạng mục, kết cấu/vật liệu, diện tích, số tầng, quy mô; tiến độ (%) chỉ nhập khi hạng mục chưa gắn với kế hoạch tiến độ. Nhấn **Lưu**.',
  ] },
  img('kt-hang-muc', 'Danh sách hạng mục công trình', 16),
  legend([[1, 'Thêm hạng mục'], [2, 'Sửa hạng mục']]),
  img('kt-them-hang-muc', 'Hộp thêm hạng mục công trình', 12),
];

S.packages = () => [
  { h1: 'GÓI THẦU VÀ HỢP ĐỒNG' },
  { h2: 'Danh sách gói thầu' },
  img('kt-goi-thau', 'Danh sách gói thầu', 16),
  legend([[1, 'Tìm kiếm, lọc theo loại gói thầu và trạng thái'], [2, 'Thêm gói thầu'], [3, 'Nhấn một dòng để mở chi tiết gói thầu']]),
  { h2: 'Thêm gói thầu' },
  { steps: [
    'Nhấn **+ Thêm gói thầu** (2).',
    'Chọn dự án, nhập ký hiệu, loại gói thầu (xây lắp, tư vấn, thiết bị…), tên gói thầu, hình thức lựa chọn nhà thầu, giá gói thầu, trạng thái và thời gian thực hiện; nhấn **Lưu**.',
  ] },
  img('kt-them-goi-thau', 'Hộp thêm gói thầu', 12),
  { h2: 'Nhập và cập nhật hợp đồng' },
  { p: 'Mở chi tiết gói thầu. Khi gói thầu chưa có hợp đồng, nhấn **+ Nhập thông tin hợp đồng**; khi đã có, nhấn **Sửa** trong khung Thông tin hợp đồng (2).' },
  img('kt-chi-tiet-goi-thau', 'Chi tiết gói thầu', 15),
  legend([[1, 'Sửa thông tin gói thầu'], [2, 'Thông tin hợp đồng'], [3, 'Liên kết nhanh tới khối lượng, thanh toán, tiến độ của hợp đồng'], [4, 'Điều chỉnh, phụ lục hợp đồng'], [5, 'Hồ sơ pháp lý của gói thầu']]),
  { steps: [
    'Nhập số hợp đồng, ngày ký, nhà thầu/liên danh, loại hợp đồng, giá trị hợp đồng, ngày bắt đầu, ngày kết thúc, tỷ lệ bảo lãnh thực hiện và tạm ứng.',
    'Nhấn **Lưu**. Giá trị và thời gian hợp đồng là căn cứ để phần mềm theo dõi tiến độ, khối lượng và thanh toán.',
  ] },
  img('kt-sua-hop-dong', 'Hộp cập nhật hợp đồng', 12),
  { h2: 'Thêm phụ lục, điều chỉnh hợp đồng' },
  { steps: [
    'Trong khung **Điều chỉnh, phụ lục hợp đồng** (4), nhấn **+ Thêm phụ lục**.',
    'Nhập số phụ lục, ngày ký, nội dung điều chỉnh, giá trị điều chỉnh (số dương là tăng, số âm là giảm) và số ngày gia hạn; nhấn **Lưu**. Giá trị và thời hạn hợp đồng sau điều chỉnh được tính tự động.',
  ] },
  img('kt-them-phu-luc', 'Hộp thêm phụ lục hợp đồng', 12),
];

S.schedule = () => [
  { h1: 'QUẢN LÝ TIẾN ĐỘ' },
  { h2: 'Lập kế hoạch tiến độ' },
  { steps: [
    'Chọn **Quản lý tiến độ**, nhấn **+ Lập kế hoạch tiến độ**.',
    'Chọn gói thầu, nhập tên hạng mục/công việc, ngày bắt đầu và kết thúc kế hoạch, trọng số (tỷ trọng giá trị trong gói thầu, %); có thể gắn với hạng mục công trình.',
    'Nhấn **Lưu**. Tiến độ gói thầu được tính bình quân theo trọng số các hạng mục.',
  ] },
  img('kt-lap-ke-hoach', 'Hộp lập kế hoạch tiến độ', 12),
  { h2: 'Cập nhật tiến độ thực tế' },
  { steps: [
    'Tại **Biểu đồ tiến độ (Gantt)**, nhấn **Cập nhật** (1) trên dòng hạng mục.',
    'Nhập tiến độ thực tế lũy kế (%), ngày cập nhật và ghi chú hoặc nguyên nhân chậm; nhấn **Lưu**. Thanh tiến độ đổi màu: xanh – đạt, vàng – chậm, đỏ – quá hạn.',
    'Nhấn **⋯** (2) để xem chi tiết hạng mục và lịch sử các lần cập nhật; tại đây có nút **Điều chỉnh kế hoạch** và **Xóa hạng mục**.',
  ] },
  img('kt-gantt', 'Biểu đồ tiến độ (Gantt)', 16),
  legend([[1, 'Cập nhật tiến độ thực tế'], [2, 'Xem chi tiết, lịch sử, điều chỉnh kế hoạch'], [3, 'Đường ngày hiện tại']]),
  { imgs2: ['kt-cap-nhat-tien-do', 'kt-chi-tiet-tien-do'], caps: ['Hộp cập nhật tiến độ', 'Chi tiết và lịch sử cập nhật'] },
];

S.diary = (shot, addShot) => [
  { h1: 'NHẬT KÝ THI CÔNG' },
  { p: 'Phân hệ **Nhật ký thi công** ghi nhận diễn biến hằng ngày tại công trường: thời tiết, nhân công, máy móc, công việc và khối lượng thực hiện, vướng mắc, xác nhận của giám sát và hình ảnh hiện trường.' },
  img(shot, 'Danh sách nhật ký thi công', 16),
  ...(shot === 'kt-nhat-ky' ? [legend([[1, 'Lọc theo gói thầu, khoảng ngày và tra cứu nội dung'], [2, 'Ghi nhật ký mới'], [3, 'Bổ sung ảnh hiện trường cho trang nhật ký'], [4, 'Sửa trang nhật ký']])] : [legend([[1, 'Ghi nhật ký mới'], [2, 'Bổ sung ảnh hiện trường cho trang nhật ký']])]),
  { h2: 'Ghi nhật ký thi công' },
  { steps: [
    'Nhấn **+ Ghi nhật ký**.',
    'Chọn gói thầu, ngày, ca làm việc, thời tiết; nhập số nhân công, máy móc thiết bị.',
    'Nhập công việc thực hiện, mỗi dòng một công việc theo mẫu «Nội dung | Khối lượng | Đơn vị», ví dụ: «Đổ bê tông móng M1–M4 | 18,5 | m3».',
    'Ghi vướng mắc, sự cố, kiến nghị (nếu có) và họ tên cán bộ giám sát xác nhận.',
    'Tại **Hình ảnh hiện trường**, chọn một hoặc nhiều ảnh; nhấn **Lưu**.',
  ] },
  img(addShot, 'Hộp ghi nhật ký thi công', 12),
  { note: 'Nhấn vào ảnh thu nhỏ trên trang nhật ký để xem ảnh cỡ lớn. Vướng mắc, sự cố được làm nổi bật màu vàng để lãnh đạo dễ theo dõi.' },
];

S.volume = () => [
  { h1: 'QUẢN LÝ KHỐI LƯỢNG' },
  { p: 'Phân hệ **Quản lý khối lượng** quản lý bảng khối lượng theo hợp đồng, các lần cập nhật khối lượng thực hiện và nghiệm thu, tổng hợp giá trị theo kỳ.' },
  img('kt-khoi-luong', 'Bảng khối lượng hợp đồng', 16),
  legend([[1, 'Chọn hợp đồng'], [2, 'Các thẻ: Khối lượng theo hợp đồng – Theo dõi nghiệm thu – Tổng hợp'], [3, 'Thêm công việc vào bảng khối lượng hợp đồng'], [4, 'Cập nhật khối lượng thực hiện']]),
  { h2: 'Lập bảng khối lượng hợp đồng' },
  { steps: [
    'Chọn hợp đồng (1), tại thẻ **Khối lượng theo hợp đồng** nhấn **+ Thêm công việc** (3).',
    'Nhập mã hiệu, đơn vị tính, nội dung công việc, khối lượng hợp đồng và đơn giá; phần mềm tự tính thành tiền. Nhấn **Lưu**.',
  ] },
  img('kt-them-boq', 'Hộp thêm công việc vào bảng khối lượng', 12),
  { h2: 'Cập nhật khối lượng thực hiện và nghiệm thu' },
  { steps: [
    'Nhấn **+ Cập nhật khối lượng thực hiện** (4).',
    'Chọn công việc, ngày, đợt/kỳ; nhập khối lượng thực hiện trong kỳ, khối lượng được nghiệm thu và số biên bản nghiệm thu; nhấn **Lưu**.',
    'Phần mềm cộng dồn khối lượng lũy kế, tính % thực hiện và giá trị nghiệm thu. Khi khối lượng lũy kế vượt khối lượng hợp đồng, phần mềm hiển thị cảnh báo để kiểm tra (không chặn việc nhập).',
  ] },
  img('kt-cap-nhat-khoi-luong', 'Hộp cập nhật khối lượng thực hiện', 12),
  { p: 'Thẻ **Theo dõi nghiệm thu** liệt kê từng lần cập nhật kèm trạng thái và biên bản; thẻ **Tổng hợp** thể hiện giá trị thực hiện, nghiệm thu theo tháng và lũy kế.' },
  img('kt-nghiem-thu', 'Theo dõi nghiệm thu', 16),
  img('kt-tong-hop-khoi-luong', 'Tổng hợp khối lượng theo kỳ', 16),
];

// ===== Kế toán =====
S.payments = () => [
  { h1: 'QUẢN LÝ THANH TOÁN' },
  { h2: 'Theo dõi giá trị đã thanh toán' },
  { p: 'Chọn **Quản lý thanh toán**. Thẻ **Theo dõi đã thanh toán** liệt kê từng hợp đồng: giá trị hợp đồng, đã nghiệm thu, đã thanh toán, đang đề nghị, còn lại và tỷ lệ thanh toán.' },
  img('ke-thanh-toan', 'Theo dõi giá trị đã thanh toán theo hợp đồng', 16),
  legend([[1, 'Lọc theo hợp đồng'], [2, 'Các thẻ: Theo dõi đã thanh toán – Kế hoạch thanh toán – Hồ sơ thanh toán – Tổng hợp'], [3, 'Bảng theo dõi theo hợp đồng']]),
  { h2: 'Lập kế hoạch thanh toán' },
  { steps: [
    'Chọn thẻ **Kế hoạch thanh toán**, nhấn **+ Thêm kế hoạch** (1).',
    'Chọn hợp đồng, nhập đợt thanh toán, thời gian dự kiến, giá trị kế hoạch và ghi chú; nhấn **Lưu**.',
    'Nhấn **Sửa** (2) để điều chỉnh kế hoạch. Tình trạng từng đợt (đã thực hiện, đến hạn, quá hạn) được phần mềm tự xác định.',
  ] },
  img('ke-ke-hoach', 'Kế hoạch thanh toán', 16),
  legend([[1, 'Thêm kế hoạch thanh toán'], [2, 'Sửa kế hoạch']]),
  img('ke-them-ke-hoach', 'Hộp thêm kế hoạch thanh toán', 12),
  { h2: 'Lập và theo dõi hồ sơ thanh toán' },
  { steps: [
    'Chọn thẻ **Hồ sơ thanh toán**, nhấn **+ Lập hồ sơ thanh toán** (1).',
    'Chọn hợp đồng, nhập số hồ sơ, ngày, loại thanh toán (tạm ứng, thanh toán khối lượng…), trạng thái, giá trị và nội dung; đính kèm bảng xác định giá trị, giấy đề nghị thanh toán; nhấn **Lưu**.',
    'Khi Kho bạc đã chi, nhấn **Xác nhận đã chi** (2); hồ sơ chuyển sang trạng thái «Đã thanh toán» và được cộng vào giá trị giải ngân.',
    'Nhấn **Sửa** (3) để cập nhật trạng thái trung gian (đề nghị, trình Kho bạc…).',
  ] },
  img('ke-ho-so', 'Danh sách hồ sơ thanh toán', 16),
  legend([[1, 'Lập hồ sơ thanh toán'], [2, 'Xác nhận đã chi'], [3, 'Sửa hồ sơ']]),
  img('ke-lap-ho-so', 'Hộp lập hồ sơ thanh toán', 12),
  { h2: 'Tổng hợp thanh toán theo quý và theo dự án' },
  { p: 'Thẻ **Tổng hợp** so sánh kế hoạch và thực tế thanh toán theo quý, tổng hợp giá trị thanh toán theo dự án (tỷ lệ giải ngân so với tổng mức đầu tư) và lũy kế theo quý.' },
  img('ke-tong-hop', 'Tổng hợp thanh toán', 15),
  { h2: 'Đối chiếu khối lượng nghiệm thu' },
  { p: 'Trước khi lập hồ sơ thanh toán, mở **Quản lý khối lượng** → thẻ **Theo dõi nghiệm thu** để đối chiếu khối lượng, giá trị đã nghiệm thu và số biên bản của hợp đồng (chỉ xem).' },
  img('ke-nghiem-thu', 'Đối chiếu khối lượng nghiệm thu', 16),
];

// ===== Quản trị =====
S.admin = () => [
  { h1: 'KHỞI TẠO HỆ THỐNG' },
  { p: 'Lần đầu truy cập sau khi cài đặt, phần mềm hiển thị màn hình **Khởi tạo hệ thống** để tạo tài khoản quản trị đầu tiên.' },
  { steps: [
    'Nhập họ và tên (1), tên đăng nhập (2), mật khẩu (3) và nhập lại mật khẩu (4).',
    'Chỉ đánh dấu **Nạp dữ liệu mẫu** (5) khi cần chạy thử; khi đưa vào sử dụng chính thức, bỏ đánh dấu.',
    'Nhấn **Khởi tạo hệ thống** (6). Phần mềm tạo sẵn các nhóm quyền và danh mục dùng chung mặc định.',
  ] },
  img('qt-khoi-tao', 'Màn hình khởi tạo hệ thống', 16),
  legend([[1, 'Họ và tên quản trị'], [2, 'Tên đăng nhập'], [3, 'Mật khẩu'], [4, 'Nhập lại mật khẩu'], [5, 'Tùy chọn nạp dữ liệu mẫu'], [6, 'Nút Khởi tạo hệ thống']]),
  { note: 'Màn hình này chỉ xuất hiện một lần khi cơ sở dữ liệu chưa có người dùng. Ghi nhớ và bảo quản mật khẩu quản trị theo quy định an toàn thông tin của Ban.' },

  { h1: 'QUẢN LÝ NGƯỜI DÙNG' },
  { p: 'Chọn **Quản trị hệ thống**. Các thẻ (1) gồm: Người dùng, Nhóm và phân quyền, Danh mục dùng chung, Nhật ký hoạt động, Sao lưu – hệ thống.' },
  img('qt-nguoi-dung', 'Danh sách người dùng', 16),
  legend([[1, 'Các thẻ quản trị'], [2, 'Thêm người dùng'], [3, 'Sửa thông tin người dùng'], [4, 'Đặt lại mật khẩu'], [5, 'Khóa / mở khóa tài khoản']]),
  { h2: 'Thêm người dùng' },
  { steps: [
    'Nhấn **+ Thêm người dùng** (2).',
    'Nhập tên đăng nhập (chữ thường không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang, từ 3 đến 32 ký tự), họ và tên, đơn vị/phòng ban, nhóm người dùng, thư điện tử, điện thoại và mật khẩu ban đầu.',
    'Nhấn **Lưu**, sau đó thông báo tên đăng nhập và mật khẩu ban đầu cho người dùng; đề nghị người dùng đổi mật khẩu ngay ở lần đăng nhập đầu tiên.',
  ] },
  img('qt-them-nguoi-dung', 'Hộp thêm người dùng', 12),
  { h2: 'Đặt lại mật khẩu, khóa và xóa tài khoản' },
  { bullets: [
    '**Đặt lại mật khẩu** (4): nhập mật khẩu mới cho người dùng quên mật khẩu. Mọi phiên đăng nhập cũ của tài khoản đó bị đăng xuất ngay.',
    '**Khóa** (5): tạm ngừng tài khoản (ví dụ cán bộ nghỉ phép dài ngày, chuyển công tác); nhấn **Mở khóa** để cho phép đăng nhập trở lại. Nên khóa thay vì xóa để giữ lịch sử thao tác.',
    '**Xóa**: chỉ dùng cho tài khoản tạo nhầm. Phần mềm không cho phép tự khóa, tự xóa hoặc tự bỏ quyền quản trị của tài khoản đang đăng nhập.',
  ] },
  img('qt-dat-lai-mat-khau', 'Hộp đặt lại mật khẩu', 10),

  { h1: 'NHÓM NGƯỜI DÙNG VÀ PHÂN QUYỀN' },
  { p: 'Phần mềm phân quyền theo nhóm. Mỗi nhóm được cấp quyền cho từng phân hệ ở một trong ba mức: **Không truy cập**, **Chỉ xem**, **Xem và cập nhật**; đồng thời có thể giới hạn **phạm vi dữ liệu** theo dự án. Quyền được kiểm tra trên máy chủ cho mọi thao tác.' },
  img('qt-nhom-quyen', 'Danh sách nhóm người dùng', 16),
  legend([[1, 'Thêm nhóm người dùng'], [2, 'Phân quyền cho nhóm']]),
  { steps: [
    'Nhấn **+ Thêm nhóm** (1) hoặc **Phân quyền** (2) trên dòng nhóm.',
    'Nhập tên và mô tả nhóm; tại bảng **Phân quyền chức năng**, chọn mức quyền cho từng phân hệ.',
    'Tại **Phạm vi dữ liệu**, đánh dấu các dự án nhóm được làm việc (để trống là tất cả dự án). Dùng cho tư vấn giám sát, nhà thầu chỉ tham gia một số dự án.',
    'Nhấn **Lưu**. Quyền mới có hiệu lực ngay với các thành viên của nhóm.',
  ] },
  img('qt-phan-quyen', 'Hộp phân quyền nhóm', 12),
  { table: { head: ['Nhóm mặc định', 'Mô tả'], widths: [3000, 6000], rows: [
    ['Quản trị hệ thống', 'Toàn quyền, quản lý người dùng và cấu hình.'],
    ['Lãnh đạo Ban', 'Xem toàn bộ, chỉ đạo, cập nhật thông tin dự án.'],
    ['Cán bộ kỹ thuật', 'Quản lý kỹ thuật, tiến độ, nhật ký, khối lượng.'],
    ['Kế toán', 'Kế hoạch và hồ sơ thanh toán.'],
    ['Tư vấn giám sát / Nhà thầu', 'Cập nhật nhật ký, tiến độ hiện trường trong phạm vi dự án được giao.'],
  ] }, cap: 'Các nhóm người dùng tạo sẵn khi khởi tạo hệ thống' },

  { h1: 'DANH MỤC DÙNG CHUNG' },
  { p: 'Danh mục dùng chung là các giá trị chọn sẵn trong ô nhập liệu: nhóm dự án, giai đoạn, nguồn vốn, loại gói thầu, hình thức lựa chọn nhà thầu, loại hợp đồng, loại hồ sơ pháp lý, loại và trạng thái thanh toán, đơn vị tính, thời tiết, định dạng mô hình…' },
  { steps: [
    'Chọn thẻ **Danh mục dùng chung**, chọn loại danh mục ở cột bên trái (1).',
    'Nhấn **+ Thêm giá trị** (2), nhập giá trị và thứ tự hiển thị; nhập tên loại mới để tạo loại danh mục mới. Nhấn **Lưu**.',
    'Nhấn **Sửa** hoặc **Xóa** trên dòng giá trị để điều chỉnh.',
  ] },
  img('qt-danh-muc', 'Quản lý danh mục dùng chung', 16),
  legend([[1, 'Danh sách loại danh mục'], [2, 'Thêm giá trị danh mục']]),

  { h1: 'NHẬT KÝ HOẠT ĐỘNG' },
  { p: 'Mọi thao tác đăng nhập, thêm, sửa, xóa đều được máy chủ ghi lại kèm thời gian, người dùng, phân hệ, đối tượng và địa chỉ máy truy cập. Chọn người dùng (1), nhập từ khóa để lọc; nhấn **Xuất Excel** (2) để lưu nhật ký phục vụ kiểm tra.' },
  img('qt-nhat-ky-he-thong', 'Nhật ký hoạt động', 16),
  legend([[1, 'Lọc theo người dùng'], [2, 'Xuất nhật ký ra Excel']]),

  { h1: 'SAO LƯU VÀ PHỤC HỒI DỮ LIỆU' },
  { p: 'Thẻ **Sao lưu, hệ thống** hiển thị thông tin hệ thống, số bản ghi từng loại dữ liệu và chức năng sao lưu, phục hồi.' },
  img('qt-sao-luu', 'Sao lưu và phục hồi dữ liệu', 15),
  legend([[1, 'Tải tệp sao lưu toàn bộ dữ liệu nghiệp vụ, danh mục, nhóm và người dùng (.json)'], [2, 'Phục hồi dữ liệu từ tệp sao lưu']]),
  { steps: [
    'Sao lưu: nhấn **Tải tệp sao lưu (.json)** (1); lưu tệp vào nơi an toàn, tách biệt với máy chủ. Khuyến nghị sao lưu tối thiểu hằng tuần và trước mỗi lần nâng cấp.',
    'Phục hồi: nhấn **Phục hồi từ tệp sao lưu** (2), chọn tệp .json, xác nhận. Dữ liệu trong tệp được ghi đè lên bản ghi trùng mã; tài khoản trùng tên đăng nhập được giữ nguyên.',
  ] },
  { note: 'Sao lưu trong phần mềm không thay thế sao lưu cơ sở dữ liệu SQL Server và thư mục tệp đính kèm trên máy chủ. Cán bộ phụ trách hạ tầng thực hiện sao lưu định kỳ theo «Hướng dẫn cài đặt».' },

  { h1: 'ĐỐI CHIẾU YÊU CẦU BÁO CÁO KINH TẾ – KỸ THUẬT' },
  { p: 'Trang **Đối chiếu BC KTKT** (nhóm Tiện ích) liệt kê 62 use case thuộc mục VI của Báo cáo kinh tế – kỹ thuật, ánh xạ tới chức năng tương ứng trong phần mềm và tình trạng đáp ứng; dùng khi kiểm tra, nghiệm thu.' },
  img('qt-doi-chieu', 'Đối chiếu danh mục chức năng với BC KTKT', 16),
];

// ===== Lắp ráp theo vai trò =====
function build(k) {
  const out = common(k);
  if (k === 'ld') {
    out.push({ h1: 'THEO DÕI, ĐIỀU HÀNH' }, ...S.dashboard(k, 'ld-tong-quan').slice(0), ...S.contractView(), ...S.paymentView());
    out.push(...S.projectView(true), ...S.projectEdit(), ...S.scheduleView(), ...S.reports());
    out.push(...tail(k, false));
  }
  if (k === 'kt') {
    out.push({ h1: 'THEO DÕI TỔNG QUAN' }, ...S.dashboard(k, 'kt-giao-dien-chinh').slice(0, 2), { p: 'Ý nghĩa các chỉ tiêu, biểu đồ và cách nhấn vào cảnh báo để xử lý giống như hướng dẫn tại trang Tổng quan dành cho Lãnh đạo Ban.' });
    out.push(...S.projectView(true), ...S.projectEdit(), ...S.model(), ...S.packages(), ...S.schedule(), ...S.diary('kt-nhat-ky', 'kt-ghi-nhat-ky'), ...S.volume(), ...S.reports());
    out.push(...tail(k, true));
  }
  if (k === 'ke') {
    out.push({ h1: 'THEO DÕI TỔNG QUAN' }, ...S.dashboard(k, 'ke-giao-dien-chinh').slice(0, 2), { p: 'Các chỉ tiêu «Giá trị hợp đồng» và «Đã giải ngân» trên trang Tổng quan được tính trực tiếp từ hồ sơ thanh toán do Kế toán xác nhận đã chi.' });
    out.push(...S.payments(), { h1: 'TRA CỨU HỢP ĐỒNG' }, ...S.contractView().slice(1), ...S.reports());
    out.push(...tail(k, false));
  }
  if (k === 'gs') {
    out.push({ h1: 'THEO DÕI TỔNG QUAN' }, { p: 'Tài khoản Tư vấn giám sát / Nhà thầu chỉ thấy số liệu của các dự án được giao. Trang **Tổng quan** hiển thị các chỉ tiêu, biểu đồ và cảnh báo trong phạm vi đó.' }, img('gs-tong-quan', 'Trang Tổng quan trong phạm vi dự án được giao', 14));
    out.push(...S.diary('gs-nhat-ky', 'gs-ghi-nhat-ky'));
    out.push({ h1: 'CẬP NHẬT TIẾN ĐỘ' }, { steps: [
      'Chọn **Quản lý tiến độ**, kéo xuống **Biểu đồ tiến độ (Gantt)**.',
      'Nhấn **Cập nhật** (1) trên dòng hạng mục, nhập tiến độ thực tế lũy kế (%), ngày cập nhật và ghi chú hoặc nguyên nhân chậm; nhấn **Lưu**.',
    ] }, img('gs-tien-do', 'Cập nhật tiến độ trên biểu đồ Gantt', 16), legend([[1, 'Cập nhật tiến độ thực tế']]), img('kt-cap-nhat-tien-do', 'Hộp cập nhật tiến độ', 11),
    { note: 'Tư vấn giám sát / Nhà thầu chỉ xem thông tin dự án, mô hình và khối lượng; không sửa được hợp đồng, khối lượng hợp đồng và thanh toán.' });
    out.push(...tail(k, true));
  }
  if (k === 'qt') {
    out.push(...S.admin());
    out.push({ h1: 'CÁC PHÂN HỆ NGHIỆP VỤ' }, { p: 'Tài khoản Quản trị hệ thống có toàn quyền trên mọi phân hệ nghiệp vụ. Cách sử dụng từng phân hệ được trình bày chi tiết trong tài liệu hướng dẫn của vai trò tương ứng:' },
      { table: { head: ['Phân hệ', 'Tài liệu hướng dẫn tham khảo'], widths: [4500, 4500], rows: [
        ['Tổng quan, Quản lý dự án, Báo cáo', 'HDSD dành cho Lãnh đạo Ban'],
        ['Mô hình hóa công trình, Gói thầu và hợp đồng, Tiến độ, Nhật ký thi công, Khối lượng', 'HDSD dành cho Cán bộ kỹ thuật'],
        ['Quản lý thanh toán', 'HDSD dành cho Kế toán'],
        ['Sử dụng trên điện thoại', 'HDSD dành cho Tư vấn giám sát / Nhà thầu'],
      ] }, cap: 'Tài liệu tham khảo cho các phân hệ nghiệp vụ' });
    out.push(...tail(k, false));
  }
  return out;
}
module.exports = { ROLES, build };
