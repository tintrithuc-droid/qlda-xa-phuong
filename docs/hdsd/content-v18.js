// Các chương bổ sung: mã kiểm tra khi đăng nhập, mật khẩu riêng ở lần đầu, menu theo giai đoạn, Trung tâm cảnh báo,
// lưu nháp và chuyển duyệt, theo dõi hồ sơ, thiết lập quy trình duyệt, danh mục nhà thầu và đơn vị giám sát,
// nghiệm thu sản phẩm tư vấn, tài khoản thuộc đơn vị, tạo lập dữ liệu đầu kỳ.
// Tài liệu gửi xã không nêu số phiên bản hay ngày phát hành, chỉ mô tả cách dùng.
const img = (f, cap, w = 16) => ({ img: f, cap, w });
const legend = items => ({ legend: items });
const S18 = {};

S18.loginCaptcha = () => [
  { p: 'Nhập sai mật khẩu từ 3 lần trở lên, phần mềm hỏi thêm **Mã kiểm tra**: một dãy chữ số in trên ảnh (1). Ảnh khó đọc thì nhấn **Đổi mã khác** (2). Gõ dãy số vào ô **Mã kiểm tra** (3), nhập lại mật khẩu đúng rồi nhấn **Đăng nhập**.' },
  img('chung-ma-kiem-tra', 'Mã kiểm tra hiện ra sau vài lần nhập sai mật khẩu', 9),
  legend([[1, 'Ảnh mã kiểm tra'], [2, 'Lấy mã khác khi ảnh khó đọc'], [3, 'Ô nhập mã kiểm tra']]),
  { note: 'Phần mềm không khóa tài khoản khi có người nhập sai mật khẩu, nên không ai cố tình làm khóa được tài khoản của cán bộ. Máy nào thử mật khẩu liên tục thì bị chặn tạm 15 phút, các máy khác vẫn đăng nhập bình thường. Quên mật khẩu, đề nghị quản trị hệ thống đặt lại; không chia sẻ mật khẩu cho người khác.' },
];

S18.firstPassword = () => [
  { h2: 'Đặt mật khẩu riêng ở lần đăng nhập đầu' },
  { p: 'Tài khoản do quản trị hệ thống tạo mới hoặc vừa được đặt lại mật khẩu phải đổi sang mật khẩu của riêng mình ngay lần đăng nhập đầu tiên. Nhập **Mật khẩu ban đầu** được cấp, **Mật khẩu mới** (tối thiểu 8 ký tự, có cả chữ và số), nhập lại mật khẩu mới và nhấn **Lưu mật khẩu và vào hệ thống**. Từ lần sau chỉ dùng mật khẩu mới; quản trị hệ thống cũng không biết mật khẩu này.' },
  img('chung-doi-mat-khau-lan-dau', 'Đặt mật khẩu riêng ở lần đăng nhập đầu', 12),
];

S18.menuPhases = () => [
  { h2: 'Menu Nghiệp vụ theo giai đoạn' },
  { p: 'Nhóm **Nghiệp vụ** trên thanh chức năng chia theo hai giai đoạn của dự án. **Chuẩn bị đầu tư** (1) gồm gói thầu tư vấn khảo sát, lập báo cáo kinh tế - kỹ thuật, thiết kế, dự toán và việc nghiệm thu, thanh toán các gói đó. **Thực hiện đầu tư** (2) gồm giải phóng mặt bằng, gói thi công, mua sắm, tư vấn giám sát cùng tiến độ, nhật ký, khối lượng, nghiệm thu, thanh toán và quyết toán.' },
  img('kt-menu-giai-doan', 'Menu Nghiệp vụ chia theo giai đoạn chuẩn bị đầu tư và thực hiện đầu tư', 16),
  legend([[1, 'Các mục của giai đoạn chuẩn bị đầu tư'], [2, 'Các mục của giai đoạn thực hiện đầu tư'], [3, 'Nhãn giai đoạn của trang đang mở'], [4, 'Các thẻ: gói thầu và hợp đồng, danh mục nhà thầu, danh mục đơn vị giám sát']]),
  { p: 'Hai giai đoạn dùng chung một kho dữ liệu: mỗi gói thầu thuộc một giai đoạn, hợp đồng và hồ sơ của hợp đồng đi theo giai đoạn của gói thầu, không phải nhập hai lần. Báo cáo, Tổng quan và Trung tâm cảnh báo vẫn tính đủ cả hai giai đoạn.' },
];

S18.alerts = () => [
  { h1: 'TRUNG TÂM CẢNH BÁO' },
  { p: 'Trang **Trung tâm cảnh báo** (ngay dưới Trình duyệt hồ sơ trên thanh chức năng) gom mọi cảnh báo trong phạm vi được giao về một chỗ: hợp đồng sắp hết hạn hoặc quá hạn, bảo lãnh sắp hết hiệu lực, hạng mục chậm tiến độ, kế hoạch thanh toán trễ, hồ sơ pháp lý hết hiệu lực, bảo hành sắp hết hạn, dự án chậm giải ngân, giá trị hợp đồng vượt giá gói thầu, tổng giá trị hợp đồng vượt tổng mức đầu tư.' },
  img('chung-canh-bao', 'Trung tâm cảnh báo', 16),
  legend([[1, 'Lọc theo mức độ (đỏ, vàng), dự án, nhóm cảnh báo; tìm theo nội dung'], [2, 'Xem: mở đúng hồ sơ cần xử lý'], [3, 'Xuất danh sách cảnh báo ra Excel']]),
  { bullets: [
    '**Mức đỏ**: đã quá hạn hoặc nghiêm trọng, cần xử lý ngay. **Mức vàng**: sắp đến hạn, cần theo dõi.',
    'Nhấn **Xem** (2) trên dòng cảnh báo để mở thẳng gói thầu, hợp đồng, kế hoạch thanh toán hay dự án liên quan.',
    'Bảo lãnh tạm ứng chỉ được nhắc khi hợp đồng còn dư nợ tạm ứng chưa thu hồi hết.',
    'Số màu đỏ cạnh từng mục trên thanh chức năng là số cảnh báo của mục đó; cảnh báo của gói thầu chuẩn bị đầu tư được đếm vào mục của giai đoạn chuẩn bị đầu tư.',
  ] },
];

// Lưu nháp, chuyển duyệt, theo dõi hồ sơ: dùng chung cho người lập hồ sơ
S18.sendFlow = () => [
  { h2: 'Lưu nháp, lưu và chuyển duyệt' },
  { p: 'Các biểu mẫu của hồ sơ theo quy trình duyệt có hai nút: **Lưu nháp** (1) giữ hồ sơ ở trạng thái soạn thảo để bổ sung tiếp; **Lưu và chuyển duyệt** (2) lưu rồi mở ngay hộp chuyển hồ sơ sang bước xử lý đầu tiên.' },
  img('chung-luu-nhap', 'Biểu mẫu có nút Lưu nháp và Lưu và chuyển duyệt', 12),
  legend([[1, 'Lưu nháp'], [2, 'Lưu và chuyển duyệt']]),
  { p: 'Hộp **Chuyển duyệt** cho biết hồ sơ sẽ đi qua những bước nào (1). Có thể chọn đích danh người xử lý bước tiếp theo (2), ví dụ một lãnh đạo cụ thể; để trống thì mọi người có quyền ở bước đó đều thấy hồ sơ. Nhập ý kiến kèm theo (3) rồi nhấn **Chuyển duyệt**. Trên dòng hồ sơ cũng có nút **Chuyển duyệt** cho hồ sơ đã lưu nháp trước đó.' },
  img('chung-chuyen-duyet', 'Hộp chuyển duyệt: các bước của quy trình, chọn người xử lý', 12),
  legend([[1, 'Các bước hồ sơ sẽ đi qua'], [2, 'Chọn đích danh người xử lý (không bắt buộc)'], [3, 'Ý kiến kèm theo']]),
  { note: 'Loại hồ sơ nào được quản trị hệ thống tắt quy trình duyệt thì nút trên dòng hồ sơ là **Ghi nhận**: hồ sơ có hiệu lực ngay, không qua bước duyệt.' },
  { h2: 'Theo dõi hồ sơ đã chuyển' },
  { p: 'Trang **Trình duyệt hồ sơ** có các thẻ (1): **Chờ tôi xử lý** (hồ sơ đến lượt mình), **Tôi đang soạn** (bản nháp và hồ sơ bị trả lại), **Tôi đã chuyển** (hồ sơ mình chuyển đang chờ người khác), **Đã hoàn thành**, **Tất cả đang xử lý** và **Lịch sử duyệt**. Mỗi dòng ghi hồ sơ đang ở bước nào, ai đang giữ và hạn xử lý (2); quá hạn thì nhãn chuyển màu đỏ.' },
  img('chung-theo-doi-ho-so', 'Thẻ Tôi đã chuyển: bước hiện tại, người đang giữ, hạn xử lý', 16),
  legend([[1, 'Các thẻ theo dõi hồ sơ'], [2, 'Bước đang xử lý, người đang giữ, hạn xử lý'], [3, 'Rút lại hồ sơ vừa chuyển'], [4, 'In phiếu trình']]),
  { bullets: [
    '**Rút lại** (3): khi người ở bước sau chưa xử lý, người vừa chuyển rút hồ sơ về để sửa tiếp.',
    '**In phiếu trình** (4): in phiếu trình khổ A4 gồm thông tin hồ sơ, các bước đã qua, ý kiến của từng người và ô ký, dùng khi cần lưu bản giấy.',
    '**Lịch sử**: xem toàn bộ các lần chuyển, kiểm tra, duyệt, trả lại của hồ sơ.',
  ] },
  { p: 'Nút chuông (1) trên thanh công cụ phía trên báo số hồ sơ đang chờ mình xử lý. Nhấn vào chuông để xem danh sách thông báo (2): hồ sơ mới đến lượt, hồ sơ bị trả lại, hồ sơ đã được duyệt; nhấn một dòng để mở đúng thẻ trên trang Trình duyệt hồ sơ.' },
  img('chung-chuong', 'Chuông thông báo trình duyệt', 16),
  legend([[1, 'Chuông thông báo và số việc cần xử lý'], [2, 'Danh sách thông báo']]),
];

S18.workflowAdmin = () => [
  { h1: 'THIẾT LẬP QUY TRÌNH DUYỆT' },
  { p: 'Quản trị hệ thống tự thiết lập quy trình duyệt cho từng loại hồ sơ, không cần sửa phần mềm. Mở **Trình duyệt hồ sơ**, chọn thẻ **Thiết lập quy trình** (1).' },
  img('qt-quy-trinh', 'Quy trình duyệt theo loại hồ sơ', 16),
  legend([[1, 'Thẻ Thiết lập quy trình'], [2, 'Phạm vi: quy trình chung hoặc quy trình riêng của một dự án'], [3, 'Bật, tắt quy trình duyệt cho loại hồ sơ'], [4, 'Thiết lập các bước'], [5, 'Nguyên tắc xử lý chung']]),
  { bullets: [
    'Các loại hồ sơ: kế hoạch tiến độ, đợt nghiệm thu khối lượng, phụ lục hợp đồng, hồ sơ thanh toán, biên bản nghiệm thu, hợp đồng, kế hoạch thanh toán, hồ sơ pháp lý.',
    '**Áp dụng** (3): bỏ đánh dấu thì hồ sơ loại đó được ghi nhận ngay khi lưu, không qua duyệt. Ví dụ xã không cần duyệt hồ sơ thanh toán trong phần mềm thì tắt ở đây.',
    'Chọn **Quy trình riêng** của một dự án (2) khi dự án đó cần cách duyệt khác; loại hồ sơ chưa thiết lập riêng thì dùng quy trình chung.',
  ] },
  { h2: 'Thiết lập các bước' },
  { p: 'Nhấn **Thiết lập bước** (4) trên dòng loại hồ sơ. Mỗi bước gồm: tên bước, tên nút xử lý (ví dụ «Kiểm tra đạt», «Xác nhận khối lượng», «Duyệt»), nhóm người dùng hoặc người cụ thể được xử lý, khi trả lại thì về người lập hay về bước trước, số ngày làm việc phải xử lý, và khoảng giá trị áp dụng.' },
  img('qt-sua-quy-trinh', 'Thiết lập các bước của quy trình', 13),
  legend([[1, 'Áp dụng quy trình cho loại hồ sơ'], [2, 'Thêm bước'], [3, 'Đổi thứ tự bước'], [4, 'Lưu quy trình']]),
  { bullets: [
    'Bước cuối cùng là bước **Duyệt**; hồ sơ được duyệt ở bước này mới có hiệu lực (tính vào giá trị hợp đồng, khối lượng nghiệm thu, tiến độ, số liệu thanh toán…).',
    'Bước không chọn nhóm, người xử lý thì dùng quyền **Kiểm tra hồ sơ** (bước giữa) hoặc **Duyệt hồ sơ** (bước cuối) của nhóm người dùng.',
    '**Khoảng giá trị**: bước chỉ áp dụng khi giá trị hồ sơ nằm trong khoảng đã nhập. Ví dụ hợp đồng từ 1 tỷ đồng trở lên mới qua bước thẩm định; hợp đồng nhỏ hơn đi thẳng đến bước duyệt.',
    '**Hạn xử lý**: số ngày làm việc kể từ khi hồ sơ đến bước; quá hạn, hồ sơ hiện nhãn đỏ ở trang Trình duyệt hồ sơ.',
    'Đợt nghiệm thu khối lượng mặc định có bước **Tư vấn giám sát xác nhận** trước bước Lãnh đạo Ban duyệt. Đợt nghiệm thu sản phẩm tư vấn giai đoạn chuẩn bị đầu tư tự bỏ qua bước này.',
  ] },
  { h2: 'Nguyên tắc xử lý' },
  { bullets: [
    'Hồ sơ chuyển đích danh thì chỉ người được chọn (hoặc quản trị) xử lý bước đó.',
    'Người chuyển duyệt hồ sơ không tự xử lý các bước sau của chính hồ sơ đó.',
  ] },
  { note: 'Hồ sơ đang trên đường duyệt giữ nguyên các bước đã có lúc chuyển; quy trình mới áp dụng cho hồ sơ chuyển sau khi lưu. Mọi lần thay đổi quy trình được ghi vào nhật ký hoạt động.' },
];

S18.orgs = (edit) => [
  { h1: 'DANH MỤC NHÀ THẦU, ĐƠN VỊ GIÁM SÁT' },
  { p: 'Mục **Gói thầu và hợp đồng** có thêm hai thẻ **Danh mục nhà thầu** (1) và **Danh mục đơn vị giám sát** (2). Mỗi đơn vị được nhập một lần (tên, mã số thuế, địa chỉ, người đại diện, tài khoản ngân hàng, chứng chỉ năng lực) và chọn lại ở mọi gói thầu, không phải gõ tay nhiều lần.' },
  img('kt-danh-muc-nha-thau', 'Danh mục nhà thầu', 16),
  legend([[1, 'Danh mục nhà thầu'], [2, 'Danh mục đơn vị giám sát'], [3, 'Thêm nhà thầu'], [4, 'Nhấn một dòng để xem đủ thông tin, gói thầu và tài khoản của đơn vị']]),
  ...(edit ? [
    { h2: 'Thêm nhà thầu, đơn vị giám sát' },
    { steps: [
      'Mở thẻ danh mục cần thêm, nhấn **+ Thêm nhà thầu** hoặc **+ Thêm đơn vị giám sát** (3).',
      'Nhập tên theo giấy chứng nhận đăng ký doanh nghiệp, tên viết tắt, mã số thuế, địa chỉ, điện thoại, người đại diện, số tài khoản và ngân hàng, chứng chỉ năng lực hoạt động xây dựng, lĩnh vực hoạt động; đính kèm giấy chứng nhận, chứng chỉ, hồ sơ năng lực.',
      'Nhấn **Lưu**. Phần mềm báo nếu tên hoặc mã số thuế đã có trong danh mục, tránh nhập trùng.',
    ] },
    img('kt-them-nha-thau', 'Hộp thêm nhà thầu', 12),
    { note: 'Một công ty vừa thi công vừa làm tư vấn giám sát thì có một bản ghi ở mỗi danh mục. Đơn vị đã được chọn ở gói thầu hoặc có tài khoản người dùng thì không xóa được; khi ngừng hợp tác, chuyển trạng thái sang **Ngừng hoạt động**.' },
    { h2: 'Chọn nhà thầu, đơn vị giám sát cho gói thầu' },
    { steps: [
      'Mở biểu mẫu thêm hoặc sửa gói thầu. Chọn **Giai đoạn** (1): chuẩn bị đầu tư hoặc thực hiện đầu tư.',
      'Tại **Nhà thầu trúng thầu** (2), gõ vài chữ rồi chọn trong danh mục; tên chưa có sẽ được thêm vào danh mục nhà thầu khi lưu.',
      'Gói thầu do liên danh thực hiện: đánh dấu các thành viên khác ở **Thành viên liên danh** (3) và nhập tên liên danh.',
      'Đánh dấu một hoặc nhiều **Đơn vị giám sát độc lập** (4); đơn vị chưa có thì gõ tên ở ô bên dưới, cách nhau dấu chấm phẩy.',
      'Nhấn **Lưu**. Khi nhập hợp đồng của gói thầu, ô nhà thầu được điền sẵn theo nhà thầu đã chọn.',
    ] },
    img('kt-goi-thau-chon-nha-thau', 'Chọn giai đoạn, nhà thầu và đơn vị giám sát cho gói thầu', 13),
    legend([[1, 'Giai đoạn của gói thầu'], [2, 'Nhà thầu trúng thầu'], [3, 'Thành viên liên danh'], [4, 'Đơn vị giám sát độc lập']]),
  ] : []),
  { p: 'Trang chi tiết gói thầu có khung **Nhà thầu và đơn vị giám sát** (1) với mã số thuế, người đại diện, điện thoại, chứng chỉ của từng đơn vị; nhấn tên đơn vị để xem đủ thông tin.' },
  img('kt-the-nha-thau', 'Khung nhà thầu và đơn vị giám sát ở chi tiết gói thầu', 16),
  legend([[1, 'Nhà thầu và đơn vị giám sát của gói thầu']]),
];

S18.prepAcceptance = (k) => {
  const out = [{ h1: 'NGHIỆM THU SẢN PHẨM TƯ VẤN' },
    { p: 'Hợp đồng tư vấn giai đoạn chuẩn bị đầu tư (khảo sát, lập báo cáo kinh tế - kỹ thuật, thiết kế, dự toán…) nghiệm thu và thanh toán theo **sản phẩm**, không theo khối lượng. Mở **Chuẩn bị đầu tư › Nghiệm thu, thanh toán**, chọn hợp đồng ở ô phía trên bên phải, thẻ **Nghiệm thu sản phẩm** (1).' },
    img('kt-nghiem-thu-san-pham', 'Nghiệm thu sản phẩm của hợp đồng tư vấn', 16),
    legend([[1, 'Thẻ Nghiệm thu sản phẩm'], [2, 'Thêm sản phẩm theo hợp đồng'], [3, 'Lập đợt nghiệm thu sản phẩm'], [4, 'Sản phẩm, giá trị theo hợp đồng, đã nghiệm thu, tình trạng'], [5, 'Các đợt nghiệm thu và trạng thái duyệt']]),
  ];
  if (k === 'kt') out.push(
    { steps: [
      'Nhấn **+ Thêm sản phẩm** (2), nhập ký hiệu, tên sản phẩm và giá trị theo hợp đồng. Lặp lại cho từng sản phẩm; tổng giá trị các sản phẩm nên bằng giá trị hợp đồng.',
      'Khi có biên bản nghiệm thu, nhấn **+ Nghiệm thu sản phẩm** (3). Nhập tên đợt, số biên bản, ngày nghiệm thu (1) và giá trị nghiệm thu đợt này của từng sản phẩm (2); đính kèm biên bản đã ký.',
      'Nhấn **Lưu**, rồi nhấn **Chuyển duyệt** trên dòng đợt. Đợt nghiệm thu sản phẩm đi thẳng đến Lãnh đạo Ban duyệt, không qua bước tư vấn giám sát xác nhận.',
    ] },
    img('kt-lap-dot-san-pham', 'Lập đợt nghiệm thu sản phẩm theo giá trị', 13),
    legend([[1, 'Số biên bản nghiệm thu'], [2, 'Giá trị nghiệm thu đợt này của từng sản phẩm']]),
    { p: 'Lũy kế giá trị nghiệm thu của một sản phẩm không được vượt giá trị theo hợp đồng: dòng vượt tô đỏ (1) và phần mềm không cho lưu (2). Cần điều chỉnh thì lập phụ lục hợp đồng, sửa giá trị sản phẩm rồi mới nghiệm thu tiếp.' },
    img('kt-chan-vuot-gia-tri', 'Phần mềm chặn nghiệm thu vượt giá trị sản phẩm', 13),
    legend([[1, 'Dòng sản phẩm bị vượt giá trị'], [2, 'Thông báo không lưu được']]),
  );
  if (k === 'ke') out.push({ p: 'Giá trị sản phẩm đã nghiệm thu (đợt đã được duyệt) là căn cứ lập hồ sơ thanh toán của hợp đồng tư vấn. Kế hoạch thanh toán, hồ sơ thanh toán của hợp đồng giai đoạn chuẩn bị đầu tư lập ngay trên trang **Chuẩn bị đầu tư › Nghiệm thu, thanh toán**, các thẻ **Kế hoạch thanh toán** và **Hồ sơ thanh toán**, cách làm như ở mục Quản lý thanh toán.' });
  if (k === 'ld') out.push({ p: 'Đợt nghiệm thu sản phẩm do cán bộ chuyển duyệt hiện trong thẻ **Chờ tôi xử lý** của trang Trình duyệt hồ sơ, duyệt như đợt nghiệm thu khối lượng. Sau khi duyệt, giá trị đã nghiệm thu được tính vào tiến độ hợp đồng và làm căn cứ thanh toán.' });
  return out;
};

S18.orgUser = () => [
  { h2: 'Tài khoản của nhà thầu, đơn vị giám sát' },
  { p: 'Khi tạo tài khoản cho cán bộ của nhà thầu hoặc đơn vị giám sát, chọn nhóm **Tư vấn giám sát / Nhà thầu** và chọn đơn vị ở ô **Thuộc đơn vị** (1). Tài khoản tự thấy đúng các gói thầu mà đơn vị được chọn (là nhà thầu, thành viên liên danh hoặc đơn vị giám sát), cùng hợp đồng, khối lượng, tiến độ, nhật ký của các gói đó; không cần giao phạm vi dự án cho từng tài khoản.' },
  img('qt-tai-khoan-don-vi', 'Tài khoản thuộc đơn vị nhà thầu', 12),
  legend([[1, 'Thuộc đơn vị']]),
  { note: 'Cán bộ của Ban để trống ô Thuộc đơn vị. Đơn vị đổi gói thầu (thêm, bớt) thì phạm vi của tài khoản tự đổi theo.' },
];

S18.opening = () => [
  { h1: 'TẠO LẬP DỮ LIỆU ĐẦU KỲ' },
  { p: 'Khi bắt đầu dùng phần mềm cho các dự án đang làm dở, quản trị hệ thống đưa toàn bộ số liệu đang có vào một lần qua bộ mẫu Excel, không phải gõ tay từng hồ sơ. Mở **Quản trị hệ thống**, thẻ **Dữ liệu đầu kỳ** (1).' },
  img('qt-du-lieu-dau-ky', 'Tạo lập dữ liệu đầu kỳ', 16),
  legend([[1, 'Thẻ Dữ liệu đầu kỳ'], [2, 'Tải bộ mẫu Excel']]),
  { steps: [
    'Nhấn **Tải bộ mẫu trống (.xlsx)** (2). Mỗi trang của tệp Excel ghi rõ bộ phận nào điền: dự án, kế hoạch vốn, hồ sơ pháp lý, hạng mục, gói thầu (có cột giai đoạn), hợp đồng, phụ lục, bảng khối lượng, khối lượng nghiệm thu lũy kế, tạm ứng, thanh toán, kế hoạch tiến độ.',
    'Chuyển tệp cho các bộ phận điền, rồi nhận lại và chọn tệp để phần mềm kiểm tra. Phần mềm kiểm tra toàn bộ trước khi ghi: còn lỗi ở dòng nào thì báo đúng trang, đúng dòng và không ghi dòng nào cả.',
    'Hết lỗi, nhấn **Ghi dữ liệu đầu kỳ**. Nhập lại cùng tệp không làm nhân đôi số liệu.',
    'Xem **Bảng đối soát theo hợp đồng**: giá trị gồm phụ lục, nghiệm thu lũy kế, tạm ứng, thu hồi tạm ứng, đã thanh toán, còn lại. Xuất Excel hoặc in có ô ký của ba bên để các bộ phận xác nhận số liệu đầu kỳ.',
    'Dùng **Tải hồ sơ scan hàng loạt** để chọn nhiều tệp scan cùng lúc; phần mềm tự gắn tệp vào đúng hồ sơ theo số hiệu ghi trong tên tệp.',
  ] },
  { note: 'Trước khi dùng thật, nếu đã chạy thử với dữ liệu mẫu, dùng **Dọn dữ liệu chạy thử**: phần mềm sao lưu trước rồi mới xóa, nên vẫn khôi phục được khi cần.' },
];

S18.realExcel = () => ({ note: 'Nút **Nhập từ Excel** nhận được cả tệp thực tế của nhà thầu, tư vấn: bảng giá theo Mẫu số 11B, bảng dự toán (phần mềm tự tìm dòng tiêu đề, lấy dòng nhóm làm Nhóm công việc, bỏ các dòng tổng), biên bản nghiệm thu dạng Excel để điền đợt nghiệm thu, tiến độ dạng biểu đồ ngang có cột «ngày thứ».' });

S18.restoreModes = () => ({ p: 'Khi phục hồi từ tệp, chọn một trong hai cách: **Đưa dữ liệu về đúng thời điểm sao lưu** (khuyến nghị): hồ sơ nhập sau thời điểm đó bị bỏ, phần mềm tự sao lưu dữ liệu hiện tại trước khi phục hồi và yêu cầu gõ chữ xác nhận; hoặc **Chỉ ghi đè, bổ sung**: giữ hồ sơ nhập sau thời điểm sao lưu, chỉ ghi đè bản ghi trùng mã.' });

module.exports = { S18 };
