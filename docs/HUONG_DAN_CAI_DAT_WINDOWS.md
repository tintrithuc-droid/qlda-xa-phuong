# Hướng dẫn cài đặt trên máy chủ Windows (PostgreSQL đi kèm)

Dành cho cán bộ kỹ thuật cài phần mềm Quản lý dự án xã/phường trên máy chủ Windows của UBND hoặc một máy tính để bàn dùng làm máy chủ trong mạng nội bộ.
Gói cài đã có sẵn phần mềm và cơ sở dữ liệu PostgreSQL 16, không phải cài thêm IIS, SQL Server hay .NET. Không cần kết nối Internet khi cài.
Một máy có thể phục vụ một xã hoặc nhiều xã; mỗi xã một cơ sở dữ liệu, một kho tệp và một cổng truy cập riêng.

## 1. Yêu cầu

| Hạng mục | Một xã/phường | 5–10 xã chung một máy |
|---|---|---|
| Hệ điều hành | Windows Server 2016/2019/2022/2025 hoặc Windows 10/11, bản 64-bit | Windows Server 2019 trở lên |
| CPU / RAM | 2 nhân / 4 GB | 4–8 nhân / 8–16 GB |
| Ổ đĩa | 60–100 GB trống trên ổ C | 200–500 GB SSD |
| Mạng | IP tĩnh trong mạng nội bộ; IP tĩnh công cộng hoặc tên miền nếu dùng từ ngoài | như bên trái |

Tài khoản cài đặt phải có quyền Administrator. Máy dùng làm máy chủ không nên đặt chế độ ngủ (Sleep).

## 2. Cài đặt (khoảng 5 phút)

1. Chép tệp `QLDA_XaPhuong_GoiCaiDat_Windows_<phiên bản>.zip` vào máy chủ, bấm chuột phải chọn **Extract All** (giải nén hết, không chạy trực tiếp trong tệp zip).
2. Mở thư mục vừa giải nén, bấm đúp **CAI_DAT.bat**, chọn **Yes** khi Windows hỏi quyền quản trị.
3. Nhập **mã xã** (chữ thường không dấu, số, gạch ngang, ví dụ `xa-tan-hoa`) và **cổng** (Enter để dùng 8080).

Hoặc chạy bằng PowerShell (Run as administrator) trong thư mục gói cài:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\cai-dat.ps1 -MaXa xa-tan-hoa -Cong 8080
.\cai-dat.ps1 -MaXa phuong-an-lac -Cong 8081     # xã thứ hai trên cùng máy: cổng khác
```

Chương trình cài tự làm các việc sau:

- Cài PostgreSQL 16 vào `C:\QLDA\pgsql`, dữ liệu ở `C:\QLDA\pgdata`, chạy thành dịch vụ **QLDA_PostgreSQL**. Cơ sở dữ liệu chỉ nhận kết nối từ chính máy này (cổng nội bộ 5433), mật khẩu ngẫu nhiên lưu ở `C:\QLDA\csdl-matkhau.txt` (chỉ Administrators đọc được).
- Chép phần mềm vào `C:\QLDA\<mã-xã>\app`, tệp đính kèm và bản sao lưu ở `C:\QLDA\<mã-xã>\du-lieu`.
- Tạo dịch vụ **QLDA_<mã-xã>**, tự khởi động cùng máy và tự chạy lại nếu gặp sự cố.
- Mở tường lửa Windows cho cổng đã chọn, rồi in địa chỉ truy cập.

4. Mở trình duyệt tới địa chỉ in ra (ví dụ `http://192.168.1.10:8080`). Màn hình **Khởi tạo hệ thống** hiện ra: nhập họ tên, tên đăng nhập và mật khẩu quản trị (tối thiểu 8 ký tự, có chữ và số). Bỏ dấu chọn *Nạp dữ liệu mẫu* khi cài để dùng thật.
5. Thiết lập **Xác thực 2 lớp** cho tài khoản quản trị (quét mã QR bằng Google Authenticator hoặc Microsoft Authenticator, lưu 10 mã khôi phục). Chi tiết xem *HDSD dành cho Quản trị hệ thống* trong menu Hướng dẫn sử dụng của phần mềm.

Nếu máy đã có PostgreSQL khác dùng cổng 5433, thêm `-CongCsdl 5434` khi cài xã đầu tiên.

## 3. Truy cập từ Internet và HTTPS

Trong mạng nội bộ dùng ngay địa chỉ `http://<IP máy chủ>:<cổng>`. Để cán bộ dùng từ ngoài cơ quan, hoặc chụp ảnh hiện trường bằng điện thoại (trình duyệt điện thoại chỉ cho mở máy ảnh trên trang HTTPS), cần tên miền và chứng chỉ:

1. Trỏ tên miền (ví dụ `qlda.tanhoa.gov.vn`) về IP công cộng của máy chủ, mở cổng 80 và 443 trên modem/tường lửa về máy chủ.
2. Tải Caddy cho Windows (tệp `caddy_windows_amd64.exe` tại caddyserver.com), đổi tên thành `caddy.exe`, đặt vào `C:\QLDA\caddy`, tạo tệp `C:\QLDA\caddy\Caddyfile`:

```
qlda.tanhoa.gov.vn {
    reverse_proxy 127.0.0.1:8080
}
```

3. Chạy trong PowerShell (Administrator): `cd C:\QLDA\caddy; .\caddy.exe run` để thử; khi chạy được, đăng ký thành dịch vụ bằng `sc.exe create QLDA_Caddy binPath= "C:\QLDA\caddy\caddy.exe run --config C:\QLDA\caddy\Caddyfile" start= auto` rồi `Start-Service QLDA_Caddy`. Caddy tự xin và gia hạn chứng chỉ Let's Encrypt miễn phí.

## 4. Sao lưu

- Phần mềm tự sao lưu lúc 1 giờ sáng mỗi đêm (toàn bộ dữ liệu và tệp đính kèm) vào `C:\QLDA\<mã-xã>\du-lieu\backups`, giữ 14 bản. Quản trị xem và tải bản sao lưu tại *Quản trị hệ thống → Sao lưu*.
- Nên chép thêm ra ổ khác hoặc ổ mạng (NAS) mỗi đêm:

```powershell
.\sao-luu.ps1 -Den "E:\SaoLuu_QLDA" -DatLich           # hoặc -Den "\\NAS01\SaoLuu\QLDA"
```

## 5. Cập nhật phiên bản

Giải nén gói mới, chạy lại `CAI_DAT.bat` (nhập đúng mã xã cũ) hoặc `.\cai-dat.ps1 -MaXa <mã-xã>` cho từng xã. Dữ liệu, cấu hình và cổng giữ nguyên, cơ sở dữ liệu tự nâng cấp khi phần mềm khởi động. Nên tải một bản sao lưu trước khi cập nhật.

## 6. Lệnh thường dùng (PowerShell, Administrator)

```powershell
Get-Service QLDA_*                                   # trạng thái các dịch vụ
Restart-Service QLDA_xa-tan-hoa                      # khởi động lại phần mềm của một xã
.\dat-lai-2fa.ps1 -MaXa xa-tan-hoa -TenDangNhap admin   # đặt lại xác thực 2 lớp khi quản trị mất điện thoại
.\go-cai-dat.ps1 -MaXa xa-tan-hoa                    # gỡ phần mềm, giữ dữ liệu
.\go-cai-dat.ps1 -MaXa xa-tan-hoa -XoaDuLieu         # gỡ hẳn, xóa dữ liệu của xã (hỏi xác nhận)
```

Nhật ký: phần mềm ghi vào *Event Viewer → Windows Logs → Application*; PostgreSQL ghi vào `C:\QLDA\pgdata\log`.

## 7. Chọn gói cài nào

| Tình huống | Gói nên dùng |
|---|---|
| UBND có sẵn máy chủ hoặc máy tính Windows | Gói Windows (tài liệu này) |
| Thuê máy chủ ảo Linux, hoặc một máy chủ phục vụ nhiều xã | Gói Linux, xem *Hướng dẫn cài đặt trên máy chủ Linux* |
| Đơn vị đã có SQL Server và IIS, muốn dùng tiếp | Gói Windows/IIS cũ, xem `HUONG_DAN_CAI_DAT.md` |

Dữ liệu chuyển được giữa hai gói: tải bản sao lưu ở máy cũ (*Quản trị hệ thống → Sao lưu*), khôi phục trên máy mới.
