# Ứng dụng Android QLDA TTTS

Ứng dụng bọc phần mềm web (WebView), không chứa dữ liệu; mọi thứ nằm trên máy chủ của Ban.
iPhone dùng bản web: mở Safari → địa chỉ máy chủ → Chia sẻ → "Thêm vào MH chính".

- Lần đầu mở: nhập địa chỉ máy chủ, ứng dụng kiểm tra `/api/health` rồi lưu lại.
- Ở màn hình đầu, nhấn Quay lại: Tải lại / Đổi máy chủ / Thoát.
- Chọn tệp: có thêm lựa chọn chụp ảnh bằng camera (Android 10+), ảnh lưu ở `Ảnh/QLDA TTTS`.
- Tải tệp đính kèm (`/api/files/...`, sao lưu) qua DownloadManager kèm cookie đăng nhập;
  tệp xuất từ trình duyệt (Excel, `blob:`) được chuyển sang ứng dụng và lưu vào `Tải xuống/QLDA TTTS`.
- Cho phép HTTP (máy chủ nội bộ); khuyến nghị HTTPS khi truy cập qua Internet.

## Dựng APK

Không cần Android Studio. Trên Ubuntu:

```bash
sudo apt install openjdk-17-jdk-headless aapt dalvik-exchange zipalign apksigner
ANDROID_JAR=/duong/dan/android-34/android.jar \
KEYSTORE=/duong/dan/qlda-ttts.jks KS_PASS=... ./build-apk.sh
```

Mỗi lần phát hành: tăng `versionCode`/`versionName` trong `AndroidManifest.xml`.
Bản cập nhật **phải ký bằng đúng khóa cũ** (`qlda-ttts.jks`, bàn giao riêng, không đưa vào kho mã),
nếu khác khóa máy sẽ từ chối cài đè.
