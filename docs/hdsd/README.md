# Bộ hướng dẫn sử dụng theo vai trò

Tạo lại 5 tệp HDSD (Quản trị hệ thống, Lãnh đạo Ban, Cán bộ kỹ thuật, Kế toán, Tư vấn giám sát / Nhà thầu):

1. Chạy ứng dụng với CSDL trống ở cổng 5080.
2. `LANG=vi_VN.UTF-8 LANGUAGE=vi node shots.js` rồi `node shots-dt.js` — chụp ảnh màn hình thật (máy tính và điện thoại) vào `shots/`.
3. `node drum.js` — tạo hình trống đồng cho trang bìa.
4. `node build.js [qt|ld|kt|ke|gs]` — dựng .docx và .pdf vào `out/` (cần `docx`, LibreOffice, poppler-utils, Pillow). Script tự đo bố cục bằng `measure.py`: hình, chú thích và bảng chú giải luôn liền trang; hình bị đẩy sang trang sau hoặc đuôi chương chỉ còn vài dòng thì tự thu nhỏ hình (không nhỏ hơn mức đọc được); lượt cuối ghi số trang vào mục lục.

Nội dung từng vai trò nằm trong `content.js`.
5. Tài liệu dùng trên điện thoại: `node build.js dt` (nội dung ở `content-dt.js`).
