# Hướng dẫn vận hành máy chủ cho thuê nhiều xã/phường

Dành cho cán bộ kỹ thuật của Tri Thức. Một máy chủ phục vụ nhiều xã/phường: mỗi xã truy cập bằng địa chỉ riêng (ví dụ `https://tan-hoa.qlda.trithuc.vn`), có **cơ sở dữ liệu riêng, tài khoản cơ sở dữ liệu riêng, kho tệp riêng**. Tri Thức quản lý các xã trên **trang quản lý thuê bao** `https://quantri.qlda.trithuc.vn`.

Gói cài cho xã tự đặt máy chủ (Linux, Windows) không thay đổi; gói này chỉ dùng cho máy chủ của Tri Thức.

## 1. Chuẩn bị

| Hạng mục | Thử nghiệm, 1–10 xã | 10–50 xã | 50–150 xã |
|---|---|---|---|
| Máy chủ | 4 vCPU, 8 GB RAM, SSD 200–300 GB | 8 vCPU, 16 GB RAM, SSD 1 TB | 2 máy: phần mềm 8 vCPU/16 GB, CSDL 8 vCPU/32 GB, lưu trữ 2–4 TB |
| Hệ điều hành | Ubuntu 22.04 hoặc 24.04 LTS | như bên trái | như bên trái |
| Sao lưu ngoài máy | Ổ hoặc máy chủ khác có SFTP, hoặc kho lưu trữ S3 trong nước | như bên trái | như bên trái |

Số liệu là ước tính; xem dung lượng thực tế của từng xã trên trang quản lý thuê bao rồi điều chỉnh.

**Tên miền.** Chọn tên miền gốc, ví dụ `qlda.trithuc.vn`. Tại nơi quản lý DNS của `trithuc.vn`, tạo hai bản ghi trỏ về IP máy chủ:

| Bản ghi | Loại | Giá trị |
|---|---|---|
| `*.qlda.trithuc.vn` | A | IP máy chủ |
| `quantri.qlda.trithuc.vn` | A | IP máy chủ (không bắt buộc nếu đã có bản ghi `*`) |

Mở cổng **80** và **443** trên tường lửa. Chứng chỉ HTTPS được cấp và gia hạn tự động cho từng xã, không phải làm tay.

## 2. Cài đặt (khoảng 10 phút)

Chép gói `QLDA_XaPhuong_GoiThueBao_<phiên bản>.tar.gz` lên máy chủ, rồi chạy (quyền root):

```bash
tar -xzf QLDA_XaPhuong_GoiThueBao_1.6.tar.gz && cd QLDA_XaPhuong_GoiThueBao_1.6
sudo bash cai-dat.sh qlda.trithuc.vn kythuat@trithuc.vn tri
```

Ba tham số: tên miền gốc, email nhận thông báo chứng chỉ, tên đăng nhập quản trị nền tảng. Script tự cài Docker, nạp phần mềm, tạo thư mục `/opt/qlda-thue-bao` (mật khẩu CSDL ngẫu nhiên trong `.env`), khởi động PostgreSQL, phần mềm và cổng vào HTTPS, đặt lịch sao lưu 1h30 hằng đêm và kiểm tra tình trạng 5 phút một lần. Cuối cùng script in **mật khẩu tạm** của quản trị nền tảng.

Mở `https://quantri.qlda.trithuc.vn`, đăng nhập bằng mật khẩu tạm, quét mã QR bằng Google Authenticator hoặc Microsoft Authenticator, nhập mã 6 số. Sau đó bấm **Đổi mật khẩu** ngay.

Thêm quản trị nền tảng khác, hoặc đặt lại khi quên mật khẩu/mất điện thoại:

```bash
cd /opt/qlda-thue-bao && sudo docker compose -p qlda-thue-bao exec app dotnet QldaTtts.Web.dll --tao-quan-tri-nen-tang <tên đăng nhập> "Họ tên"
```

## 3. Cấp dịch vụ cho một xã

1. Trên trang quản lý thuê bao bấm **Thêm xã/phường**. Nhập tên (ví dụ *xã Tân Hòa*), mã xã tự gợi ý (`tan-hoa`, dùng làm địa chỉ), hạn sử dụng, người liên hệ. Xã có tên miền riêng (ví dụ `qlda.tanhoa.cantho.gov.vn`) thì nhập vào ô tên miền riêng và đề nghị xã trỏ bản ghi A về IP máy chủ.
2. Bấm **Tạo xã và cơ sở dữ liệu**. Sau 10–30 giây, hộp thoại hiện **mã khởi tạo** và nội dung soạn sẵn để gửi xã. Mã chỉ hiện một lần, dùng một lần, hiệu lực 30 ngày. Bấm **Chép nội dung** rồi gửi cho cán bộ quản trị của xã qua kênh tin cậy.
3. Cán bộ xã mở đường dẫn trong thư, mã khởi tạo đã điền sẵn. Họ nhập họ tên, tên đăng nhập, mật khẩu, bật xác thực 2 lớp. Từ đây xã tự quản lý tài khoản, phân quyền, dữ liệu của mình. Tên đơn vị trên giao diện và báo cáo đã điền sẵn theo tên xã; quản trị xã sửa lại được trong phân hệ Giao diện.

Mã hết hạn hoặc thất lạc trước khi xã khởi tạo: mở **Chi tiết** của xã, bấm **Cấp lại mã khởi tạo**.

## 4. Công việc thường ngày

**Gia hạn, sửa thông tin.** Chi tiết → Sửa thông tin, gia hạn. Hết hạn mà chưa gia hạn, người dùng của xã thấy thông báo hết hạn; dữ liệu giữ nguyên.

**Tạm khóa / mở lại.** Chi tiết → Tạm khóa, nhập lý do (người dùng của xã thấy lý do này). Mở lại bằng nút Mở lại.

**Hỗ trợ xã mất điện thoại xác thực.** Khi có văn bản đề nghị của xã: Chi tiết → Đặt lại xác thực 2 lớp cho một tài khoản, nhập tên đăng nhập. Thao tác được ghi vào nhật ký của chính xã đó. Quản trị nền tảng **không xem được dữ liệu nghiệp vụ** của xã; trang chi tiết chỉ hiện số liệu đếm (số tài khoản, dự án, tệp, dung lượng).

**Nhật ký nền tảng.** Thẻ *Nhật ký nền tảng* ghi mọi lần đăng nhập, tạo xã, sửa, khóa/mở, cấp mã, đặt lại 2 lớp, nâng cấp.

Các lệnh dưới đây chạy trong `/opt/qlda-thue-bao` với quyền root:

| Việc | Lệnh |
|---|---|
| Xem danh sách xã | `bash danh-sach-xa.sh` |
| Sao lưu ngay (ngoài lịch đêm) | `bash sao-luu.sh` |
| Khôi phục **một** xã về một ngày | `bash khoi-phuc-xa.sh tan-hoa 2026-11-20` |
| Xuất trọn dữ liệu bàn giao cho xã | `bash xuat-du-lieu-xa.sh tan-hoa` |
| Xóa hẳn một xã (sau khi đã tạm khóa và bàn giao) | `bash xoa-xa.sh tan-hoa` |
| Kiểm tra tình trạng | `bash kiem-tra.sh` |
| Xem nhật ký phần mềm | `docker compose -p qlda-thue-bao logs --tail 200 app` |

## 5. Sao lưu và khôi phục

Mỗi đêm `sao-luu.sh` lưu vào `/srv/qlda-saoluu/<ngày>/`:
- `csdl/<mã-xã>.dump`: cơ sở dữ liệu từng xã (khôi phục riêng từng xã) và `_nentang.dump` (danh sách xã);
- `tep/<mã-xã>/files`: kho tệp của từng xã, ảnh chụp theo ngày (tệp không đổi dùng chung giữa các ngày nên tốn rất ít dung lượng);
- `keys/`, `env.txt`: khóa bảo vệ dữ liệu và cấu hình; **thiếu hai thứ này thì không dựng lại được máy chủ**.

Giữ 14 bản hằng ngày và 12 bản đầu tháng (đổi trong `.env`: `BACKUP_KEEP_DAYS`, `BACKUP_KEEP_MONTHS`). Bên cạnh đó, phần mềm của mỗi xã vẫn tự sao lưu trong phạm vi xã và quản trị xã tự tải được bản sao.

**Bắt buộc có bản sao ngoài máy chủ.** Khai báo trong `.env`:

```
RESTIC_REPOSITORY=sftp:saoluu@10.0.0.9:/kho/qlda
RESTIC_PASSWORD=<mật khẩu dài, cất giữ riêng>
```

Bản sao được mã hóa trước khi rời máy chủ. Mất `RESTIC_PASSWORD` thì không mở được bản sao, nên cất mật khẩu này ở nơi an toàn ngoài máy chủ.

**Khôi phục một xã** (`khoi-phuc-xa.sh <mã> <ngày>`): script tạm khóa xã, lưu thêm một bản dữ liệu hiện tại vào `/srv/qlda-saoluu/truoc-khoi-phuc`, khôi phục CSDL và kho tệp, rồi mở lại. Các xã khác vẫn dùng bình thường trong lúc khôi phục.

Nên diễn tập khôi phục mỗi quý trên một xã thử nghiệm và ghi biên bản.

## 6. Nâng cấp phiên bản

Chép gói mới lên máy chủ, giải nén, chạy lại đúng lệnh cài đặt (không cần tham số quản trị):

```bash
sudo bash /opt/qlda-thue-bao/sao-luu.sh
sudo bash cai-dat.sh qlda.trithuc.vn kythuat@trithuc.vn
```

Phần mềm khởi động lại và **nâng cấp cơ sở dữ liệu lần lượt từng xã**. Xã đang chờ nâng cấp, người dùng thấy thông báo "Đang nâng cấp phần mềm" trong vài giây. Xã nào nâng cấp lỗi thì chỉ xã đó tạm dừng, trang quản lý thuê bao báo **Lỗi nâng cấp** kèm nội dung lỗi; khắc phục xong bấm **Chạy lại nâng cấp**. Nên nâng cấp ngoài giờ hành chính và báo trước cho các xã.

## 7. Theo dõi, cảnh báo

`kiem-tra.sh` chạy 5 phút một lần, kiểm tra trang quản lý thuê bao, từng xã đang hoạt động, ổ đĩa (cảnh báo từ 85%), bản sao lưu đêm qua. Muốn nhận cảnh báo qua Telegram, tạo bot và khai báo trong `.env`:

```
ALERT_URL=https://api.telegram.org/bot<mã bot>/sendMessage?chat_id=<mã nhóm>
```

Mỗi lỗi chỉ nhắc lại tối đa một lần mỗi giờ. Nhật ký kiểm tra: `/var/log/qlda-kiem-tra.log`; nhật ký sao lưu: `/var/log/qlda-sao-luu.log`.

## 8. An toàn

- Phần mềm không mở cổng trực tiếp ra ngoài; mọi truy cập đi qua cổng vào HTTPS.
- Cổng vào chỉ xin chứng chỉ cho tên miền đã đăng ký trên trang quản lý thuê bao.
- Mỗi xã một tài khoản CSDL chỉ vào được CSDL của xã đó. Phiên đăng nhập và khóa xác thực 2 lớp mã hóa bằng khóa riêng của từng xã: phiên của xã này mang sang xã khác hoặc sang trang quản lý thuê bao đều bị từ chối.
- Trang khởi tạo tài khoản quản trị của xã chỉ dùng được khi có mã khởi tạo do Tri Thức cấp.
- `.env`, thư mục `du-lieu/keys` và các bản sao lưu chỉ tài khoản root đọc được. Không gửi các tệp này qua thư điện tử hay tin nhắn.

## 9. Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Xã báo "Không tìm thấy đơn vị" | Kiểm tra mã xã/tên miền riêng trên trang quản lý thuê bao; tên miền riêng phải trỏ đúng IP máy chủ. |
| Trình duyệt báo lỗi chứng chỉ ở tên miền mới | Kiểm tra bản ghi DNS và cổng 80/443; xem `docker compose -p qlda-thue-bao logs caddy`. |
| Xã báo "Đang nâng cấp phần mềm" lâu | Trang quản lý thuê bao → Chi tiết xã → xem lỗi nâng cấp → Chạy lại nâng cấp. |
| Quản trị xã quên mật khẩu | Quản trị khác của xã đặt lại. Xã chỉ có một quản trị: khi có văn bản đề nghị, chạy `docker compose -p qlda-thue-bao exec app dotnet QldaTtts.Web.dll --dat-lai-mat-khau <tên đăng nhập> --xa <mã xã>`, gửi mật khẩu tạm cho xã và đề nghị đổi ngay. |
| Quản trị nền tảng mất điện thoại | Chạy lại lệnh `--tao-quan-tri-nen-tang <tên đăng nhập>` trên máy chủ để đặt lại. |
