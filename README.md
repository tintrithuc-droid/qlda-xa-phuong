# Phần mềm quản lý dự án đầu tư xây dựng: bản dùng chung cho Ban QLDA xã/phường

Sản phẩm của Công ty Cổ phần Tin học Tri Thức. Phát triển từ phần mềm QLDA của Ban QLDA Trung tâm Thủy sản TP.HCM
(kho `tintrithuc-droid/qlda-ttts-hcm`, phiên bản 1.0 ngày 01/11/2026), đổi sang nhận diện trung tính và dữ liệu mẫu cấp xã.
Mỗi đơn vị tự đặt logo, tên đơn vị, banner, chân trang tại Quản trị hệ thống → Thông tin đơn vị, giao diện.

77 chức năng, 11 phân hệ:
quản lý dự án, mô hình hóa công trình (lưu trữ tệp mô hình theo phiên bản), gói thầu và hợp đồng, tiến độ (Gantt, đường cong S),
nhật ký thi công, khối lượng, thanh toán, báo cáo thống kê, quản trị hệ thống và ứng dụng hiện trường trên điện thoại.

Phiên bản 1.1 (03/11/2026) bổ sung theo chức năng, nhiệm vụ của Ban QLDA cấp xã (Luật Xây dựng 135/2025/QH15, Nghị định 217/2026/NĐ-CP,
Nghị định 207/2026/NĐ-CP; thực tiễn TP Cần Thơ sau sắp xếp chính quyền 2 cấp):
- Dự án ghi vai trò của Ban (chủ đầu tư, quản lý dự án, tư vấn QLDA), người quyết định đầu tư, hình thức quản lý dự án, loại dự án;
- **Kế hoạch vốn, giải ngân**: kế hoạch trung hạn, vốn năm, bổ sung/điều chỉnh, giải ngân so với kịch bản quý, cảnh báo chậm giải ngân;
- **Giải phóng mặt bằng**: bồi thường, chi trả, bàn giao mặt bằng theo khu vực, cảnh báo chậm bàn giao;
- **Nghiệm thu, bàn giao, bảo hành**: nghiệm thu theo giai đoạn, hoàn thành, bàn giao sử dụng, cảnh báo hết bảo hành;
- **Quyết toán dự án**: hạn lập, thẩm tra, phê duyệt, tất toán, cảnh báo quá hạn;
- Nhóm người dùng "Lãnh đạo UBND xã (người quyết định đầu tư)" chỉ xem; danh mục nguồn vốn, hồ sơ pháp lý, hình thức LCNT cập nhật.
Hệ thống đang chạy được nâng cấp tự động khi cài bản mới (bảng, danh mục, quyền của nhóm có sẵn).
Phiên bản 1.3 (03/11/2026) làm mới giao diện:
- Mỗi người dùng tự chọn **Giao diện** (nút bảng màu trên thanh trên cùng, mục Tài khoản hoặc menu): chế độ sáng/tối/tự động, 6 tông màu
  (xanh hành chính, xanh ngọc, tím than, xanh lá, cam đất, than chì), thanh điều hướng nền đậm hoặc sáng, 4 cỡ chữ, mật độ thoáng/gọn;
  lưu theo tài khoản trên máy chủ (`/api/auth/ui`, bảng Settings, khóa `ui:<mã người dùng>`), đăng nhập máy khác vẫn giữ;
- Mọi bảng tự căn độ rộng cột: cột ngắn (mã, trạng thái, số tiền, ngày) không xuống dòng, cột chữ dài có độ rộng tối thiểu dễ đọc,
  bảng rộng hơn khung thì cuộn ngang và giữ cố định cột đầu; bộ lọc báo cáo xếp lưới đều cột.
Phiên bản 1.5 (05/11/2026) theo đề xuất của bộ phận Triển khai:
- **Trình duyệt kế hoạch tiến độ**: kế hoạch lập ở trạng thái Soạn thảo, Lãnh đạo Ban duyệt; chỉ kế hoạch đã duyệt mới tính tiến độ,
  đường cong S, cảnh báo và được cập nhật thực tế; kế hoạch có sẵn khi nâng cấp được coi là đã duyệt;
- **Nhập từ Excel**: bảng khối lượng hợp đồng, khối lượng thực hiện/nghiệm thu, kế hoạch tiến độ (tệp mẫu, xem trước, đánh dấu dòng lỗi);
- Hồ sơ thanh toán bị trả lại có nhãn riêng, không chiếm hạn mức hợp đồng, không cộng vào "Đang đề nghị"; máy chủ kiểm tra hạn mức khi trình, duyệt;
- Thẻ Tổng cộng trên điện thoại có nhãn từng cột; thẻ công việc nhật ký: tên và nút xóa cùng một hàng.
Trang **Danh mục chức năng** trong phần mềm liệt kê từng chức năng và nơi thực hiện trong phần mềm.

## Công nghệ

- ASP.NET Core 8 (C#), Entity Framework Core 8, chạy trên Linux hoặc Windows
- Cơ sở dữ liệu chọn theo `Database:Provider`:
  - `PostgreSQL` (khuyến nghị cho xã/phường, chi phí thấp): máy chủ Linux + Docker, xem [docs/HUONG_DAN_CAI_DAT_LINUX.md](docs/HUONG_DAN_CAI_DAT_LINUX.md); migration ở `Data/MigrationsPg`
  - `PostgreSQL` trên Windows: gói cài Windows có sẵn PostgreSQL 16 và phần mềm chạy thành dịch vụ Windows, không cần IIS, SQL Server hay .NET,
    xem [docs/HUONG_DAN_CAI_DAT_WINDOWS.md](docs/HUONG_DAN_CAI_DAT_WINDOWS.md); đóng gói bằng `deploy/windows/build-package.sh`
  - `SqlServer`: máy chủ Windows/IIS có sẵn SQL Server, xem [docs/HUONG_DAN_CAI_DAT.md](docs/HUONG_DAN_CAI_DAT.md); migration ở `Data/Migrations`
  - `Sqlite`: bản demo trên máy cá nhân, đơn vị rất nhỏ
- Giao diện web một trang, đáp ứng máy tính và điện thoại, cài được lên màn hình chính (PWA)

## Cấu trúc

```
src/QldaTtts.Web/
  Controllers/   API: auth, data (CRUD có phân quyền + phạm vi dự án), users, files, backup
  Data/          Thực thể, DbContext, migration SQL Server
  Services/      Phân quyền người dùng, danh sách tập dữ liệu, mật khẩu
  wwwroot/       Giao diện (js/, css/), service worker, manifest
deploy/          install.ps1 (cài IIS), build-package.ps1, sql/ (lược đồ CSDL)
deploy/windows/  cai-dat.ps1, CAI_DAT.bat, go-cai-dat.ps1, sao-luu.ps1, build-package.sh (Windows + PostgreSQL đi kèm)
deploy/linux/    install.sh, docker-compose.yml, sao-luu-csdl.sh, build-package.sh (Docker + PostgreSQL)
Dockerfile       ảnh chạy trên Linux
docs/            HUONG_DAN_CAI_DAT.md
tests/e2e/       Kiểm thử đầu-cuối Playwright
```

## Chạy thử trên máy lập trình

```bash
cd src/QldaTtts.Web
dotnet run            # môi trường Development dùng SQLite tại App_Data/qlda-dev.db
```

Dùng SQL Server: đặt `Database:Provider=SqlServer` và `ConnectionStrings:SqlServer` (appsettings hoặc biến môi trường).

Kiểm thử: `npm i --no-save playwright && npx playwright install chromium && node tests/e2e/smoke.js http://127.0.0.1:5080` (trên CSDL trống).

Thêm migration khi đổi mô hình dữ liệu (làm cho cả hai CSDL): `dotnet tool restore && cd src/QldaTtts.Web`, rồi
`dotnet ef migrations add <Ten> --context AppDbContext -o Data/Migrations` và `dotnet ef migrations add <Ten> --context PgDbContext -o Data/MigrationsPg`;
sau đó cập nhật `deploy/sql/QLDA_TTTS_schema.sql` bằng `dotnet ef migrations script --idempotent --context AppDbContext -o ../../deploy/sql/QLDA_TTTS_schema.sql`.

## Triển khai

Hai gói cài chính thức, cùng dùng PostgreSQL: máy chủ Linux [docs/HUONG_DAN_CAI_DAT_LINUX.md](docs/HUONG_DAN_CAI_DAT_LINUX.md),
máy chủ hoặc máy tính Windows [docs/HUONG_DAN_CAI_DAT_WINDOWS.md](docs/HUONG_DAN_CAI_DAT_WINDOWS.md) (CI cài thử trên Windows Server, Artifacts → `goi-cai-dat-windows`).
Máy chủ Windows/IIS có sẵn SQL Server: [docs/HUONG_DAN_CAI_DAT.md](docs/HUONG_DAN_CAI_DAT.md). Gói cài đặt Windows được CI tạo tự động (Actions → Artifacts → `goi-cai-dat-QLDA_TTTS`).
