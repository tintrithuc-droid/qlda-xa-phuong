// Nội dung bộ HDSD theo vai trò. Mỗi khối: h1/h2/h3/p/steps/bullets/img/imgs2/legend/table/note
const H10 = ['01/11/2026', 'Ban hành lần đầu, theo phần mềm phiên bản 1.0', '1.0'];
const H11 = ['03/11/2026', 'Cập nhật theo phần mềm phiên bản 1.1: bổ sung Kế hoạch vốn – giải ngân, Giải phóng mặt bằng, Nghiệm thu – bàn giao – bảo hành, Quyết toán dự án hoàn thành; vai trò của Ban và người quyết định đầu tư; nhóm Lãnh đạo UBND xã', '1.1'];
const H12 = ['03/11/2026', 'Cập nhật theo phần mềm phiên bản 1.2: trình duyệt hồ sơ (phụ lục hợp đồng, hồ sơ thanh toán, nghiệm thu); nhập ngày theo ngày/tháng/năm, phân trang danh sách, giao diện sáng/tối; bảng nhập công việc nhật ký; kế hoạch thanh toán theo đợt; in, xuất báo cáo PDF và CSV', '1.2'];
const H13 = ['03/11/2026', 'Cập nhật theo phần mềm phiên bản 1.3: giao diện mới; mỗi người tự chọn chế độ sáng/tối, tông màu, cỡ chữ, mật độ hiển thị ở nút Giao diện; bảng tự căn độ rộng cột; ảnh minh họa chụp lại theo giao diện mới', '1.3'];
const ROLES = {
  qt: { name: 'Quản trị hệ thống', file: 'Quan tri he thong', user: 'admin', hist: [H10, H11, H12, ['03/11/2026', 'Nhóm Lãnh đạo UBND xã đổi thành Lãnh đạo xã/phường (Bí thư, Chủ tịch, Phó Chủ tịch…)', '1.2'], H13] },
  ld: { name: 'Lãnh đạo Ban', file: 'Lanh dao Ban', user: 'lanhdao', hist: [H10, H11, H12, H13] },
  kt: { name: 'Cán bộ kỹ thuật', file: 'Can bo ky thuat', user: 'kythuat', hist: [H10, H11, H12, H13] },
  ke: { name: 'Kế toán', file: 'Ke toan', user: 'ketoan', hist: [H10, H11, H12, H13] },
  gs: { name: 'Tư vấn giám sát / Nhà thầu', file: 'Tu van giam sat - Nha thau', user: 'giamsat', hist: [H10, H11, H12, H13] },
  ub: { name: 'Lãnh đạo xã/phường', file: 'Lanh dao xa phuong', user: 'ubnd', hist: [['03/11/2026', 'Ban hành lần đầu, theo phần mềm phiên bản 1.1', '1.1'], H12, ['03/11/2026', 'Mở rộng thành vai trò Lãnh đạo xã/phường (Bí thư, Phó Bí thư, Chủ tịch, Phó Chủ tịch HĐND, UBND); bổ sung chương Xem trên điện thoại', '1.2'], H13] },
  dt: { name: 'Sử dụng trên điện thoại', file: 'Su dung tren dien thoai', audience: 'Cán bộ dùng phần mềm trên điện thoại: Tư vấn giám sát, Nhà thầu, Cán bộ kỹ thuật, Lãnh đạo Ban, Lãnh đạo xã/phường', cover: 'SỬ DỤNG TRÊN ĐIỆN THOẠI',
    hist: [H10, ['03/11/2026', 'Cập nhật theo phần mềm phiên bản 1.1: thêm phần mềm ra màn hình chính trên Android và iPhone; tra cứu giải ngân, giải phóng mặt bằng, nghiệm thu trên điện thoại', '1.1'], ['03/11/2026', 'Cập nhật theo phần mềm phiên bản 1.2: bảng nhập công việc nhật ký, ô nhập ngày theo ngày/tháng/năm', '1.2'], ['03/11/2026', 'Bổ sung Lãnh đạo xã/phường xem trên điện thoại', '1.2'], H13] },
};
const MODS = ['Tổng quan', 'Quản lý dự án', 'Kế hoạch vốn, giải ngân', 'Giải phóng mặt bằng', 'Mô hình hóa công trình', 'Gói thầu và hợp đồng', 'Quản lý tiến độ', 'Nhật ký thi công', 'Quản lý khối lượng', 'Nghiệm thu, bàn giao, bảo hành', 'Quản lý thanh toán', 'Quyết toán dự án', 'Báo cáo, thống kê', 'Quản trị hệ thống'];
const E = 'Xem và cập nhật', V = 'Chỉ xem', N = 'Không truy cập';
const PERM = {
  qt: [E, E, E, E, E, E, E, E, E, E, E, E, E, E],
  ld: [V, E, V, V, V, V, V, V, V, V, V, V, V, V],
  kt: [V, E, V, E, E, E, E, E, E, E, V, V, V, V],
  ke: [V, V, E, N, N, V, N, N, V, V, E, E, V, N],
  gs: [V, V, N, N, V, N, E, E, V, V, N, N, N, N],
  ub: [V, V, V, V, N, N, V, N, N, V, V, V, V, N],
};
const SCOPE = { qt: 'tất cả dự án', ld: 'tất cả dự án', kt: 'tất cả dự án', ke: 'tất cả dự án', gs: 'chỉ các dự án được quản trị hệ thống giao', ub: 'tất cả dự án của xã/phường' };
const PURPOSE = {
  qt: 'quản lý tài khoản người dùng, nhóm quyền, danh mục dùng chung, theo dõi nhật ký hoạt động, quản lý kho tệp đính kèm, sao lưu và phục hồi dữ liệu, bảo đảm hệ thống vận hành ổn định và an toàn',
  ld: 'theo dõi tổng thể tình hình thực hiện các dự án, giải ngân kế hoạch vốn, giải phóng mặt bằng, nghiệm thu và quyết toán; nắm bắt cảnh báo, chỉ đạo xử lý công việc, cập nhật thông tin dự án và khai thác báo cáo phục vụ điều hành',
  kt: 'quản lý thông tin dự án, giải phóng mặt bằng, tệp mô hình công trình, gói thầu và hợp đồng, lập và cập nhật tiến độ, ghi nhật ký thi công, quản lý khối lượng, nghiệm thu, bàn giao và theo dõi bảo hành công trình',
  ke: 'nhập kế hoạch vốn được giao và theo dõi giải ngân so với kịch bản, lập kế hoạch thanh toán, lập và theo dõi hồ sơ thanh toán, xác nhận giá trị đã chi, đối chiếu khối lượng nghiệm thu, theo dõi quyết toán dự án hoàn thành và khai thác báo cáo giải ngân',
  gs: 'ghi nhật ký thi công kèm ảnh hiện trường, cập nhật tiến độ thực tế, tra cứu dự án, mô hình và khối lượng trong phạm vi được giao, kể cả trên điện thoại',
  ub: 'theo dõi, trên máy tính hoặc điện thoại, tình hình thực hiện các dự án đầu tư công của xã/phường: tiến độ, giải ngân kế hoạch vốn so với kịch bản, giải phóng mặt bằng, nghiệm thu bàn giao, quyết toán dự án hoàn thành; nắm bắt cảnh báo và khai thác báo cáo phục vụ chỉ đạo, điều hành',
};

const img = (name, cap, w) => ({ img: name, cap, w });
const legend = rows => ({ legend: rows });

// ===== Phần chung =====
function common(k) {
  const r = ROLES[k], out = [];
  out.push({ h1: 'GIỚI THIỆU CHUNG' });
  out.push({ h2: 'Mục đích tài liệu' });
  out.push({ p: `Tài liệu này hướng dẫn cán bộ thuộc nhóm người dùng «${r.name}» sử dụng Phần mềm quản lý dự án đầu tư xây dựng của Ban Quản lý dự án đầu tư xây dựng xã/phường (sau đây gọi là «phần mềm») để ${PURPOSE[k]}.` });
  out.push({ p: 'Nội dung được trình bày theo trình tự thao tác thực tế. Mỗi thao tác có hình minh họa chụp trực tiếp từ giao diện phần mềm; số liệu trên hình là số liệu minh họa.' });
  out.push({ h2: 'Đối tượng sử dụng và phạm vi quyền' });
  out.push({ p: `Tài khoản thuộc nhóm «${r.name}» được phân quyền mặc định như bảng dưới đây. Quản trị hệ thống có thể điều chỉnh quyền theo yêu cầu thực tế của Ban; khi đó phần mềm tự ẩn các chức năng không được phép sử dụng.` });
  out.push({ table: { head: ['TT', 'Phân hệ chức năng', 'Quyền mặc định'], widths: [800, 5200, 3000], rows: MODS.map((m, i) => [String(i + 1), m, PERM[k][i]]) }, cap: `Quyền mặc định của nhóm «${r.name}»` });
  out.push({ p: `Phạm vi dữ liệu: ${SCOPE[k]}.` });
  out.push({ h2: 'Quy ước trình bày' });
  out.push({ bullets: [
    'Khung đỏ có số thứ tự trên hình minh họa chỉ vị trí cần thao tác; bảng chú giải ngay dưới hình giải thích ý nghĩa từng số.',
    'Tên nút, thẻ, mục chọn trên giao diện được in đậm, ví dụ: nhấn nút **Lưu**.',
    'Ô nhập liệu có dấu * màu đỏ là thông tin bắt buộc, không được bỏ trống.',
    'Ngày tháng nhập theo dạng ngày/tháng/năm (ví dụ 03/11/2026, hoặc gõ liền 03112026); số tiền tính bằng đồng.',
  ] });
  out.push({ h2: 'Yêu cầu về thiết bị' });
  out.push({ bullets: [
    'Máy tính: trình duyệt Google Chrome, Microsoft Edge hoặc Cốc Cốc phiên bản mới; độ phân giải màn hình khuyến nghị từ 1366 × 768 trở lên.',
    'Điện thoại: Android 7.0 trở lên dùng trình duyệt Chrome; iPhone dùng trình duyệt Safari. Có thể thêm phần mềm ra màn hình chính để mở như một ứng dụng.',
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
  if (k === 'qt') out.push({ p: 'Tài khoản quản trị nhập thêm mã 6 số từ ứng dụng xác thực trên điện thoại sau bước mật khẩu (xem chương **Xác thực 2 lớp**).' });
  out.push({ note: 'Nhập sai mật khẩu 5 lần liên tiếp, tài khoản bị tạm khóa 15 phút để chống dò mật khẩu. Quên mật khẩu, đề nghị quản trị hệ thống đặt lại; không chia sẻ mật khẩu cho người khác.' });
  out.push({ h2: 'Giao diện làm việc chính' });
  out.push({ p: 'Sau khi đăng nhập, giao diện gồm thanh chức năng bên trái, thanh công cụ phía trên và vùng làm việc ở giữa.' });
  out.push(img(`${k}-giao-dien-chinh`, 'Bố cục giao diện làm việc chính', 16));
  out.push(legend([
    [1, 'Thanh chức năng: danh sách phân hệ được phép sử dụng, nhóm theo Điều hành – Nghiệp vụ – Khai thác – Tiện ích. Số màu đỏ bên phải là số việc cần chú ý (ví dụ hạng mục chậm tiến độ, dự án chậm giải ngân, bảo hành sắp hết hạn).'],
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
  out.push({ h2: 'Nhập ngày, xem danh sách dài, giao diện sáng/tối' });
  out.push({ p: 'Mọi ô ngày trong phần mềm đều nhập theo dạng **ngày/tháng/năm** (1), không phụ thuộc cài đặt ngôn ngữ của máy tính. Có thể gõ đủ «03/11/2026» hoặc gõ liền «03112026», phần mềm tự thêm dấu «/». Muốn chọn trên lịch, nhấn biểu tượng lịch (2) bên phải ô. Ngày không hợp lệ (ví dụ 31/02) được tô đỏ và không cho lưu.' });
  out.push(img('v12-nhap-ngay', 'Ô nhập ngày theo ngày/tháng/năm và bảng nhập công việc', 12));
  out.push(legend([[1, 'Ô nhập ngày: gõ ngày/tháng/năm'], [2, 'Chọn ngày trên lịch'], [3, 'Bảng nhập công việc: công việc, khối lượng, đơn vị'], [4, 'Thêm dòng công việc']]));
  out.push({ p: 'Danh sách dài (hồ sơ, nhật ký, nhật ký hoạt động…) được chia trang, mặc định 20 dòng mỗi trang. Dùng các nút chuyển trang (1) phía dưới bảng; chọn số dòng mỗi trang (2): 20, 50, 100 hoặc **Tất cả**. Lựa chọn được ghi nhớ cho lần sau. Khi đổi điều kiện lọc, danh sách tự quay về trang đầu.' });
  out.push(img('v12-phan-trang', 'Thanh chuyển trang phía dưới danh sách', 12));
  out.push(legend([[1, 'Chuyển trang đầu, trang trước, trang sau, trang cuối'], [2, 'Chọn số dòng mỗi trang']]));
  out.push({ p: 'Nút giao diện (1) ở thanh công cụ phía trên chuyển lần lượt giữa ba chế độ: **Tự động theo máy** (sáng hoặc tối theo cài đặt của máy tính, điện thoại), **Giao diện sáng** và **Giao diện tối**. Giao diện tối giúp đỡ mỏi mắt khi làm việc lâu hoặc ban đêm; số liệu không thay đổi.' });
  out.push(img('v12-giao-dien-toi', 'Giao diện tối', 16));
  out.push(legend([[1, 'Nút chuyển giao diện sáng/tối']]));
  out.push({ h2: 'Chọn tông màu, cỡ chữ cho riêng mình' });
  out.push({ p: 'Nút **Giao diện** (biểu tượng bảng màu, cạnh nút sáng/tối) mở hộp chọn cách hiển thị. Trên điện thoại, mở trình đơn bên trái và chọn **Giao diện, màu sắc**. Lựa chọn được lưu theo tài khoản: đăng nhập ở máy khác vẫn giữ nguyên. Thay đổi chỉ ảnh hưởng đến cách hiển thị của người đang dùng, không làm thay đổi số liệu.' });
  out.push(img('v13-hop-giao-dien', 'Hộp chọn giao diện', 13));
  out.push(legend([[1, 'Chế độ: tự động theo máy, sáng hoặc tối'], [2, 'Tông màu chủ đạo (6 lựa chọn)'], [3, 'Thanh bên đậm hoặc sáng'], [4, 'Cỡ chữ: nhỏ, vừa, lớn, rất lớn'], [5, 'Mật độ hiển thị: thoáng hoặc gọn'], [6, 'Trở về mặc định']]));
  out.push(...attachCommon(k));
  if (k !== 'qt') out.push(...guideCommon(k));
  return out;
}

// Đính kèm tệp: cách dùng chung cho mọi hộp nhập liệu 
function attachCommon(k) {
  const ro = k === 'ld';
  return [
    { h2: 'Đính kèm và xem tệp' },
    { p: 'Các hộp nhập liệu có ô **đính kèm tệp** để lưu bản scan văn bản, hợp đồng, biên bản, chứng từ ngay cùng thông tin nhập: quyết định phê duyệt dự án, quyết định giao kế hoạch vốn, phương án bồi thường, quyết định phê duyệt kế hoạch và kết quả lựa chọn nhà thầu, hợp đồng đã ký, bảo lãnh, phụ lục, kế hoạch tiến độ, nhật ký thi công, biên bản nghiệm thu, bàn giao, hồ sơ và chứng từ thanh toán, hồ sơ quyết toán, công việc được giao…' },
    { steps: [
      'Trong hộp nhập liệu, tại ô đính kèm, nhấn **Chọn tệp** (2) và chọn một hoặc nhiều tệp trên máy; hoặc kéo thả tệp từ thư mục vào ô này. Trên điện thoại, nút này mở máy ảnh hoặc thư viện ảnh.',
      'Tệp mới chọn hiện ngay bên dưới (3), chưa được gửi lên máy chủ. Nhấn **Bỏ** để bỏ tệp chọn nhầm.',
      'Nhấn **Lưu**. Thông tin và tệp được lưu cùng lúc; phần mềm ghi nhận người tải lên, thời điểm và dung lượng.',
      'Tệp đã lưu trước đó hiện phía trên (1): nhấn tên tệp để mở; muốn gỡ, nhấn **Gỡ** trên dòng tệp rồi nhấn **Lưu**.',
    ] },
    img('chung-dinh-kem', 'Ô đính kèm tệp trong hộp nhập liệu', 12),
    legend([[1, 'Tệp đã lưu: tên tệp, dung lượng, người tải lên, thời điểm; nút Gỡ để gỡ tệp'], [2, 'Chọn tệp hoặc kéo thả tệp vào đây'], [3, 'Tệp mới chọn, sẽ tải lên khi nhấn Lưu']]),
    { p: 'Trong các bảng danh sách, cột **Tệp** cho biết tệp đính kèm của từng dòng: nếu có một tệp, nhấn tên tệp để mở; nếu có nhiều tệp, nhấn nút **n tệp** để mở danh sách và chọn tệp cần xem. Tệp PDF và ảnh mở ngay trên trình duyệt; các loại khác (Word, Excel, bản vẽ…) được tải về máy.' },
    img('chung-ds-tep', 'Danh sách tệp đính kèm của một bản ghi', 10),
    { note: 'Mỗi tệp tối đa 500 MB; phần mềm không nhận tệp chương trình (.exe, .bat…). Tệp gỡ nhầm chưa mất ngay mà được chuyển vào thùng rác 30 ngày; đề nghị quản trị hệ thống khôi phục.' + (ro ? '' : ' Người dùng chỉ mở được tệp thuộc dự án trong phạm vi được giao.') },
  ];
}

// Trang Hướng dẫn sử dụng trong phần mềm (các vai trò không phải quản trị)
function guideCommon(k) {
  return [
    { h2: 'Xem hướng dẫn sử dụng trong phần mềm' },
    { p: 'Chọn **Hướng dẫn sử dụng** ở cuối thanh chức năng bên trái (trên điện thoại: **Menu → Hướng dẫn**). Trang chỉ hiển thị tài liệu và video hướng dẫn dành cho nhóm người dùng của tài khoản đang đăng nhập; tài liệu này cũng có sẵn tại đây.' },
    img('chung-huong-dan', 'Trang Hướng dẫn sử dụng theo nhóm người dùng', 16),
    legend([[1, 'Mục Hướng dẫn sử dụng trên thanh chức năng'], [2, 'Ô tìm kiếm trong hướng dẫn'], [3, 'Tài liệu hướng dẫn: nhấn Mở để xem ngay, Tải về để lưu vào máy'], [4, 'Video hướng dẫn: nhấn nút phát để xem']]),
    { note: 'Nội dung hướng dẫn do quản trị hệ thống cập nhật; khi phần mềm có chức năng mới, kiểm tra lại trang này để có tài liệu mới nhất.' },
  ];
}

const tail = (k, mobile) => {
  const out = [];
  if (mobile) out.push(...mobileSection(k));
  out.push({ h1: 'CÂU HỎI THƯỜNG GẶP VÀ HỖ TRỢ' });
  out.push({ table: { head: ['Tình huống', 'Cách xử lý'], widths: [3600, 5400], rows: [
    ['Không đăng nhập được, báo sai tên đăng nhập hoặc mật khẩu', 'Kiểm tra bộ gõ tiếng Việt và phím Caps Lock. Sau 5 lần sai tài khoản bị khóa 15 phút; liên hệ quản trị hệ thống nếu quên mật khẩu.'],
    ...(k === 'qt' ? [['Mã xác thực 2 lớp luôn báo sai', 'Kiểm tra đồng hồ điện thoại (bật Đặt giờ tự động); nhập mã đang hiển thị, không dùng lại mã vừa nhập. Mất điện thoại: dùng mã khôi phục hoặc nhờ quản trị khác đặt lại 2 lớp.']] : []),
    ['Thông báo «Tài khoản đã bị khóa»', 'Tài khoản bị quản trị hệ thống khóa hoặc đang trong thời gian khóa tạm. Liên hệ quản trị hệ thống.'],
    ['Không thấy một chức năng trên thanh bên trái', 'Nhóm người dùng của tài khoản chưa được cấp quyền phân hệ đó. Đề nghị quản trị hệ thống xem lại phân quyền.'],
    ['Không thấy dữ liệu của một dự án', 'Kiểm tra ô chọn dự án ở thanh công cụ phía trên; nếu vẫn không thấy, tài khoản chưa được giao phạm vi dự án đó.'],
    ['Trang Tổng quan báo «chậm giải ngân»', 'Tỷ lệ giải ngân của dự án thấp hơn kịch bản đến ngày hiện tại quá 10%. Mở **Kế hoạch vốn, giải ngân** để xem chi tiết; kiểm tra các hồ sơ thanh toán đã được xác nhận đã chi.'],
    ['Không xóa được một bản ghi', 'Bản ghi còn dữ liệu liên quan (ví dụ gói thầu còn hợp đồng, hợp đồng còn khối lượng). Xử lý các bản ghi liên quan trước.'],
    ['Màn hình báo mất kết nối', 'Kiểm tra mạng; phần mềm tự kết nối lại. Thông tin đang nhập dở trong hộp nhập liệu chưa được lưu cho đến khi nhấn Lưu thành công.'],
    ['Tải tệp đính kèm không được', 'Mỗi tệp tối đa 500 MB; phần mềm không nhận tệp chương trình (.exe, .bat…) vì lý do an toàn.'],
    ['Gỡ nhầm tệp đính kèm hoặc xóa nhầm bản ghi có tệp', k === 'qt' ? 'Mở Quản trị hệ thống → thẻ Kho tệp, thùng rác, nhấn Khôi phục trên dòng tệp (trong 30 ngày). Bản ghi đã xóa: phục hồi từ bản sao lưu tự động.' : 'Báo quản trị hệ thống trong vòng 30 ngày để khôi phục tệp từ thùng rác.'],
    ['Không sửa, không xóa được phụ lục, hồ sơ thanh toán, biên bản nghiệm thu', 'Hồ sơ đang chờ duyệt hoặc đã được duyệt nên bị khóa. Hồ sơ chờ duyệt: nhấn **Rút lại** để sửa tiếp. Hồ sơ đã duyệt: đề nghị Lãnh đạo Ban **Thu hồi** về soạn thảo (ghi rõ lý do).'],
    ['Phụ lục hợp đồng đã nhập nhưng giá trị hợp đồng không thay đổi', 'Chỉ phụ lục **đã duyệt** mới được cộng vào giá trị và thời hạn hợp đồng. Kiểm tra trạng thái phụ lục tại khung Điều chỉnh, phụ lục hoặc trang **Trình duyệt hồ sơ**.'],
    ['Không mở được tệp, báo «không có quyền»', 'Tệp thuộc dự án nằm ngoài phạm vi được giao cho tài khoản. Đề nghị quản trị hệ thống kiểm tra phạm vi dữ liệu của nhóm.'],
  ] }, cap: 'Một số tình huống thường gặp' });
  out.push({ p: 'Đầu mối hỗ trợ kỹ thuật: quản trị hệ thống của Ban Quản lý dự án; đơn vị phát triển phần mềm: Công ty Cổ phần Tin học Tri Thức. Khi báo lỗi, đề nghị ghi rõ tên đăng nhập, thời điểm, trang đang thao tác và chụp màn hình thông báo lỗi (nếu có).' });
  return out;
};

function mobileSection(k) {
  const out = [];
  out.push({ h1: 'SỬ DỤNG TRÊN ĐIỆN THOẠI' });
  out.push({ p: 'Phần mềm tự điều chỉnh giao diện cho màn hình điện thoại, phù hợp với cán bộ làm việc tại hiện trường. Có hai cách sử dụng:' });
  out.push({ bullets: [
    'Điện thoại Android: mở Chrome, truy cập địa chỉ phần mềm, chạm nút **⋮** → **Thêm vào màn hình chính** (hoặc **Cài đặt ứng dụng**) để tạo biểu tượng như một ứng dụng.',
    'iPhone: mở Safari, truy cập địa chỉ phần mềm, nhấn nút Chia sẻ → **Thêm vào MH chính** để tạo biểu tượng như một ứng dụng.',
    'Chi tiết xem tài liệu «Hướng dẫn sử dụng trên điện thoại».',
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
    [1, 'Các chỉ tiêu chính: số dự án, tổng mức đầu tư, giá trị hợp đồng, giải ngân năm so với kế hoạch vốn và kịch bản đến ngày hiện tại, số cảnh báo (ô đỏ khi có cảnh báo nghiêm trọng).'],
    [2, 'Biểu đồ: dự án theo trạng thái; tiến độ kế hoạch và thực tế từng gói thầu; giá trị hợp đồng; khối lượng thực hiện – nghiệm thu – thanh toán; đường cong S so sánh kế hoạch và thực tế.'],
    [3, 'Cảnh báo và việc cần xử lý: hạng mục quá hạn, chậm so với kế hoạch, công việc sắp đến hạn; bảo lãnh hợp đồng, giấy phép và văn bản pháp lý sắp hết hiệu lực (trước 30 ngày) hoặc đã hết hiệu lực; dự án chậm giải ngân so với kịch bản; bảo hành, bảo lãnh bảo hành sắp hết hạn; quyết toán quá hạn; khu vực chậm bàn giao mặt bằng; đợt thanh toán quá hạn theo kế hoạch (tô đỏ khi quá hạn trên 30 ngày); hồ sơ đang chờ duyệt. Nhấn **Xem** để mở ngay nội dung cần xử lý.'],
    [4, 'Bảng tình hình thực hiện các dự án; nhấn tên dự án để mở chi tiết.'],
  ])] : []),
  { p: 'Muốn xem riêng một dự án, chọn dự án tại ô chọn dự án trên thanh công cụ phía trên; toàn bộ chỉ tiêu và biểu đồ tự tính lại theo dự án đã chọn.' },
];

S.reports = () => [
  { h1: 'KHAI THÁC BÁO CÁO, THỐNG KÊ' },
  { p: 'Phân hệ **Báo cáo, thống kê** cho phép lọc, tra cứu, in và xuất 07 loại báo cáo ra tệp Excel, PDF hoặc CSV:' },
  { bullets: ['Báo cáo tổng hợp tình hình thực hiện dự án;', 'Báo cáo tiến độ thực hiện dự án và các gói thầu;', 'Báo cáo tình hình thực hiện hợp đồng;', 'Báo cáo khối lượng thực hiện, nghiệm thu và thanh toán;', 'Báo cáo tổng hợp theo dự án, gói thầu và thời gian;', 'Báo cáo tình hình giải ngân kế hoạch vốn đầu tư công (so với kịch bản);', 'Báo cáo tình hình quyết toán dự án hoàn thành.'] },
  { steps: [
    'Chọn **Báo cáo, thống kê** trên thanh chức năng.',
    'Chọn loại báo cáo (1), dự án (2), gói thầu (3); nhập khoảng thời gian «Từ – Đến» và từ khóa tra cứu nếu cần. Bảng số liệu hiển thị ngay bên dưới.',
    'Nhấn **Xuất Excel** (4) để tải tệp báo cáo về máy; tệp mở được bằng Microsoft Excel hoặc LibreOffice.',
    'Nhấn **In / Xuất PDF** (5) để mở trang in khổ A4 nằm ngang, có quốc hiệu, tên đơn vị, số thứ tự, dòng tổng cộng và khung ký «Người lập biểu – Thủ trưởng đơn vị». Trong hộp thoại in, chọn máy in để in ngay hoặc chọn **Lưu thành PDF** để lưu tệp gửi cấp trên.',
    'Nhấn **Xuất CSV** (6) để tải dữ liệu dạng CSV (tiếng Việt hiển thị đúng khi mở bằng Excel) dùng cho tổng hợp, nhập vào phần mềm khác.',
  ] },
  img('chung-bao-cao', 'Trang Báo cáo, thống kê', 16),
  legend([[1, 'Chọn loại báo cáo'], [2, 'Lọc theo dự án'], [3, 'Lọc theo gói thầu'], [4, 'Xuất báo cáo ra Excel'], [5, 'In hoặc lưu báo cáo thành PDF'], [6, 'Xuất báo cáo ra CSV']]),
  img('v12-bao-cao-in', 'Mẫu báo cáo in, xuất PDF', 16),
  img('chung-bao-cao-tien-do', 'Ví dụ báo cáo tiến độ thực hiện dự án và các gói thầu', 16),
  img('chung-bao-cao-giai-ngan', 'Ví dụ báo cáo tình hình giải ngân kế hoạch vốn', 16),
  { note: 'Tệp Excel xuất ra có tên đơn vị (thiết lập tại Quản trị hệ thống → Thông tin đơn vị), tên báo cáo và điều kiện lọc; có thể chỉnh sửa, in ấn, gửi báo cáo cấp trên ngay.' },
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
    'Nhập mã dự án, tên dự án, trạng thái, tổng mức đầu tư (bắt buộc) và các thông tin: nhóm dự án, loại dự án, giai đoạn, nguồn vốn, thời gian, địa điểm, quy mô.',
    'Chọn **Vai trò của Ban** đối với dự án (chủ đầu tư, quản lý dự án hoặc tư vấn quản lý dự án), **Hình thức quản lý dự án**, **Hồ sơ dự án** (báo cáo kinh tế – kỹ thuật hoặc báo cáo nghiên cứu khả thi); nhập **Chủ đầu tư** và **Người quyết định đầu tư** (mặc định: Chủ tịch UBND xã/phường).',
    'Tại phần **Quyết định phê duyệt dự án** (1), nhập số quyết định, ngày ban hành, cơ quan ban hành và đính kèm bản scan quyết định (2).',
    'Nhấn **Lưu**. Quyết định được lưu thành hồ sơ pháp lý của dự án (loại «Quyết định phê duyệt dự án») kèm tệp; phần mềm ghi nhận người cập nhật và thời điểm vào nhật ký hoạt động.',
  ] },
  img('kt-them-du-an', 'Hộp nhập thông tin dự án', 12),
  legend([[1, 'Số, ngày, cơ quan ban hành quyết định phê duyệt dự án'], [2, 'Đính kèm bản scan quyết định phê duyệt dự án']]),
  { p: 'Thẻ **Thông tin chung** của dự án có khung **Văn bản pháp lý chính** (1) liệt kê quyết định chủ trương đầu tư, quyết định phê duyệt và các quyết định điều chỉnh dự án kèm tệp. Nhấn **+ QĐ chủ trương** hoặc **+ QĐ điều chỉnh** (2) để bổ sung nhanh.' },
  img('kt-van-ban-chinh', 'Văn bản pháp lý chính của dự án', 16),
  legend([[1, 'Văn bản pháp lý chính và tệp đính kèm'], [2, 'Thêm quyết định chủ trương đầu tư, quyết định điều chỉnh dự án']]),
  { h2: 'Quản lý hồ sơ pháp lý dự án' },
  { steps: [
    'Mở chi tiết dự án, chọn thẻ **Hồ sơ pháp lý**, nhấn **+ Thêm hồ sơ** (1).',
    'Chọn loại hồ sơ (quyết định chủ trương đầu tư, quyết định phê duyệt dự án, giấy phép xây dựng…), nhập số hiệu, ngày ban hành, cơ quan ban hành, trích yếu; đính kèm một hoặc nhiều tệp (PDF, ảnh scan, Word, Excel).',
    'Văn bản có thời hạn (giấy phép, bảo lãnh, chứng thư…): nhập **Hiệu lực đến**. Phần mềm cảnh báo trên trang Tổng quan từ 30 ngày trước khi hết hạn; ngày hiệu lực tô vàng khi sắp hết hạn, tô đỏ khi đã hết hạn.',
    'Nhấn **Lưu**. Tệp đính kèm được lưu trên máy chủ; nhấn tên tệp trong danh sách để mở hoặc tải về.',
  ] },
  img('ld-du-an-phap-ly', 'Danh sách hồ sơ pháp lý của dự án', 16),
  legend([[1, 'Thêm hồ sơ pháp lý']]),
  img('chung-them-ho-so-phap-ly', 'Hộp nhập hồ sơ pháp lý', 12),
  { h2: 'Giao và theo dõi công việc' },
  { steps: [
    'Mở chi tiết dự án, chọn thẻ **Công việc**, nhấn **+ Thêm công việc** (1).',
    'Nhập tên công việc, đơn vị hoặc người phụ trách, hạn hoàn thành, mức ưu tiên, trạng thái và ghi chú; đính kèm văn bản giao việc (nếu có); nhấn **Lưu**.',
    'Khi công việc xong, nhấn **Hoàn thành** (2) trên dòng công việc, nhập ngày hoàn thành, kết quả và đính kèm tệp kết quả (văn bản, báo cáo, biên bản…); nhấn **Xác nhận hoàn thành**. Công việc quá hạn được tô đỏ và đưa vào mục cảnh báo trên trang Tổng quan.',
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
  { note: 'Tiến độ của dự án được tính bình quân theo giá trị các gói thầu (gói thầu giá trị lớn ảnh hưởng nhiều hơn), không tính bình quân đơn giản. Tiến độ gói thầu tính theo trọng số các hạng mục.' },
];

S.contractView = () => [
  { h2: 'Tra cứu gói thầu và hợp đồng' },
  { p: 'Chọn **Gói thầu và hợp đồng**, nhấn vào một gói thầu để xem: thông tin hợp đồng (1) gồm số hợp đồng, nhà thầu, giá trị, thời gian, bảo lãnh, tạm ứng, thời hạn bảo lãnh và tệp bản hợp đồng đã ký, bảo lãnh thực hiện hợp đồng, bảo lãnh tạm ứng; theo dõi tiến độ thực hiện hợp đồng (2) so sánh tiến độ thời gian với tiến độ thi công, giá trị thực hiện, nghiệm thu và thanh toán; các phụ lục điều chỉnh và hồ sơ pháp lý của gói thầu (quyết định phê duyệt kế hoạch, kết quả lựa chọn nhà thầu) kèm tệp.' },
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
    'Nhập mã, tên hạng mục, kết cấu/vật liệu, diện tích, số tầng, quy mô; tiến độ (%) chỉ nhập khi hạng mục chưa gắn với kế hoạch tiến độ; đính kèm hồ sơ của hạng mục (bản vẽ, thuyết minh) nếu cần. Nhấn **Lưu**.',
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
    'Chọn dự án, nhập ký hiệu, loại gói thầu (xây lắp, tư vấn, thiết bị…), tên gói thầu, hình thức lựa chọn nhà thầu, giá gói thầu, trạng thái và thời gian thực hiện.',
    'Tại phần **QĐ phê duyệt KHLCNT** và **QĐ phê duyệt kết quả LCNT**, nhập số, ngày quyết định và đính kèm bản scan. Có thể bỏ trống và bổ sung sau khi có quyết định.',
    'Nhấn **Lưu**. Các quyết định được lưu thành hồ sơ pháp lý của gói thầu kèm tệp.',
  ] },
  img('kt-them-goi-thau', 'Hộp thêm gói thầu', 12),
  { h2: 'Nhập và cập nhật hợp đồng' },
  { p: 'Mở chi tiết gói thầu. Khi gói thầu chưa có hợp đồng, nhấn **+ Nhập thông tin hợp đồng**; khi đã có, nhấn **Sửa** trong khung Thông tin hợp đồng (2).' },
  img('kt-chi-tiet-goi-thau', 'Chi tiết gói thầu', 15),
  legend([[1, 'Sửa thông tin gói thầu'], [2, 'Thông tin hợp đồng'], [3, 'Liên kết nhanh tới khối lượng, thanh toán, tiến độ của hợp đồng'], [4, 'Điều chỉnh, phụ lục hợp đồng'], [5, 'Hồ sơ pháp lý của gói thầu']]),
  { steps: [
    'Nhập số hợp đồng, ngày ký, nhà thầu/liên danh, loại hợp đồng, giá trị hợp đồng, ngày bắt đầu, ngày kết thúc, tỷ lệ bảo lãnh thực hiện và tạm ứng.',
    'Nhập **Bảo lãnh thực hiện HĐ hiệu lực đến** và **Bảo lãnh tạm ứng hiệu lực đến** (1); phần mềm cảnh báo trước 30 ngày để yêu cầu nhà thầu gia hạn bảo lãnh.',
    'Đính kèm **bản hợp đồng đã ký**, **bảo lãnh thực hiện hợp đồng** và **bảo lãnh tạm ứng** (2) vào đúng ô tương ứng.',
    'Nhấn **Lưu**. Giá trị và thời gian hợp đồng là căn cứ để phần mềm theo dõi tiến độ, khối lượng và thanh toán.',
  ] },
  img('kt-sua-hop-dong', 'Hộp cập nhật hợp đồng', 12),
  legend([[1, 'Thời hạn hiệu lực của bảo lãnh thực hiện hợp đồng và bảo lãnh tạm ứng'], [2, 'Tệp bản hợp đồng đã ký, bảo lãnh thực hiện hợp đồng, bảo lãnh tạm ứng']]),
  { h2: 'Thêm phụ lục, điều chỉnh hợp đồng' },
  { steps: [
    'Trong khung **Điều chỉnh, phụ lục hợp đồng** (4), nhấn **+ Thêm phụ lục**.',
    'Nhập số phụ lục, ngày ký, nội dung điều chỉnh, giá trị điều chỉnh (số dương là tăng, số âm là giảm) và số ngày gia hạn; đính kèm bản phụ lục đã ký; nhấn **Lưu**. Phụ lục được lưu ở trạng thái **Soạn thảo**.',
    'Nhấn **Trình duyệt** trên dòng phụ lục để trình Lãnh đạo Ban (xem chương **Trình duyệt hồ sơ**). Chỉ khi phụ lục **Đã duyệt**, giá trị và thời hạn hợp đồng sau điều chỉnh mới được tính tự động; phụ lục chờ duyệt hiện ghi chú riêng dưới bảng.',
  ] },
  img('kt-them-phu-luc', 'Hộp thêm phụ lục hợp đồng', 12),
];

S.schedule = () => [
  { h1: 'QUẢN LÝ TIẾN ĐỘ' },
  { h2: 'Lập kế hoạch tiến độ' },
  { steps: [
    'Chọn **Quản lý tiến độ**, nhấn **+ Lập kế hoạch tiến độ**.',
    'Chọn gói thầu, nhập tên hạng mục/công việc, ngày bắt đầu và kết thúc kế hoạch, trọng số (tỷ trọng giá trị trong gói thầu, %); có thể gắn với hạng mục công trình và đính kèm bảng tiến độ được duyệt.',
    'Nhấn **Lưu**. Tiến độ gói thầu được tính bình quân theo trọng số các hạng mục.',
  ] },
  img('kt-lap-ke-hoach', 'Hộp lập kế hoạch tiến độ', 12),
  { h2: 'Cập nhật tiến độ thực tế' },
  { steps: [
    'Tại **Biểu đồ tiến độ (Gantt)**, nhấn **Cập nhật** (1) trên dòng hạng mục.',
    'Nhập tiến độ thực tế lũy kế (%), ngày cập nhật và ghi chú hoặc nguyên nhân chậm; có thể đính kèm ảnh hiện trường, báo cáo tuần làm căn cứ. Nhấn **Lưu**. Thanh tiến độ đổi màu: xanh – đạt, vàng – chậm, đỏ – quá hạn.',
    'Nhấn **⋯** (2) để xem chi tiết hạng mục và lịch sử các lần cập nhật kèm tệp của từng lần; tại đây có nút **Điều chỉnh kế hoạch** và **Xóa hạng mục**.',
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
    'Nhập công việc thực hiện vào bảng: mỗi dòng ghi công việc, khối lượng và đơn vị ở ba ô riêng, ví dụ «Đổ bê tông móng M1–M4» – «18,5» – «m3». Nhấn **+ Thêm dòng** để thêm công việc, nút **×** để xóa dòng; ô đơn vị gợi ý sẵn các đơn vị thường dùng.',
    'Ghi vướng mắc, sự cố, kiến nghị (nếu có) và họ tên cán bộ giám sát xác nhận.',
    'Tại **Hình ảnh hiện trường**, chọn một hoặc nhiều ảnh.',
    'Sau khi các bên ký trang nhật ký giấy, đính kèm bản scan tại ô **Trang nhật ký đã ký** (có thể bổ sung sau bằng nút **Sửa**); nhấn **Lưu**.',
  ] },
  img(addShot, 'Hộp ghi nhật ký thi công', 12),
  { h2: 'Quản lý ảnh hiện trường' },
  { p: 'Nhấn **Thêm ảnh** trên trang nhật ký để mở hộp **Hình ảnh hiện trường**: ghi **chú thích** (1) cho từng ảnh (vị trí, nội dung chụp), đánh dấu **Bỏ ảnh này** (2) với ảnh tải nhầm và chọn thêm ảnh mới (3); nhấn **Lưu**. Chú thích hiện dưới ảnh trên trang nhật ký.' },
  img(shot === 'kt-nhat-ky' ? 'kt-anh-nhat-ky' : 'gs-anh-nhat-ky', 'Hộp quản lý ảnh hiện trường', 12),
  legend([[1, 'Chú thích ảnh'], [2, 'Bỏ ảnh tải nhầm'], [3, 'Thêm ảnh mới']]),
  { note: 'Nhấn vào ảnh thu nhỏ trên trang nhật ký để xem ảnh cỡ lớn. Vướng mắc, sự cố được làm nổi bật màu vàng để lãnh đạo dễ theo dõi. Danh sách hiển thị 10 trang nhật ký mới nhất; nhấn **Xem thêm** để xem tiếp.' },
];

S.volume = () => [
  { h1: 'QUẢN LÝ KHỐI LƯỢNG' },
  { p: 'Phân hệ **Quản lý khối lượng** quản lý bảng khối lượng theo hợp đồng, các lần cập nhật khối lượng thực hiện và nghiệm thu, tổng hợp giá trị theo kỳ.' },
  img('kt-khoi-luong', 'Bảng khối lượng hợp đồng', 16),
  legend([[1, 'Chọn hợp đồng'], [2, 'Các thẻ: Khối lượng theo hợp đồng – Theo dõi nghiệm thu – Tổng hợp'], [3, 'Thêm công việc vào bảng khối lượng hợp đồng'], [4, 'Cập nhật khối lượng thực hiện'], [5, 'Đính kèm tệp bảng khối lượng, dự toán gốc của hợp đồng']]),
  { h2: 'Lập bảng khối lượng hợp đồng' },
  { steps: [
    'Chọn hợp đồng (1), tại thẻ **Khối lượng theo hợp đồng** nhấn **+ Thêm công việc** (3).',
    'Nhập mã hiệu, đơn vị tính, nội dung công việc, khối lượng hợp đồng và đơn giá; phần mềm tự tính thành tiền. Nhấn **Lưu**.',
    'Lưu tệp bảng khối lượng, dự toán gốc của hợp đồng (Excel, PDF): nhấn **Đính kèm / gỡ tệp** (5) ở dòng **Bảng khối lượng, dự toán gốc của hợp đồng** phía trên bảng.',
  ] },
  img('kt-them-boq', 'Hộp thêm công việc vào bảng khối lượng', 12),
  { h2: 'Cập nhật khối lượng thực hiện và nghiệm thu' },
  { steps: [
    'Nhấn **+ Cập nhật khối lượng thực hiện** (4).',
    'Chọn công việc, ngày, đợt/kỳ; nhập khối lượng thực hiện trong kỳ, khối lượng được nghiệm thu và số biên bản nghiệm thu; đính kèm bản scan **biên bản nghiệm thu** của đợt; nhấn **Lưu**. Biên bản gắn theo đợt/kỳ nên các công việc cùng đợt dùng chung một biên bản.',
    'Phần mềm cộng dồn khối lượng lũy kế, tính % thực hiện và giá trị nghiệm thu. Khi khối lượng lũy kế vượt khối lượng hợp đồng, phần mềm hiển thị cảnh báo để kiểm tra (không chặn việc nhập).',
  ] },
  img('kt-cap-nhat-khoi-luong', 'Hộp cập nhật khối lượng thực hiện', 12),
  { p: 'Thẻ **Theo dõi nghiệm thu** liệt kê từng lần cập nhật kèm trạng thái, số biên bản và tệp biên bản nghiệm thu; thẻ **Tổng hợp** thể hiện giá trị thực hiện, nghiệm thu theo tháng và lũy kế.' },
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
    'Chọn hợp đồng, nhập đợt thanh toán, thời gian dự kiến, giá trị kế hoạch và ghi chú; đính kèm quyết định giao kế hoạch vốn hoặc văn bản đăng ký kế hoạch (nếu có); nhấn **Lưu**.',
    'Nhấn **Sửa** (2) để điều chỉnh kế hoạch. Cột **Đã chi** cộng các hồ sơ thanh toán đã được Kho bạc chi của đúng đợt đó; tình trạng từng đợt được phần mềm tự xác định: **Đã thực hiện** (đã chi đủ), **Đang trình thanh toán**, **Còn N ngày** (đến hạn trong 15 ngày), **Quá hạn N ngày**, **Chưa đến hạn**. Đợt quá hạn được đưa vào mục cảnh báo trên trang Tổng quan, trừ khi hợp đồng đã thanh toán đủ.',
  ] },
  img('ke-ke-hoach', 'Kế hoạch thanh toán', 16),
  legend([[1, 'Thêm kế hoạch thanh toán'], [2, 'Sửa kế hoạch']]),
  img('ke-them-ke-hoach', 'Hộp thêm kế hoạch thanh toán', 12),
  { h2: 'Lập và theo dõi hồ sơ thanh toán' },
  { steps: [
    'Chọn thẻ **Hồ sơ thanh toán**, nhấn **+ Lập hồ sơ thanh toán** (1).',
    'Chọn hợp đồng và **Đợt thanh toán theo kế hoạch** (danh sách đợt tự lọc theo hợp đồng đã chọn); nhập số hồ sơ, ngày, loại thanh toán (tạm ứng, thanh toán khối lượng…), giá trị và nội dung; đính kèm bộ hồ sơ thanh toán (giấy đề nghị, bảng xác định giá trị, biên bản nghiệm thu…); nhấn **Lưu**. Hồ sơ mới ở trạng thái **Đề nghị**.',
    'Nhấn **Trình duyệt** trên dòng hồ sơ để trình Lãnh đạo Ban. Khi được duyệt, hồ sơ chuyển sang **Đang trình KBNN** (xem chương **Trình duyệt hồ sơ**).',
    'Khi Kho bạc đã chi, nhấn **Xác nhận đã chi** (2), nhập ngày Kho bạc chi và đính kèm **chứng từ Kho bạc** (giấy rút vốn, ủy nhiệm chi…); nhấn **Xác nhận đã chi**. Hồ sơ chuyển sang trạng thái «Đã thanh toán» và được cộng vào giá trị giải ngân.',
    'Nhấn **Sửa** (3) để sửa hồ sơ đang ở trạng thái Đề nghị hoặc bị trả lại; hồ sơ chờ duyệt, đã duyệt bị khóa để bảo đảm số liệu đã trình không bị thay đổi.',
  ] },
  img('ke-ho-so', 'Danh sách hồ sơ thanh toán', 16),
  legend([[1, 'Lập hồ sơ thanh toán'], [2, 'Xác nhận đã chi'], [3, 'Sửa hồ sơ']]),
  { imgs2: ['ke-lap-ho-so', 'ke-xac-nhan-chi'], caps: ['Hộp lập hồ sơ thanh toán', 'Hộp xác nhận đã chi kèm chứng từ Kho bạc'] },
  { p: 'Cột **Tệp** trong danh sách hồ sơ thanh toán gồm cả bộ hồ sơ đề nghị và chứng từ Kho bạc; nhấn để mở khi cần đối chiếu, kiểm tra.' },
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

  { h1: 'XÁC THỰC 2 LỚP' },
  { p: 'Để bảo vệ tài khoản có toàn quyền, mọi tài khoản thuộc nhóm **Quản trị hệ thống** bắt buộc dùng xác thực 2 lớp: ngoài mật khẩu, khi đăng nhập phải nhập thêm mã 6 số do ứng dụng xác thực trên điện thoại sinh ra. Mã đổi sau mỗi 30 giây và chỉ dùng được một lần, nên dù lộ mật khẩu, người khác vẫn không đăng nhập được nếu không cầm điện thoại của quản trị.' },
  { bullets: [
    'Ứng dụng xác thực: **Google Authenticator** hoặc **Microsoft Authenticator** (miễn phí trên CH Play và App Store). Ứng dụng sinh mã ngay trên điện thoại, không cần SMS và không cần kết nối Internet.',
    'Các nhóm khác (Lãnh đạo xã/phường, Lãnh đạo Ban, Cán bộ kỹ thuật, Kế toán, Tư vấn giám sát) đăng nhập bằng mật khẩu như bình thường.',
  ] },
  { h2: 'Thiết lập lần đầu' },
  { p: 'Màn hình **Thiết lập xác thực 2 lớp** xuất hiện ngay sau khi khởi tạo hệ thống, và ở lần đăng nhập đầu tiên của mỗi tài khoản quản trị mới.' },
  img('qt-2lop-thiet-lap', 'Màn hình thiết lập xác thực 2 lớp', 7.2),
  legend([[1, 'Mã QR để quét bằng ứng dụng xác thực'], [2, 'Khóa thiết lập (dùng khi không quét được mã QR)'], [3, 'Ô nhập mã 6 số'], [4, 'Nút Xác nhận và bật']]),
  { steps: [
    'Cài ứng dụng Google Authenticator hoặc Microsoft Authenticator trên điện thoại.',
    'Trong ứng dụng, nhấn nút **+** → **Quét mã QR** và quét mã QR (1) trên màn hình. Ứng dụng thêm mục «QLDA Xa Phuong» kèm tên đăng nhập.',
    'Nếu không quét được, chọn **Nhập khóa thiết lập** trong ứng dụng, nhập tên tài khoản và dãy khóa (2) hiển thị bên dưới mã QR.',
    'Nhập mã 6 số đang hiển thị trên ứng dụng vào ô (3), nhấn **Xác nhận và bật** (4).',
  ] },
  { h2: 'Lưu mã khôi phục' },
  { p: 'Sau khi bật, phần mềm cấp **10 mã khôi phục** (1). Mỗi mã dùng thay cho mã 6 số được một lần, khi mất hoặc đổi điện thoại. Mã chỉ hiển thị một lần.' },
  { steps: [
    'Nhấn **Tải tệp .txt** (2) để lưu tệp mã, hoặc **In** (3) để in ra giấy; cất giữ nơi an toàn, tách biệt với điện thoại.',
    'Đánh dấu **Tôi đã lưu mã khôi phục ở nơi an toàn** (4), nhấn **Vào hệ thống** (5).',
  ] },
  img('qt-2lop-ma-khoi-phuc', 'Màn hình lưu mã khôi phục', 9.5),
  legend([[1, 'Danh sách 10 mã khôi phục'], [2, 'Tải mã về tệp văn bản'], [3, 'In mã ra giấy'], [4, 'Xác nhận đã lưu mã'], [5, 'Vào hệ thống']]),
  { h2: 'Đăng nhập hằng ngày' },
  { steps: [
    'Nhập tên đăng nhập và mật khẩu như bình thường, nhấn **Đăng nhập**.',
    'Mở ứng dụng xác thực, nhập mã 6 số của mục «QLDA Xa Phuong» vào ô (1), nhấn **Xác nhận** (2).',
    'Không có điện thoại bên cạnh: nhấn **Dùng mã khôi phục** (3) và nhập một mã khôi phục chưa dùng (dạng xxxxx-xxxxx).',
  ] },
  { imgs2: ['qt-2lop-dang-nhap', 'qt-2lop-ma-khoi-phuc-dang-nhap'], caps: ['Nhập mã 6 số khi đăng nhập', 'Nhập mã khôi phục thay cho mã 6 số'] },
  legend([[1, 'Ô nhập mã 6 số'], [2, 'Nút Xác nhận'], [3, 'Chuyển sang dùng mã khôi phục']]),
  { note: 'Nhập sai mã 5 lần, tài khoản bị tạm khóa 15 phút. Mã luôn bị từ chối thường do đồng hồ điện thoại lệch giờ: bật «Đặt giờ tự động» trên điện thoại.' },
  { h2: 'Tạo mã khôi phục mới' },
  { p: 'Nhấn vào tên tài khoản ở góc trên bên phải. Hộp **Tài khoản** hiện trạng thái xác thực 2 lớp và số mã khôi phục còn lại (1). Khi sắp hết mã hoặc nghi lộ mã, nhấn **Tạo mã khôi phục mới** (2), nhập lại mật khẩu; bộ mã cũ hết hiệu lực ngay.' },
  img('qt-2lop-tai-khoan', 'Trạng thái xác thực 2 lớp trong hộp Tài khoản', 6.5),
  legend([[1, 'Trạng thái và số mã khôi phục còn lại'], [2, 'Tạo bộ mã khôi phục mới']]),
  { h2: 'Đặt lại khi quản trị mất điện thoại' },
  { bullets: [
    'Một quản trị khác vào **Quản trị hệ thống → Người dùng**, nhấn **Đặt lại 2 lớp** trên dòng tài khoản đó và xác nhận. Mã cũ, mã khôi phục cũ và các phiên đăng nhập của tài khoản hết hiệu lực; lần đăng nhập sau người đó quét mã QR mới.',
    'Quản trị không tự đặt lại được cho chính mình. Nếu Ban chỉ có một tài khoản quản trị và mất cả điện thoại lẫn mã khôi phục, đề nghị cán bộ phụ trách máy chủ thực hiện theo mục «Xác thực 2 lớp» của Hướng dẫn cài đặt.',
    'Khuyến nghị: duy trì ít nhất hai tài khoản quản trị (ví dụ một cán bộ chính, một cán bộ dự phòng) để luôn có người đặt lại được.',
  ] },
  img('qt-2lop-dat-lai', 'Hộp xác nhận đặt lại xác thực 2 lớp', 9),

  { h1: 'QUẢN LÝ NGƯỜI DÙNG' },
  { p: 'Chọn **Quản trị hệ thống**. Các thẻ (1) gồm: Người dùng, Nhóm và phân quyền, Danh mục dùng chung, Nhật ký hoạt động, Thông tin đơn vị – giao diện, Kho tệp – thùng rác, Sao lưu – hệ thống.' },
  img('qt-nguoi-dung', 'Danh sách người dùng', 16),
  legend([[1, 'Các thẻ quản trị'], [2, 'Thêm người dùng'], [3, 'Sửa thông tin người dùng'], [4, 'Đặt lại mật khẩu'], [5, 'Khóa / mở khóa tài khoản'], [6, 'Trạng thái xác thực 2 lớp: Đã bật / Chờ thiết lập (quản trị mới chưa đăng nhập lần đầu) / Không bắt buộc'], [7, 'Đặt lại xác thực 2 lớp cho quản trị mất điện thoại']]),
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
  { p: 'Cột **Duyệt hồ sơ** (1) cấp quyền duyệt, trả lại, từ chối và thu hồi hồ sơ trình duyệt của ba phân hệ: **Gói thầu và hợp đồng** (phụ lục hợp đồng), **Quản lý thanh toán** (hồ sơ thanh toán), **Nghiệm thu, bàn giao, bảo hành** (biên bản nghiệm thu). Mặc định chỉ nhóm Lãnh đạo Ban có quyền này. Người duyệt cần có thêm quyền xem phân hệ tương ứng.' },
  img('v12-quyen-duyet', 'Cấp quyền Duyệt hồ sơ cho nhóm Lãnh đạo Ban', 12),
  legend([[1, 'Cột cấp quyền Duyệt hồ sơ']]),
  { table: { head: ['Nhóm mặc định', 'Mô tả'], widths: [3000, 6000], rows: [
    ['Quản trị hệ thống', 'Toàn quyền, quản lý người dùng và cấu hình.'],
    ['Lãnh đạo Ban', 'Xem toàn bộ, chỉ đạo, cập nhật thông tin dự án.'],
    ['Cán bộ kỹ thuật', 'Quản lý kỹ thuật, tiến độ, nhật ký, khối lượng, nghiệm thu, giải phóng mặt bằng.'],
    ['Kế toán', 'Kế hoạch vốn, giải ngân, thanh toán, quyết toán.'],
    ['Tư vấn giám sát / Nhà thầu', 'Cập nhật nhật ký, tiến độ hiện trường trong phạm vi dự án được giao.'],
    ['Lãnh đạo xã/phường (Bí thư, Phó Bí thư, Chủ tịch, Phó Chủ tịch HĐND, UBND; Chủ tịch UBND là người quyết định đầu tư)', 'Theo dõi tình hình dự án, giải ngân, giải phóng mặt bằng, nghiệm thu, quyết toán; nhận cảnh báo. Chỉ xem.'],
  ] }, cap: 'Các nhóm người dùng tạo sẵn khi khởi tạo hệ thống' },

  { h1: 'DANH MỤC DÙNG CHUNG' },
  { p: 'Danh mục dùng chung là các giá trị chọn sẵn trong ô nhập liệu: nhóm dự án, loại dự án, vai trò của Ban, hình thức quản lý dự án, giai đoạn, nguồn vốn, loại kế hoạch vốn, loại nghiệm thu, trạng thái quyết toán, loại gói thầu, hình thức lựa chọn nhà thầu, loại hợp đồng, loại hồ sơ pháp lý, loại và trạng thái thanh toán, đơn vị tính, thời tiết, định dạng mô hình…' },
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

  { h1: 'KHO TỆP VÀ THÙNG RÁC' },
  { p: 'Thẻ **Kho tệp, thùng rác** giúp quản trị theo dõi dung lượng tệp đính kèm, khôi phục tệp người dùng gỡ nhầm và dọn tệp không còn sử dụng.' },
  img('qt-kho-tep', 'Kho tệp và thùng rác', 16),
  legend([[1, 'Tổng số tệp, dung lượng kho tệp, số tệp trong thùng rác và tệp không còn sử dụng'], [2, 'Số tệp và dung lượng theo loại dữ liệu (hồ sơ pháp lý, hợp đồng, thanh toán, nhật ký…)'], [3, 'Dọn tệp không còn sử dụng'], [4, 'Khôi phục tệp từ thùng rác'], [5, 'Xóa hẳn tệp khỏi máy chủ']]),
  { bullets: [
    '**Thùng rác**: tệp do người dùng gỡ khỏi bản ghi, hoặc tệp của bản ghi bị xóa, được giữ 30 ngày rồi tự xóa hẳn. Nhấn **Khôi phục** (4) để gắn tệp trở lại bản ghi cũ (bản ghi phải còn tồn tại); nhấn **Xóa hẳn** (5) để giải phóng dung lượng ngay.',
    '**Tệp không còn sử dụng**: tệp đã bị thay bằng phiên bản khác hoặc ảnh đã bỏ khỏi nhật ký, không còn bản ghi nào dùng tới. Nhấn **Dọn** (3) để xóa các tệp này (chỉ tính tệp tải lên quá 1 ngày).',
    'Theo dõi dung lượng (1) để chủ động mở rộng ổ đĩa máy chủ; mỗi tệp tải lên tối đa 500 MB.',
  ] },

  { h1: 'SAO LƯU VÀ PHỤC HỒI DỮ LIỆU' },
  { p: 'Thẻ **Sao lưu, hệ thống** hiển thị thông tin hệ thống, số bản ghi từng loại dữ liệu, chức năng sao lưu, phục hồi và danh sách bản sao lưu tự động trên máy chủ.' },
  img('qt-sao-luu', 'Sao lưu và phục hồi dữ liệu', 15),
  legend([[1, 'Tải tệp sao lưu dữ liệu (.json): dữ liệu nghiệp vụ, danh mục, nhóm, người dùng và danh sách tệp đính kèm'], [2, 'Tải bản sao lưu đầy đủ (.zip): dữ liệu kèm toàn bộ tệp đính kèm'], [3, 'Phục hồi dữ liệu từ tệp sao lưu'], [4, 'Sao lưu lên máy chủ ngay'], [5, 'Danh sách bản sao lưu tự động; nhấn tên để tải về']]),
  { h2: 'Sao lưu tự động hằng đêm' },
  { p: 'Máy chủ tự sao lưu lúc 1 giờ sáng mỗi ngày: ghi một tệp dữ liệu .json và chép thêm các tệp đính kèm mới vào thư mục sao lưu (do người cài đặt cấu hình; máy chủ Linux: volume appdata của từng xã), giữ 14 bản gần nhất. Cùng lúc, phần mềm xóa hẳn các tệp đã nằm trong thùng rác quá 30 ngày. Nhấn **Sao lưu lên máy chủ ngay** (4) trước khi nâng cấp hoặc thao tác dữ liệu lớn.' },
  { h2: 'Tải bản sao lưu về máy và phục hồi' },
  { steps: [
    'Sao lưu dữ liệu: nhấn **Tải tệp sao lưu dữ liệu (.json)** (1). Muốn có cả tệp đính kèm, nhấn **Tải bản sao lưu đầy đủ kèm tệp (.zip)** (2); thời gian đóng gói tùy dung lượng kho tệp. Lưu tệp vào nơi an toàn, tách biệt với máy chủ.',
    'Phục hồi: nhấn **Phục hồi từ tệp sao lưu** (3), chọn tệp .json, xác nhận. Dữ liệu trong tệp được ghi đè lên bản ghi trùng mã; tài khoản trùng tên đăng nhập được giữ nguyên; danh sách tệp đính kèm được phục hồi cùng dữ liệu.',
  ] },
  { note: 'Nên đặt thư mục sao lưu tự động trên ổ đĩa khác hoặc ổ mạng (cấu hình Storage:BackupPath, xem «Hướng dẫn cài đặt»). Sao lưu trong phần mềm không thay thế sao lưu cơ sở dữ liệu định kỳ (PostgreSQL hoặc SQL Server) do cán bộ phụ trách hạ tầng thực hiện.' },

  { h1: 'THÔNG TIN ĐƠN VỊ, GIAO DIỆN' },
  { p: 'Thẻ **Thông tin đơn vị, giao diện** cho phép quản trị thay logo, tên phần mềm, tên đơn vị, banner trang đăng nhập, chân trang… mà không cần cài lại phần mềm. Dùng khi đơn vị đổi tên hoặc khi triển khai phần mềm cho đơn vị khác. Thay đổi áp dụng ngay cho mọi người dùng ở lần mở trang tiếp theo.' },
  img('qt-don-vi', 'Thông tin đơn vị và nhận diện giao diện', 16),
  legend([[1, 'Các ô thông tin: tên đơn vị rút gọn, tên phần mềm, cơ quan chủ quản, đơn vị sử dụng, tiêu đề và mô tả banner, địa chỉ, chân trang, tên đơn vị trên báo cáo, chủ đầu tư mặc định, thông tin hỗ trợ'], [2, 'Lưu thông tin'], [3, 'Đưa các ô thông tin về mặc định'], [4, 'Xem trước logo và tên phần mềm như trên thanh chức năng'], [5, 'Chọn ảnh logo mới']]),
  { steps: [
    'Chọn **Quản trị hệ thống** → thẻ **Thông tin đơn vị, giao diện**.',
    'Sửa các ô thông tin (1). Ô **Chân trang** có thể ghi **{năm}**, phần mềm tự thay bằng năm hiện tại. Nhấn **Lưu thông tin** (2).',
    'Thay logo: nhấn **Chọn ảnh logo** (5), chọn ảnh PNG, JPG hoặc WEBP tối đa 2 MB (nên dùng ảnh vuông, nền trong suốt). Logo hiện ngay ở khung xem trước (4), thanh chức năng và trang đăng nhập. Nhấn **Xóa logo** để dùng lại biểu tượng mặc định.',
    'Muốn trở về thông tin ban đầu, nhấn **Khôi phục mặc định** (3) và xác nhận; logo được giữ nguyên.',
  ] },
  img('qt-dang-nhap-don-vi', 'Trang đăng nhập sau khi thay logo và thông tin đơn vị', 16),
  { note: 'Mọi lần thay đổi được ghi vào Nhật ký hoạt động. Thông tin đơn vị và logo được lưu kèm trong tệp sao lưu dữ liệu.' },

  { h1: 'QUẢN LÝ HƯỚNG DẪN SỬ DỤNG' },
  { p: 'Trang **Hướng dẫn sử dụng** (cuối thanh chức năng bên trái) chứa tài liệu, video hướng dẫn cho từng nhóm người dùng. Quản trị hệ thống xem toàn bộ; mỗi nhóm khác chỉ thấy hướng dẫn dành cho nhóm mình. Khi cài đặt, phần mềm tự tạo sẵn 7 hướng dẫn kèm tệp PDF của bộ tài liệu này cho từng vai trò.' },
  img('qt-huong-dan', 'Quản lý hướng dẫn sử dụng', 16),
  legend([[1, 'Thêm hướng dẫn'], [2, 'Tìm kiếm trong hướng dẫn'], [3, 'Lọc hướng dẫn theo nhóm người dùng'], [4, 'Nhóm người dùng được xem hướng dẫn'], [5, 'Sửa hoặc xóa hướng dẫn'], [6, 'Tệp hướng dẫn: Mở hoặc Tải về']]),
  { h2: 'Thêm, sửa hướng dẫn và đính kèm tệp, video' },
  { steps: [
    'Nhấn **+ Thêm hướng dẫn** (1), hoặc **Sửa** (5) trên hướng dẫn cần cập nhật.',
    'Nhập **Tiêu đề**, **Nhóm nội dung** (ví dụ «Tài liệu hướng dẫn sử dụng», «Video hướng dẫn»; các hướng dẫn cùng nhóm nội dung hiển thị chung một mục) và **Thứ tự hiển thị**.',
    'Tại **Dành cho nhóm người dùng**, đánh dấu các nhóm được xem; để trống nghĩa là mọi người dùng đều xem được.',
    'Ghi nội dung, lưu ý (nếu có); tại ô đính kèm, chọn hoặc kéo thả tệp PDF, Word, ảnh hoặc video clip MP4 (tối đa 500 MB mỗi tệp). Muốn thay tài liệu cũ, nhấn **Gỡ** trên tệp cũ và chọn tệp mới.',
    'Nhấn **Lưu**. Người dùng thuộc nhóm được chọn thấy ngay hướng dẫn mới.',
  ] },
  img('qt-them-huong-dan', 'Hộp thêm, sửa hướng dẫn sử dụng', 12),
  { bullets: [
    'Video hướng dẫn phát ngay trên trang (nên dùng định dạng MP4); tài liệu PDF mở trên trình duyệt; tệp Word, Excel được tải về máy.',
    'Xóa hướng dẫn: nhấn **Xóa** (5) và xác nhận. Tệp kèm theo được chuyển vào thùng rác 30 ngày, có thể khôi phục tại thẻ **Kho tệp, thùng rác**.',
    'Phần mềm kiểm tra quyền trên máy chủ: người dùng không mở được tệp của hướng dẫn không dành cho nhóm mình, kể cả khi biết đường dẫn.',
  ] },

  { h1: 'DANH MỤC CHỨC NĂNG' },
  { p: 'Trang **Danh mục chức năng** (nhóm Tiện ích) liệt kê 77 chức năng của phần mềm theo 17 nhóm nghiệp vụ, nơi thực hiện từng chức năng và nút **Mở** để chuyển nhanh tới trang tương ứng; dùng khi giới thiệu, đào tạo người dùng mới hoặc kiểm tra, nghiệm thu phần mềm.' },
  img('qt-doi-chieu', 'Danh mục chức năng của phần mềm', 16),
];


// ===== Phiên bản 1.1: chức năng Ban QLDA cấp xã =====
S.capital = (edit) => [
  { h1: 'KẾ HOẠCH VỐN, GIẢI NGÂN' },
  { p: 'Phân hệ **Kế hoạch vốn, giải ngân** theo dõi kế hoạch đầu tư công trung hạn, vốn được giao hằng năm (kể cả vốn điều chỉnh, kéo dài) và tiến độ giải ngân của từng dự án so với **kịch bản giải ngân** theo quý. Giá trị giải ngân được tính tự động từ hồ sơ thanh toán đã được Kho bạc chi, không phải nhập lại.' },
  img('von-giai-ngan', 'Theo dõi giải ngân kế hoạch vốn năm', 16),
  legend([[1, 'Chọn năm kế hoạch'], [2, 'Chỉ tiêu chính: kế hoạch vốn năm, đã giải ngân, kịch bản đến ngày hiện tại, số dự án chậm giải ngân quá 10%'], [3, 'Các thẻ: Theo dõi giải ngân – Kế hoạch vốn – Lũy kế theo quý'], [4, 'Bảng giải ngân từng dự án: thanh tiến độ, kịch bản đến nay và tình trạng (đạt kịch bản / chậm)']]),
  { p: 'Tình trạng **Đạt kịch bản** (xanh) khi tỷ lệ giải ngân bằng hoặc vượt kịch bản đến ngày hiện tại; **Chậm** (vàng) khi thấp hơn không quá 10%; **Chậm giải ngân** (đỏ) khi thấp hơn quá 10% – dự án này đồng thời được đưa vào mục cảnh báo trên trang Tổng quan.' },
  ...(edit ? [
    { h2: 'Nhập kế hoạch vốn được giao' },
    { steps: [
      'Chọn thẻ **Kế hoạch vốn**, nhấn **+ Thêm kế hoạch vốn** (1).',
      'Chọn dự án, năm kế hoạch, **loại kế hoạch** (kế hoạch trung hạn, kế hoạch vốn năm, bổ sung, điều chỉnh giảm, kéo dài), nguồn vốn và giá trị.',
      'Nhập số và ngày quyết định giao vốn; đính kèm quyết định giao kế hoạch vốn hoặc văn bản đăng ký kế hoạch.',
      'Với kế hoạch vốn năm, nhập **kịch bản giải ngân lũy kế** hết quý I, II, III (mặc định 20%, 45%, 70%; hết năm 100%) theo chỉ đạo của UBND xã/phường. Nhấn **Lưu**.',
      'Khi có quyết định điều chỉnh, thêm một dòng mới loại «Điều chỉnh giảm» hoặc «Bổ sung»; phần mềm tự tính kế hoạch vốn năm sau điều chỉnh. Nhấn **Sửa** (2) để sửa dòng đã nhập.',
    ] },
    img('von-ke-hoach', 'Danh sách kế hoạch vốn được giao', 16),
    legend([[1, 'Thêm kế hoạch vốn'], [2, 'Sửa kế hoạch vốn']]),
    img('von-them', 'Hộp thêm kế hoạch vốn', 12),
  ] : [
    { p: 'Thẻ **Kế hoạch vốn** liệt kê các quyết định giao vốn của từng dự án (trung hạn, năm, bổ sung, điều chỉnh) kèm tệp quyết định; nhấn tên tệp để xem.' },
  ]),
  { h2: 'Lũy kế giải ngân theo quý' },
  { p: 'Thẻ **Lũy kế theo quý** so sánh kịch bản và thực tế giải ngân lũy kế từng quý của năm đã chọn, kèm tỷ lệ đạt kịch bản và tỷ lệ so với kế hoạch vốn năm; dùng khi báo cáo giải ngân định kỳ.' },
  img('von-quy', 'Kịch bản và thực tế giải ngân lũy kế theo quý', 16),
];

S.clearance = (edit) => [
  { h1: 'GIẢI PHÓNG MẶT BẰNG' },
  { p: 'Phân hệ **Giải phóng mặt bằng** theo dõi từng khu vực, đoạn tuyến phải bồi thường, hỗ trợ, tái định cư: số hộ bị ảnh hưởng và đã chi trả, diện tích thu hồi và đã bàn giao, kinh phí theo phương án và đã chi trả, hạn bàn giao mặt bằng cho thi công.' },
  img('gpmb', 'Tiến độ bồi thường, bàn giao mặt bằng', 16),
  legend([[1, 'Chỉ tiêu chính: hộ đã chi trả, diện tích đã bàn giao, kinh phí đã chi trả, số khu vực chậm bàn giao'], [2, 'Thêm khu vực giải phóng mặt bằng (chỉ hiện với tài khoản có quyền cập nhật)'], [3, 'Bảng tiến độ từng khu vực: tiến độ, tình trạng, vướng mắc và tệp đính kèm']]),
  ...(edit ? [
    { h2: 'Thêm, cập nhật khu vực giải phóng mặt bằng' },
    { steps: [
      'Nhấn **+ Thêm khu vực** (2).',
      'Chọn dự án, nhập tên khu vực, đoạn tuyến; số hộ bị ảnh hưởng, diện tích thu hồi, kinh phí theo phương án; số và ngày quyết định phê duyệt phương án bồi thường; hạn bàn giao mặt bằng.',
      'Trong quá trình thực hiện, nhấn **Sửa** trên dòng khu vực để cập nhật số hộ đã chi trả, kinh phí đã chi trả, diện tích đã bàn giao, ngày bàn giao và vướng mắc, kiến nghị.',
      'Đính kèm phương án bồi thường, biên bản bàn giao mặt bằng; nhấn **Lưu**. Phần mềm không cho số hộ đã chi trả hoặc diện tích đã bàn giao vượt tổng số.',
    ] },
    img('gpmb-them', 'Hộp thêm khu vực giải phóng mặt bằng', 12),
  ] : []),
  { note: 'Tiến độ khu vực tính theo diện tích đã bàn giao so với diện tích thu hồi. Khu vực quá hạn bàn giao mà chưa bàn giao được tô đỏ và đưa vào mục cảnh báo trên trang Tổng quan để chỉ đạo tháo gỡ.' },
];

S.acceptance = (edit) => [
  { h1: 'NGHIỆM THU, BÀN GIAO, BẢO HÀNH' },
  { p: 'Phân hệ **Nghiệm thu, bàn giao, bảo hành** lưu biên bản nghiệm thu theo giai đoạn thi công, nghiệm thu hoàn thành hạng mục, công trình, bàn giao đưa vào sử dụng (theo Nghị định 207/2026/NĐ-CP) và theo dõi thời hạn bảo hành, bảo lãnh bảo hành của từng công trình.' },
  img('nt-ds', 'Danh sách nghiệm thu, bàn giao', 16),
  legend([[1, 'Chỉ tiêu: số biên bản nghiệm thu giai đoạn, nghiệm thu hoàn thành, công trình đã bàn giao, công trình sắp hết bảo hành'], [2, 'Các thẻ: Nghiệm thu, bàn giao – Theo dõi bảo hành'], [3, 'Lọc theo loại nghiệm thu, bàn giao'], [4, 'Thêm biên bản (chỉ hiện với tài khoản có quyền cập nhật)']]),
  ...(edit ? [
    { h2: 'Thêm biên bản nghiệm thu, bàn giao' },
    { steps: [
      'Nhấn **+ Thêm biên bản** (4).',
      'Chọn dự án và gói thầu (để trống nếu nghiệm thu, bàn giao toàn dự án); chọn loại (nghiệm thu giai đoạn, nghiệm thu hoàn thành hạng mục, nghiệm thu hoàn thành công trình, bàn giao đưa vào sử dụng…), ngày, số biên bản, kết quả.',
      'Nhập nội dung nghiệm thu và đơn vị tiếp nhận, quản lý sử dụng (khi bàn giao).',
      'Khi nghiệm thu hoàn thành hoặc bàn giao: nhập **thời hạn bảo hành** (tháng) – phần mềm tự tính ngày hết bảo hành – và **bảo lãnh bảo hành hiệu lực đến**.',
      'Đính kèm biên bản, bản vẽ hoàn công, bảo lãnh bảo hành; nhấn **Lưu**. Gói thầu phải thuộc dự án đã chọn. Biên bản lưu ở trạng thái **Soạn thảo**; nhấn **Trình duyệt** để trình Lãnh đạo Ban (xem chương **Trình duyệt hồ sơ**).',
    ] },
    img('nt-them', 'Hộp thêm biên bản nghiệm thu, bàn giao', 12),
  ] : []),
  { h2: 'Theo dõi bảo hành công trình' },
  { p: 'Thẻ **Theo dõi bảo hành** liệt kê các công trình có thời hạn bảo hành, sắp xếp theo ngày hết bảo hành. Phần mềm cảnh báo trước 30 ngày khi sắp hết bảo hành hoặc hết bảo lãnh bảo hành để Ban kiểm tra hiện trạng, yêu cầu nhà thầu sửa chữa trước khi hoàn trả bảo lãnh.' },
  img('nt-bh', 'Theo dõi bảo hành công trình', 16),
];

S.settlement = (edit) => [
  { h1: 'QUYẾT TOÁN DỰ ÁN HOÀN THÀNH' },
  { p: 'Phân hệ **Quyết toán dự án** theo dõi từng dự án hoàn thành từ khi bàn giao đến khi tất toán tài khoản: hạn lập báo cáo quyết toán, ngày trình thẩm tra, giá trị đề nghị – thẩm tra – phê duyệt, quyết định phê duyệt và ngày tất toán.' },
  img('qtoan-ds', 'Quyết toán dự án hoàn thành', 16),
  legend([[1, 'Chỉ tiêu: dự án phải quyết toán, quá hạn lập quyết toán, đã phê duyệt, giá trị giảm trừ qua thẩm tra'], [2, 'Bảng hồ sơ quyết toán: thời hạn, giá trị đề nghị – thẩm tra – phê duyệt, tất toán và tình trạng'], [3, 'Thêm hồ sơ quyết toán (chỉ hiện với tài khoản có quyền cập nhật)']]),
  { p: 'Dự án đã hoàn thành, bàn giao nhưng chưa có hồ sơ quyết toán được liệt kê riêng ở khung **Dự án đã hoàn thành chưa lập hồ sơ quyết toán** phía trên bảng, để Ban không bỏ sót.' },
  ...(edit ? [
    { h2: 'Lập và cập nhật hồ sơ quyết toán' },
    { steps: [
      'Nhấn **+ Thêm hồ sơ quyết toán** (3), hoặc nhấn **Lập hồ sơ** trên dòng dự án tại khung **Dự án đã hoàn thành chưa lập hồ sơ quyết toán** – ngày hoàn thành được điền sẵn từ biên bản bàn giao.',
      'Nhập ngày hoàn thành, bàn giao và **hạn lập báo cáo quyết toán** theo quy định hiện hành.',
      'Khi trình thẩm tra, nhập ngày trình và giá trị đề nghị quyết toán; khi có kết quả, nhập giá trị thẩm tra, giá trị phê duyệt, số và ngày quyết định phê duyệt; khi tất toán tài khoản tại Kho bạc, nhập ngày tất toán.',
      'Đính kèm báo cáo quyết toán, thông báo kết quả thẩm tra, quyết định phê duyệt; nhấn **Lưu**. Tình trạng được phần mềm tự xác định.',
    ] },
    img('qtoan-them', 'Hộp thêm hồ sơ quyết toán', 12),
  ] : []),
  { note: 'Phần mềm cảnh báo trước 30 ngày khi sắp đến hạn lập báo cáo quyết toán, khi đã quá hạn và khi đã phê duyệt quá 60 ngày nhưng chưa tất toán tài khoản – giúp Ban không bị nhắc nhở, phê bình vì chậm quyết toán.' },
];


// ===== Bản 1.2: trình duyệt hồ sơ =====
S.approval = (k) => {
  const lead = k === 'ld';
  const out = [{ h1: 'TRÌNH DUYỆT HỒ SƠ' },
    { p: 'Phụ lục hợp đồng, hồ sơ thanh toán và biên bản nghiệm thu được quản lý theo quy trình trình duyệt: **người lập** lưu hồ sơ ở trạng thái soạn thảo và bấm **Trình duyệt**; **Lãnh đạo Ban** (người được cấp quyền Duyệt hồ sơ) xem và **Duyệt**, **Trả lại** kèm ý kiến hoặc **Từ chối**. Chỉ hồ sơ đã duyệt mới được tính vào số liệu: phụ lục đã duyệt mới cộng vào giá trị và thời hạn hợp đồng; hồ sơ thanh toán được duyệt mới chuyển sang trình Kho bạc.' },
    { table: { head: ['Hồ sơ', 'Người lập', 'Trạng thái khi lưu', 'Khi được duyệt'], widths: [2300, 2200, 2000, 2500], rows: [
      ['Phụ lục hợp đồng', 'Cán bộ kỹ thuật', 'Soạn thảo', 'Đã duyệt: cộng vào giá trị, thời hạn hợp đồng'],
      ['Hồ sơ thanh toán', 'Kế toán', 'Đề nghị', 'Đang trình KBNN; Kế toán xác nhận đã chi khi Kho bạc chi'],
      ['Biên bản nghiệm thu, bàn giao', 'Cán bộ kỹ thuật', 'Soạn thảo', 'Đã duyệt'],
    ] }, cap: 'Các loại hồ sơ theo quy trình trình duyệt' },
    { p: 'Trang **Trình duyệt hồ sơ** (ngay dưới Tổng quan trên thanh chức năng) gom tất cả hồ sơ ở một nơi, gồm các thẻ: **Chờ tôi duyệt**, **Đang chờ duyệt**, **Đang soạn thảo, bị trả lại** và **Lịch sử duyệt**. Số màu đỏ bên cạnh tên trang là số hồ sơ đang chờ tài khoản duyệt.' },
  ];
  if (!lead) out.push(
    { h2: 'Trình duyệt hồ sơ' },
    { steps: [
      'Lập hồ sơ như bình thường (phụ lục hợp đồng, hồ sơ thanh toán hoặc biên bản nghiệm thu) và nhấn **Lưu**. Hồ sơ ở trạng thái soạn thảo (1), vẫn sửa, xóa được.',
      'Khi hồ sơ đã đủ, nhấn **Trình duyệt** (2) trên dòng hồ sơ; nhập ý kiến kèm theo nếu cần (ví dụ văn bản đề nghị của nhà thầu) và nhấn **Trình duyệt** trong hộp xác nhận. Hồ sơ chuyển sang **Chờ duyệt**.',
      'Trong khi chờ duyệt, hồ sơ bị khóa sửa. Cần sửa gấp: nhấn **Rút lại** để đưa hồ sơ về soạn thảo, sửa xong trình lại.',
    ] },
    img('v12-kt-phu-luc', 'Phụ lục hợp đồng ở các trạng thái soạn thảo, đã duyệt', 16),
    legend([[1, 'Trạng thái Soạn thảo'], [2, 'Nút Trình duyệt'], [3, 'Phụ lục đã duyệt (được tính vào giá trị hợp đồng)']]),
    img('v12-trinh', 'Hộp xác nhận trình duyệt', 11),
    { h2: 'Xử lý hồ sơ bị trả lại' },
    { p: 'Khi Lãnh đạo Ban trả lại, hồ sơ về trạng thái soạn thảo và hiện ở thẻ **Đang soạn thảo, bị trả lại** (1) của trang Trình duyệt hồ sơ, kèm ý kiến của người duyệt (2). Sửa, bổ sung hồ sơ theo ý kiến rồi nhấn **Trình duyệt** (3) để trình lại.' },
    img('v12-kt-bi-tra-lai', 'Hồ sơ bị trả lại kèm ý kiến của Lãnh đạo Ban', 16),
    legend([[1, 'Thẻ hồ sơ đang soạn thảo, bị trả lại'], [2, 'Ý kiến của người duyệt'], [3, 'Trình duyệt lại sau khi sửa']]),
    { note: 'Hồ sơ đã được duyệt bị khóa để bảo đảm số liệu đã duyệt không bị thay đổi. Phát hiện sai sót sau khi duyệt, đề nghị Lãnh đạo Ban **Thu hồi** hồ sơ về soạn thảo để điều chỉnh.' },
  );
  else out.push(
    { h2: 'Duyệt, trả lại, từ chối hồ sơ' },
    { steps: [
      'Chọn **Trình duyệt hồ sơ** (1) trên thanh chức năng. Thẻ **Chờ tôi duyệt** (2) liệt kê hồ sơ đang chờ, kèm loại hồ sơ, dự án, giá trị, nội dung và người trình.',
      'Kiểm tra hồ sơ; cần xem chi tiết hoặc tệp đính kèm, mở hồ sơ tại phân hệ tương ứng (Gói thầu và hợp đồng, Quản lý thanh toán, Nghiệm thu).',
      'Nhấn **Duyệt** (3) nếu đồng ý; nhập ý kiến (không bắt buộc) và nhấn **Duyệt** trong hộp xác nhận.',
      'Nhấn **Trả lại** (4) khi hồ sơ cần sửa, bổ sung: bắt buộc ghi ý kiến để người lập biết cần làm gì. Hồ sơ về soạn thảo cho người lập sửa và trình lại.',
      'Nhấn **Từ chối** (5) khi không chấp thuận hồ sơ: bắt buộc ghi lý do. Hồ sơ bị từ chối không được tính vào số liệu.',
    ] },
    img('v12-ld-cho-duyet', 'Trang Trình duyệt hồ sơ, thẻ Chờ tôi duyệt', 16),
    legend([[1, 'Trang Trình duyệt hồ sơ và số hồ sơ chờ duyệt'], [2, 'Các thẻ: Chờ tôi duyệt – Đang chờ duyệt – Đang soạn thảo, bị trả lại – Lịch sử duyệt'], [3, 'Duyệt hồ sơ'], [4, 'Trả lại hồ sơ kèm ý kiến'], [5, 'Từ chối hồ sơ']]),
    { imgs2: ['v12-duyet', 'v12-tra-lai'], caps: ['Hộp xác nhận duyệt', 'Hộp trả lại hồ sơ: bắt buộc ghi ý kiến'] },
    { h2: 'Thu hồi hồ sơ đã duyệt, xem lịch sử' },
    { p: 'Hồ sơ đã duyệt bị khóa với người lập. Khi cần điều chỉnh, nhấn **Thu hồi** (1) trên dòng hồ sơ và ghi lý do: hồ sơ về soạn thảo để người lập sửa và trình lại. Hồ sơ thanh toán đã được Kho bạc chi thì không thu hồi được. Nhấn **Lịch sử** (2) để xem toàn bộ quá trình trình, duyệt, trả lại của một hồ sơ.' },
    img('v12-ld-thu-hoi', 'Thu hồi và xem lịch sử của phụ lục đã duyệt', 16),
    legend([[1, 'Thu hồi hồ sơ đã duyệt về soạn thảo'], [2, 'Lịch sử trình duyệt của hồ sơ']]),
    { p: 'Thẻ **Lịch sử duyệt** ghi lại mọi lần trình, duyệt, trả lại, từ chối, thu hồi: thời gian, hồ sơ, thao tác, người thực hiện và ý kiến. Lịch sử do máy chủ ghi, không sửa, xóa được, làm căn cứ khi kiểm tra, thanh tra.' },
    img('v12-lich-su', 'Lịch sử duyệt hồ sơ', 16),
  );
  return out;
};


// ===== Lãnh đạo xã/phường xem trên điện thoại =====
S.leaderMobile = () => [
  { h1: 'XEM TRÊN ĐIỆN THOẠI' },
  { p: 'Lãnh đạo xã/phường dùng chính tài khoản trên máy tính để xem trên điện thoại, không cần cài phần mềm riêng. Số liệu trên điện thoại và máy tính là một, cập nhật cùng lúc.' },
  { h2: 'Mở phần mềm trên điện thoại' },
  { steps: [
    'Điện thoại Android: mở **Chrome**; iPhone: mở **Safari**. Nhập địa chỉ phần mềm do quản trị hệ thống cung cấp.',
    'Nhập tên đăng nhập, mật khẩu và chạm **Đăng nhập** (1–3).',
    'Để mở nhanh lần sau: trên Android chạm **⋮** → **Thêm vào màn hình chính**; trên iPhone chạm nút **Chia sẻ** → **Thêm vào MH chính**. Biểu tượng phần mềm xuất hiện trên màn hình điện thoại như một ứng dụng.',
  ] },
  { imgs2: ['dt-dang-nhap-so', 'dt-xp-tong-quan'], caps: ['Đăng nhập trên điện thoại', 'Trang Tổng quan'], mobile: true },
  legend([[1, 'Tên đăng nhập'], [2, 'Mật khẩu'], [3, 'Đăng nhập'], [4, 'Các chỉ tiêu chính: dự án, tổng mức đầu tư, giá trị hợp đồng, giải ngân năm, số cảnh báo'], [5, 'Thanh điều hướng: Tổng quan, Dự án, Hiện trường, Menu']]),
  { h2: 'Nắm tình hình và cảnh báo' },
  { p: 'Trang **Tổng quan** mở ra ngay sau khi đăng nhập: các chỉ tiêu chính (4) được xếp thành thẻ dễ đọc trên màn hình nhỏ; kéo xuống để xem biểu đồ và **Cảnh báo và việc cần xử lý** (dự án chậm giải ngân, hạng mục quá hạn, đợt thanh toán quá hạn, khu vực chậm bàn giao mặt bằng, quyết toán quá hạn…). Chạm **Xem** để mở ngay nội dung cần chỉ đạo.' },
  { imgs2: ['dt-xp-canh-bao', 'dt-xp-von'], caps: ['Cảnh báo và việc cần xử lý', 'Giải ngân kế hoạch vốn so với kịch bản'], mobile: true },
  { h2: 'Tra cứu dự án và các phân hệ khác' },
  { p: 'Chạm **Dự án** ở thanh dưới cùng để xem danh sách dự án, chạm vào một dự án để xem chi tiết, tình trạng thực hiện và hồ sơ pháp lý (mở được tệp PDF ngay trên điện thoại). Chạm **Menu** để mở các phân hệ khác: Kế hoạch vốn, giải ngân; Giải phóng mặt bằng; Quản lý tiến độ; Nghiệm thu, bàn giao, bảo hành; Quản lý thanh toán; Quyết toán dự án; Báo cáo, thống kê. Muốn xem riêng một dự án, chọn dự án ở ô phía trên cùng.' },
  { imgs2: ['dt-xp-du-an', 'dt-xp-menu', 'dt-xp-bao-cao'], caps: ['Danh sách dự án', 'Menu các phân hệ được xem', 'Báo cáo, thống kê'], mobile: true },
  { note: 'Trên điện thoại, các bảng tự chuyển thành dạng thẻ, không cần kéo ngang. Báo cáo xuất Excel, PDF được tải về điện thoại và mở bằng ứng dụng xem tệp. Khi dùng điện thoại chung hoặc bị mất điện thoại, đăng xuất hoặc báo quản trị hệ thống đặt lại mật khẩu ngay.' },
];

// ===== Lắp ráp theo vai trò =====
function build(k) {
  if (k === 'dt') return require('./content-dt').build();
  const out = common(k);
  if (k === 'ld') {
    out.push({ h1: 'THEO DÕI, ĐIỀU HÀNH' }, ...S.dashboard(k, 'ld-tong-quan').slice(0), ...S.contractView(), ...S.paymentView());
    out.push(...S.approval('ld'));
    out.push(...S.projectView(true), ...S.projectEdit(), ...S.capital(false), ...S.clearance(false), ...S.scheduleView(), ...S.acceptance(false), ...S.settlement(false), ...S.reports());
    out.push(...tail(k, false));
  }
  if (k === 'kt') {
    out.push({ h2: 'Trang Tổng quan' }, S.dashboard(k, 'kt-giao-dien-chinh')[1], { p: 'Ý nghĩa các chỉ tiêu, biểu đồ và cách nhấn vào cảnh báo để xử lý giống như hướng dẫn tại trang Tổng quan dành cho Lãnh đạo Ban.' });
    out.push(...S.projectView(true), ...S.projectEdit(), ...S.clearance(true), ...S.model(), ...S.packages(), ...S.schedule(), ...S.diary('kt-nhat-ky', 'kt-ghi-nhat-ky'), ...S.volume(), ...S.acceptance(true), ...S.approval('kt'), ...S.reports());
    out.push(...tail(k, true));
  }
  if (k === 'ke') {
    out.push({ h2: 'Trang Tổng quan' }, S.dashboard(k, 'ke-giao-dien-chinh')[1], { p: 'Các chỉ tiêu «Giá trị hợp đồng» và «Đã giải ngân» trên trang Tổng quan được tính trực tiếp từ hồ sơ thanh toán do Kế toán xác nhận đã chi.' });
    out.push(...S.capital(true), ...S.payments(), ...S.approval('ke'), ...S.settlement(true), { h1: 'TRA CỨU HỢP ĐỒNG' }, ...S.contractView().slice(1), ...S.reports());
    out.push(...tail(k, false));
  }
  if (k === 'gs') {
    out.push({ h2: 'Trang Tổng quan' }, { p: 'Tài khoản Tư vấn giám sát / Nhà thầu chỉ thấy số liệu của các dự án được giao. Trang **Tổng quan** hiển thị các chỉ tiêu, biểu đồ và cảnh báo trong phạm vi đó.' }, img('gs-tong-quan', 'Trang Tổng quan trong phạm vi dự án được giao', 14));
    out.push(...S.diary('gs-nhat-ky', 'gs-ghi-nhat-ky'));
    out.push({ h1: 'CẬP NHẬT TIẾN ĐỘ' }, { steps: [
      'Chọn **Quản lý tiến độ**, kéo xuống **Biểu đồ tiến độ (Gantt)**.',
      'Nhấn **Cập nhật** (1) trên dòng hạng mục, nhập tiến độ thực tế lũy kế (%), ngày cập nhật và ghi chú hoặc nguyên nhân chậm; đính kèm ảnh hiện trường, báo cáo tuần làm căn cứ (không bắt buộc); nhấn **Lưu**.',
    ] }, img('gs-tien-do', 'Cập nhật tiến độ trên biểu đồ Gantt', 16), legend([[1, 'Cập nhật tiến độ thực tế']]), img('kt-cap-nhat-tien-do', 'Hộp cập nhật tiến độ', 11),
    { note: 'Tư vấn giám sát / Nhà thầu chỉ xem thông tin dự án, mô hình và khối lượng; không sửa được hợp đồng, khối lượng hợp đồng và thanh toán.' });
    out.push(...tail(k, true));
  }
  if (k === 'ub') {
    out.push({ h1: 'THEO DÕI, ĐIỀU HÀNH' }, ...S.dashboard(k, 'ld-tong-quan'));
    out.push({ p: 'Tài khoản Lãnh đạo xã/phường chỉ xem, không sửa dữ liệu; mọi số liệu do Ban Quản lý dự án và các bộ phận cập nhật hằng ngày, nên Lãnh đạo nắm được tình hình mà không cần chờ báo cáo giấy. Cùng một tài khoản dùng được trên máy tính và trên điện thoại (xem chương **Xem trên điện thoại**).' });
    out.push(...S.capital(false), ...S.clearance(false), ...S.projectView(false), ...S.scheduleView(), ...S.paymentView(), ...S.acceptance(false), ...S.settlement(false), ...S.reports(), ...S.leaderMobile());
    out.push(...tail(k, false));
  }
  if (k === 'qt') {
    out.push(...S.admin());
    out.push({ h1: 'CÁC PHÂN HỆ NGHIỆP VỤ' }, { p: 'Tài khoản Quản trị hệ thống có toàn quyền trên mọi phân hệ nghiệp vụ. Cách sử dụng từng phân hệ được trình bày chi tiết trong tài liệu hướng dẫn của vai trò tương ứng:' },
      { table: { head: ['Phân hệ', 'Tài liệu hướng dẫn tham khảo'], widths: [4500, 4500], rows: [
        ['Tổng quan, Quản lý dự án, Báo cáo', 'HDSD dành cho Lãnh đạo Ban'],
        ['Giải phóng mặt bằng, Mô hình hóa công trình, Gói thầu và hợp đồng, Tiến độ, Nhật ký thi công, Khối lượng, Nghiệm thu – bàn giao – bảo hành', 'HDSD dành cho Cán bộ kỹ thuật'],
        ['Kế hoạch vốn – giải ngân, Quản lý thanh toán, Quyết toán dự án', 'HDSD dành cho Kế toán'],
        ['Sử dụng trên điện thoại', 'HDSD sử dụng trên điện thoại'],
      ] }, cap: 'Tài liệu tham khảo cho các phân hệ nghiệp vụ' });
    out.push(...tail(k, false));
  }
  return out;
}
module.exports = { ROLES, build };
