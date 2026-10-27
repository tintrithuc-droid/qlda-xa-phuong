# Hướng dẫn cài đặt Phần mềm QLDA đầu tư xây dựng, Ban QLDA Trung tâm Thủy sản TP.HCM

Công nghệ theo Báo cáo KTKT (phần VIII): ASP.NET Core 8 (C#), Microsoft SQL Server 2019 trở lên, Windows Server 2019 trở lên, IIS.

## 1. Yêu cầu máy chủ

| Hạng mục | Tối thiểu | Khuyến nghị |
|---|---|---|
| Hệ điều hành | Windows Server 2019 | Windows Server 2022 |
| CPU / RAM | 4 nhân / 8 GB | 8 nhân / 16 GB |
| Ổ dữ liệu | 200 GB (tệp mô hình, ảnh hiện trường) | 500 GB, tách ổ D: |
| CSDL | SQL Server 2019 (Express dùng thử được, giới hạn 10 GB) | SQL Server 2019/2022 Standard |
| Phần mềm | ASP.NET Core 8 Hosting Bundle | |
| Mạng | Cổng 80/443 mở trong mạng nội bộ / Internet | Chứng chỉ SSL cho tên miền |

Ứng dụng và SQL Server có thể chung một máy hoặc tách hai máy.

## 2. Chuẩn bị

1. Cài **SQL Server** (chế độ xác thực Mixed hoặc Windows). Collation khuyến nghị `Vietnamese_CI_AS`.
2. Tải và cài **ASP.NET Core 8.0 Hosting Bundle**: https://dotnet.microsoft.com/download/dotnet/8.0 (mục *Hosting Bundle*). Nếu cài trước IIS thì sau khi bật IIS cần chạy lại bộ cài (Repair).
3. Lấy gói cài `QLDA_TTTS_<ngày>.zip`:
   - trên GitHub: tab **Actions** → lần chạy CI mới nhất của nhánh `main` → mục *Artifacts* → `goi-cai-dat-QLDA_TTTS`;
   - hoặc tự đóng gói trên máy có .NET 8 SDK: `.\deploy\build-package.ps1`.
4. Giải nén vào thư mục bất kỳ trên máy chủ, ví dụ `C:\Setup\QLDA`.

## 3. Cài đặt

Mở **PowerShell bằng quyền Administrator** trong thư mục đã giải nén:

```powershell
Set-ExecutionPolicy -Scope Process Bypass

# SQL Server cùng máy, xác thực Windows (script tự tạo CSDL và login cho IIS)
.\install.ps1 -SqlServer "." -Port 80

# SQL Server máy khác, dùng tài khoản SQL
.\install.ps1 -SqlServer "10.0.0.5,1433" -SqlUser qlda_app -SqlPassword "MatKhauManh#2026" -Port 80

# Có tên miền và chứng chỉ SSL đã nhập vào kho LocalMachine\My
.\install.ps1 -SqlServer "." -HostName qlda.tttshcm.gov.vn -Port 443 -CertThumbprint "<thumbprint>"
```

Tham số khác: `-InstallPath` (mặc định `C:\inetpub\QLDA_TTTS`), `-DataPath` (mặc định `D:\QLDA_TTTS_Data`, nơi lưu tệp đính kèm), `-SiteName`, `-Database`.

Khi dùng `-SqlUser`, tài khoản SQL cần quyền `dbcreator` lần đầu (để tạo CSDL), hoặc DBA tạo sẵn CSDL `QLDA_TTTS` và cấp `db_owner`. DBA muốn tạo lược đồ thủ công thì dùng `sql\QLDA_TTTS_schema.sql` (chạy lại nhiều lần vẫn an toàn).

Script tự: bật IIS, chép ứng dụng, tạo Application Pool (No Managed Code, luôn chạy), tạo website, ghi `appsettings.Production.json`, cấp quyền thư mục, tạo CSDL và bảng (EF Core migration chạy khi ứng dụng khởi động), kiểm tra `/api/health`.

## 4. Khởi tạo lần đầu

1. Mở trình duyệt tới địa chỉ website.
2. Màn hình **Khởi tạo hệ thống**: nhập họ tên, tên đăng nhập, mật khẩu quản trị. Bỏ chọn *Nạp dữ liệu mẫu* khi triển khai chính thức.
3. Vào **Quản trị hệ thống**: tạo nhóm người dùng, phân quyền theo phân hệ và phạm vi dự án, tạo tài khoản cán bộ, cập nhật danh mục.

## 5. Ứng dụng trên điện thoại

Phần hiện trường (UC54–62) chạy trên trình duyệt điện thoại. Trên Android (Chrome) chọn *Thêm vào màn hình chính*, trên iPhone (Safari) chọn *Chia sẻ → Thêm vào MH chính*: ứng dụng mở toàn màn hình như ứng dụng cài đặt. Chụp ảnh hiện trường cần website chạy **HTTPS**.

## 6. Cập nhật phiên bản

Giải nén gói mới và chạy lại `.\install.ps1` (không cần tham số SQL). Script dừng website, chép bản mới, giữ nguyên cấu hình, dữ liệu và khóa phiên đăng nhập; lược đồ CSDL tự nâng cấp khi khởi động.

## 7. Sao lưu

- **CSDL**: lập SQL Server Agent job (hoặc Task Scheduler + `sqlcmd`) sao lưu `QLDA_TTTS` hằng ngày, ví dụ:
  `BACKUP DATABASE [QLDA_TTTS] TO DISK = N'E:\Backup\QLDA_TTTS.bak' WITH INIT, COMPRESSION`
- **Tệp đính kèm**: sao lưu thư mục `-DataPath\files` cùng lịch (robocopy sang ổ/máy khác).
- **Khóa ứng dụng**: thư mục `<InstallPath>\App_Data\keys` (mất khóa thì người dùng chỉ phải đăng nhập lại).
- Trong phần mềm: *Quản trị hệ thống → Hệ thống → Tải tệp sao lưu* xuất toàn bộ dữ liệu nghiệp vụ dạng JSON.

## 8. Bảo mật đã có

- Mật khẩu băm PBKDF2 (ASP.NET Core Identity), tối thiểu 8 ký tự gồm chữ và số; nhập sai 5 lần khóa 15 phút.
- Cookie phiên HttpOnly, SameSite=Strict; chặn ghi dữ liệu từ trang khác (CSRF); tiêu đề bảo mật HTTP.
- Phân quyền kiểm tra trên máy chủ theo phân hệ (không truy cập / xem / cập nhật) và theo phạm vi dự án.
- Nhật ký hoạt động ghi trên máy chủ cho mọi thao tác thêm, sửa, xóa, đăng nhập (kèm địa chỉ IP).
- Chặn tải lên tệp thực thi (.exe, .js, .ps1, .html…); tệp chỉ tải về được khi đã đăng nhập.
- Bật HTTPS: dùng `-CertThumbprint`; ứng dụng tự chuyển hướng HTTP sang HTTPS và bật HSTS.

## 9. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| HTTP Error 500.19 / 500.31 | Chưa cài hoặc cần cài lại ASP.NET Core 8 Hosting Bundle (Repair), rồi `iisreset`. |
| 500.30 khi khởi động | Thường do không kết nối được SQL Server. Sửa `appsettings.Production.json`, xem Event Viewer → Application. Bật `stdoutLogEnabled="true"` trong `web.config` để ghi log vào `logs\`. |
| Không tải được tệp lớn | Kiểm tra `maxAllowedContentLength` trong `web.config` (mặc định 500 MB). |
| Kiểm tra nhanh | Mở `/api/health`: trả `{"status":"ok","db":"ok"}` là ứng dụng và CSDL hoạt động. |
