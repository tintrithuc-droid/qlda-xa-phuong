# Hướng dẫn cài đặt trên máy chủ Linux (Docker + PostgreSQL)

Dành cho cán bộ kỹ thuật cài đặt phần mềm Quản lý dự án xã/phường trên máy chủ Linux (máy chủ của UBND hoặc máy chủ ảo thuê trong nước).
Một máy chủ có thể phục vụ một xã hoặc nhiều xã; mỗi xã một cơ sở dữ liệu và kho tệp riêng.

## 1. Yêu cầu

| Hạng mục | Một xã/phường | 5–10 xã chung một máy chủ |
|---|---|---|
| Hệ điều hành | Ubuntu 22.04 / 24.04 LTS (64-bit) | như bên trái |
| CPU / RAM | 2 nhân / 4 GB | 4–8 nhân / 8–16 GB |
| Ổ đĩa | 60–100 GB SSD | 200–500 GB SSD |
| Mạng | IP tĩnh hoặc tên miền, mở cổng 80/443 | như bên trái |

## 2. Cài đặt (khoảng 10 phút)

1. Chép gói `QLDA_XaPhuong_GoiCaiDat_Linux_<phiên bản>.tar.gz` lên máy chủ (WinSCP, hoặc tải từ Google Drive bằng `wget`).
2. Giải nén và cài cho từng xã (quyền root):

```bash
tar -xzf QLDA_XaPhuong_GoiCaiDat_Linux_1.2.tar.gz && cd QLDA_XaPhuong_GoiCaiDat_Linux_1.2
sudo bash install.sh xa-tan-hoa 8080      # mã xã, cổng
sudo bash install.sh phuong-an-lac 8081   # xã thứ hai trên cùng máy: cổng khác
```

Script tự cài Docker (từ kho Ubuntu), nạp ảnh phần mềm, tạo thư mục `/opt/qlda/<mã-xã>` với mật khẩu CSDL ngẫu nhiên trong `.env`, khởi động PostgreSQL 16 và phần mềm, rồi in địa chỉ truy cập.
Mỗi xã một CSDL và một kho tệp riêng, tách biệt hoàn toàn.

3. Mở trình duyệt tới địa chỉ in ra. Màn hình **Khởi tạo hệ thống** hiện ra: nhập họ tên, tên đăng nhập và mật khẩu quản trị (tối thiểu 8 ký tự, có chữ và số). Bỏ dấu chọn *Nạp dữ liệu mẫu* khi cài để dùng thật.
4. Thiết lập **Xác thực 2 lớp** cho tài khoản quản trị: quét mã QR bằng Google Authenticator hoặc Microsoft Authenticator, nhập mã 6 số, lưu 10 mã khôi phục. Chi tiết xem *HDSD dành cho Quản trị hệ thống* (có sẵn trong menu Hướng dẫn sử dụng của phần mềm).

## 3. Tên miền và HTTPS (khuyến nghị, bắt buộc để chụp ảnh hiện trường trên điện thoại)

Cài Caddy làm cổng vào, tự xin chứng chỉ Let's Encrypt miễn phí:

```bash
sudo apt-get install -y caddy
sudo tee /etc/caddy/Caddyfile >/dev/null <<'CFG'
qlda-tanhoa.example.vn {
    reverse_proxy 127.0.0.1:8080
}
qlda-anlac.example.vn {
    reverse_proxy 127.0.0.1:8081
}
CFG
sudo systemctl reload caddy
```

Trỏ bản ghi DNS của tên miền về IP máy chủ trước khi chạy.

## 4. Sao lưu

- Phần mềm tự sao lưu hằng đêm (dữ liệu + tệp đính kèm) vào volume `appdata` của từng xã, giữ 14 bản.
- Thêm bản sao CSDL PostgreSQL mỗi đêm cho mọi xã:

```bash
sudo cp sao-luu-csdl.sh /opt/qlda/
echo "30 1 * * * root bash /opt/qlda/sao-luu-csdl.sh" | sudo tee /etc/cron.d/qlda-sao-luu
```

Bản sao nằm ở `/opt/qlda/_saoluu`; nên đồng bộ thư mục này ra ngoài máy chủ (Google Drive bằng rclone, hoặc ổ NAS).

## 5. Cập nhật phiên bản

Chép gói mới lên máy chủ, giải nén, chạy lại đúng lệnh `sudo bash install.sh <mã-xã> <cổng>` cho từng xã. Dữ liệu giữ nguyên, CSDL tự nâng cấp khi phần mềm khởi động.

Nên chạy `sao-luu-csdl.sh` trước khi cập nhật. Khi nâng cấp từ bản 1.1 lên 1.2, phần mềm tự chuyển các phụ lục hợp đồng và biên bản nghiệm thu đã nhập sang trạng thái «Đã duyệt», gắn hồ sơ thanh toán cũ với đợt thanh toán theo kế hoạch, cấp quyền Duyệt hồ sơ cho nhóm Lãnh đạo Ban và thay tài liệu hướng dẫn sử dụng trong phần mềm bằng bản mới. Không cần thao tác thêm.

## 6. Lệnh thường dùng

```bash
cd /opt/qlda/xa-tan-hoa
docker compose ps                      # trạng thái
docker compose logs -f app             # nhật ký phần mềm
docker compose restart app             # khởi động lại
docker compose exec app dotnet QldaTtts.Web.dll --reset-2fa admin   # đặt lại xác thực 2 lớp khi quản trị mất điện thoại
```
