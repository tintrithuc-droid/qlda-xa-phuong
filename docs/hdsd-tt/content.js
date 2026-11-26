// Nội dung Hướng dẫn sử dụng e-work Tri Thức (bản 1.10.24: phần Dự án, quyền không xóa, Nhận nhiệm vụ, KPI và bảng lương tự chốt, Công việc theo kết quả sản phẩm, người cùng phụ trách phòng) theo vai trò.
// Mỗi chương: id, title, roles (nv: Nhân viên, tp: Trưởng phòng, kt: Kế toán, gd: Ban giám đốc, qt: Quản trị), html, shot (ảnh trong shots/, có thể thiếu).
// Chương chung cho mọi người đặt roles: ALL.
const ALL = ['nv', 'tp', 'kt', 'gd', 'qt'];

exports.ROLES = {
  nv: { name: 'Nhân viên', file: 'Nhan vien', group: 'g-nv',
    intro: 'Tài liệu dành cho mọi người lao động của Công ty: nhận nhiệm vụ hằng ngày, gửi đề xuất, làm công việc được giao, xem KPI, xác nhận lương, xem lịch họp, thông báo và thông tin dự án.' },
  tp: { name: 'Trưởng phòng', file: 'Truong phong', group: 'g-tp',
    intro: 'Trưởng phòng làm mọi việc như Nhân viên, thêm phần quản lý phòng mình: giao việc, xác nhận việc tự tạo, duyệt gia hạn, nghiệm thu, duyệt đề xuất, xem hôm nay ai ở đâu, theo dõi bảng công của phòng.' },
  kt: { name: 'Kế toán', file: 'Ke toan', group: 'g-ketoan',
    intro: 'Kế toán làm mọi việc như Nhân viên, thêm phần hồ sơ nhân sự, bảng công, ngày nghỉ lễ, rà bảng lương (bảng lương tự chốt ngày 1), nhập khoản phát sinh, trả lời kiến nghị, xuất bảng lương kế toán và danh sách chuyển khoản ngân hàng sau khi Giám đốc duyệt chi.' },
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
<tr><td><b>Nhân viên</b></td><td rowspan="5">Mọi người đều: nhận nhiệm vụ hằng ngày, gửi đề xuất, làm việc được giao, xem KPI của mọi người (công khai) và phiếu lương của mình, xác nhận lương, xem lịch họp, thông báo, xem và <b>cập nhật dữ liệu dự án</b> (Điều hành, Nghiệp vụ)</td><td><b>Không xóa</b> dữ liệu dự án (cần xóa thì báo Trưởng phòng). Không xem lương, bảng công, hồ sơ nhân sự, tiền thưởng của người khác</td></tr>
<tr><td><b>Trưởng phòng</b></td><td>Với phòng mình: giao việc, xác nhận việc tự tạo, nghiệm thu, duyệt đề xuất, xem hôm nay ai ở đâu, bảng công; <b>xóa</b> dữ liệu dự án nhập sai; xem bảng lương của phòng nếu được giao (chỉ xem)</td></tr>
<tr><td><b>Kế toán</b></td><td>Hồ sơ nhân sự, bảng công, ngày lễ, rà bảng lương, nhập khoản phát sinh, trả lời kiến nghị, xuất bảng lương và danh sách chuyển khoản (không duyệt chi)</td></tr>
<tr><td><b>Ban giám đốc</b></td><td>Toàn công ty: giao việc, hôm nay ai ở đâu, mở chốt KPI khi cần sửa, duyệt đề xuất của trưởng bộ phận, <b>duyệt chi lương (chỉ Giám đốc)</b>, thông báo, lịch họp, quản lý dự án</td></tr>
<tr><td><b>Quản trị</b></td><td>Tài khoản, vai trò, thiết lập hệ thống, sao lưu</td></tr></table>
<p class="note">Quyền Trưởng phòng đi theo phòng ban: phòng nào ghi tên người phụ trách (và <b>người cùng phụ trách</b>) là ai thì người đó quản lý phòng đó. Đổi trưởng phòng chỉ cần sửa phòng ban.</p>
<p>Người đã nghỉ việc hoặc bị khóa tài khoản không còn hiện ở các danh sách chọn người (giao việc, phối hợp, mời họp) và không tính KPI; dữ liệu cũ vẫn giữ để tra cứu.</p>` },

  { id: 'co-cau', title: 'Cơ cấu và ai duyệt cho ai (từ 01/12/2026)', roles: ALL, html: `
<table><tr><th>Bộ phận</th><th>Người phụ trách</th><th>Thành viên</th></tr>
<tr><td><b>Ban giám đốc</b></td><td>Đỗ Cao Trí (Giám đốc)</td><td>Đỗ Hòa: cố vấn, không chấm công, không duyệt (vai trò Nhân viên)</td></tr>
<tr><td><b>Phòng Dự án - Kỹ thuật</b></td><td>Tám (trưởng phòng); Đoàn Thúy Quyên (người cùng phụ trách)</td><td>Khôi, Thịnh, Tính, Phạm Đoàn Trùng Dương</td></tr>
<tr><td><b>Hành chính - Kế toán</b></td><td>Thanh (phụ trách)</td><td>Thảo. Cả hai không chấm công.</td></tr></table>
<table><tr><th>Việc cần duyệt</th><th>Của ai</th><th>Ai duyệt</th></tr>
<tr><td rowspan="3">Đề xuất (nghỉ, tăng ca, công tác, tạm ứng, xăng xe…)</td><td>Chuyên viên Phòng Dự án - Kỹ thuật</td><td>Tám hoặc Đoàn Thúy Quyên (ai duyệt trước cũng được)</td></tr>
<tr><td>Thảo</td><td>Thanh</td></tr>
<tr><td>Tám, Đoàn Thúy Quyên, Thanh</td><td>Giám đốc</td></tr>
<tr><td>Giao việc, nghiệm thu sản phẩm</td><td>Người trong phòng</td><td>Người giao việc (trưởng phòng, người cùng phụ trách, Giám đốc)</td></tr>
<tr><td>Chi lương</td><td>Cả công ty</td><td><b>Chỉ Giám đốc</b> duyệt chi; Kế toán lập bảng, không duyệt</td></tr>
<tr><td>Xem bảng lương của phòng</td><td>Phòng Dự án - Kỹ thuật</td><td>Chỉ Đoàn Thúy Quyên (chỉ xem)</td></tr>
<tr><td>Xóa dữ liệu phần Dự án</td><td>Mọi dự án</td><td>Trưởng phòng, người cùng phụ trách, Giám đốc. Nhân viên không xóa.</td></tr></table>
<p><b>Thay đổi từ 01/12/2026</b>: dùng địa chỉ <b>https://e-work.vn</b> (bản mới); bảng lương, KPI tháng 12 tính hoàn toàn trên phần mềm mới; KPI tính 3 chiều (sản phẩm 60%, chuyên cần 20%, tương tác 20%); giao việc là giao sản phẩm.</p>` },

  { id: 'dang-nhap', title: 'Đăng nhập, đổi mật khẩu', roles: ALL, shot: 'dang-nhap', html: `
<ol><li>Mở <b>https://e-work.vn</b> (địa chỉ e-work quen thuộc, nay là bản mới) trên máy tính hoặc điện thoại.</li>
<li>Đăng nhập bằng <b>tên đăng nhập và mật khẩu e-work cũ</b> của bạn, không cần cấp lại.</li>
<li>Lần đầu vào, phần mềm hiện ngay <b>hướng dẫn dành cho vai trò của bạn</b>. Đọc qua rồi bấm <b>Đã đọc, không hiện lại</b> (hoặc <b>Để sau</b>). Xem lại bất cứ lúc nào ở mục <b>Hướng dẫn sử dụng</b>.</li>
<li>Đổi mật khẩu khi cần: mật khẩu mới tối thiểu 8 ký tự, có chữ và số. Không dùng chung mật khẩu với tài khoản khác.</li></ol>
<p>Trên điện thoại: mở trang bằng Chrome (Android) hoặc Safari (iPhone), chọn <b>Thêm vào màn hình chính</b> để dùng như ứng dụng.</p>
<p class="note">Quên mật khẩu: báo Quản trị đặt lại. Phần mềm không bao giờ hỏi mật khẩu qua tin nhắn hay thư.</p>` },

  { id: 'diem-danh', title: 'Nhận nhiệm vụ hằng ngày', roles: ALL, shot: 'nhan-nhiem-vu', shots: ['diem-danh'], html: `
<p>"Nhận nhiệm vụ" thay cho điểm danh: <b>mỗi ngày làm việc bấm một lần</b>, khi bắt đầu làm việc. Không cần định vị, không cần phiếu duyệt, không bấm khi ra về.</p>
<ol><li>Vào <b>Văn phòng → Nhận nhiệm vụ</b> (trang mở đầu sau khi đăng nhập).</li>
<li>Chọn hôm nay làm việc ở đâu: <i>Ở công ty</i>, <i>Làm việc online</i>, <i>Đi công tác</i> hoặc <i>Khác</i>. Chọn <i>Khác</i> thì bắt buộc ghi nội dung công việc hôm nay (ví dụ: họp với chủ đầu tư tại UBND xã).</li>
<li>Bấm <b>Nhận nhiệm vụ</b>. Màn hình hiện giờ nhận, nơi làm; đi muộn thì hiện số phút muộn.</li></ol>
<p>Công ty quản lý công việc theo <b>kết quả sản phẩm</b> nên không phải chọn việc làm trong ngày hay ghi kết quả cuối ngày: việc nào xong thì nộp sản phẩm ở mục <i>Công việc</i>.</p>
<table><tr><th>Trường hợp</th><th>Cách tính</th></tr>
<tr><td>Đã nhận nhiệm vụ</td><td>Tính 1 ngày công để tính lương (ngày làm nửa ngày tính theo lịch).</td></tr>
<tr><td>Nhận sau giờ vào (08:00)</td><td>Tính đi muộn, trừ điểm chuyên cần trong KPI (muộn không quá 5 phút không trừ). Chọn <i>Đi công tác</i> hoặc <i>Khác</i> thì không tính muộn.</td></tr>
<tr><td>Ngày làm việc không nhận nhiệm vụ và không có phiếu nghỉ phép được duyệt</td><td>Tính <b>nghỉ không phép</b>: trừ lương ngày đó và trừ điểm chuyên cần.</td></tr>
<tr><td>Có phiếu nghỉ phép, nghỉ việc riêng, làm việc online hoặc công tác được duyệt cả ngày</td><td>Không phải nhận nhiệm vụ, không tính nghỉ không phép.</td></tr></table>
<p>Bấm <b>Bật nhắc trên thiết bị này</b> để điện thoại, máy tính hiện thông báo nhắc nhận nhiệm vụ khi đang mở phần mềm.</p>
<p>Ngày nghỉ (Chủ nhật, thứ Bảy nghỉ, ngày lễ): không nhận nhiệm vụ, màn hình chỉ hiện lời chúc. Có làm thêm vào ngày nghỉ thì làm xong lập <b>phiếu xác nhận tăng ca</b> (chương <i>Đề xuất</i>).</p>
<p>Quên nhận nhiệm vụ hoặc đi muộn có lý do: gửi đề xuất <i>Quên nhận nhiệm vụ</i> hoặc <i>Đi muộn</i>. Đề xuất được duyệt thì công tự tính lại.</p>
<p>Từ ngày 1 đến ngày 10 mỗi tháng, trang hiện <b>Tổng kết tháng trước của bạn</b>: số ngày ở công ty, online, công tác, khác, số lần đi muộn, ngày nghỉ phép, ngày nghỉ không phép. Bấm <b>Đã xem</b> để ẩn.</p>
<p>Người được đặt <b>Không chấm công</b> (hiện là Đỗ Hòa, Thanh, Thảo) không phải nhận nhiệm vụ; lương tính theo hồ sơ.</p>
<p class="note">Chỉ nhận nhiệm vụ trên phần mềm này (https://e-work.vn). Đến hết tháng 11/2026, dữ liệu nhận nhiệm vụ được phần mềm tự chép sang cơ sở dữ liệu e-work cũ để đối chiếu lương tháng 11; không cần chấm ở nơi khác.</p>` },

  { id: 'de-xuat', title: 'Gửi đề xuất', roles: ALL, shot: 'de-xuat', shots: ['tang-ca'], html: `
<ol><li>Vào <b>Văn phòng → Đề xuất</b>, bấm <b>+ Tạo đề xuất</b>, chọn loại (xếp theo nhóm <i>Nghỉ</i>, <i>Thời gian</i>, <i>Chi phí</i>, <i>Khác</i>).</li>
<li>Nhập thời gian, số ngày hoặc số tiền, lý do; đính kèm chứng từ nếu có (giấy khám bệnh, hóa đơn xăng…). Bấm Lưu để gửi.</li>
<li>Theo dõi trạng thái ở thẻ <b>Đề xuất của tôi</b>. Khi chưa duyệt, bạn còn sửa hoặc hủy được.</li></ol>
<p class="note">Phiếu cũ chuyển từ e-work đã hết tác dụng (chờ duyệt quá 30 ngày, đăng ký tăng ca trước khi làm) được ẩn khỏi danh sách, không bị xóa.</p>
<table><tr><th>Loại</th><th>Ảnh hưởng đến công, lương</th></tr>
<tr><td>Nghỉ phép</td><td>Trừ vào phép năm, vẫn hưởng lương. Hết phép thì tính nghỉ không lương.</td></tr>
<tr><td>Nghỉ việc riêng có lương</td><td>Kết hôn 3 ngày, con kết hôn 1 ngày, bố mẹ (hai bên), vợ hoặc chồng, con mất 3 ngày (Điều 115 Bộ luật Lao động). Không trừ phép.</td></tr>
<tr><td>Nghỉ không lương</td><td>Không tính lương ngày đó, không tính vắng không phép.</td></tr>
<tr><td>Nghỉ ốm, thai sản (BHXH)</td><td>Công ty không trả lương ngày đó; bảo hiểm xã hội chi trả theo chứng từ.</td></tr>
<tr><td>Làm việc online, Công tác</td><td>Không bắt buộc: chỉ cần chọn khi nhận nhiệm vụ. Lập phiếu khi cả ngày không vào được phần mềm hoặc cần công tác phí. Công tác phí theo mức Công ty đặt (nếu bật).</td></tr>
<tr><td>Tăng ca (phiếu xác nhận)</td><td>Lập <b>sau khi đã làm thêm</b>: chọn loại (bình thường tối đa 3 giờ/ngày; theo yêu cầu gấp tối đa 4 giờ/ngày), ngày, số giờ đã làm, nội dung, và chọn <b>Tăng ca cho công việc</b> (việc bạn làm chính hoặc phối hợp; số giờ tăng ca hiện trong chi tiết công việc). Không lập cho ngày chưa tới. Trưởng bộ phận hoặc Giám đốc duyệt. Phiếu duyệt trong tháng nào tính vào lương tháng đó. Tiền = số giờ × (lương chính + phụ cấp) ÷ công chuẩn ÷ 8 × hệ số theo loại ngày, đặt trong <b>Lương → Thiết lập</b> (Công ty đang trả như e-work: làm thêm ngày nghỉ 150%).</td></tr>
<tr><td>Đi muộn; Quên nhận nhiệm vụ</td><td>Được duyệt thì không tính đi muộn hoặc nghỉ không phép.</td></tr>
<tr><td>Tạm ứng, Xăng xe, Thanh toán, Ứng lương</td><td>Kế toán hoặc Ban giám đốc chọn có đưa vào lương tháng hay không.</td></tr></table>` },

  { id: 'cong-viec', title: 'Công việc', roles: ALL, shot: 'cong-viec', shots: ['nop-san-pham', 'chi-tiet-viec'], html: `
<p>Công ty quản lý công việc <b>theo kết quả sản phẩm</b>: giao việc là giao <b>một sản phẩm có hạn bàn giao</b>. Người làm tự chủ cách làm, không phải báo tiến độ từng bước; người giao kiểm sản phẩm khi được nộp. KPI tính trên sản phẩm được nghiệm thu: đúng hạn và đạt chất lượng.</p>
<p>Việc tổ chức theo cây <b>Dự án › Gói thầu › Việc</b>. Gói thầu không bắt buộc: dự án chưa có gói thầu hoặc việc chung của dự án thì giao thẳng ở dự án; việc không thuộc dự án là <i>Việc nội bộ</i>. Tab Công việc trong từng dự án lấy cùng dữ liệu này.</p>
<p>Vào <b>Văn phòng → Công việc</b>. Có ba thẻ:</p>
<table><tr><th>Thẻ</th><th>Gồm</th></tr>
<tr><td><b>Việc của tôi</b></td><td>Việc tôi tự tạo và tự làm.</td></tr>
<tr><td><b>Được giao</b></td><td>Việc người khác giao cho tôi: làm chính, <i>Phối hợp</i> hoặc <i>Theo dõi</i>.</td></tr>
<tr><td><b>Tôi giao</b></td><td>Việc tôi giao cho người khác. Sản phẩm chờ nghiệm thu luôn ở đầu.</td></tr></table>
<p>Danh sách có cột <b>Sản phẩm bàn giao</b>; dòng dự án, gói thầu hiện số sản phẩm đã nghiệm thu trên tổng số (ví dụ "5/8 sản phẩm đã nghiệm thu"). Lọc theo trạng thái, dự án, gói thầu, loại công việc, tháng; <b>Xuất Excel</b> để lưu danh sách. Đầu trang hiện việc sắp đến hạn, quá hạn và <b>KPI tạm tính</b> tháng này.</p>
<p><b>Thêm việc</b>: bấm <b>+ Thêm việc</b> (đầu trang, hoặc trên dòng dự án, gói thầu). Ghi <b>Tên việc</b>, <b>Sản phẩm bàn giao</b> (bắt buộc, ví dụ "Biên bản nghiệm thu có chữ ký khách hàng, bản PDF"), <b>Tiêu chí đạt</b> (không bắt buộc), ô <b>Ai làm</b> (<i>Việc của tôi</i> hoặc <i>Giao cho người khác</i>), <b>Hạn bàn giao</b>, mức độ. Bấm <b>+ Thêm chi tiết</b> khi cần người phối hợp, người theo dõi, sản phẩm thành phần, loại công việc, ghi chú, tệp đính kèm.</p>
<p><b>Sản phẩm là kết quả cuối cùng dùng được</b>, không phải số phần trăm hay bản nháp. Không nhập chi tiết từng bước kiểu cũ; người làm tự sắp xếp các bước.</p>
<table><tr><th>Việc</th><th>Sản phẩm bàn giao</th><th>Tiêu chí đạt</th></tr>
<tr><td>Lập báo cáo KTKT dự án X</td><td>Báo cáo KTKT dự án X được phê duyệt</td><td>Có quyết định phê duyệt; đính kèm báo cáo và quyết định</td></tr>
<tr><td>Hỗ trợ khách hàng A dùng phần mềm</td><td>Biên bản hỗ trợ có xác nhận của khách hàng</td><td>Khách hàng ký hoặc xác nhận qua thư</td></tr>
<tr><td>Cập nhật hồ sơ thanh toán gói 03</td><td>Hồ sơ thanh toán đợt 2 gói 03 đủ trên phần mềm</td><td>Đủ giấy đề nghị, bảng giá trị, biên bản nghiệm thu</td></tr></table>
<p><b>Sản phẩm làm nhiều tháng, cần phê duyệt</b>: khi giao chọn <b>Sản phẩm cần cơ quan phê duyệt: Có</b>, phần mềm tự tạo 3 mốc (Dự thảo, Trình thẩm định, Được phê duyệt) và tự đặt hạn; người làm nộp từng mốc như một sản phẩm. Không cần tự chia.</p>
<p class="note">Cơ quan ngoài (chủ đầu tư, Sở) duyệt chậm thì <b>xin gia hạn trước hạn</b>, không bị trừ điểm.</p>
<p><b>Làm việc</b>: bấm vào tên việc để xem sản phẩm cần bàn giao, tiêu chí và nhật ký.</p>
<ol><li><b>Trao đổi</b> (không bắt buộc): hỏi, báo vướng mắc, gửi tài liệu tham khảo.</li>
<li><b>Xin gia hạn</b>: chọn hạn mới, ghi lý do; người giao duyệt (việc của tôi thì gia hạn ngay). Xin <b>trước hạn</b> và được duyệt thì không trừ điểm; xin khi đã quá hạn thì vẫn tính trễ theo hạn cũ.</li>
<li><b>Nộp sản phẩm</b>: đính kèm tệp sản phẩm, hoặc ghi đường dẫn, nơi kiểm tra (ví dụ "đã chạy trên máy chủ khách hàng A"); không có thì chưa nộp được. Việc chuyển sang <i>Chờ nghiệm thu</i>.</li>
<li>Người phối hợp bấm <b>Xong phần tôi</b> khi làm xong phần mình; chi tiết việc hiện ✓ cạnh tên người đã xong.</li>
<li>Người giao <b>Nghiệm thu</b>: <b>Đạt tốt</b>, <b>Đạt</b>, hoặc <b>Chưa đạt</b> (trả lại sửa, ghi rõ cần sửa gì và hạn sửa). Quá <b>3 ngày làm việc</b> chưa nghiệm thu thì việc tự tính <b>Đạt</b>.</li></ol>
<p>Việc lớn chỉ chia <b>sản phẩm thành phần</b> khi mỗi phần có sản phẩm riêng, người làm riêng; KPI tính theo từng sản phẩm thành phần. Việc tự tạo hiện <i>Tự tạo, chờ xác nhận</i>: người giao việc cha hoặc Trưởng phòng xác nhận thì mới tính KPI.</p>
<p class="note">Làm thêm giờ cho việc nào thì khi lập phiếu tăng ca chọn đúng việc đó; chi tiết công việc hiện tổng giờ tăng ca. Việc tạo trước đây chưa ghi sản phẩm thì hiện "chưa ghi", không phải điền lại.</p>` },


  { id: 'kpi', title: 'KPI: đánh giá ba chiều, tự động', roles: ALL, shot: 'kpi', html: `
<p><b>KPI do máy tự tính hoàn toàn</b> từ chính các thao tác của bạn trên phần mềm. Không ai chấm tay, không phải nhập gì thêm: mọi thông số chỉ xác định <b>một lần lúc giao việc</b>. Vào <b>Văn phòng → KPI</b>, chọn tháng; bấm <b>Cách tính</b> để xem công thức, <b>Xuất</b> để in, lưu.</p>
<table><tr><th>Chiều</th><th>Tỷ trọng</th><th>Máy tự tính từ</th></tr>
<tr><td><b>Sản phẩm</b></td><td>60%</td><td>Các sản phẩm, mốc kết quả có hạn hoặc được nộp trong tháng (cách tính ở dưới).</td></tr>
<tr><td><b>Chuyên cần</b></td><td>20%</td><td>Nhận nhiệm vụ hằng ngày: 100 điểm, mỗi lần muộn quá 5 phút trừ 5, mỗi ngày nghỉ không phép trừ 20.</td></tr>
<tr><td><b>Tương tác</b></td><td>20%</td><td>Số <b>ngày làm việc có cập nhật</b> trên phần mềm: nộp sản phẩm, trao đổi việc, xong phần phối hợp, cập nhật dữ liệu dự án, gửi đề xuất, lịch, thông báo, xác nhận lương, nghiệm thu, duyệt… Có cập nhật trong khoảng 3/5 số ngày đi làm là đủ 100 điểm. Mỗi ngày chỉ tính một lần: bấm nhiều trong ngày không cộng thêm. Đăng nhập, nhận nhiệm vụ không tính ở đây.</td></tr></table>
<h3>Điểm sản phẩm</h3>
<p>Mỗi sản phẩm (hoặc mốc) = <b>quy mô</b> (Nhỏ 1, Vừa 2, Lớn 4) × <b>tỷ lệ mốc</b> × mức độ (Bình thường 1, Quan trọng 1,5, Khẩn cấp 2) × <b>đúng hạn</b> (đúng hạn 100%; trễ 1 ngày làm việc còn 75%; trễ 2–3 ngày còn 50%; <b>trễ quá 3 ngày làm việc: 0</b>) × <b>chất lượng</b> (Đạt tốt 100%, Đạt 85%, quá 3 ngày chưa nghiệm thu tự tính Đạt) × (1 − 20% mỗi lần bị <b>trả về sửa</b> vì chưa đạt). Mốc đến hạn mà chưa nộp: 0 điểm. Người phối hợp được tính 30%. Điểm sản phẩm = 100 × tổng điểm đạt ÷ tổng hệ số.</p>
<p class="note"><b>Ví dụ tính điểm tháng 12</b>: bạn có 2 mốc đến hạn. Mốc "Dự thảo" của báo cáo KTKT quy mô Lớn: hệ số 4 × 40% = 1,6; nộp đúng hạn, Đạt tốt: được 1,6. Một sản phẩm Nhỏ (hệ số 1): trễ 1 ngày, Đạt: được 1 × 75% × 85% = 0,64. Điểm sản phẩm = 100 × (1,6 + 0,64) ÷ (1,6 + 1) = <b>86,2</b>. Chuyên cần 95 (đi muộn 1 lần), tương tác 100. KPI = 86,2 × 60% + 95 × 20% + 100 × 20% = <b>90,7</b>, xếp loại A.</p>
<p><b>Sản phẩm cần cơ quan phê duyệt</b> (ví dụ báo cáo KTKT): lúc giao chọn "Có", phần mềm <b>tự chia 3 mốc</b> và tự đặt hạn: <b>Dự thảo 40%</b> (hạn ở giữa thời gian), <b>Trình thẩm định 30%</b>, <b>Được phê duyệt 30%</b> (hạn của sản phẩm). Mỗi mốc tính vào tháng của mốc, nên việc làm 2 tháng thì tháng nào cũng có điểm. Cơ quan ngoài duyệt chậm thì xin gia hạn mốc trước hạn, không bị trừ.</p>
<p><b>Ngày nộp</b> là ngày bấm Nộp sản phẩm, không ghi lùi được. Cả tháng không có sản phẩm, mốc nào đến hạn hoặc được nộp, và cũng không có sản phẩm dài nào đang làm, thì phần sản phẩm 0 điểm. Người đang làm sản phẩm dài (hạn sau tháng này) thì không bị 0: tháng đó tính theo chuyên cần và tương tác.</p>
<p>Xếp loại: A từ 90, B từ 75, C từ 60, dưới 60 là D. <b>Thưởng KPI</b>: cả công ty xếp hạng chung, <b>hạng 1 và hạng 2</b> được thưởng. Máy tự chốt lúc 0 giờ ngày 1 tháng sau. Điểm, xếp loại công khai; tiền thưởng của người khác không hiện. Điểm tháng đang chạy (<b>KPI tạm tính</b>) hiện ở trang Nhận nhiệm vụ và đầu trang Công việc.</p>
<p class="note">Cách tính ba chiều áp dụng từ KPI tháng 12/2026 (tháng 11 tính như cũ: công việc 70%, chuyên cần 30%). Sau 3 tháng Công ty đánh giá lại.</p>` },

  { id: 'phieu-luong', title: 'Phiếu lương và xác nhận lương', roles: ALL, shot: 'phieu-luong', html: `
<p>Trong tháng, mục <b>Lương</b> hiện <b>Phiếu lương tạm tính</b> của bạn (tính theo nhận nhiệm vụ, đề xuất, tăng ca đã duyệt tới hôm nay; chưa có thưởng KPI). Trang ghi rõ <b>Lương tạm tính</b>; phiếu tạm tính chỉ để theo dõi, không xác nhận; thấy thiếu ngày công thì lập đề xuất ngay để kịp sửa.</p>
<ol><li>Bảng lương tháng tự chốt lúc 0 giờ ngày 1 tháng sau. Vào <b>Văn phòng → Lương</b>, chọn tháng để xem phiếu lương của mình: ngày công, lương thời gian, phụ cấp, tăng ca, công tác phí, thưởng KPI, bảo hiểm, thuế thu nhập cá nhân, tạm ứng, thực nhận.</li>
<li>Từ ngày 1 đến hết ngày 3 tháng sau: bấm <b>Đồng ý, xác nhận lương</b>, hoặc ghi rõ ý kiến rồi bấm <b>Gửi kiến nghị</b>. Quá hạn coi như đồng ý.</li>
<li>Kế toán trả lời kiến nghị ngay trên phiếu lương. Bấm <b>In, lưu PDF phiếu lương</b> để lưu.</li></ol>
<p>Người <b>Không chấm công</b> lĩnh nguyên lương chính, không phải tự xác nhận lương.</p>
<p class="note">Bạn thấy phiếu lương của chính mình. Bảng lương của phòng: theo quyết định của Giám đốc, <b>chỉ Đoàn Thúy Quyên</b> (người cùng phụ trách Phòng Dự án - Kỹ thuật) được xem, chỉ xem; trưởng phòng không xem. Thông tin tài khoản ngân hàng, số CCCD chỉ Kế toán và Ban giám đốc thấy để chi lương.</p>` },

  { id: 'lich-thong-bao', title: 'Lịch công tác, thông báo', roles: ALL, html: `
<ul><li><b>Lịch công tác</b>: xem theo tuần, chọn <i>Chỉ lịch của tôi</i>; bấm <b>Thêm</b> để tải tệp lịch vào điện thoại, Outlook, Google Calendar; <b>Xuất → Lịch tuần (PDF/Excel)</b> để in.</li>
<li><b>Thông báo nội bộ</b>: thông báo mới có chấm đỏ trên chuông; mở là được ghi nhận đã xem.</li>
<li><b>Hướng dẫn sử dụng</b>: menu Tiện ích → Hướng dẫn sử dụng, có tài liệu này.</li></ul>` },

  { id: 'dieu-hanh-nghiep-vu', title: 'Phần Dự án: Điều hành và Nghiệp vụ', roles: ALL, shot: 'du-an', shots: ['du-an-sua'], html: `
<p>Công ty làm việc như một Ban quản lý dự án (dự án CNTT, chuyển đổi số, đổi mới sáng tạo). Mọi thông tin dự án nằm ở hai nhóm menu bên trái: <b>Điều hành</b> và <b>Nghiệp vụ</b>. Mọi người xem được hết ("không gì phải giấu"); chuyên viên và Trưởng phòng <b>cập nhật</b> trực tiếp.</p>
<table><tr><th>Mục</th><th>Dùng để</th></tr>
<tr><td colspan="2"><b>Điều hành</b></td></tr>
<tr><td>Tổng quan</td><td>Số dự án, vốn, giải ngân, việc quá hạn, cảnh báo của toàn công ty.</td></tr>
<tr><td>Quản lý dự án</td><td>Hồ sơ từng dự án: thẻ <i>Thông tin chung</i>, <i>Công việc</i>, <i>Hồ sơ pháp lý</i> (quyết định, tờ trình, văn bản kèm tệp), <i>Tình trạng thực hiện</i>.</td></tr>
<tr><td>Trình duyệt hồ sơ</td><td>Hồ sơ đang chờ duyệt: thẻ <i>Chờ tôi xử lý</i>, <i>Tôi đang soạn</i>, <i>Tôi đã chuyển</i>, <i>Đã hoàn thành</i>, <i>Lịch sử duyệt</i>.</td></tr>
<tr><td>Trung tâm cảnh báo</td><td>Hợp đồng, bảo lãnh sắp hết hạn, tiến độ chậm, thanh toán vượt giá trị nghiệm thu.</td></tr>
<tr><td>Kế hoạch vốn, giải ngân</td><td>Vốn được giao theo năm, giải ngân thực tế.</td></tr>
<tr><td>Nhà thầu, đơn vị giám sát</td><td>Danh mục đơn vị dùng chung khi lập gói thầu, hợp đồng.</td></tr>
<tr><td colspan="2"><b>Nghiệp vụ</b> (theo giai đoạn dự án)</td></tr>
<tr><td>Chuẩn bị dự án</td><td>Gói thầu tư vấn chuẩn bị (khảo sát, lập báo cáo KTKT, thẩm định), thanh toán chuẩn bị.</td></tr>
<tr><td>Gói thầu và hợp đồng</td><td>Gói thầu, hợp đồng, phụ lục điều chỉnh (chỉ phụ lục đã duyệt mới cộng vào giá trị hợp đồng), nghiệm thu và thanh toán tư vấn.</td></tr>
<tr><td>Tiến độ, nhật ký, khối lượng</td><td>Kế hoạch tiến độ (lập, trình duyệt, cập nhật % thực tế), nhật ký triển khai hằng ngày có ảnh, bảng khối lượng và các đợt nghiệm thu khối lượng.</td></tr>
<tr><td>Nghiệm thu, bàn giao, bảo hành</td><td>Biên bản nghiệm thu, vận hành thử, bàn giao, bảo lãnh bảo hành.</td></tr>
<tr><td>Thanh toán, quyết toán</td><td>Kế hoạch thanh toán theo đợt, hồ sơ thanh toán (đề nghị → trình duyệt → đã chi), quyết toán dự án hoàn thành.</td></tr>
<tr><td>Báo cáo, thống kê</td><td>Báo cáo tổng hợp, in PDF, xuất Excel.</td></tr></table>
<h3>Cập nhật dữ liệu</h3>
<ol><li>Chọn dự án ở ô chọn dự án phía trên (hoặc mở dự án từ <b>Quản lý dự án</b>), vào mục cần cập nhật.</li>
<li>Bấm <b>+ Thêm</b> (ví dụ <i>+ Thêm hồ sơ</i>, <i>+ Thêm gói thầu</i>, <i>+ Thêm nhật ký</i>) hoặc <b>Sửa</b> trên dòng cần sửa; điền các ô có dấu *, đính kèm tệp (PDF, ảnh, Excel); bấm <b>Lưu</b>.</li>
<li>Hồ sơ có quy trình duyệt (kế hoạch tiến độ, đợt nghiệm thu khối lượng, phụ lục hợp đồng, hồ sơ thanh toán, biên bản nghiệm thu) lưu ở trạng thái <b>Soạn thảo</b> (<i>Lưu nháp</i>); đủ hồ sơ thì bấm <b>Chuyển duyệt</b>. Bị trả lại thì xem ý kiến ở thẻ <i>Tôi đang soạn</i>, sửa rồi trình lại. Chỉ hồ sơ <b>đã duyệt</b> mới được tính vào số liệu.</li>
<li><b>Tiến độ % của hợp đồng, gói thầu</b> (mục Quản lý tiến độ) là số liệu của dự án, vẫn cập nhật như trước. Khác với <b>công việc</b> của mỗi người: công việc không báo %, chỉ nộp sản phẩm.</li>
<li>Kế hoạch tiến độ, bảng khối lượng, khối lượng nghiệm thu nhập được từ tệp Excel theo mẫu (nút <i>Nhập Excel</i>, có tệp mẫu để tải).</li></ol>
<h3>Quyền xóa và lịch sử</h3>
<table><tr><th>Vai trò</th><th>Thêm, sửa</th><th>Xóa</th></tr>
<tr><td>Nhân viên (chuyên viên)</td><td>Được</td><td><b>Không</b>. Nhập sai thì sửa lại; cần xóa thì báo Trưởng phòng.</td></tr>
<tr><td>Trưởng phòng, Ban giám đốc</td><td>Được</td><td>Được, sau khi kiểm tra lại.</td></tr></table>
<ul><li>Mọi lần thêm, sửa, xóa đều được ghi lại: mở hồ sơ bằng nút <b>Sửa</b>, cuối biểu mẫu có mục <b>Lịch sử thay đổi</b> (ai, lúc nào, sửa gì). Quản trị xem toàn bộ ở <b>Nhật ký hệ thống</b>.</li>
<li>Xóa hồ sơ là xóa hẳn (chỉ tệp đính kèm vào Thùng rác); cần khôi phục thì Quản trị lấy từ bản sao lưu hằng đêm. Vì vậy chỉ Trưởng phòng, Ban giám đốc được xóa.</li>
<li>Việc của mình trong dự án vẫn làm ở mục <b>Công việc</b>; tab Công việc của dự án và mục Công việc là cùng một dữ liệu. Cập nhật dữ liệu dự án được tính KPI khi được giao thành việc có sản phẩm.</li></ul>` },

  // ---------------- trưởng phòng
  { id: 'tp-giao-viec', title: 'Giao sản phẩm, duyệt gia hạn, nghiệm thu', roles: ['tp', 'gd'], shot: 'giao-viec', shots: ['nghiem-thu'], html: `
<ol><li>Vào <b>Công việc</b>, bấm <b>+ Thêm việc</b>, ô <b>Ai làm</b> chọn <i>Giao cho người khác</i>. Ghi rõ <b>Sản phẩm bàn giao</b> (giao cái gì, để khi nghiệm thu kiểm được) và <b>Tiêu chí đạt</b> nếu cần; chọn <b>Quy mô</b> (Nhỏ, Vừa, Lớn) và <b>Sản phẩm cần cơ quan phê duyệt</b> (Có thì phần mềm tự chia 3 mốc 40/30/30, tự đặt hạn); chọn dự án, gói thầu (hoặc <i>Việc chung của dự án</i>), người thực hiện, hạn bàn giao, mức độ. Người phối hợp, người theo dõi, sản phẩm thành phần, loại công việc: bấm <b>+ Thêm chi tiết</b>.</li>
<li>Thẻ <b>Tôi giao</b>: mọi việc mình đã giao, sản phẩm chờ nghiệm thu ở đầu. Thẻ <b>Phòng tôi phụ trách</b> (Trưởng phòng) hoặc <b>Tất cả</b> (Ban giám đốc): việc của cả phòng, cả công ty. Lọc <i>Quá hạn</i>, <i>Việc tự tạo chờ xác nhận</i>, <i>Chờ nghiệm thu</i>.</li>
<li>Xin gia hạn: mở việc, trong nhật ký bấm <b>Duyệt gia hạn</b> hoặc <b>Từ chối</b>.</li>
<li>Việc tự tạo chờ xác nhận: bấm <b>Xác nhận</b> để tính KPI, hoặc <b>Không nhận</b> (việc chuyển sang Đã hủy).</li>
<li>Sản phẩm chờ nghiệm thu: bấm <b>Nghiệm thu</b>, xem tệp, đường dẫn trong nhật ký rồi chọn <b>Đạt tốt</b> (đúng tiêu chí, không cần sửa), <b>Đạt</b> (dùng được, còn điểm nhỏ) hoặc <b>Chưa đạt</b> (ghi rõ cần sửa gì, chọn hạn sửa). Quá 3 ngày làm việc không nghiệm thu thì việc tự tính <b>Đạt</b>, nên cần nghiệm thu kịp thời.</li>
<li>Đổi hạn sang ngày muộn hơn được tính là gia hạn. Ban giám đốc sửa nhầm hạn thì ở ô <i>Đổi hạn</i> chọn <i>Sửa nhầm hạn</i>.</li></ol>
<p>Đầu trang Công việc hiện mục <b>Việc của phòng, người bạn giao</b>: số việc quá hạn, việc tự tạo chờ xác nhận, sản phẩm chờ nghiệm thu và những người có KPI tạm tính dưới mức C.</p>
<p><b>Giao đúng cách</b>: mỗi việc một sản phẩm kiểm được; sản phẩm cần phê duyệt thì chọn "Có" để phần mềm tự chia mốc; không chia theo từng bước nhỏ. <b>Quy mô</b> chọn theo khối lượng: Nhỏ (vài ngày), Vừa (vài tuần), Lớn (từ một tháng, như báo cáo KTKT). Bị trả lại vì lỗi chất lượng thì chọn <b>Chưa đạt</b> (trừ 20%); chủ đầu tư đổi yêu cầu thì <b>cho gia hạn</b> hoặc giao sản phẩm mới, không trừ điểm người làm. Cập nhật dữ liệu dự án (Điều hành, Nghiệp vụ) muốn tính KPI thì giao thành việc có sản phẩm, ví dụ "Hồ sơ thanh toán đợt 2 gói 03 đủ trên phần mềm".</p>
<p class="note">Không tự nghiệm thu việc của chính mình. Việc có sản phẩm thành phần chưa xong thì chưa nộp được; KPI tính theo từng sản phẩm thành phần.</p>` },


  { id: 'tp-duyet', title: 'Duyệt đề xuất', roles: ['tp', 'gd'], shot: 'duyet', html: `
<ol><li>Vào <b>Đề xuất</b>, thẻ <b>Chờ tôi duyệt</b> (số trong ngoặc là số đề xuất đang chờ).</li>
<li>Mở đề xuất, xem chứng từ đính kèm, bấm <b>Duyệt</b> hoặc <b>Không duyệt</b> (ghi lý do).</li></ol>
<p><b>Ai duyệt cho ai:</b> trưởng bộ phận (trưởng phòng và người cùng phụ trách) duyệt đề xuất của chuyên viên trong phòng, ai duyệt trước cũng được. Giám đốc duyệt đề xuất của trưởng bộ phận. Không ai tự duyệt đề xuất của mình (phần mềm chặn); đề xuất của Giám đốc được duyệt bằng tài khoản Quản trị (admin).</p>` },

  { id: 'tp-kpi', title: 'Hôm nay ai ở đâu, Bảng công, KPI', roles: ['tp', 'gd'], shot: 'hom-nay', html: `
<ol><li>Vào <b>Bảng công</b>, thẻ <b>Hôm nay ai ở đâu</b>: số người ở công ty, online, công tác, khác, có phiếu nghỉ, chưa nhận nhiệm vụ, đi muộn; từng người làm ở đâu. Chọn ngày khác để xem lại.</li>
<li>Thẻ <b>Tổng hợp tháng</b>: mỗi người số ngày công, ở công ty, online, công tác, khác, đi muộn, nghỉ phép, tăng ca, nghỉ không phép; <b>Xuất Excel</b> khi cần. Trưởng phòng thấy phòng mình; Giám đốc và Kế toán thấy toàn công ty.</li>
<li><b>Lương</b>: theo quyết định của Giám đốc, chỉ Đoàn Thúy Quyên (người cùng phụ trách) xem bảng lương của Phòng Dự án - Kỹ thuật, chỉ xem, không sửa, không duyệt chi. Trưởng phòng không xem.</li>
<li><b>KPI</b> máy tự tính và tự chốt lúc 0 giờ ngày 1 tháng sau, không ai phải chấm hay bấm chốt. Cần sửa sai sót thì Ban giám đốc bấm <b>Mở chốt</b>, sửa, bấm <b>Chốt KPI tháng</b>.</li></ol>
<p>Muốn KPI phản ánh đúng: giao việc ghi rõ sản phẩm và hạn bàn giao, nghiệm thu đúng lúc, duyệt gia hạn và xác nhận việc tự tạo kịp thời.</p>` },

  // ---------------- kế toán
  { id: 'kt-nhan-su', title: 'Hồ sơ nhân sự, hồ sơ lương', roles: ['kt'], shot: 'nhan-su', html: `
<ol><li><b>Văn phòng → Nhân sự</b>, bấm tên một người để mở trang hồ sơ: thẻ <b>Thông tin chung</b> (cá nhân, phòng ban, chức vụ, ngày vào làm, ngân hàng, CCCD, người phụ thuộc), <b>Bằng cấp, chứng chỉ</b>, <b>Hợp đồng lao động</b>, <b>Quá trình công tác</b>, <b>Khen thưởng</b>, <b>Kỷ luật</b>, <b>Giấy tờ</b>, <b>Tất cả tệp</b>. Mỗi mục đính kèm được ảnh chụp hoặc bản PDF, bấm <b>Xem</b> để mở ngay. Mỗi người xem hồ sơ của mình ở <b>Hồ sơ của tôi</b>.</li>
<li>Ô <b>Chấm công</b>: chọn <i>Không chấm công</i> cho người không cần nhận nhiệm vụ. Người đó hưởng nguyên lương chính, không cần tự xác nhận lương.</li>
<li>Người sắp nghỉ việc: chỉ cần ghi <b>Ngày nghỉ việc</b> (giữ trạng thái Đang làm việc). Đến hết ngày đó, người này vẫn chấm công và hưởng lương bình thường. Từ hôm sau, phần mềm <b>tự khóa tài khoản</b> và bỏ họ khỏi các danh sách chọn người và KPI. Bảng công, bảng lương tháng cuối vẫn tính đủ; hồ sơ vẫn giữ để tra cứu.</li>
<li><b>Lương → Hồ sơ lương</b>: lương cơ bản, lương đóng bảo hiểm, các khoản phụ cấp, số người phụ thuộc, cách tính thuế, đóng hay không đóng bảo hiểm, mức công tác phí riêng (để trống thì dùng mức chung, 0 là không hưởng; đã lấy sẵn từ e-work).</li></ol>
<p class="note">Thông tin CCCD, ngân hàng là dữ liệu cá nhân (Nghị định 13/2023): chỉ dùng để chi lương, không chụp màn hình gửi ra ngoài.</p>` },

  { id: 'kt-bang-cong', title: 'Bảng công, ngày nghỉ lễ', roles: ['kt'], html: `
<ol><li><b>Bảng công</b>, thẻ <b>Tổng hợp tháng</b>: chọn tháng, xem từng người (ngày công, ở công ty, online, công tác, khác, đi muộn, nghỉ phép, tăng ca, nghỉ không phép); <b>Xuất Excel</b>. Bấm tên để xem chi tiết từng ngày (thẻ <b>Chi tiết nhận nhiệm vụ</b>).</li>
<li><b>+ Bổ sung nhận nhiệm vụ</b> hoặc <b>Điều chỉnh</b> khi có sai sót (ô giờ để trống thì giữ giờ cũ; phần mềm ghi lại người sửa, lý do).</li>
<li>Thẻ <b>Thiết lập</b>: chọn năm, bấm <b>Điền ngày lễ theo luật</b> cho năm mới; thêm ngày nghỉ bù, ngày làm bù theo thông báo của Chính phủ.</li></ol>` },

  { id: 'kt-luong', title: 'Bảng lương tự tính, tự chốt', roles: ['kt'], shot: 'bang-luong', html: `
<ol><li>Vào <b>Lương</b>, chọn tháng. Bảng lương tự tính từ bảng công, đề xuất đã được trưởng bộ phận duyệt, KPI đã chốt và hồ sơ lương. Kế toán không phải nhập lại.</li>
<li>Từng người: <b>Thưởng, khấu trừ khác</b> để thêm khoản ngoài; mục <b>Đề xuất tạm ứng, xăng xe trong tháng</b> chọn <i>Đưa vào lương</i> hoặc không.</li>
<li><b>Bảng lương tự chốt lúc 0 giờ ngày 1 tháng sau</b> (ngay sau khi KPI tự chốt), không ai phải bấm. Có khoản phát sinh thì nhập trước ngày đó; nhập muộn thì <b>Mở chốt</b>, nhập, rồi <b>Chốt bảng lương</b> (đã mở chốt thì phần mềm không tự chốt lại). Trong tháng, trang ghi <b>Lương tạm tính</b> và chỉ có nút <b>Chốt sớm…</b> (không dùng, trừ khi Giám đốc yêu cầu). Nhân viên thấy phiếu lương và xác nhận từ ngày 1 đến ngày 3 tháng sau. Quy định của Công ty: tự chốt <b>0 giờ ngày 1</b>, không đổi.</li>
<li>Kiến nghị: bấm <b>Trả lời kiến nghị</b>. Cần sửa số liệu thì <b>Mở chốt</b>, sửa, chốt lại.</li></ol>
<p><b>Quy tắc tính (theo quy định hiện hành):</b></p>
<ul><li>Bảo hiểm người lao động đóng: BHXH 8%, BHYT 1,5%, BHTN 1%. Trần BHXH, BHYT = 20 lần lương cơ sở (2.530.000 đ từ 01/7/2026); trần BHTN = 20 lần lương tối thiểu vùng (vùng I 5.310.000 đ từ 01/01/2026, Nghị định 293/2025).</li>
<li>Thuế TNCN: biểu 5 bậc từ 01/01/2026 (5%, 10%, 20%, 30%, 35%); giảm trừ bản thân 15,5 triệu, mỗi người phụ thuộc 6,2 triệu.</li>
<li>Phép năm: làm đủ năm được 12 ngày (như e-work, không cộng thêm theo thâm niên); năm đầu tính theo số tháng làm việc. Nghỉ phép trong số phép được hưởng lương; vượt phép trừ lương. Cuối năm còn phép thì trả vào lương tháng 12.</li>
<li>Ngày nghỉ không phép (không nhận nhiệm vụ, không có phiếu nghỉ) trừ lương ngày đó.</li>
<li>Công tác phí theo mức trong Thiết lập (bật hoặc tắt). Tạm ứng, xăng xe theo lựa chọn từng đề xuất.</li></ul>` },

  { id: 'kt-duyet-chi', title: 'Duyệt chi, xuất bảng lương và danh sách chuyển khoản', roles: ['kt', 'gd'], shot: 'duyet-chi', html: `
<ol><li>Sau hạn xác nhận và đã trả lời hết kiến nghị, <b>chỉ Giám đốc</b> bấm <b>Duyệt chi lương</b> (Kế toán lập, Giám đốc duyệt: tách người lập với người duyệt). Còn kiến nghị chờ xử lý thì phần mềm chưa cho duyệt.</li>
<li>Bấm <b>Xuất → Bảng lương kế toán (Excel/PDF)</b>: đủ các cột theo quy định, có chữ ký Người lập biểu, Kế toán trưởng, Giám đốc và cột ký nhận. Dùng để lưu chứng từ.</li>
<li><b>Xuất → Danh sách chuyển khoản ngân hàng</b>: tệp Excel đúng mẫu <i>Danh sách giao dịch</i> của MB Bank (STT, số tài khoản, tên người thụ hưởng, ngân hàng, số tiền, nội dung). Tải lên Internet Banking doanh nghiệp để chi lương.</li>
<li>Đã duyệt chi thì không mở chốt được nữa. Cần sửa thì Giám đốc bấm <b>Hủy duyệt chi</b> trước (chỉ người có quyền duyệt chi, hiện là Giám đốc).</li></ol>
<p>Nội dung chuyển khoản, tài khoản trích nợ đặt trong <b>Lương → Thiết lập</b> (mặc định "TRI THUC THANH TOAN LUONG T{tháng}.{năm}").</p>` },

  // ---------------- ban giám đốc
  { id: 'gd-nhan-su-luong', title: 'Nhân sự, bảng công, bảng lương: xem và duyệt chi', roles: ['gd'], html: `
<p>Kế toán nhập hồ sơ nhân sự, rà bảng công và bảng lương (xem HDSD Kế toán). Giám đốc chỉ cần:</p>
<ul><li><b>Nhân sự</b>, <b>Bảng công → Tổng hợp tháng</b>: xem toàn công ty, xuất Excel khi cần báo cáo.</li>
<li><b>Lương</b>: trong tháng trang ghi <b>Lương tạm tính</b>; bảng tự chốt 0 giờ ngày 1. Sau hạn xác nhận (ngày 3) và đã trả lời hết kiến nghị, bấm <b>Duyệt chi lương</b>; cần sửa sau khi đã duyệt thì <b>Hủy duyệt chi</b> trước.</li>
<li>Duyệt đề xuất của Tám, Đoàn Thúy Quyên, Thanh ở <b>Đề xuất → Chờ tôi duyệt</b>.</li></ul>` },

  { id: 'gd-dieu-hanh', title: 'Điều hành toàn công ty', roles: ['gd'], html: `
<ul><li><b>Bảng công → Hôm nay ai ở đâu</b>: xem nhanh trên điện thoại ai ở công ty, online, công tác, ai chưa nhận nhiệm vụ.</li>
<li>Trang Nhận nhiệm vụ hiện thêm mục <b>Việc của phòng, người bạn giao</b>: số việc quá hạn, việc tự tạo chờ xác nhận, sản phẩm chờ nghiệm thu. Bấm để mở ngay danh sách.</li>
<li><b>Thông báo nội bộ</b>: <b>+ Đăng thông báo</b>, chọn người nhận; xem ai đã đọc (<i>Đã xem</i>).</li>
<li><b>Lịch công tác</b>: <b>+ Thêm lịch</b>, ghi kết luận sau họp, <b>Xuất → Lịch tuần (PDF/Excel)</b>.</li>
<li><b>Dự án</b>: tạo, sửa, xóa dự án, gói thầu (chương <i>Phần Dự án</i>). Dự án là cấp cha, gói thầu là cấp con của công việc; tab Công việc của dự án và mục Công việc là cùng một dữ liệu.</li>
<li>Các trang KPI, Bảng công, Lương, Công việc, Lịch công tác đều có nút <b>Xuất</b> (Excel, PDF) để báo cáo.</li></ul>
<p class="note">Giám đốc vẫn nhận nhiệm vụ, gửi đề xuất và xác nhận phiếu lương của mình như mọi người.</p>` },

  // ---------------- quản trị
  { id: 'qt-tai-khoan', title: 'Tài khoản, vai trò khi nhân sự thay đổi', roles: ['qt'], shot: 'qt-nguoi-dung', html: `
<ol><li><b>Quản trị hệ thống → Người dùng</b>: thêm tài khoản, chọn vai trò (Nhân viên, Trưởng phòng, Kế toán, Ban giám đốc), đặt mật khẩu ban đầu; <b>tài khoản mới</b> phải đổi mật khẩu khi đăng nhập lần đầu (tài khoản chuyển từ e-work giữ mật khẩu cũ).</li>
<li><b>Nhân sự thay đổi</b>: sửa tài khoản, đổi vai trò. Ví dụ nhân viên lên Trưởng phòng: đổi vai trò sang Trưởng phòng và ghi người phụ trách ở <b>Nhân sự → Phòng ban</b> (Sửa phòng ban). Phòng có hai người cùng quản lý thì chọn thêm <b>Người cùng phụ trách</b>.</li>
<li>Người nghỉ việc: Kế toán ghi Ngày nghỉ việc trong hồ sơ, phần mềm tự khóa tài khoản từ hôm sau (không xóa, giữ lịch sử). Cần khóa ngay thì bấm Khóa ở đây.</li>
<li>Vai trò hiện dùng: <b>Nhân viên</b> (g-nv, gồm cả Đỗ Hòa: cố vấn, đặt Không chấm công), <b>Trưởng phòng</b> (g-tp), <b>Kế toán</b> (g-ketoan), <b>Ban giám đốc</b> (g-bgd, chỉ Giám đốc), <b>Quản trị</b> (chỉ tài khoản admin, có xác thực 2 lớp). Phòng ban và người phụ trách: chương <i>Cơ cấu và ai duyệt cho ai</i>.</li>
<li><b>Nhóm, phân quyền</b>: quyền từng phân hệ (không, xem, sửa), ô <i>Duyệt hồ sơ</i> cho Đề xuất và Lương (duyệt chi), ô <b>Không được xóa</b> (được thêm, sửa nhưng không xóa; nhóm Nhân viên đang đặt cho mọi mục phần Dự án). Chỉ sửa khi Công ty đổi quy chế.</li></ol>
<p class="note">Quyền <i>xem</i> một phân hệ Văn phòng (Nhân sự, Bảng công, Đề xuất, KPI, Lương) nghĩa là xem dữ liệu của mọi người. Không cấp cho vai trò Nhân viên.</p>` },

  { id: 'qt-thiet-lap', title: 'Thiết lập hệ thống', roles: ['qt'], html: `
<p><b>Công ty đang dùng</b>: Nhận nhiệm vụ (không chọn việc, không ghi kết quả cuối ngày), quản lý theo kết quả sản phẩm từ 12/2026, không theo dõi tiến độ %, KPI tự động 60/20/20, tự chốt KPI và lương 0 giờ ngày 1. Không đổi khi chưa có quyết định của Giám đốc.</p>
<ul><li><b>Bảng công → Thiết lập</b>: giờ làm, ca sáng chiều, thứ Bảy, số ngày phép năm, có cộng phép theo thâm niên hay không; ô <i>Nhận nhiệm vụ</i> (bật: mỗi ngày bấm một lần, tự chọn nơi làm, không định vị), tên hiển thị của nút, ô có phần chọn việc làm hôm nay và kết quả cuối ngày hay không (Công ty đang tắt vì quản lý theo kết quả).</li>
<li><b>KPI → Thiết lập</b>: mục <b>Quản lý theo kết quả sản phẩm</b> (áp dụng từ tháng, hệ số Đạt tốt, Đạt, có theo dõi tiến độ % hay không), công khai điểm KPI, cách tính (tự động hoàn toàn hoặc có chấm tay), tỷ trọng, xếp hạng chung toàn công ty, số người đứng đầu được thưởng, hệ số mức độ, trễ hạn, chất lượng, trừ gia hạn, mở lại, hệ số phối hợp, xếp loại, thưởng xếp hạng, số ngày nhắc trước hạn, tự chốt KPI (bật/tắt, ngày tự chốt).</li>
<li><b>Lương → Thiết lập</b>: lương cơ sở, lương tối thiểu vùng, tỷ lệ bảo hiểm, giảm trừ, biểu thuế, tỷ lệ tăng ca, số giờ tăng ca tối đa một ngày (bình thường, gấp), tính tăng ca theo tháng duyệt phiếu hay theo ngày tăng ca, đơn giá tăng ca tính trên lương chính + phụ cấp hay chỉ lương chính, thưởng của tháng còn làm trên e-work (lấy theo bảng lương e-work hay theo KPI trên phần mềm), công tác phí, tạm ứng và xăng xe mặc định, tài khoản trích nợ, nội dung chuyển khoản, hạn xác nhận lương.</li>
<li><b>Thông tin đơn vị → Phân hệ sử dụng</b>: ẩn các phân hệ Công ty không dùng.</li>
<li><b>Sao lưu, phục hồi</b>: sao lưu tự động hằng ngày; tải bản sao lưu đầy đủ trước mỗi lần cập nhật.</li>
<li>Tài khoản quản trị bắt buộc xác thực 2 lớp (ứng dụng Authenticator, mục "e-work Trithuc").</li></ul>` },

  { id: 'qt-ework', title: 'Chuyển dữ liệu và chạy song song e-work cũ', roles: ['qt'], html: `
<ul><li>Dữ liệu e-work (nhân sự, chấm công, đề xuất, lịch họp, thông báo, hồ sơ lương, dự án, công việc) đã chuyển sang; bảng cũ lưu tại <b>Dữ liệu e-work cũ</b> để tra cứu.</li>
<li>Đến hết tháng 11/2026, ngày nhận nhiệm vụ được chép sang cơ sở dữ liệu e-work cũ mỗi 5 phút: thêm dòng mới; dòng do phần mềm mới chép mà sau đó sửa (điều chỉnh, giải trình được duyệt) thì cập nhật đúng dòng đó; không xóa. Phần cập nhật cần quyền UPDATE trên bảng ChamCongs của e-work.</li>
<li>Đối chiếu lương tháng 11 với e-work cũ: bên kỹ thuật chạy trên máy chủ ngày 01/12 (phụ lục kỹ thuật: lệnh <code>--doi-chieu-luong 2026-11</code>).</li></ul>` },
];
