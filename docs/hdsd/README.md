# Bộ hướng dẫn sử dụng theo vai trò

Bộ hợp nhất (08/11/2026) gồm 7 tài liệu cho xã, phường (Quản trị hệ thống, Lãnh đạo Ban, Cán bộ kỹ thuật, Kế toán, Tư vấn giám sát / Nhà thầu, Lãnh đạo xã/phường, Sử dụng trên điện thoại) và 1 tài liệu cho nhà sản xuất (vận hành máy chủ cho thuê). Tài liệu cho xã không có nội dung cài đặt hay cập nhật phiên bản; các nội dung đó chỉ nằm trong tài liệu nhà sản xuất.

Tạo lại:

1. Chạy ứng dụng với CSDL trống ở cổng 5080. `python3 mau.py` tạo tệp mẫu (PDF, ảnh, Excel) trong `/tmp/hdsd-mau` và `/tmp/hdsd-them`.
2. `LANG=vi_VN.UTF-8 LANGUAGE=vi node shots.js`, rồi `node shots-v17.js` (chạy tiếp trên cùng CSDL: trình duyệt tiến độ, đợt nghiệm thu, TVGS xác nhận, Quản trị chính, bước kiểm tra, xem PDF…) rồi `node shots-v18.js` (mã kiểm tra đăng nhập, menu theo giai đoạn, danh mục nhà thầu và đơn vị giám sát, nghiệm thu sản phẩm tư vấn, lưu nháp và chuyển duyệt, theo dõi hồ sơ, chuông, Trung tâm cảnh báo, tài khoản thuộc đơn vị, dữ liệu đầu kỳ) và `node shots-dt.js` — chụp ảnh màn hình thật (máy tính và điện thoại) vào `shots/`.
3. Ảnh trang quản lý thuê bao: cài máy chủ cho thuê với tên miền `qlda.test` (`deploy/thue-bao/cai-dat.sh`), mở bộ chuyển tiếp `<tên>.localhost:8092 → <tên>.qlda.test`, rồi
   `HD_REPLACE='[["quantri.localhost:8092","quantri.qlda.trithucsoft.vn"],["localhost:8092","qlda.trithucsoft.vn"],["qlda.test","qlda.trithucsoft.vn"]]' PORTAL_USER=… PORTAL_PW=… PORTAL_SECRET=… node shots-thuebao.js`
   (`HD_REPLACE` đổi địa chỉ máy thử sang tên miền thật trên ảnh).
4. `node drum.js` — tạo hình trống đồng cho trang bìa.
5. `node build.js [qt|ld|kt|ke|gs|ub|dt|ns]` — dựng .docx và .pdf vào `out/` (cần `docx`, LibreOffice, poppler-utils, Pillow). Script tự đo bố cục bằng `measure.py`: hình, chú thích và bảng chú giải luôn liền trang; hình bị đẩy sang trang sau hoặc đuôi chương chỉ còn vài dòng thì tự thu nhỏ hình (không nhỏ hơn mức đọc được); lượt cuối ghi số trang vào mục lục.

Nội dung: vai trò của xã trong `content.js` (các chương nâng cấp theo phần mềm TTTS trong `content-v18.js`), điện thoại trong `content-dt.js`, nhà sản xuất trong `content-ns.js`. Ngày ban hành và số V trong tên tệp đặt ở `build.js` (DATE) và `ROLES[k].v`.

## Bộ riêng cho một đơn vị (ví dụ Công ty CP Tin học Tri Thức, mã `trithuc`)

- Ảnh: chạy lại bước 2 với `HD_REPLACE_FILE=$PWD/tt-replace.json` (đổi tên đơn vị, tên nhóm trên giao diện trước khi chụp), ảnh lưu vào `shots/`. Ảnh bộ chuẩn nên chép sang thư mục khác trước.
- Tài liệu: `HD_VARIANT=tt HD_SHOTS=… HD_OUT=… node build.js qt ld kt ke gs ub dt` (`variant-tt.js` đổi tên nhóm quyền, từ ngữ, bảng quyền; thêm chương xác nhận khối lượng và duyệt hồ sơ khi được giao cho Nhân viên, bỏ chương xác nhận khối lượng của Nhà thầu).
- Nạp vào phần mềm: chép PDF vào `src/QldaTtts.Web/hdsd/trithuc/` cùng `tt-vai-tro.json` đổi tên thành `vai-tro.json`. Máy chủ cho thuê dùng thư mục `hdsd/<mã xã>` cho xã có thư mục riêng, các xã khác dùng bộ chuẩn trong `hdsd/`.
