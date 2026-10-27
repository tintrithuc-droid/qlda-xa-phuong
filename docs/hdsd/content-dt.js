// HDSD sử dụng phần mềm trên điện thoại (Android: ứng dụng QLDA TTTS; iPhone: Safari / màn hình chính)
const img = (name, cap, w) => ({ img: name, cap, w });
const legend = rows => ({ legend: rows });
const E = 'Xem và cập nhật', V = 'Chỉ xem', N = 'Không dùng';

function build() {
  const out = [];
  out.push({ h1: 'GIỚI THIỆU CHUNG' });
  out.push({ h2: 'Mục đích tài liệu' });
  out.push({ p: 'Tài liệu này hướng dẫn cán bộ sử dụng Phần mềm quản lý dự án đầu tư xây dựng của Ban Quản lý dự án – Trung tâm Thủy sản Thành phố Hồ Chí Minh trên điện thoại di động: cài đặt và kết nối, đăng nhập, ghi nhật ký thi công kèm ảnh chụp hiện trường, cập nhật tiến độ, tra cứu dự án, khối lượng và xem báo cáo.' });
  out.push({ p: 'Phần mềm trên điện thoại dùng chung dữ liệu với bản trên máy tính: thông tin nhập tại hiện trường được lưu ngay về máy chủ của Ban và hiển thị cho các bộ phận khác trong khoảng 30 giây. Hình minh họa chụp trực tiếp từ giao diện phần mềm trên điện thoại; số liệu trên hình là dữ liệu mẫu, được đánh dấu «(mẫu)».' });
  out.push({ h2: 'Chức năng dùng trên điện thoại theo vai trò' });
  out.push({ p: 'Mỗi tài khoản chỉ thấy các chức năng được phân quyền. Bảng dưới đây là quyền mặc định của các nhóm thường dùng điện thoại; quản trị hệ thống có thể điều chỉnh theo yêu cầu thực tế của Ban.' });
  out.push({ table: { head: ['Chức năng', 'TVGS / Nhà thầu', 'Cán bộ kỹ thuật', 'Lãnh đạo Ban'], widths: [3300, 1900, 1900, 1900], rows: [
    ['Ghi nhật ký thi công, chụp ảnh hiện trường', E, E, V],
    ['Cập nhật tiến độ thực hiện', E, E, V],
    ['Tra cứu dự án', V, E, E],
    ['Khối lượng thực hiện, nghiệm thu', V, E, V],
    ['Tổng quan, cảnh báo', V, V, V],
    ['Báo cáo, xuất Excel', N, V, V],
  ] }, cap: 'Chức năng dùng trên điện thoại theo nhóm người dùng' });
  out.push({ p: 'Tài khoản Tư vấn giám sát / Nhà thầu chỉ thấy số liệu của các dự án được quản trị hệ thống giao.' });
  out.push({ h2: 'Yêu cầu về thiết bị và kết nối' });
  out.push({ bullets: [
    'Điện thoại Android 7.0 trở lên: cài ứng dụng **QLDA TTTS** (tệp .apk do quản trị hệ thống cung cấp).',
    'iPhone: dùng trình duyệt Safari và thêm phần mềm ra màn hình chính (không cần cài ứng dụng).',
    'Kết nối Wi‑Fi nội bộ của Ban hoặc Internet/VPN theo hướng dẫn của quản trị hệ thống. Địa chỉ máy chủ do quản trị hệ thống cung cấp.',
    'Cho phép ứng dụng dùng máy ảnh để chụp ảnh hiện trường.',
  ] });
  out.push({ h2: 'Quy ước trình bày' });
  out.push({ bullets: [
    'Khung đỏ có số thứ tự trên hình chỉ vị trí cần chạm; bảng chú giải ngay dưới hình giải thích từng số.',
    'Tên nút, thẻ, mục chọn trên giao diện được in đậm, ví dụ: chạm **Lưu**.',
    'Ô có dấu * màu đỏ là thông tin bắt buộc, không được bỏ trống.',
  ] });

  out.push({ h1: 'CÀI ĐẶT VÀ KẾT NỐI' });
  out.push({ h2: 'Cài ứng dụng trên điện thoại Android' });
  out.push({ steps: [
    'Nhận tệp **QLDA_TTTS_v1.0.1.apk** do quản trị hệ thống gửi (qua Zalo, thư điện tử hoặc chép trực tiếp), mở tệp trên điện thoại.',
    'Nếu máy hỏi, cho phép ứng dụng đang mở tệp (Zalo, Tệp, Chrome…) được **cài ứng dụng không rõ nguồn gốc**, rồi chạm **Cài đặt**.',
    'Cài xong, trên màn hình chính có biểu tượng mặt trống đồng nền xanh tên **QLDA TTTS**. Chạm để mở.',
    'Lần đầu mở, nhập **Địa chỉ máy chủ** do quản trị hệ thống cung cấp (ví dụ http://192.168.1.10:5080 trong mạng nội bộ) và chạm **Kết nối**. Ứng dụng kiểm tra kết nối, lưu địa chỉ và chuyển sang màn hình đăng nhập.',
  ] });
  out.push({ note: 'Chỉ cài tệp .apk do quản trị hệ thống của Ban cung cấp. Bản cập nhật được ký cùng một khóa nên cài đè trực tiếp, dữ liệu và địa chỉ máy chủ đã lưu được giữ nguyên. Hướng dẫn chi tiết từng bước có trong tài liệu «Hướng dẫn cài ứng dụng trên điện thoại».' });
  out.push({ p: 'Ứng dụng không lưu dữ liệu nghiệp vụ trên điện thoại; mọi thông tin nằm trên máy chủ của Ban. Một số thao tác riêng của ứng dụng Android:' });
  out.push({ bullets: [
    'Ở màn hình đầu, chạm nút **Quay lại** của điện thoại để mở hộp chọn: **Tải lại trang**, **Đổi máy chủ** (khi Ban đổi địa chỉ truy cập) hoặc **Thoát ứng dụng**.',
    'Khi chọn ảnh đính kèm, ứng dụng hỏi **Chọn tệp hoặc chụp ảnh**: chọn máy ảnh để chụp trực tiếp tại hiện trường.',
    'Tệp tải về (tệp đính kèm, báo cáo Excel) được lưu vào thư mục **Tải xuống/QLDA TTTS** của điện thoại.',
  ] });
  out.push({ h2: 'Thêm phần mềm ra màn hình chính trên iPhone' });
  out.push({ steps: [
    'Mở **Safari**, nhập địa chỉ phần mềm do quản trị hệ thống cung cấp.',
    'Chạm nút **Chia sẻ** (hình vuông có mũi tên lên) ở thanh dưới cùng của Safari.',
    'Chọn **Thêm vào MH chính**, giữ tên «QLDA TTTS» và chạm **Thêm**.',
    'Từ đây mở phần mềm bằng biểu tượng trên màn hình chính; phần mềm chạy toàn màn hình như một ứng dụng.',
  ] });

  out.push({ h1: 'ĐĂNG NHẬP VÀ GIAO DIỆN' });
  out.push({ h2: 'Đăng nhập' });
  out.push({ steps: [
    'Mở ứng dụng (hoặc biểu tượng trên màn hình chính iPhone).',
    'Nhập **Tên đăng nhập** (1) và **Mật khẩu** (2) được cấp, chạm **Đăng nhập** (3).',
  ] });
  out.push(img('dt-dang-nhap-so', 'Màn hình đăng nhập trên điện thoại', 6.4));
  out.push(legend([[1, 'Ô nhập tên đăng nhập'], [2, 'Ô nhập mật khẩu'], [3, 'Nút Đăng nhập']]));
  out.push({ note: 'Nhập sai mật khẩu 5 lần liên tiếp, tài khoản bị tạm khóa 15 phút.' });
  out.push({ h2: 'Bố cục màn hình' });
  out.push({ p: 'Sau khi đăng nhập, phần mềm mở trang **Hiện trường** gồm các ô thao tác nhanh. Các thành phần chính trên màn hình:' });
  out.push({ imgs2: ['dt-bo-cuc', 'dt-menu-day-du'], caps: ['Các thành phần trên màn hình', 'Menu chức năng đầy đủ'], mobile: true });
  out.push(legend([
    [1, 'Nút mở menu chức năng đầy đủ (hình bên phải).'],
    [2, 'Ô chọn dự án làm việc: chọn một dự án để mọi trang chỉ hiển thị số liệu của dự án đó.'],
    [3, 'Tài khoản đang đăng nhập: đổi mật khẩu, đăng xuất.'],
    [4, 'Các ô thao tác nhanh: tra cứu dự án, cập nhật tiến độ, ghi nhật ký, khối lượng, tổng quan, đổi mật khẩu, đăng xuất (chỉ hiện các ô được phân quyền).'],
    [5, 'Thanh điều hướng dưới cùng: Tổng quan, Dự án, Hiện trường, Nhật ký, Menu.'],
    [6, 'Danh sách phân hệ được phép sử dụng; chạm vào vùng tối bên phải để đóng menu.'],
  ]));
  out.push({ p: 'Trên điện thoại, các bảng dữ liệu tự chuyển thành dạng thẻ: mỗi dòng là một thẻ, nhãn cột hiển thị bên trái giá trị, không cần kéo ngang màn hình.' });
  out.push({ h2: 'Đổi mật khẩu và đăng xuất' });
  out.push({ steps: [
    'Chạm biểu tượng tài khoản ở góc trên bên phải (hoặc ô **Đổi mật khẩu** trên trang Hiện trường).',
    'Chọn **Đổi mật khẩu** (1), nhập mật khẩu hiện tại, mật khẩu mới (tối thiểu 8 ký tự, có cả chữ và số), nhập lại và chạm **Lưu**.',
    'Chọn **Đăng xuất** (2) khi cho người khác mượn máy hoặc không dùng nữa.',
  ] });
  out.push({ imgs2: ['dt-tai-khoan', 'dt-doi-mk'], caps: ['Hộp Tài khoản', 'Hộp Đổi mật khẩu'], mobile: true });
  out.push(legend([[1, 'Đổi mật khẩu'], [2, 'Đăng xuất']]));

  out.push({ h1: 'GHI NHẬT KÝ THI CÔNG TẠI HIỆN TRƯỜNG' });
  out.push({ h2: 'Ghi nhật ký kèm ảnh hiện trường' });
  out.push({ steps: [
    'Trên trang **Hiện trường**, chạm ô **Ghi nhật ký thi công**.',
    'Chọn **Gói thầu** (1), kiểm tra **Ngày** (2, mặc định là hôm nay), chọn ca làm việc, **Thời tiết** (3), nhập **Số nhân công** (4) và máy móc, thiết bị.',
    'Nhập **Công việc thực hiện** (5), mỗi dòng một công việc theo mẫu «Nội dung | Khối lượng | Đơn vị», ví dụ: «Đổ bê tông lót móng | 2,4 | m3». Ghi **Vướng mắc, sự cố, kiến nghị** (6) nếu có.',
    'Tại ô **Hình ảnh hiện trường** (7), chọn máy ảnh để chụp hoặc chọn ảnh có sẵn; có thể chọn nhiều ảnh.',
    'Chạm **Lưu** (8). Nhật ký và ảnh được gửi ngay về máy chủ.',
  ] });
  out.push({ imgs2: ['dt-nk-1', 'dt-nk-2', 'dt-nk-3'], caps: ['Thông tin chung', 'Công việc thực hiện', 'Ảnh hiện trường và Lưu'], mobile: true });
  out.push(legend([[1, 'Gói thầu'], [2, 'Ngày ghi nhật ký'], [3, 'Thời tiết'], [4, 'Số nhân công'], [5, 'Công việc thực hiện, mỗi dòng một công việc'], [6, 'Vướng mắc, sự cố, kiến nghị'], [7, 'Hình ảnh hiện trường'], [8, 'Lưu nhật ký']]));
  out.push({ note: 'Ảnh chụp được tự thu nhỏ còn tối đa 1920 điểm ảnh trước khi gửi để tiết kiệm dung lượng 3G/4G mà vẫn đủ rõ. Trên hình minh họa, nút chọn ảnh hiển thị theo trình duyệt máy tính; trên điện thoại, nút này mở hộp chọn máy ảnh hoặc thư viện ảnh.' });
  out.push({ h2: 'Xem lại nhật ký' });
  out.push({ p: 'Chạm **Nhật ký** ở thanh điều hướng dưới cùng để xem các trang nhật ký đã ghi, mới nhất ở trên. Chạm **+ Ghi nhật ký** (1) để ghi trang mới; lọc theo gói thầu (2), khoảng ngày hoặc nội dung. Mỗi thẻ nhật ký có nút **Thêm ảnh** để bổ sung ảnh, **Sửa** và **Xóa** (theo quyền).' });
  out.push(img('dt-nhat-ky-ds', 'Danh sách nhật ký thi công', 6.4));
  out.push(legend([[1, 'Ghi trang nhật ký mới'], [2, 'Lọc theo gói thầu']]));

  out.push({ h1: 'CẬP NHẬT TIẾN ĐỘ' });
  out.push({ h2: 'Cập nhật nhanh tại hiện trường' });
  out.push({ steps: [
    'Trên trang **Hiện trường**, chạm ô **Cập nhật tiến độ**.',
    'Chọn **Hạng mục tiến độ** (1); danh sách hiện mã gói thầu, tên hạng mục và phần trăm hiện tại, chỉ gồm hạng mục chưa hoàn thành.',
    'Nhập **Tiến độ thực tế lũy kế (%)** (2), ghi chú hoặc nguyên nhân chậm nếu có, chạm **Lưu** (3).',
  ] });
  out.push({ h2: 'Cập nhật trên biểu đồ tiến độ' });
  out.push({ p: 'Chạm **Menu** → **Quản lý tiến độ**, kéo xuống **Biểu đồ tiến độ (Gantt)**. Thanh màu xanh là hạng mục đúng tiến độ, vàng là chậm, đỏ là quá hạn. Chạm **Cập nhật** (4) trên dòng hạng mục để nhập phần trăm thực hiện như cách cập nhật nhanh.' });
  out.push({ imgs2: ['dt-td-nhanh', 'dt-tien-do'], caps: ['Hộp cập nhật tiến độ nhanh', 'Cập nhật trên biểu đồ Gantt'], mobile: true });
  out.push(legend([[1, 'Chọn hạng mục tiến độ'], [2, 'Tiến độ thực tế lũy kế (%)'], [3, 'Lưu'], [4, 'Cập nhật tiến độ trên dòng hạng mục']]));

  out.push({ h1: 'TRA CỨU THÔNG TIN' });
  out.push({ h2: 'Tra cứu dự án' });
  out.push({ p: 'Chạm **Dự án** ở thanh điều hướng. Lọc theo trạng thái (1) hoặc nhập từ khóa; chạm vào thẻ dự án (2) để xem chi tiết gồm các thẻ **Thông tin chung**, **Công việc**, **Hồ sơ pháp lý** và **Tình trạng thực hiện**. Tệp hồ sơ pháp lý chạm vào để mở hoặc tải về.' });
  out.push({ imgs2: ['dt-du-an-ds', 'dt-du-an-ct'], caps: ['Danh sách dự án', 'Chi tiết dự án'], mobile: true });
  out.push(legend([[1, 'Lọc theo trạng thái dự án'], [2, 'Thẻ dự án, chạm để xem chi tiết']]));
  out.push({ h2: 'Tổng quan, cảnh báo và khối lượng' });
  out.push({ p: 'Trang **Tổng quan** hiển thị các chỉ tiêu chính, biểu đồ và danh sách **Cảnh báo và việc cần xử lý** (hạng mục quá hạn, chậm tiến độ, công việc sắp đến hạn); chạm **Xem** để mở ngay nội dung cần xử lý. Trang **Quản lý khối lượng** (mở từ Menu) cho xem giá trị hợp đồng, khối lượng thực hiện lũy kế, đã nghiệm thu và đã thanh toán của từng hợp đồng.' });
  out.push({ imgs2: ['dt-tong-quan', 'dt-canh-bao', 'dt-khoi-luong'], caps: ['Trang Tổng quan', 'Cảnh báo cần xử lý', 'Quản lý khối lượng'], mobile: true });
  out.push({ h2: 'Lãnh đạo Ban xem trên điện thoại' });
  out.push({ p: 'Tài khoản Lãnh đạo Ban xem được toàn bộ dự án. Trang **Báo cáo, thống kê** (mở từ Menu) cho chọn loại báo cáo, dự án, gói thầu, khoảng thời gian và chạm **Xuất Excel** để tải báo cáo về điện thoại: trên Android, tệp lưu tại Tải xuống/QLDA TTTS; trên iPhone, chọn **Lưu vào Tệp** hoặc gửi qua ứng dụng khác.' });
  out.push({ imgs2: ['dt-ld-tong-quan', 'dt-ld-bao-cao'], caps: ['Tổng quan của Lãnh đạo Ban', 'Báo cáo, thống kê'], mobile: true });

  out.push({ h1: 'CÂU HỎI THƯỜNG GẶP VÀ HỖ TRỢ' });
  out.push({ table: { head: ['Tình huống', 'Cách xử lý'], widths: [3400, 5600], rows: [
    ['Ứng dụng báo «Không kết nối được»', 'Kiểm tra Wi‑Fi nội bộ hoặc VPN và địa chỉ máy chủ; chạm Thử lại. Ban đổi địa chỉ truy cập: dùng Đổi máy chủ.'],
    ['Báo «Chứng chỉ HTTPS của máy chủ không hợp lệ»', 'Không tiếp tục; báo quản trị hệ thống kiểm tra chứng chỉ của máy chủ.'],
    ['Không chụp được ảnh', 'Vào Cài đặt điện thoại → Ứng dụng → QLDA TTTS → Quyền, cho phép Máy ảnh (iPhone: Cài đặt → Safari → Máy ảnh).'],
    ['Lưu nhật ký báo lỗi', 'Thường do mất sóng. Kiểm tra kết nối rồi chạm Lưu lại; nhật ký chỉ được ghi nhận khi phần mềm báo lưu thành công.'],
    ['Không tìm thấy tệp đã tải', 'Android: thư mục Tải xuống/QLDA TTTS. iPhone: ứng dụng Tệp, mục Tải về.'],
    ['Không cài được bản mới', 'Chỉ cài tệp do quản trị hệ thống cung cấp. Nếu máy báo xung đột gói, gỡ ứng dụng cũ rồi cài lại và nhập lại địa chỉ máy chủ.'],
    ['Không thấy một chức năng', 'Tài khoản chưa được phân quyền chức năng đó; đề nghị quản trị hệ thống xem lại.'],
    ['Tài khoản bị tạm khóa', 'Do nhập sai mật khẩu 5 lần; chờ 15 phút hoặc đề nghị quản trị hệ thống đặt lại mật khẩu.'],
  ] }, cap: 'Một số tình huống thường gặp trên điện thoại' });
  out.push({ p: 'Đầu mối hỗ trợ kỹ thuật: quản trị hệ thống của Ban Quản lý dự án; đơn vị phát triển phần mềm: Công ty Cổ phần Tin học Tri Thức. Khi báo lỗi, đề nghị ghi rõ tên đăng nhập, loại điện thoại, thời điểm, thao tác đang thực hiện và chụp màn hình thông báo lỗi (nếu có).' });
  return out;
}
module.exports = { build };
