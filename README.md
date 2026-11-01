# Phần mềm quản lý dự án đầu tư xây dựng: bản dùng chung cho Ban QLDA xã/phường

Sản phẩm của Công ty Cổ phần Tin học Tri Thức. Phát triển từ phần mềm QLDA của Ban QLDA Trung tâm Thủy sản TP.HCM
(kho `tintrithuc-droid/qlda-ttts-hcm`, phiên bản 1.0 ngày 01/11/2026), đổi sang nhận diện trung tính và dữ liệu mẫu cấp xã.
Mỗi đơn vị tự đặt logo, tên đơn vị, banner, chân trang tại Quản trị hệ thống → Thông tin đơn vị, giao diện.

62 chức năng, 7 phân hệ:
quản lý dự án, mô hình hóa công trình (lưu trữ tệp mô hình theo phiên bản), gói thầu và hợp đồng, tiến độ (Gantt, đường cong S),
nhật ký thi công, khối lượng, thanh toán, báo cáo thống kê, quản trị hệ thống và ứng dụng hiện trường trên điện thoại.
Trang **Danh mục chức năng** trong phần mềm ánh xạ từng use case với chức năng đã làm.

## Công nghệ

- ASP.NET Core 8 (C#), Entity Framework Core 8
- Microsoft SQL Server 2019+ (đã kiểm thử trên SQL Server 2022)
- Windows Server 2019+ / IIS (ASP.NET Core Hosting Bundle)
- Giao diện web một trang, đáp ứng máy tính và điện thoại, cài được lên màn hình chính (PWA)

## Cấu trúc

```
src/QldaTtts.Web/
  Controllers/   API: auth, data (CRUD có phân quyền + phạm vi dự án), users, files, backup
  Data/          Thực thể, DbContext, migration SQL Server
  Services/      Phân quyền người dùng, danh sách tập dữ liệu, mật khẩu
  wwwroot/       Giao diện (js/, css/), service worker, manifest
deploy/          install.ps1 (cài IIS), build-package.ps1, sql/ (lược đồ CSDL)
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

Thêm migration khi đổi mô hình dữ liệu: `dotnet tool restore && cd src/QldaTtts.Web && dotnet ef migrations add <Ten> -o Data/Migrations`,
sau đó cập nhật `deploy/sql/QLDA_TTTS_schema.sql` bằng `dotnet ef migrations script --idempotent -o ../../deploy/sql/QLDA_TTTS_schema.sql`.

## Triển khai

Xem [docs/HUONG_DAN_CAI_DAT.md](docs/HUONG_DAN_CAI_DAT.md). Gói cài đặt được CI tạo tự động (Actions → Artifacts → `goi-cai-dat-QLDA_TTTS`).
