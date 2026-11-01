# Hướng dẫn cài đặt Phần mềm QLDA đầu tư xây dựng, bản dùng chung cho Ban QLDA xã/phường

Phương án máy chủ Windows: ASP.NET Core 8 (C#), Microsoft SQL Server 2019 trở lên (Express miễn phí dùng được), Windows Server 2019 trở lên, IIS.
Phương án chi phí thấp hơn (Linux, Docker, PostgreSQL): xem [HUONG_DAN_CAI_DAT_LINUX.md](HUONG_DAN_CAI_DAT_LINUX.md).

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
3. Lấy gói cài `QLDA_TTTS_GoiCaiDat_MayChu_v1.0.zip` trong thư mục phiên bản `PhienBan_1.0_<ngày>\1_GoiCaiDat_MayChu` do đơn vị phát triển bàn giao (hoặc tự đóng gói trên máy có .NET 8 SDK: `.\deploy\build-package.ps1`, chép các tệp PDF HDSD vào `src\QldaTtts.Web\hdsd` trước khi đóng gói).
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

Khi SQL Server nằm **máy khác** mà không dùng `-SqlUser`, login cần tạo là tài khoản máy chủ web (`DOMAIN\TENMAYWEB$`) thay cho `IIS APPPOOL\QLDA_TTTS`; đơn giản hơn là dùng tài khoản SQL với `-SqlUser`.

Khi dùng `-SqlUser`, tài khoản SQL cần quyền `dbcreator` lần đầu (để tạo CSDL), hoặc DBA tạo sẵn CSDL `QLDA_TTTS` và cấp `db_owner`. DBA muốn tạo lược đồ thủ công thì dùng `sql\QLDA_TTTS_schema.sql` (chạy lại nhiều lần vẫn an toàn).

Script tự: bật IIS, chép ứng dụng, tạo Application Pool (No Managed Code, luôn chạy), tạo website, ghi `appsettings.Production.json`, cấp quyền thư mục, tạo CSDL và bảng (EF Core migration chạy khi ứng dụng khởi động), kiểm tra `/api/health`.

## 4. Khởi tạo lần đầu

1. Mở trình duyệt tới địa chỉ website.
2. Màn hình **Khởi tạo hệ thống**: nhập họ tên, tên đăng nhập, mật khẩu quản trị. Bỏ chọn *Nạp dữ liệu mẫu* khi triển khai chính thức.
   Tiếp theo là màn hình **Thiết lập xác thực 2 lớp**: cài Google Authenticator hoặc Microsoft Authenticator trên điện thoại, quét mã QR, nhập mã 6 số, rồi tải/in **10 mã khôi phục** và cất giữ nơi an toàn (xem mục 8a).
3. Vào **Quản trị hệ thống**: tạo nhóm người dùng, phân quyền theo phân hệ và phạm vi dự án, tạo tài khoản cán bộ, cập nhật danh mục.

## 5. Ứng dụng trên điện thoại

Phần hiện trường (UC54–62) chạy trên trình duyệt điện thoại. Trên Android (Chrome) chọn *Thêm vào màn hình chính*, trên iPhone (Safari) chọn *Chia sẻ → Thêm vào MH chính*: ứng dụng mở toàn màn hình như ứng dụng cài đặt. Chụp ảnh hiện trường cần website chạy **HTTPS**.

## 6. Cài lại, cập nhật phiên bản

Phiên bản **1.0** là bản phát hành đầu tiên để cài đặt chính thức trên máy chủ. Góc dưới thanh bên trái của phần mềm hiện số phiên bản đang chạy.

**Máy chủ đã cài bản chạy thử trước đây** (đã có IIS, website `QLDA_TTTS`, CSDL `QLDA_TTTS`):

1. Nếu bản cũ có dữ liệu cần giữ: đăng nhập quản trị, vào **Quản trị hệ thống → Sao lưu, hệ thống**, nhấn **Tải tệp sao lưu (.json)**.
2. Giải nén gói 1.0 ra thư mục mới (ví dụ `C:\Setup\QLDA_v1.0`), mở PowerShell bằng quyền Administrator, `cd` vào thư mục đó và chạy `.\install.ps1` (truyền lại `-SqlServer ".\SQLEXPRESS"` hoặc `-DataPath` nếu lần trước có dùng). Script dừng website, chép bản mới, giữ nguyên cấu hình, dữ liệu và khóa phiên đăng nhập; lược đồ CSDL tự nâng cấp khi khởi động.
3. Muốn **bắt đầu sạch** (bỏ toàn bộ dữ liệu chạy thử): trước bước 2, dừng website, xóa CSDL và thư mục dữ liệu, rồi cài như máy mới:
   ```powershell
   Stop-Website QLDA_TTTS; Stop-WebAppPool QLDA_TTTS
   sqlcmd -S ".\SQLEXPRESS" -E -C -Q "ALTER DATABASE [QLDA_TTTS] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [QLDA_TTTS]"
   Remove-Item -Recurse -Force D:\QLDA_TTTS_Data\files, C:\inetpub\QLDA_TTTS\App_Data\files -ErrorAction SilentlyContinue
   ```
   Lần mở website kế tiếp hiện màn hình **Khởi tạo hệ thống** (mục 4).
4. Kiểm tra: mở `http://localhost/api/health` thấy `"status":"ok"`; đăng nhập, góc dưới thanh bên trái hiện **Phiên bản 1.0**; nhấn Ctrl+F5 trên các máy trạm để tải giao diện mới.

**Sau khi cài**, quản trị hệ thống:
- vào **Quản trị hệ thống → Thông tin đơn vị, giao diện** để đặt logo, tên phần mềm, tên đơn vị, banner trang đăng nhập, chân trang (dùng khi triển khai cho đơn vị khác, không cần sửa mã);
- mở **Hướng dẫn sử dụng**: phần mềm đã tạo sẵn 6 hướng dẫn kèm tệp PDF theo từng vai trò (lấy từ thư mục `app\hdsd`); mỗi nhóm người dùng chỉ thấy hướng dẫn của mình, quản trị có thể thêm, sửa, xóa, đính kèm tài liệu hoặc video.

Các phiên bản sau: giải nén gói mới và chạy lại `.\install.ps1` như bước 2.

## 7. Sao lưu

- **CSDL**: lập SQL Server Agent job (hoặc Task Scheduler + `sqlcmd`) sao lưu `QLDA_TTTS` hằng ngày, ví dụ:
  `BACKUP DATABASE [QLDA_TTTS] TO DISK = N'E:\Backup\QLDA_TTTS.bak' WITH INIT, COMPRESSION`
- **Tệp đính kèm**: sao lưu thư mục `-DataPath\files` cùng lịch (robocopy sang ổ/máy khác).
- **Khóa ứng dụng**: thư mục `<InstallPath>\App_Data\keys`. Khóa này mã hóa cả khóa xác thực 2 lớp: mất khóa thì mọi người phải đăng nhập lại và tài khoản quản trị phải thiết lập lại xác thực 2 lớp (mục 8a). Phục hồi CSDL sang máy chủ mới thì chép kèm thư mục này.
- **Sao lưu tự động trong phần mềm**: hằng đêm từ 1 giờ sáng, phần mềm tự ghi một tệp `SaoLuu_QLDA_*.json` (toàn bộ dữ liệu) và chép thêm các tệp đính kèm mới vào thư mục sao lưu, giữ 14 bản gần nhất. Thư mục mặc định `-DataPath\backups` (cài mới) hoặc `<InstallPath>\App_Data\backups` (bản cài trước). Nên đổi sang ổ khác hoặc ổ mạng trong `appsettings.Production.json`:
  `"Storage": { "BackupPath": "E:\\SaoLuu\\QLDA" }, "Backup": { "Hour": 1, "Keep": 14, "Enabled": true }`
  (ổ mạng thì cấp quyền ghi cho `IIS APPPOOL\QLDA_TTTS`). Danh sách bản sao lưu xem tại *Quản trị hệ thống → Sao lưu, hệ thống*.
- Trong phần mềm: *Quản trị hệ thống → Sao lưu, hệ thống* có *Tải tệp sao lưu dữ liệu (.json)* và *Tải bản sao lưu đầy đủ kèm tệp (.zip)*.
- **Thùng rác tệp đính kèm**: tệp người dùng gỡ hoặc tệp của bản ghi bị xóa được giữ 30 ngày, quản trị khôi phục tại *Quản trị hệ thống → Kho tệp, thùng rác*; quá 30 ngày phần mềm tự xóa hẳn.

## 8. Bảo mật đã có

- Mật khẩu băm PBKDF2 (ASP.NET Core Identity), tối thiểu 8 ký tự gồm chữ và số; nhập sai 5 lần khóa 15 phút.
- Tài khoản quản trị bắt buộc xác thực 2 lớp bằng mã 6 số trên điện thoại (mục 8a).
- Cookie phiên HttpOnly, SameSite=Strict; chặn ghi dữ liệu từ trang khác (CSRF); tiêu đề bảo mật HTTP.
- Phân quyền kiểm tra trên máy chủ theo phân hệ (không truy cập / xem / cập nhật) và theo phạm vi dự án.
- Nhật ký hoạt động ghi trên máy chủ cho mọi thao tác thêm, sửa, xóa, đăng nhập (kèm địa chỉ IP).
- Chặn tải lên tệp thực thi (.exe, .js, .ps1, .html…); tệp chỉ tải về được khi đã đăng nhập.
- Bật HTTPS: dùng `-CertThumbprint`; ứng dụng tự chuyển hướng HTTP sang HTTPS và bật HSTS.

## 8a. Xác thực 2 lớp cho tài khoản quản trị

- Tài khoản thuộc nhóm có **toàn quyền** (Quản trị hệ thống) bắt buộc nhập thêm mã 6 số từ ứng dụng xác thực trên điện thoại (TOTP theo RFC 6238, đổi mã mỗi 30 giây; dùng Google Authenticator, Microsoft Authenticator hoặc ứng dụng tương đương, không cần SMS hay Internet trên điện thoại).
- Lần đăng nhập đầu tiên của mỗi tài khoản quản trị: quét mã QR, nhập mã để xác nhận, lưu 10 mã khôi phục (mỗi mã dùng một lần khi không có điện thoại). Tạo bộ mã mới tại *Tài khoản → Tạo mã khôi phục mới*.
- Nhập sai mã 5 lần: tạm khóa 15 phút (tính chung với nhập sai mật khẩu). Mỗi mã chỉ dùng được một lần.
- Quản trị mất điện thoại: một quản trị khác vào *Quản trị hệ thống → Người dùng → Đặt lại 2 lớp*; lần đăng nhập sau người đó quét mã QR mới.
- Chỉ có một quản trị và mất cả điện thoại lẫn mã khôi phục: trên máy chủ, mở PowerShell bằng tài khoản có quyền vào CSDL rồi chạy
  `cd C:\inetpub\QLDA_TTTS; $env:ASPNETCORE_ENVIRONMENT='Production'; .\QldaTtts.Web.exe --reset-2fa admin`
  (thay `admin` bằng tên đăng nhập). Hoặc chạy trong SQL Server Management Studio:
  `UPDATE Users SET TotpSecret = NULL, RecoveryCodes = NULL, TotpLastStep = 0 WHERE Username = 'admin'`.
- Đồng hồ máy chủ và điện thoại phải đúng giờ (lệch quá 30 giây thì mã bị từ chối): bật đồng bộ thời gian Windows (`w32tm /resync`).
- Tắt yêu cầu bắt buộc (không khuyến nghị): thêm `"Security": { "RequireTwoFactorForAdmins": false }` vào `appsettings.Production.json`. Tên hiển thị trong ứng dụng xác thực đổi bằng `Security:TwoFactorIssuer` (mặc định "QLDA TTTS HCM").

## 9. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| HTTP Error 500.19 / 500.31 | Chưa cài hoặc cần cài lại ASP.NET Core 8 Hosting Bundle (Repair), rồi `iisreset`. |
| 500.30 khi khởi động | Thường do không kết nối được SQL Server. Sửa `appsettings.Production.json`, xem Event Viewer → Application. Bật `stdoutLogEnabled="true"` trong `web.config` để ghi log vào `logs\`. |
| Không tải được tệp lớn | Kiểm tra `maxAllowedContentLength` trong `web.config` (mặc định 500 MB). |
| Mã xác thực 2 lớp luôn báo sai | Đồng hồ máy chủ hoặc điện thoại lệch giờ: đồng bộ lại thời gian (`w32tm /resync`, bật *Đặt giờ tự động* trên điện thoại). |
| "Không đọc được khóa xác thực 2 lớp" | Thư mục `App_Data\keys` đã thay đổi hoặc mất: đặt lại 2 lớp cho tài khoản đó (mục 8a). |
| Kiểm tra nhanh | Mở `/api/health`: trả `{"status":"ok","db":"ok"}` là ứng dụng và CSDL hoạt động. |
