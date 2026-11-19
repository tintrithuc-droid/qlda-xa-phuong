#!/usr/bin/env bash
# Cập nhật máy chủ thuê bao (.22) lên bản 1.8.2 (rà soát cho Tri Thức, gán dự án cho tài khoản khách hàng). Chạy bằng root:
#   bash cap-nhat-1.8.2.sh qlda-src-94c384e.tar.gz   (tệp nén tạo bằng: git archive --format=tar.gz -o qlda-src-94c384e.tar.gz 94c384e)
set -euo pipefail
TGZ=${1:-qlda-src-94c384e.tar.gz}; TAG=94c384e; DIR=/opt/qlda-thue-bao; SRC=/opt/qlda-src-$TAG; APP=qlda-thue-bao-app-1
[[ -f "$TGZ" ]] || { echo "Không thấy $TGZ"; exit 1; }
echo "== 1. Giải nén mã nguồn vào $SRC"; mkdir -p "$SRC"; tar xzf "$TGZ" -C "$SRC"
echo "== 2. Giữ bộ HDSD đang chạy (PDF không có trong mã nguồn)"
rm -rf "$SRC/src/QldaTtts.Web/hdsd"; docker cp "$APP:/app/hdsd" "$SRC/src/QldaTtts.Web/hdsd" && ls "$SRC/src/QldaTtts.Web/hdsd" | head
echo "== 3. Dựng ảnh qlda-xa-phuong:$TAG (vài phút)"; docker build -q -t "qlda-xa-phuong:$TAG" "$SRC"
echo "== 4. Giữ bản đang chạy để quay về: qlda-xa-phuong:truoc-cap-nhat-182"
docker commit "$APP" qlda-xa-phuong:truoc-cap-nhat-182 >/dev/null
echo "== 5. Sao lưu dữ liệu"; bash "$DIR/sao-luu.sh" </dev/null || echo "(Sao lưu báo lỗi, xem lại trước khi tiếp tục)"
echo "== 6. Chạy bản mới"
cd "$DIR"; cp .env ".env.bak-182"
if grep -q '^QLDA_IMAGE=' .env; then sed -i "s#^QLDA_IMAGE=.*#QLDA_IMAGE=qlda-xa-phuong:$TAG#" .env; else echo "QLDA_IMAGE=qlda-xa-phuong:$TAG" >> .env; fi
docker compose --project-directory "$DIR" -p qlda-thue-bao up -d app </dev/null
for i in $(seq 1 60); do v=$(curl -sk --resolve trithuc.qlda.trithucsoft.vn:443:127.0.0.1 https://trithuc.qlda.trithucsoft.vn/api/health || true); [[ "$v" == *1.8.2* ]] && { echo "Đã chạy: $v"; exit 0; }; sleep 2; done
echo "Chưa thấy bản 1.8.2 chạy. Quay về: sed -i 's#^QLDA_IMAGE=.*#QLDA_IMAGE=qlda-xa-phuong:truoc-cap-nhat-182#' $DIR/.env && docker compose --project-directory $DIR -p qlda-thue-bao up -d app"; exit 1
