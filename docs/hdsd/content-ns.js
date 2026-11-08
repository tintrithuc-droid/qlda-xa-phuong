// HDSD dành cho nhà sản xuất: vận hành máy chủ cho thuê nhiều xã/phường (trang quản lý thuê bao, máy chủ, sao lưu, cập nhật phiên bản)
const img = (name, cap, w) => ({ img: name, cap, w });
const legend = rows => ({ legend: rows });
const D = 'qlda.trithucsoft.vn';

function build() {
  const out = [];
  // ===== 1
  out.push({ h1: 'GIỚI THIỆU CHUNG' });
  out.push({ h2: 'Mục đích tài liệu' });
  out.push({ p: 'Tài liệu này hướng dẫn cán bộ kỹ thuật của Công ty Cổ phần Tin học Tri Thức vận hành dịch vụ cho thuê Phần mềm quản lý dự án đầu tư xây dựng cho nhiều xã, phường trên một máy chủ: cài đặt máy chủ, cấp dịch vụ cho từng xã, quản lý thời hạn, tạm khóa, hỗ trợ xã khi mất xác thực 2 lớp, quản lý quản trị viên nền tảng, sao lưu, khôi phục, cập nhật phiên bản và xử lý sự cố.' });
  out.push({ p: 'Cách sử dụng các phân hệ nghiệp vụ bên trong phần mềm của xã (dự án, hợp đồng, tiến độ, khối lượng, thanh toán…) được trình bày trong bộ hướng dẫn sử dụng theo vai trò dành cho xã, phường.' });
  out.push({ h2: 'Mô hình dịch vụ' });
  out.push({ p: `Một máy chủ phục vụ nhiều xã. Mỗi xã truy cập bằng địa chỉ riêng dạng **https://<mã-xã>.${D}** (ví dụ https://tan-hoa.${D}), có cơ sở dữ liệu riêng, tài khoản cơ sở dữ liệu riêng và kho tệp riêng; dữ liệu của xã này không đọc được từ xã khác. Tri Thức quản lý danh sách xã trên **trang quản lý thuê bao** tại https://quantri.${D}.` });
  out.push({ table: { head: ['Thành phần', 'Vai trò'], widths: [2600, 6400], rows: [
    ['Cổng vào HTTPS (Caddy)', 'Nhận mọi truy cập ở cổng 80, 443; tự xin và gia hạn chứng chỉ cho từng địa chỉ của xã; chuyển yêu cầu vào phần mềm.'],
    ['Phần mềm', 'Một bộ phần mềm dùng chung, nhận biết xã theo địa chỉ truy cập và làm việc với đúng cơ sở dữ liệu của xã đó.'],
    ['PostgreSQL', 'Một máy chủ cơ sở dữ liệu: CSDL nền tảng (danh sách xã, quản trị viên, nhật ký) và một CSDL riêng cho mỗi xã.'],
    ['Thư mục dữ liệu', '/opt/qlda-thue-bao: cấu hình, kho tệp từng xã, khóa bảo vệ dữ liệu. Bản sao lưu: /srv/qlda-saoluu.'],
  ] }, cap: 'Các thành phần của máy chủ cho thuê' });
  out.push({ h2: 'Phân định trách nhiệm giữa Tri Thức và xã' });
  out.push({ table: { head: ['Công việc', 'Tri Thức', 'Xã, phường'], widths: [4200, 2400, 2400], rows: [
    ['Cài đặt, vận hành máy chủ, tên miền, chứng chỉ', 'Thực hiện', 'Không'],
    ['Cập nhật phiên bản phần mềm', 'Thực hiện', 'Không (dùng ngay bản mới)'],
    ['Sao lưu toàn bộ CSDL, kho tệp; bản sao ngoài máy chủ', 'Thực hiện hằng đêm', 'Tự tải bản sao của xã khi cần'],
    ['Cấp mã khởi tạo, gia hạn, tạm khóa dịch vụ', 'Thực hiện', 'Không'],
    ['Tài khoản người dùng, phân quyền, danh mục, dữ liệu nghiệp vụ', 'Không xem, không sửa', 'Quản trị xã thực hiện'],
    ['Đặt lại xác thực 2 lớp, mật khẩu cho quản trị duy nhất của xã', 'Thực hiện khi có văn bản đề nghị', 'Gửi văn bản đề nghị'],
  ] }, cap: 'Phân định trách nhiệm' });
  out.push({ note: 'Quản trị nền tảng không xem được dữ liệu nghiệp vụ của xã. Trang quản lý thuê bao chỉ hiện số liệu đếm (số tài khoản, dự án, tệp, dung lượng) phục vụ vận hành.' });
  out.push({ h2: 'Quy ước trình bày' });
  out.push({ bullets: [
    'Khung đỏ có số thứ tự trên hình chỉ vị trí cần thao tác; bảng chú giải dưới hình giải thích từng số.',
    'Tên nút, thẻ trên giao diện in đậm, ví dụ: nhấn **Thêm xã/phường**.',
    'Lệnh trên máy chủ đặt trong khung nền xám, chạy bằng tài khoản root (hoặc thêm sudo phía trước). Phần trong dấu < > là giá trị cần thay, ví dụ <mã-xã>.',
  ] });

  // ===== 2
  out.push({ h1: 'CÀI ĐẶT MÁY CHỦ' });
  out.push({ h2: 'Yêu cầu máy chủ' });
  out.push({ table: { head: ['Hạng mục', 'Thử nghiệm, 1–10 xã', '10–50 xã', '50–150 xã'], widths: [1800, 2400, 2400, 2400], rows: [
    ['Máy chủ', '4 vCPU, 8 GB RAM, SSD 200–300 GB', '8 vCPU, 16 GB RAM, SSD 1 TB', 'Phần mềm 8 vCPU/16 GB; CSDL 8 vCPU/32 GB; lưu trữ 2–4 TB'],
    ['Hệ điều hành', 'Ubuntu 22.04/24.04 LTS hoặc CentOS Stream, Rocky, AlmaLinux 8–10', 'Như bên trái', 'Như bên trái'],
    ['Sao lưu ngoài máy', 'Máy chủ khác có SFTP hoặc kho lưu trữ S3 trong nước', 'Như bên trái', 'Như bên trái'],
  ] }, cap: 'Cấu hình máy chủ theo số xã' });
  out.push({ p: 'Số liệu là ước tính ban đầu; theo dõi dung lượng thực tế của từng xã trên trang quản lý thuê bao để điều chỉnh. Máy chủ hiện hành của Tri Thức: CentOS Stream 10, 10 CPU, 30 GB RAM.' });
  out.push({ h2: 'Tên miền và đường mạng' });
  out.push({ p: `Tên miền gốc của dịch vụ là **${D}**. Tại nơi quản lý DNS của trithucsoft.vn, tạo hai bản ghi trỏ về địa chỉ IP công khai của máy chủ:` });
  out.push({ table: { head: ['Bản ghi', 'Loại', 'Giá trị'], widths: [3600, 1400, 4000], rows: [
    [`qlda.trithucsoft.vn`, 'A', 'IP công khai của máy chủ'],
    [`*.qlda.trithucsoft.vn`, 'A', 'IP công khai của máy chủ'],
  ] }, cap: 'Bản ghi DNS cần tạo' });
  out.push({ bullets: [
    'Các bản ghi đã có của công ty (trithucsoft.vn, www, mail…) giữ nguyên. Bản ghi cụ thể luôn được ưu tiên hơn bản ghi *, nên trang web và thư điện tử của công ty không bị ảnh hưởng.',
    'Mở cổng **80** và **443** trên tường lửa. Máy chủ đặt trong mạng nội bộ thì cấu hình chuyển tiếp cổng 80, 443 trên router từ IP công khai về IP nội bộ của máy chủ. Không thay đổi các luật chuyển tiếp đang phục vụ hệ thống khác.',
    'Chứng chỉ HTTPS được cấp và gia hạn tự động cho từng địa chỉ của xã, không phải làm tay. Cổng vào chỉ xin chứng chỉ cho địa chỉ đã đăng ký trên trang quản lý thuê bao.',
  ] });
  out.push({ h2: 'Cài đặt' });
  out.push({ p: 'Chép gói cài QLDA_XaPhuong_GoiThueBao_<phiên bản>.tar.gz lên máy chủ, giải nén và chạy lệnh cài với ba tham số: tên miền gốc, thư điện tử nhận thông báo chứng chỉ và tên đăng nhập quản trị nền tảng đầu tiên.' });
  out.push({ code: `tar -xzf QLDA_XaPhuong_GoiThueBao_1.7.tar.gz\ncd QLDA_XaPhuong_GoiThueBao_1.7\nsudo bash cai-dat.sh ${D} kythuat@trithucsoft.vn tri` });
  out.push({ p: 'Bộ cài tự thực hiện (khoảng 10 phút):' });
  out.push({ bullets: [
    'Cài Docker (họ Red Hat dùng kho docker-ce chính thức), rsync, cron, restic nếu máy chưa có; mở cổng 80, 443 trên firewalld; giữ SELinux bật.',
    'Nạp ảnh phần mềm, tạo thư mục /opt/qlda-thue-bao với tệp cấu hình .env (mật khẩu CSDL sinh ngẫu nhiên).',
    'Khởi động PostgreSQL, phần mềm và cổng vào HTTPS; đặt lịch sao lưu lúc 1 giờ 30 hằng đêm và kiểm tra tình trạng 5 phút một lần.',
    'In ra **mật khẩu tạm** của quản trị nền tảng. Chép mật khẩu này ngay; đăng nhập lần đầu xong phải đổi.',
  ] });
  out.push({ note: 'Bộ cài in cảnh báo nếu máy thiếu rsync (sao lưu vẫn chạy nhưng chép đầy đủ kho tệp mỗi đêm, tốn dung lượng) hoặc thiếu dịch vụ cron (sao lưu đêm và kiểm tra 5 phút sẽ không tự chạy). Gặp cảnh báo này, cài bổ sung rồi chạy lại lệnh cài.' });
  out.push({ h2: 'Trang web khác dùng chung cổng 80, 443' });
  out.push({ p: 'Khi trên cùng địa chỉ IP còn trang web khác cần đi qua cổng 80, 443 của máy chủ này, tạo một tệp trong /opt/qlda-thue-bao/them/ cho mỗi trang, đuôi .caddy, rồi khởi động lại cổng vào. Tên miền ghi rõ trong tệp được cấp chứng chỉ bình thường và được ưu tiên hơn các địa chỉ của xã.' });
  out.push({ code: 'cat > /opt/qlda-thue-bao/them/vi-du.caddy <<\'HET\'\nvidu.trithucsoft.vn {\n\treverse_proxy http://192.168.0.21:80\n}\nHET\ncd /opt/qlda-thue-bao && docker compose -p qlda-thue-bao restart caddy' });

  // ===== 3
  out.push({ h1: 'TRANG QUẢN LÝ THUÊ BAO' });
  out.push({ h2: 'Đăng nhập lần đầu' });
  out.push({ steps: [
    `Mở https://quantri.${D}, nhập tên đăng nhập (1) và mật khẩu tạm (2) do bộ cài in ra, nhấn **Đăng nhập** (3).`,
    'Lần đầu, màn hình hiện mã QR (1). Mở Google Authenticator hoặc Microsoft Authenticator trên điện thoại, nhấn **+** và quét mã; không quét được thì nhập dãy khóa (2) hiển thị bên dưới.',
    'Nhập mã 6 số đang hiện trên ứng dụng vào ô (3), nhấn **Xác nhận**.',
    'Vào trang xong, nhấn **Đổi mật khẩu** ở góc trên bên phải, nhập mật khẩu hiện tại và mật khẩu mới (tối thiểu 10 ký tự, có chữ và số).',
  ] });
  out.push({ imgs2: ['ns-dang-nhap', 'ns-2lop-quet-ma'], caps: ['Đăng nhập trang quản lý thuê bao', 'Quét mã xác thực 2 lớp lần đầu'] });
  out.push(legend([[1, 'Tên đăng nhập; trên hình bên phải: mã QR để quét'], [2, 'Mật khẩu; trên hình bên phải: khóa thiết lập dùng khi không quét được mã'], [3, 'Nút Đăng nhập; trên hình bên phải: ô nhập mã 6 số']]));
  out.push(img('ns-doi-mat-khau', 'Hộp đổi mật khẩu quản trị nền tảng', 11));
  out.push({ note: 'Các lần sau, đăng nhập bằng mật khẩu và mã 6 số trên điện thoại. Mỗi mã chỉ dùng được một lần: mã vừa dùng để xác nhận một thao tác không dùng lại được để đăng nhập, chờ mã kế tiếp.' });
  out.push({ h2: 'Bố cục trang' });
  out.push({ p: 'Trang gồm ba thẻ (1): **Danh sách xã/phường**, **Quản trị viên** và **Nhật ký nền tảng**. Thẻ đầu tiên có các ô thống kê (2): tổng số đơn vị thuê, đang hoạt động, sắp hết hạn trong 30 ngày, hết hạn hoặc tạm khóa, chờ xã khởi tạo tài khoản.' });
  out.push(img('ns-danh-sach-xa', 'Danh sách xã/phường thuê dịch vụ', 16));
  out.push(legend([[1, 'Các thẻ của trang'], [2, 'Ô thống kê nhanh'], [3, 'Tìm theo mã, tên xã, tên miền, người liên hệ'], [4, 'Thêm xã/phường'], [5, 'Mở chi tiết một xã']]));
  out.push({ p: 'Bảng danh sách cho biết mã, tên đơn vị, địa chỉ truy cập, trạng thái, hạn sử dụng (kèm số ngày còn lại, tô vàng khi còn dưới 30 ngày) và phiên bản dữ liệu của từng xã. Dòng «Chờ khởi tạo tài khoản quản trị» nghĩa là xã chưa dùng mã khởi tạo.' });

  // ===== 4
  out.push({ h1: 'CẤP DỊCH VỤ CHO MỘT XÃ' });
  out.push({ h2: 'Thêm xã và tạo cơ sở dữ liệu' });
  out.push({ steps: [
    'Nhấn **+ Thêm xã/phường** (4).',
    'Nhập **Tên đơn vị** (1), ví dụ «xã Tân Hòa». **Mã xã** (2) được gợi ý tự động từ tên (tan-hoa) và dùng làm địa chỉ truy cập; chỉ gồm chữ thường không dấu, số và gạch ngang. Các tên dành riêng (www, mail, quantri…) không đặt được.',
    'Nhập **Hạn sử dụng** (3) theo hợp đồng; để trống là không giới hạn. Nhập **Người liên hệ của xã** (4): họ tên, chức vụ, số điện thoại.',
    `Xã có tên miền riêng (ví dụ qlda.tanhoa.cantho.gov.vn) thì nhập vào ô (5) và đề nghị xã trỏ bản ghi A của tên miền đó về IP máy chủ. Ghi chú số hợp đồng, gói dịch vụ nếu cần.`,
    'Nhấn **Tạo xã và cơ sở dữ liệu** (6). Sau 10–30 giây, phần mềm tạo CSDL, tài khoản CSDL và kho tệp riêng cho xã.',
  ] });
  out.push(img('ns-them-xa', 'Hộp thêm xã/phường thuê dịch vụ', 13));
  out.push(legend([[1, 'Tên đơn vị'], [2, 'Mã xã, dùng làm địa chỉ truy cập'], [3, 'Hạn sử dụng'], [4, 'Người liên hệ của xã'], [5, 'Tên miền riêng của xã (nếu có)'], [6, 'Tạo xã và cơ sở dữ liệu']]));
  out.push({ h2: 'Gửi mã khởi tạo cho xã' });
  out.push({ p: 'Tạo xong, hộp thoại hiện **mã khởi tạo** (1) và nội dung soạn sẵn (2) gồm địa chỉ phần mềm, đường dẫn khởi tạo có điền sẵn mã và yêu cầu bật xác thực 2 lớp. Nhấn **Chép nội dung** (3) rồi gửi cho cán bộ quản trị của xã qua kênh tin cậy (gặp trực tiếp, công văn, nhóm tin nhắn chính thức).' });
  out.push(img('ns-ma-khoi-tao', 'Mã khởi tạo và nội dung gửi xã', 13));
  out.push(legend([[1, 'Mã khởi tạo: chỉ hiện một lần, dùng một lần, hiệu lực 30 ngày'], [2, 'Nội dung soạn sẵn để gửi xã'], [3, 'Chép nội dung']]));
  out.push({ p: 'Cán bộ xã mở đường dẫn, mã khởi tạo đã điền sẵn; họ nhập họ tên, tên đăng nhập, mật khẩu rồi bật xác thực 2 lớp. Từ đây xã tự quản lý tài khoản, phân quyền và dữ liệu của mình; tên đơn vị trên giao diện và báo cáo đã điền sẵn theo tên xã. Màn hình khởi tạo của xã để trống ô dữ liệu mẫu; chỉ khi xã cần tập huấn mới đánh dấu.' });
  out.push(img('xa-khoi-tao-ma', 'Màn hình khởi tạo hệ thống phía xã', 15));
  out.push({ note: 'Mã hết hạn hoặc thất lạc trước khi xã khởi tạo: mở **Chi tiết** của xã, nhấn **Cấp lại mã khởi tạo**. Mã cũ hết hiệu lực ngay. Khi xã đã khởi tạo xong, nút này không còn hiện.' });

  // ===== 5
  out.push({ h1: 'QUẢN LÝ CÁC XÃ ĐANG THUÊ' });
  out.push({ h2: 'Xem chi tiết một xã' });
  out.push({ p: 'Nhấn **Chi tiết** trên dòng xã. Hộp chi tiết gồm thông tin xã (1): mã, hạn sử dụng, người liên hệ, địa chỉ, tên miền riêng, phiên bản dữ liệu; tình hình sử dụng (2): số tài khoản (và số tài khoản dùng trong 30 ngày), số dự án, số tệp, dung lượng CSDL và kho tệp, lần đăng nhập và sao lưu gần nhất; và các thao tác (3)–(5).' });
  out.push(img('ns-chi-tiet-xa', 'Chi tiết một xã thuê dịch vụ', 15));
  out.push(legend([[1, 'Thông tin xã và địa chỉ truy cập'], [2, 'Tình hình sử dụng (chỉ số liệu đếm, không có dữ liệu nghiệp vụ)'], [3, 'Sửa thông tin, gia hạn'], [4, 'Tạm khóa dịch vụ'], [5, 'Đặt lại xác thực 2 lớp cho một tài khoản của xã']]));
  out.push({ h2: 'Gia hạn, sửa thông tin' });
  out.push({ p: 'Nhấn **Sửa thông tin, gia hạn** (3), sửa hạn sử dụng, người liên hệ, tên miền riêng hoặc ghi chú, nhấn **Lưu**. Hết hạn mà chưa gia hạn, người dùng của xã thấy thông báo hết hạn và không làm việc được; dữ liệu được giữ nguyên, gia hạn xong dùng lại ngay.' });
  out.push({ h2: 'Tạm khóa và mở lại' });
  out.push({ steps: [
    'Nhấn **Tạm khóa** (4), nhập **Lý do tạm khóa** (1). Người dùng của xã thấy lý do này trên màn hình, nên ghi rõ ràng, lịch sự, kèm đầu mối liên hệ.',
    'Nhấn **Tạm khóa** (2). Mọi phiên đăng nhập của xã bị thoát; người dùng thấy màn hình **Tạm ngừng phục vụ**. Dữ liệu giữ nguyên.',
    'Khi xã đã hoàn tất thủ tục, mở **Chi tiết**, nhấn **Mở lại** (1). Xã dùng lại ngay.',
  ] });
  out.push({ imgs2: ['ns-tam-khoa', 'xa-tam-khoa'], caps: ['Hộp tạm khóa xã, ghi lý do', 'Màn hình người dùng của xã thấy khi bị tạm khóa'] });
  out.push(legend([[1, 'Lý do tạm khóa (hiện cho người dùng của xã)'], [2, 'Xác nhận tạm khóa']]));
  out.push(img('ns-mo-lai', 'Xã đang tạm khóa: nút Mở lại và Cấp lại mã khởi tạo', 14));
  out.push(legend([[1, 'Mở lại dịch vụ cho xã'], [2, 'Cấp lại mã khởi tạo (khi xã chưa khởi tạo tài khoản)']]));
  out.push({ h2: 'Hỗ trợ xã mất xác thực 2 lớp hoặc quên mật khẩu' });
  out.push({ p: 'Trong phần mềm của xã, Quản trị chính đặt lại mật khẩu và xác thực 2 lớp cho các tài khoản khác. Tri Thức chỉ can thiệp khi xã không còn ai làm được việc này (xã chỉ có một quản trị, mất điện thoại và mã khôi phục), và chỉ khi có **văn bản đề nghị của xã**.' });
  out.push({ steps: [
    'Mở **Chi tiết** của xã, nhấn **Đặt lại xác thực 2 lớp cho một tài khoản** (5).',
    'Nhập **tên đăng nhập trong phần mềm của xã** của người cần đặt lại, nhấn **Đặt lại**. Mọi phiên đăng nhập của tài khoản đó bị thoát; lần đăng nhập sau người đó quét mã QR mới. Thao tác được ghi vào nhật ký hoạt động của chính xã và nhật ký nền tảng.',
  ] });
  out.push(img('ns-dat-lai-2lop', 'Đặt lại xác thực 2 lớp cho một tài khoản của xã', 13));
  out.push({ p: 'Quản trị duy nhất của xã quên mật khẩu: chạy lệnh dưới đây trên máy chủ, gửi mật khẩu tạm in ra cho xã qua kênh tin cậy và đề nghị đổi ngay.' });
  out.push({ code: 'cd /opt/qlda-thue-bao\ndocker compose -p qlda-thue-bao exec app dotnet QldaTtts.Web.dll --dat-lai-mat-khau <tên đăng nhập> --xa <mã-xã>' });

  // ===== 6
  out.push({ h1: 'QUẢN TRỊ VIÊN NỀN TẢNG' });
  out.push({ p: 'Thẻ **Quản trị viên** liệt kê các tài khoản được vào trang quản lý thuê bao: tên đăng nhập, họ tên, trạng thái, xác thực 2 lớp và lần đăng nhập gần nhất. Mỗi người một tài khoản riêng, bắt buộc bật xác thực 2 lớp. Các thao tác thêm, khóa, mở lại, đặt lại đều phải nhập mã 6 số trên điện thoại của người đang làm.' });
  out.push(img('ns-quan-tri-vien', 'Danh sách quản trị viên nền tảng', 16));
  out.push(legend([[1, 'Thêm quản trị viên'], [2, 'Sửa họ tên'], [3, 'Đặt lại mật khẩu và xác thực 2 lớp'], [4, 'Khóa hoặc mở lại tài khoản']]));
  out.push({ h2: 'Thêm quản trị viên' });
  out.push({ steps: [
    'Nhấn **+ Thêm quản trị viên** (1).',
    'Nhập **Tên đăng nhập** (1) (3–32 ký tự: chữ thường không dấu, số, dấu chấm, gạch), **Họ tên** (2) và mã 6 số trên điện thoại của bạn (3). Nhấn **Thêm và cấp mật khẩu tạm** (4).',
    'Hộp kết quả hiện **mật khẩu tạm** (1), chỉ hiện một lần. Nhấn **Chép nội dung** (2) và gửi cho người được thêm qua kênh tin cậy. Lần đầu đăng nhập, người đó quét mã QR và đổi mật khẩu.',
  ] });
  out.push({ imgs2: ['ns-them-quan-tri', 'ns-mat-khau-tam'], caps: ['Hộp thêm quản trị viên', 'Mật khẩu tạm và nội dung gửi'] });
  out.push(legend([[1, 'Tên đăng nhập; trên hình bên phải: mật khẩu tạm'], [2, 'Họ tên; trên hình bên phải: chép nội dung gửi'], [3, 'Mã 6 số của người đang thao tác'], [4, 'Thêm và cấp mật khẩu tạm']]));
  out.push({ h2: 'Khóa, mở lại, đặt lại' });
  out.push({ bullets: [
    '**Khóa** (4): dùng khi cán bộ nghỉ việc, chuyển công tác. Phiên đang mở của người bị khóa bị thoát ngay. Phần mềm không cho tự khóa mình và luôn giữ ít nhất một quản trị viên đang hoạt động.',
    '**Đặt lại mật khẩu** (3): dùng khi quản trị viên quên mật khẩu hoặc mất điện thoại. Mật khẩu cũ và khóa xác thực 2 lớp cũ hết hiệu lực; phần mềm cấp mật khẩu tạm mới, người đó đăng nhập và quét mã QR lại. Không tự đặt lại cho chính mình.',
    'Nên duy trì ít nhất hai quản trị viên đang hoạt động để luôn có người đặt lại được cho người kia.',
  ] });
  out.push({ p: 'Khi không còn quản trị viên nào đăng nhập được (người duy nhất mất điện thoại), tạo lại tài khoản bằng lệnh trên máy chủ; lệnh in mật khẩu tạm mới:' });
  out.push({ code: 'cd /opt/qlda-thue-bao\ndocker compose -p qlda-thue-bao exec app dotnet QldaTtts.Web.dll --tao-quan-tri-nen-tang <tên đăng nhập> "Họ tên"' });
  out.push({ h2: 'Nhật ký nền tảng' });
  out.push({ p: 'Thẻ **Nhật ký nền tảng** ghi mọi lần đăng nhập, tạo xã, sửa thông tin, tạm khóa, mở lại, cấp mã khởi tạo, đặt lại xác thực 2 lớp, thêm, khóa, đặt lại quản trị viên và nâng cấp CSDL của từng xã, kèm thời gian, người thực hiện, đối tượng và địa chỉ IP. Nhật ký không sửa, xóa được trên giao diện.' });
  out.push(img('ns-nhat-ky', 'Nhật ký nền tảng', 16));

  // ===== 7
  out.push({ h1: 'SAO LƯU, KHÔI PHỤC, BÀN GIAO DỮ LIỆU' });
  out.push({ p: 'Các lệnh trong chương này chạy trong thư mục /opt/qlda-thue-bao với quyền root.' });
  out.push({ table: { head: ['Việc', 'Lệnh'], widths: [3800, 5200], rows: [
    ['Xem danh sách xã và tình trạng', 'bash danh-sach-xa.sh'],
    ['Sao lưu ngay (ngoài lịch đêm)', 'bash sao-luu.sh'],
    ['Khôi phục một xã về một ngày', 'bash khoi-phuc-xa.sh <mã-xã> <yyyy-mm-dd>'],
    ['Xuất trọn dữ liệu bàn giao cho xã', 'bash xuat-du-lieu-xa.sh <mã-xã>'],
    ['Xóa hẳn một xã', 'bash xoa-xa.sh <mã-xã>'],
    ['Kiểm tra tình trạng máy chủ', 'bash kiem-tra.sh'],
    ['Xem nhật ký phần mềm', 'docker compose -p qlda-thue-bao logs --tail 200 app'],
  ] }, cap: 'Các lệnh vận hành thường dùng' });
  out.push({ h2: 'Sao lưu hằng đêm' });
  out.push({ p: 'Lúc 1 giờ 30 mỗi đêm, sao-luu.sh lưu vào /srv/qlda-saoluu/<ngày>/:' });
  out.push({ bullets: [
    'csdl/<mã-xã>.dump: cơ sở dữ liệu từng xã, khôi phục được riêng từng xã; _nentang.dump: danh sách xã, quản trị viên, nhật ký.',
    'tep/<mã-xã>/files: kho tệp của từng xã theo ngày. Tệp không đổi dùng chung giữa các ngày nên tốn rất ít dung lượng.',
    'keys/ và env.txt: khóa bảo vệ dữ liệu và cấu hình. **Thiếu hai thành phần này thì không dựng lại được máy chủ.**',
  ] });
  out.push({ p: 'Mặc định giữ 14 bản hằng ngày và 12 bản đầu tháng; đổi bằng BACKUP_KEEP_DAYS, BACKUP_KEEP_MONTHS trong tệp .env. Ngoài ra, phần mềm của mỗi xã vẫn tự sao lưu trong phạm vi xã và quản trị xã tự tải được bản sao của mình.' });
  out.push({ h2: 'Bản sao ngoài máy chủ (bắt buộc)' });
  out.push({ p: 'Khai báo kho sao lưu ngoài máy trong /opt/qlda-thue-bao/.env. Bản sao được mã hóa trước khi rời máy chủ:' });
  out.push({ code: 'RESTIC_REPOSITORY=sftp:saoluu@<máy sao lưu>:/kho/qlda\nRESTIC_PASSWORD=<mật khẩu dài, cất giữ riêng>' });
  out.push({ note: 'Mất RESTIC_PASSWORD thì không mở được bản sao ngoài máy. Cất mật khẩu này cùng nội dung tệp .env ở nơi an toàn ngoài máy chủ, theo quy định bảo mật của công ty.' });
  out.push({ h2: 'Khôi phục một xã' });
  out.push({ p: 'Khi xã đề nghị bằng văn bản khôi phục dữ liệu về một ngày (ví dụ xóa nhầm số liệu), chạy:' });
  out.push({ code: 'bash khoi-phuc-xa.sh tan-hoa 2026-11-20' });
  out.push({ p: 'Script tạm khóa xã, lưu thêm một bản dữ liệu hiện tại vào /srv/qlda-saoluu/truoc-khoi-phuc, khôi phục CSDL và kho tệp của ngày đã chọn rồi mở lại. Các xã khác vẫn dùng bình thường. Nếu một bước bị lỗi, script dừng và báo xã **vẫn đang tạm khóa**: xử lý lỗi rồi chạy lại, hoặc mở lại xã trên trang quản lý thuê bao. Nên diễn tập khôi phục mỗi quý trên một xã thử nghiệm và ghi biên bản.' });
  out.push({ h2: 'Bàn giao dữ liệu và xóa xã' });
  out.push({ bullets: [
    'Khi xã thôi thuê hoặc chuyển sang tự đặt máy chủ: chạy xuat-du-lieu-xa.sh <mã-xã>. Script tạo /srv/qlda-bangiao/<mã-xã>-<ngày>.tar.gz gồm CSDL dạng SQL và toàn bộ kho tệp để bàn giao theo biên bản.',
    'Sau khi đã bàn giao và hết thời hạn lưu giữ theo hợp đồng: tạm khóa xã trên trang quản lý thuê bao, rồi chạy xoa-xa.sh <mã-xã>. Script tự xuất dữ liệu bàn giao thêm một lần trước khi xóa CSDL, tài khoản CSDL và kho tệp. Việc xóa không hoàn tác được; script từ chối xóa xã chưa tạm khóa.',
  ] });

  // ===== 8
  out.push({ h1: 'CẬP NHẬT PHIÊN BẢN' });
  out.push({ p: 'Phiên bản mới được cập nhật một lần trên máy chủ, mọi xã dùng ngay bản mới; người dùng của xã không phải làm gì. Nên cập nhật ngoài giờ hành chính và báo trước cho các xã.' });
  out.push({ steps: [
    'Chép gói cài mới lên máy chủ và giải nén.',
    'Sao lưu trước khi cập nhật: bash /opt/qlda-thue-bao/sao-luu.sh.',
    'Trong thư mục gói mới, chạy lại đúng lệnh cài đặt, không cần tham số quản trị. Dữ liệu, cấu hình và chứng chỉ được giữ nguyên.',
    'Phần mềm khởi động lại và nâng cấp CSDL **lần lượt từng xã**. Xã đang chờ nâng cấp, người dùng thấy thông báo «Đang nâng cấp phần mềm» trong vài giây.',
    `Mở trang quản lý thuê bao, kiểm tra cột **Phiên bản** của các xã đã lên số mới; chạy bash kiem-tra.sh để kiểm tra từng xã.`,
  ] });
  out.push({ code: `sudo bash /opt/qlda-thue-bao/sao-luu.sh\ntar -xzf QLDA_XaPhuong_GoiThueBao_<phiên bản mới>.tar.gz && cd QLDA_XaPhuong_GoiThueBao_<phiên bản mới>\nsudo bash cai-dat.sh ${D} kythuat@trithucsoft.vn` });
  out.push({ note: 'Xã nào nâng cấp lỗi thì chỉ xã đó tạm dừng; trang quản lý thuê bao hiện nhãn **Lỗi nâng cấp** kèm nội dung lỗi trong hộp Chi tiết. Khắc phục xong, nhấn **Chạy lại nâng cấp**. Các xã khác không bị ảnh hưởng.' });

  // ===== 9
  out.push({ h1: 'THEO DÕI VÀ CẢNH BÁO' });
  out.push({ p: 'kiem-tra.sh chạy 5 phút một lần, kiểm tra trang quản lý thuê bao, từng xã đang hoạt động, dung lượng ổ đĩa (cảnh báo từ 85%) và bản sao lưu đêm qua. Muốn nhận cảnh báo qua Telegram, tạo bot và khai báo trong .env:' });
  out.push({ code: 'ALERT_URL=https://api.telegram.org/bot<mã bot>/sendMessage?chat_id=<mã nhóm>' });
  out.push({ bullets: [
    'Mỗi lỗi chỉ nhắc lại tối đa một lần mỗi giờ.',
    'Nhật ký kiểm tra: /var/log/qlda-kiem-tra.log; nhật ký sao lưu: /var/log/qlda-sao-luu.log.',
    'Hằng tuần xem ô **Sắp hết hạn (30 ngày)** trên trang quản lý thuê bao để nhắc xã gia hạn hợp đồng, và xem dung lượng từng xã để chủ động mở rộng ổ đĩa.',
  ] });

  // ===== 10
  out.push({ h1: 'AN TOÀN THÔNG TIN' });
  out.push({ bullets: [
    'Phần mềm không mở cổng trực tiếp ra ngoài; mọi truy cập đi qua cổng vào HTTPS.',
    'Mỗi xã một tài khoản CSDL chỉ vào được CSDL của xã đó. Phiên đăng nhập và khóa xác thực 2 lớp mã hóa bằng khóa riêng của từng xã: phiên của xã này mang sang xã khác hoặc sang trang quản lý thuê bao đều bị từ chối.',
    'Trang khởi tạo tài khoản quản trị của xã chỉ dùng được khi có mã khởi tạo do Tri Thức cấp.',
    'Tệp .env, thư mục du-lieu/keys và các bản sao lưu chỉ tài khoản root đọc được. Không gửi các tệp này, mật khẩu tạm hay mã khởi tạo qua thư điện tử công cộng.',
    'Mỗi cán bộ dùng tài khoản quản trị nền tảng riêng; khóa ngay tài khoản của người nghỉ việc. Đổi mật khẩu root máy chủ định kỳ và sau mỗi lần có người ngoài hỗ trợ.',
  ] });

  // ===== 11
  out.push({ h1: 'XỬ LÝ SỰ CỐ' });
  out.push({ table: { head: ['Hiện tượng', 'Cách xử lý'], widths: [3400, 5600], rows: [
    ['Xã báo «Không tìm thấy đơn vị»', 'Kiểm tra mã xã, tên miền riêng trên trang quản lý thuê bao; tên miền riêng phải trỏ đúng IP máy chủ.'],
    ['Trình duyệt báo lỗi chứng chỉ ở địa chỉ mới', 'Kiểm tra bản ghi DNS và chuyển tiếp cổng 80, 443; xem nhật ký: docker compose -p qlda-thue-bao logs caddy.'],
    ['Xã báo «Đang nâng cấp phần mềm» lâu', 'Trang quản lý thuê bao → Chi tiết xã → xem lỗi nâng cấp → Chạy lại nâng cấp.'],
    ['Xã báo «Tạm ngừng phục vụ» ngoài ý muốn', 'Kiểm tra trạng thái và hạn sử dụng trong Chi tiết xã; gia hạn hoặc Mở lại.'],
    ['Quản trị duy nhất của xã quên mật khẩu, mất xác thực 2 lớp', 'Khi có văn bản đề nghị: đặt lại xác thực 2 lớp trong Chi tiết xã; đặt lại mật khẩu bằng lệnh --dat-lai-mat-khau (chương 5).'],
    ['Quản trị nền tảng mất điện thoại', 'Quản trị viên khác vào thẻ Quản trị viên → Đặt lại mật khẩu. Không còn ai: lệnh --tao-quan-tri-nen-tang (chương 6).'],
    ['Cảnh báo ổ đĩa từ 85%', 'Xem dung lượng từng xã; dọn bản sao lưu cũ (giảm BACKUP_KEEP_DAYS) hoặc mở rộng ổ đĩa.'],
    ['Cảnh báo thiếu bản sao lưu đêm qua', 'Xem /var/log/qlda-sao-luu.log; chạy lại bash sao-luu.sh; kiểm tra dịch vụ cron và kết nối tới kho sao lưu ngoài máy.'],
  ] }, cap: 'Một số sự cố thường gặp' });
  out.push({ p: 'Đầu mối kỹ thuật: Công ty Cổ phần Tin học Tri Thức, www.trithucsoft.vn, điện thoại 0907 635 679, thư điện tử trithuc@trithucsoft.vn. Khi xử lý sự cố cho xã, ghi lại thời điểm, nội dung, lệnh đã chạy và kết quả vào sổ vận hành.' });
  return out;
}
module.exports = { build };
