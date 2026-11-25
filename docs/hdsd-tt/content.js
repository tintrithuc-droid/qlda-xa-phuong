// Nội dung Hướng dẫn sử dụng e-work Tri Thức (bản 1.10.16: Nhận nhiệm vụ thay điểm danh, KPI tự động) theo vai trò.
// Mỗi chương: id, title, roles (nv: Nhân viên, tp: Trưởng phòng, kt: Kế toán, gd: Ban giám đốc, qt: Quản trị), html, shot (ảnh trong shots/, có thể thiếu).
// Chương chung cho mọi người đặt roles: ALL.
const ALL = ['nv', 'tp', 'kt', 'gd', 'qt'];

exports.ROLES = {
  nv: { name: 'Nhân viên', file: 'Nhan vien', group: 'g-nv',
    intro: 'Tài liệu dành cho mọi người lao động của Công ty: nhận nhiệm vụ hằng ngày, gửi đề xuất, làm công việc được giao, xem KPI, xác nhận lương, xem lịch họp, thông báo và thông tin dự án.' },
  tp: { name: 'Trưởng phòng', file: 'Truong phong', group: 'g-tp',
    intro: 'Trưởng phòng làm mọi việc như Nhân viên, thêm phần quản lý phòng mình: giao việc, xác nhận việc phát sinh, nghiệm thu, duyệt đề xuất, xem hôm nay ai ở đâu, theo dõi bảng công của phòng.' },
  kt: { name: 'Kế toán', file: 'Ke toan', group: 'g-ketoan',
    intro: 'Kế toán làm mọi việc như Nhân viên, thêm phần hồ sơ nhân sự, bảng công, ngày nghỉ lễ, lập và chốt bảng lương, trả lời kiến nghị, duyệt chi lương, xuất bảng lương kế toán và danh sách chuyển khoản ngân hàng.' },
  gd: { name: 'Ban giám đốc', file: 'Ban giam doc', group: 'g-bgd',
    intro: 'Giám đốc làm việc trên phần mềm như mọi người (nhận nhiệm vụ, đề xuất, làm việc được giao, xác nhận lương), thêm quyền điều hành: xem toàn công ty, hôm nay ai ở đâu, giao việc, duyệt đề xuất, duyệt chi lương, đăng thông báo, quản lý dự án.' },
  qt: { name: 'Quản trị hệ thống', file: 'Quan tri he thong', group: 'g-admin',
    intro: 'Quản trị hệ thống quản lý tài khoản, gán vai trò khi nhân sự thay đổi, phòng ban và trưởng phòng, các thiết lập nhận nhiệm vụ, KPI, lương, phân hệ sử dụng, sao lưu và bảo mật.' },
};

exports.CHAPTERS = [
  // ---------------- chung
  { id: 'vai-tro', title: 'Vai trò và phạm vi được xem', roles: ALL, html: `
<p>Mỗi tài khoản thuộc một <b>vai trò</b> (nhóm quyền). Khi nhân sự thay đổi, Quản trị chỉ đổi vai trò của tài khoản; quyền của từng vai trò giữ nguyên.</p>
<table><tr><th>Vai trò</th><th>Của mình</th><th>Thêm quyền</th></tr>
<tr><td><b>Nhân viên</b></td><td rowspan="5">Mọi người đều: nhận nhiệm vụ hằng ngày, gửi đề xuất, làm việc được giao, xem KPI của mọi người (công khai) và phiếu lương của mình, xác nhận lương, xem lịch họp, thông báo, xem thông tin dự án</td><td>Không xem lương, bảng công, hồ sơ nhân sự, tiền thưởng của người khác</td></tr>
<tr><td><b>Trưởng phòng</b></td><td>Với phòng mình: giao việc, xác nhận việc phát sinh, nghiệm thu, duyệt đề xuất, xem hôm nay ai ở đâu, bảng công</td></tr>
<tr><td><b>Kế toán</b></td><td>Hồ sơ nhân sự, bảng công, ngày lễ, lập và chốt lương, trả lời kiến nghị, duyệt chi lương, xuất bảng lương và danh sách chuyển khoản</td></tr>
<tr><td><b>Ban giám đốc</b></td><td>Toàn công ty: giao việc, hôm nay ai ở đâu, mở chốt KPI khi cần sửa, duyệt đề xuất, duyệt chi lương, thông báo, lịch họp, quản lý dự án</td></tr>
<tr><td><b>Quản trị</b></td><td>Tài khoản, vai trò, thiết lập hệ thống, sao lưu</td></tr></table>
<p class="note">Quyền Trưởng phòng đi theo phòng ban: phòng nào ghi tên người phụ trách là ai thì người đó quản lý phòng đó. Đổi trưởng phòng chỉ cần sửa phòng ban.</p>` },

  { id: 'dang-nhap', title: 'Đăng nhập, đổi mật khẩu', roles: ALL, shot: 'dang-nhap', html: `
<ol><li>Mở <b>https://trithuc.qlda.trithucsoft.vn</b> trên máy tính hoặc điện thoại.</li>
<li>Nhập tên đăng nhập (như trên e-work cũ) và mật khẩu ban đầu do Quản trị gửi riêng.</li>
<li>Lần đầu, phần mềm bắt đổi mật khẩu: mật khẩu mới tối thiểu 8 ký tự, có chữ và số. Không dùng chung mật khẩu với tài khoản khác.</li></ol>
<p>Trên điện thoại: mở trang bằng Chrome (Android) hoặc Safari (iPhone), chọn <b>Thêm vào màn hình chính</b> để dùng như ứng dụng.</p>
<p class="note">Quên mật khẩu: báo Quản trị đặt lại. Phần mềm không bao giờ hỏi mật khẩu qua tin nhắn hay thư.</p>` },

  { id: 'diem-danh', title: 'Nhận nhiệm vụ hằng ngày', roles: ALL, shot: 'nhan-nhiem-vu', html: `
<p>"Nhận nhiệm vụ" thay cho điểm danh: <b>mỗi ngày làm việc bấm một lần</b>, khi bắt đầu làm việc. Không cần định vị, không cần phiếu duyệt, không bấm khi ra về.</p>
<ol><li>Vào <b>Văn phòng → Nhận nhiệm vụ</b> (trang mở đầu sau khi đăng nhập).</li>
<li>Chọn hôm nay làm việc ở đâu: <i>Ở công ty</i>, <i>Làm việc online</i>, <i>Đi công tác</i> hoặc <i>Khác</i>. Chọn <i>Khác</i> thì bắt buộc ghi nội dung công việc hôm nay (ví dụ: họp với chủ đầu tư tại UBND xã).</li>
<li>Tích chọn các <b>việc được giao</b> sẽ làm hôm nay (không bắt buộc; danh sách lấy từ mục Công việc).</li>
<li>Bấm <b>Nhận nhiệm vụ</b>. Màn hình hiện giờ nhận, nơi làm, việc đã chọn; đi muộn thì hiện số phút muộn.</li>
<li>Cuối ngày có thể ghi một dòng <b>Kết quả hôm nay</b> rồi bấm <b>Lưu kết quả</b> (không bắt buộc).</li></ol>
<table><tr><th>Trường hợp</th><th>Cách tính</th></tr>
<tr><td>Đã nhận nhiệm vụ</td><td>Tính 1 ngày công để tính lương (ngày làm nửa ngày tính theo lịch).</td></tr>
<tr><td>Nhận sau giờ vào (08:00)</td><td>Tính đi muộn, trừ điểm chuyên cần trong KPI (muộn không quá 5 phút không trừ). Chọn <i>Đi công tác</i> hoặc <i>Khác</i> thì không tính muộn.</td></tr>
<tr><td>Ngày làm việc không nhận nhiệm vụ và không có phiếu nghỉ phép được duyệt</td><td>Tính <b>nghỉ không phép</b>: trừ lương ngày đó và trừ điểm chuyên cần.</td></tr>
<tr><td>Có phiếu nghỉ phép, nghỉ việc riêng, làm việc online hoặc công tác được duyệt cả ngày</td><td>Không phải nhận nhiệm vụ, không tính nghỉ không phép.</td></tr></table>
<p>Quá 07:50 chưa nhận nhiệm vụ thì trang hiện lời nhắc. Bấm <b>Bật nhắc trên thiết bị này</b> để điện thoại, máy tính hiện thông báo khi đang mở phần mềm.</p>
<p>Ngày nghỉ (Chủ nhật, thứ Bảy nghỉ, ngày lễ): không nhận nhiệm vụ, màn hình chỉ hiện lời chúc. Có làm thêm vào ngày nghỉ thì làm xong lập <b>phiếu xác nhận tăng ca</b> (chương <i>Đề xuất</i>).</p>
<p>Quên nhận nhiệm vụ hoặc đi muộn có lý do: gửi đề xuất <i>Quên điểm danh</i> hoặc <i>Đi muộn, về sớm</i>. Đề xuất được duyệt thì công tự tính lại.</p>
<p>Từ ngày 1 đến ngày 10 mỗi tháng, trang hiện <b>Tổng kết tháng trước của bạn</b>: số ngày ở công ty, online, công tác, khác, số lần đi muộn, ngày nghỉ phép, ngày nghỉ không phép. Bấm <b>Đã xem</b> để ẩn.</p>
<p class="note">Trong thời gian chạy song song, ngày nhận nhiệm vụ được chép sang e-work cũ mỗi 5 phút, nên không cần chấm hai nơi.</p>` },

  { id: 'de-xuat', title: 'Gửi đề xuất', roles: ALL, shot: 'de-xuat', html: `
<ol><li>Vào <b>Văn phòng → Đề xuất</b>, bấm <b>+ Tạo đề xuất</b>, chọn loại.</li>
<li>Nhập thời gian, số ngày hoặc số tiền, lý do; đính kèm chứng từ nếu có (giấy khám bệnh, hóa đơn xăng…). Bấm Lưu để gửi.</li>
<li>Theo dõi trạng thái ở thẻ <b>Đề xuất của tôi</b>. Khi chưa duyệt, bạn còn sửa hoặc hủy được.</li></ol>
<table><tr><th>Loại</th><th>Ảnh hưởng đến công, lương</th></tr>
<tr><td>Nghỉ phép</td><td>Trừ vào phép năm, vẫn hưởng lương. Hết phép thì tính nghỉ không lương.</td></tr>
<tr><td>Nghỉ việc riêng có lương</td><td>Kết hôn 3 ngày, con kết hôn 1 ngày, bố mẹ (hai bên), vợ hoặc chồng, con mất 3 ngày (Điều 115 Bộ luật Lao động). Không trừ phép.</td></tr>
<tr><td>Nghỉ không lương</td><td>Không tính lương ngày đó, không tính vắng không phép.</td></tr>
<tr><td>Nghỉ ốm, thai sản (BHXH)</td><td>Công ty không trả lương ngày đó; bảo hiểm xã hội chi trả theo chứng từ.</td></tr>
<tr><td>Làm việc online, Công tác</td><td>Không bắt buộc: chỉ cần chọn khi nhận nhiệm vụ. Lập phiếu khi cả ngày không vào được phần mềm hoặc cần công tác phí. Công tác phí theo mức Công ty đặt (nếu bật).</td></tr>
<tr><td>Tăng ca (phiếu xác nhận)</td><td>Lập <b>sau khi đã làm thêm</b>: chọn loại (bình thường tối đa 3 giờ/ngày; theo yêu cầu gấp tối đa 4 giờ/ngày), ngày, số giờ đã làm, nội dung. Không lập cho ngày chưa tới. Trưởng bộ phận hoặc Giám đốc duyệt. Phiếu duyệt trong tháng nào tính vào lương tháng đó. Tiền = số giờ × (lương chính + phụ cấp) ÷ công chuẩn ÷ 8 × hệ số theo loại ngày, đặt trong <b>Lương → Thiết lập</b> (Công ty đang trả như e-work: làm thêm ngày nghỉ 150%).</td></tr>
<tr><td>Đi muộn, về sớm; Quên điểm danh (quên nhận nhiệm vụ)</td><td>Được duyệt thì không tính đi muộn hoặc nghỉ không phép.</td></tr>
<tr><td>Tạm ứng, Xăng xe, Thanh toán, Ứng lương</td><td>Kế toán hoặc Ban giám đốc chọn có đưa vào lương tháng hay không.</td></tr></table>` },

  { id: 'cong-viec', title: 'Công việc của tôi', roles: ALL, shot: 'cong-viec', html: `
<p>Công việc tổ chức theo ba cấp: <b>Dự án → Nhiệm vụ → Công việc</b>. Vào <b>Văn phòng → Công việc, nhiệm vụ</b>, thẻ <b>Việc của tôi</b>.</p>
<ol><li>Việc mới được giao hiện ở trạng thái <i>Chưa bắt đầu</i>. Bấm <b>Bắt đầu</b> khi làm.</li>
<li>Làm xong bấm <b>Hoàn thành</b>, ghi kết quả, đính kèm sản phẩm. Việc chuyển sang <i>Chờ nghiệm thu</i>.</li>
<li>Người giao nghiệm thu, chấm chất lượng 1 đến 5 sao, hoặc mở lại kèm hạn mới nếu cần sửa.</li>
<li>Phát sinh việc ngoài kế hoạch: bấm <b>+ Việc phát sinh</b>, chọn nhiệm vụ hoặc công việc mà việc này phát sinh từ đó. Trưởng phòng xác nhận thì việc mới tính KPI.</li></ol>
<p>Điểm công việc trong KPI = mức độ (Bình thường 1, Quan trọng 1,5, Khẩn cấp 2) × hệ số đúng hạn (trễ đến 1 ngày còn 75%, đến 3 ngày còn 50%, trễ hơn 0). Mỗi lần mở lại trừ 20%, mỗi lần gia hạn trừ 10%. Người phối hợp được tính 30% điểm. Số sao nghiệm thu để ghi nhận chất lượng, không làm thay đổi điểm.</p>
<p class="note">Việc sắp đến hạn và quá hạn hiện ngay trên trang Nhận nhiệm vụ để nhắc bạn; khi nhận nhiệm vụ bạn chọn được các việc này để làm trong ngày.</p>` },

  { id: 'kpi', title: 'KPI, đánh giá tháng', roles: ALL, shot: 'kpi', html: `
<p><b>KPI do máy tự tính hoàn toàn</b>, không ai chấm tay. Vào <b>Văn phòng → KPI, đánh giá tháng</b>, chọn tháng.</p>
<table><tr><th>Phần</th><th>Tỷ trọng</th><th>Cách tính</th></tr>
<tr><td>Công việc</td><td>70%</td><td>Từ các việc được giao xong trong tháng (chương <i>Công việc của tôi</i>).</td></tr>
<tr><td>Chuyên cần</td><td>30%</td><td>100 điểm, mỗi lần đi muộn quá 5 phút trừ 5, mỗi ngày nghỉ không phép trừ 20; thấp nhất 0.</td></tr></table>
<p>Tháng không có việc được giao thì điểm chỉ tính theo chuyên cần. Xếp loại: A từ 90, B từ 75, C từ 60, dưới 60 là D.</p>
<p><b>Thưởng KPI</b>: cả công ty xếp hạng chung, chỉ <b>hạng 1 và hạng 2</b> được thưởng theo mức Công ty đặt. Máy tự chốt KPI lúc 0 giờ ngày 1 tháng sau, thưởng cộng vào lương tháng đó.</p>
<p><b>Điểm KPI công khai</b>: mọi người xem được điểm, xếp loại, hạng của nhau để cùng phấn đấu. Tiền thưởng của người khác không hiện.</p>
<p class="note">Cách tính áp dụng từ tháng 12/2026; sau 3 tháng Công ty đánh giá lại và điều chỉnh nếu cần.</p>` },

  { id: 'phieu-luong', title: 'Phiếu lương và xác nhận lương', roles: ALL, shot: 'phieu-luong', html: `
<ol><li>Khi bảng lương tháng được chốt, vào <b>Văn phòng → Lương, phiếu lương</b>, chọn tháng để xem phiếu lương của mình: ngày công, lương thời gian, phụ cấp, tăng ca, công tác phí, thưởng KPI, bảo hiểm, thuế thu nhập cá nhân, tạm ứng, thực nhận.</li>
<li>Từ ngày 1 đến hết ngày 3 tháng sau: bấm <b>Đồng ý, xác nhận lương</b>, hoặc ghi rõ ý kiến rồi bấm <b>Gửi kiến nghị</b>. Quá hạn coi như đồng ý.</li>
<li>Kế toán trả lời kiến nghị ngay trên phiếu lương. Bấm <b>In, lưu PDF phiếu lương</b> để lưu.</li></ol>
<p class="note">Bạn chỉ thấy phiếu lương của chính mình. Thông tin tài khoản ngân hàng, số CCCD chỉ Kế toán và Ban giám đốc thấy để chi lương.</p>` },

  { id: 'lich-thong-bao', title: 'Lịch họp, thông báo, thông tin dự án', roles: ALL, html: `
<ul><li><b>Lịch công tác, lịch họp</b>: xem theo tuần, chọn <i>Chỉ lịch của tôi</i>; bấm <b>Thêm</b> để tải tệp lịch vào điện thoại, Outlook, Google Calendar.</li>
<li><b>Thông báo nội bộ</b>: thông báo mới có chấm đỏ trên chuông; mở là được ghi nhận đã xem.</li>
<li><b>Dự án</b>: mọi người được xem thông tin dự án, tiến độ, gói thầu, hợp đồng để nắm bắt công việc. Chỉ Ban giám đốc và người được giao mới sửa.</li>
<li><b>Hướng dẫn sử dụng</b>: menu Tiện ích → Hướng dẫn sử dụng, có tài liệu này.</li></ul>` },

  // ---------------- trưởng phòng
  { id: 'tp-giao-viec', title: 'Giao việc, xác nhận việc phát sinh, nghiệm thu', roles: ['tp', 'gd'], shot: 'giao-viec', html: `
<ol><li>Vào <b>Công việc, nhiệm vụ</b>, bấm <b>Giao việc</b>: chọn dự án, nhiệm vụ cha (nếu là công việc con), người thực hiện, người phối hợp, mức độ, ngày bắt đầu, hạn.</li>
<li>Thẻ <b>Phòng tôi phụ trách</b> (Trưởng phòng) hoặc <b>Tất cả</b> (Ban giám đốc): lọc <i>Quá hạn</i>, <i>Việc phát sinh chờ xác nhận</i>, <i>Chờ nghiệm thu</i>.</li>
<li>Việc phát sinh: bấm <b>Xác nhận</b> để tính KPI, hoặc <b>Không nhận</b> (việc chuyển sang Đã hủy).</li>
<li>Việc chờ nghiệm thu: bấm <b>Nghiệm thu</b>, chấm 1 đến 5 sao; hoặc mở lại kèm hạn mới.</li>
<li>Đổi hạn sang ngày muộn hơn được tính là gia hạn. Ban giám đốc sửa nhầm hạn thì ở ô <i>Đổi hạn</i> chọn <i>Sửa nhầm hạn</i> để không tính gia hạn.</li></ol>
<p class="note">Không tự nghiệm thu việc của chính mình. Nhiệm vụ còn việc con chưa xong thì chưa hoàn thành được.</p>` },

  { id: 'tp-duyet', title: 'Duyệt đề xuất', roles: ['tp', 'gd'], shot: 'duyet', html: `
<ol><li>Vào <b>Đề xuất</b>, thẻ <b>Chờ tôi duyệt</b> (số trong ngoặc là số đề xuất đang chờ).</li>
<li>Mở đề xuất, xem chứng từ đính kèm, bấm <b>Duyệt</b> hoặc <b>Không duyệt</b> (ghi lý do).</li></ol>
<p>Trưởng phòng duyệt đề xuất của nhân viên phòng mình. Ban giám đốc duyệt mọi đề xuất, kể cả của Trưởng phòng. Không ai tự duyệt đề xuất của mình; đề xuất của Giám đốc do Quản trị duyệt.</p>` },

  { id: 'tp-kpi', title: 'Hôm nay ai ở đâu, bảng công của phòng, KPI', roles: ['tp', 'gd'], shot: 'hom-nay', html: `
<ol><li>Vào <b>Bảng công, chấm công</b>, thẻ <b>Hôm nay ai ở đâu</b>: số người ở công ty, online, công tác, khác, có phiếu nghỉ, chưa nhận nhiệm vụ, đi muộn; từng người làm ở đâu, việc làm hôm nay, kết quả cuối ngày. Chọn ngày khác để xem lại.</li>
<li>Thẻ <b>Tổng hợp tháng</b>: mỗi người số ngày công, ở công ty, online, công tác, khác, đi muộn, nghỉ phép, tăng ca, nghỉ không phép; <b>Xuất Excel</b> khi cần. Trưởng phòng thấy phòng mình, Ban giám đốc và Kế toán thấy toàn công ty.</li>
<li><b>KPI</b> máy tự tính và tự chốt lúc 0 giờ ngày 1 tháng sau, không ai phải chấm hay bấm chốt. Cần sửa sai sót thì Ban giám đốc bấm <b>Mở chốt</b>, sửa, bấm <b>Chốt KPI tháng</b>.</li></ol>
<p>Muốn KPI phản ánh đúng: giao việc có hạn rõ ràng, nghiệm thu đúng lúc, xác nhận việc phát sinh kịp thời.</p>` },

  // ---------------- kế toán
  { id: 'kt-nhan-su', title: 'Hồ sơ nhân sự, hồ sơ lương', roles: ['kt', 'gd'], shot: 'nhan-su', html: `
<ol><li><b>Văn phòng → Nhân sự</b>, bấm tên một người để mở trang hồ sơ: thẻ <b>Thông tin chung</b> (cá nhân, phòng ban, chức vụ, ngày vào làm, ngân hàng, CCCD, người phụ thuộc), <b>Bằng cấp, chứng chỉ</b>, <b>Hợp đồng lao động</b>, <b>Quá trình công tác</b>, <b>Khen thưởng</b>, <b>Kỷ luật</b>, <b>Giấy tờ</b>, <b>Tất cả tệp</b>. Mỗi mục đính kèm được ảnh chụp hoặc bản PDF, bấm <b>Xem</b> để mở ngay. Mỗi người xem hồ sơ của mình ở <b>Hồ sơ của tôi</b>.</li>
<li>Ô <b>Chấm công</b>: chọn <i>Không chấm công</i> cho người không cần nhận nhiệm vụ. Người đó hưởng nguyên lương chính, không cần tự xác nhận lương.</li>
<li>Người nghỉ việc: ghi ngày nghỉ việc và trạng thái <i>Nghỉ việc</i>; hồ sơ vẫn giữ để tra cứu và tính lương tháng cuối.</li>
<li><b>Lương → Hồ sơ lương</b>: lương cơ bản, lương đóng bảo hiểm, các khoản phụ cấp, số người phụ thuộc, cách tính thuế, đóng hay không đóng bảo hiểm, mức công tác phí riêng (để trống thì dùng mức chung, 0 là không hưởng; đã lấy sẵn từ e-work).</li></ol>
<p class="note">Thông tin CCCD, ngân hàng là dữ liệu cá nhân (Nghị định 13/2023): chỉ dùng để chi lương, không chụp màn hình gửi ra ngoài.</p>` },

  { id: 'kt-bang-cong', title: 'Bảng công, ngày nghỉ lễ', roles: ['kt', 'gd'], html: `
<ol><li><b>Bảng công, chấm công</b>, thẻ <b>Tổng hợp tháng</b>: chọn tháng, xem từng người (ngày công, ở công ty, online, công tác, khác, đi muộn, nghỉ phép, tăng ca, nghỉ không phép); <b>Xuất Excel</b>. Bấm tên để xem chi tiết từng ngày (thẻ <b>Chi tiết nhận nhiệm vụ</b>).</li>
<li><b>+ Bổ sung nhận nhiệm vụ</b> hoặc <b>Điều chỉnh</b> khi có sai sót (ô giờ để trống thì giữ giờ cũ; phần mềm ghi lại người sửa, lý do).</li>
<li>Thẻ <b>Thiết lập</b>: chọn năm, bấm <b>Điền ngày lễ theo luật</b> cho năm mới; thêm ngày nghỉ bù, ngày làm bù theo thông báo của Chính phủ.</li></ol>` },

  { id: 'kt-luong', title: 'Lập, chốt bảng lương', roles: ['kt', 'gd'], shot: 'bang-luong', html: `
<ol><li>Vào <b>Lương, phiếu lương</b>, chọn tháng. Bảng lương tự tính từ bảng công, đề xuất đã duyệt, KPI đã chốt và hồ sơ lương.</li>
<li>Từng người: <b>Thưởng, khấu trừ khác</b> để thêm khoản ngoài; mục <b>Đề xuất tạm ứng, xăng xe trong tháng</b> chọn <i>Đưa vào lương</i> hoặc không.</li>
<li>Kiểm tra xong bấm <b>Chốt bảng lương</b>. Nhân viên thấy phiếu lương và xác nhận từ ngày 1 đến ngày 3 tháng sau.</li>
<li>Kiến nghị: bấm <b>Trả lời kiến nghị</b>. Cần sửa số liệu thì <b>Mở chốt</b>, sửa, chốt lại.</li></ol>
<p><b>Quy tắc tính (theo quy định hiện hành):</b></p>
<ul><li>Bảo hiểm người lao động đóng: BHXH 8%, BHYT 1,5%, BHTN 1%. Trần BHXH, BHYT = 20 lần lương cơ sở (2.530.000 đ từ 01/7/2026); trần BHTN = 20 lần lương tối thiểu vùng (vùng I 5.310.000 đ từ 01/01/2026, Nghị định 293/2025).</li>
<li>Thuế TNCN: biểu 5 bậc từ 01/01/2026 (5%, 10%, 20%, 30%, 35%); giảm trừ bản thân 15,5 triệu, mỗi người phụ thuộc 6,2 triệu.</li>
<li>Phép năm: làm đủ năm được 12 ngày (như e-work, không cộng thêm theo thâm niên); năm đầu tính theo số tháng làm việc. Nghỉ phép trong số phép được hưởng lương; vượt phép trừ lương. Cuối năm còn phép thì trả vào lương tháng 12.</li>
<li>Ngày nghỉ không phép (không nhận nhiệm vụ, không có phiếu nghỉ) trừ lương ngày đó.</li>
<li>Công tác phí theo mức trong Thiết lập (bật hoặc tắt). Tạm ứng, xăng xe theo lựa chọn từng đề xuất.</li></ul>` },

  { id: 'kt-duyet-chi', title: 'Duyệt chi, xuất bảng lương và danh sách chuyển khoản', roles: ['kt', 'gd'], shot: 'duyet-chi', html: `
<ol><li>Sau hạn xác nhận và đã trả lời hết kiến nghị, Giám đốc hoặc Kế toán bấm <b>Duyệt chi lương</b>. Còn kiến nghị chờ xử lý thì phần mềm chưa cho duyệt.</li>
<li><b>Bảng lương kế toán (Excel)</b> hoặc <b>(PDF)</b>: đủ các cột theo quy định, có chữ ký Người lập biểu, Kế toán trưởng, Giám đốc và cột ký nhận. Dùng để lưu chứng từ.</li>
<li><b>Danh sách chuyển khoản ngân hàng</b>: tệp Excel đúng mẫu <i>Danh sách giao dịch</i> của MB Bank (STT, số tài khoản, tên người thụ hưởng, ngân hàng, số tiền, nội dung). Tải lên Internet Banking doanh nghiệp để chi lương.</li>
<li>Đã duyệt chi thì không mở chốt được nữa. Cần sửa thì bấm <b>Hủy duyệt chi</b> trước.</li></ol>
<p>Nội dung chuyển khoản, tài khoản trích nợ đặt trong <b>Lương → Thiết lập</b> (mặc định "TRI THUC THANH TOAN LUONG T{tháng}.{năm}").</p>` },

  // ---------------- ban giám đốc
  { id: 'gd-dieu-hanh', title: 'Điều hành toàn công ty', roles: ['gd'], html: `
<ul><li><b>Bảng công, chấm công → Hôm nay ai ở đâu</b>: xem nhanh trên điện thoại ai ở công ty, online, công tác, ai chưa nhận nhiệm vụ.</li>
<li>Trang Nhận nhiệm vụ hiện thêm mục <b>Việc của phòng, người bạn giao</b>: số việc quá hạn, việc phát sinh chờ xác nhận, việc chờ nghiệm thu, người có KPI dưới mức. Bấm để mở ngay danh sách.</li>
<li><b>Thông báo nội bộ</b>: <b>+ Đăng thông báo</b>, chọn người nhận; xem ai đã đọc (<i>Đã xem</i>).</li>
<li><b>Lịch họp</b>: <b>+ Thêm lịch</b>, ghi kết luận sau họp, <b>Xuất Excel</b> hoặc <b>In, lưu PDF</b>.</li>
<li><b>Dự án</b>: tạo, sửa dự án; nhiệm vụ của dự án là cấp cha cho công việc của nhân viên.</li>
<li>Mỗi trang KPI, Bảng công, Lương, Công việc, Lịch họp đều có <b>Xuất Excel</b> hoặc <b>In, lưu PDF</b> để báo cáo.</li></ul>
<p class="note">Giám đốc vẫn nhận nhiệm vụ, gửi đề xuất và xác nhận phiếu lương của mình như mọi người.</p>` },

  // ---------------- quản trị
  { id: 'qt-tai-khoan', title: 'Tài khoản, vai trò khi nhân sự thay đổi', roles: ['qt'], shot: 'qt-nguoi-dung', html: `
<ol><li><b>Quản trị hệ thống → Người dùng</b>: thêm tài khoản, chọn vai trò (Nhân viên, Trưởng phòng, Kế toán, Ban giám đốc), đặt mật khẩu ban đầu; người dùng phải đổi khi đăng nhập lần đầu.</li>
<li><b>Nhân sự thay đổi</b>: sửa tài khoản, đổi vai trò. Ví dụ nhân viên lên Trưởng phòng: đổi vai trò sang Trưởng phòng và ghi người phụ trách ở <b>Nhân sự → Phòng ban</b> (Sửa phòng ban).</li>
<li>Người nghỉ việc: khóa tài khoản (không xóa) để giữ lịch sử.</li>
<li><b>Nhóm, phân quyền</b>: quyền từng phân hệ (không, xem, sửa), ô <i>Duyệt hồ sơ</i> cho Đề xuất và Lương (duyệt chi). Chỉ sửa khi Công ty đổi quy chế.</li></ol>
<p class="note">Quyền <i>xem</i> một phân hệ Văn phòng (Nhân sự, Bảng công, Đề xuất, KPI, Lương) nghĩa là xem dữ liệu của mọi người. Không cấp cho vai trò Nhân viên.</p>` },

  { id: 'qt-thiet-lap', title: 'Thiết lập hệ thống', roles: ['qt'], html: `
<ul><li><b>Bảng công → Thiết lập</b>: giờ làm, ca sáng chiều, thứ Bảy, số ngày phép năm, có cộng phép theo thâm niên hay không; ô <i>Nhận nhiệm vụ</i> (bật: mỗi ngày bấm một lần, tự chọn nơi làm, không định vị) và tên hiển thị của nút.</li>
<li><b>KPI → Thiết lập</b>: công khai điểm KPI, cách tính (tự động hoàn toàn hoặc có chấm tay), tỷ trọng, xếp hạng chung toàn công ty, số người đứng đầu được thưởng, hệ số mức độ, trễ hạn, chất lượng, trừ gia hạn, mở lại, hệ số phối hợp, xếp loại, thưởng xếp hạng, số ngày nhắc trước hạn, tự chốt KPI (bật/tắt, ngày tự chốt).</li>
<li><b>Lương → Thiết lập</b>: lương cơ sở, lương tối thiểu vùng, tỷ lệ bảo hiểm, giảm trừ, biểu thuế, tỷ lệ tăng ca, số giờ tăng ca tối đa một ngày (bình thường, gấp), tính tăng ca theo tháng duyệt phiếu hay theo ngày tăng ca, đơn giá tăng ca tính trên lương chính + phụ cấp hay chỉ lương chính, thưởng của tháng còn làm trên e-work (lấy theo bảng lương e-work hay theo KPI trên phần mềm), công tác phí, tạm ứng và xăng xe mặc định, tài khoản trích nợ, nội dung chuyển khoản, hạn xác nhận lương.</li>
<li><b>Thông tin đơn vị → Phân hệ sử dụng</b>: ẩn các phân hệ Công ty không dùng.</li>
<li><b>Sao lưu, phục hồi</b>: sao lưu tự động hằng ngày; tải bản sao lưu đầy đủ trước mỗi lần cập nhật.</li>
<li>Tài khoản quản trị bắt buộc xác thực 2 lớp (ứng dụng Authenticator, mục "e-work Trithuc").</li></ul>` },

  { id: 'qt-ework', title: 'Chuyển dữ liệu và chạy song song e-work cũ', roles: ['qt'], html: `
<ul><li>Dữ liệu e-work (nhân sự, chấm công, đề xuất, lịch họp, thông báo, hồ sơ lương, dự án, công việc) đã chuyển sang; bảng cũ lưu tại <b>Dữ liệu e-work cũ</b> để tra cứu.</li>
<li>Trong thời gian chạy song song, ngày nhận nhiệm vụ được chép sang e-work cũ mỗi 5 phút: thêm dòng mới; dòng do phần mềm mới chép mà sau đó sửa (điều chỉnh, giải trình được duyệt) thì cập nhật đúng dòng đó; không xóa. Phần cập nhật cần quyền UPDATE trên bảng ChamCongs của e-work.</li>
<li>Đối chiếu lương: chạy lệnh <code>--doi-chieu-luong 2026-10</code> trên máy chủ để so bảng lương e-work với bản mới, ra tệp chênh lệch từng người.</li></ul>` },
];
