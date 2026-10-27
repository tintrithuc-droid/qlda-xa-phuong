# Bộ hướng dẫn sử dụng theo vai trò

Tạo lại 5 tệp HDSD (Quản trị hệ thống, Lãnh đạo Ban, Cán bộ kỹ thuật, Kế toán, Tư vấn giám sát / Nhà thầu):

1. Chạy ứng dụng với CSDL trống ở cổng 5080.
2. `LANG=vi_VN.UTF-8 LANGUAGE=vi node shots.js` — chụp ảnh màn hình thật vào `shots/`.
3. `node drum.js` — tạo hình trống đồng cho trang bìa.
4. `node build.js [qt|ld|kt|ke|gs]` — dựng .docx và .pdf vào `out/` (cần `docx`, LibreOffice, poppler-utils). Chạy 2 lượt để mục lục có số trang.

Nội dung từng vai trò nằm trong `content.js`.
