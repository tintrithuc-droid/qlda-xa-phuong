#!/usr/bin/env bash
# Cập nhật máy chủ thuê bao (.22) lên bản 1.8.5 (Danh sách dự án thêm lọc Năm và Trạng thái). Chạy bằng root:
#   bash cap-nhat-1.8.5.sh qlda-src-<mã>.tar.gz <mã>   (tệp nén tạo bằng: git archive --format=tar.gz -o qlda-src-<mã>.tar.gz <mã>). Không đổi cấu trúc dữ liệu.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
TGZ=${1:-qlda-src-CHUA_CO_MA.tar.gz}; TAG=${2:-CHUA_CO_MA}; DIR=/opt/qlda-thue-bao; SRC=/opt/qlda-src-$TAG; APP=qlda-thue-bao-app-1
[[ -f "$TGZ" ]] || { echo "Không thấy $TGZ"; exit 1; }
echo "== 1. Giải nén mã nguồn vào $SRC"; mkdir -p "$SRC"; tar xzf "$TGZ" -C "$SRC"
echo "== 2. Giữ bộ HDSD đang chạy (PDF không có trong mã nguồn)"
rm -rf "$SRC/src/QldaTtts.Web/hdsd"; docker cp "$APP:/app/hdsd" "$SRC/src/QldaTtts.Web/hdsd" && ls "$SRC/src/QldaTtts.Web/hdsd" | head
echo "== 3. Dựng ảnh qlda-xa-phuong:$TAG (vài phút)"; docker build -q -t "qlda-xa-phuong:$TAG" "$SRC"
echo "== 4. Giữ bản đang chạy để quay về: qlda-xa-phuong:truoc-cap-nhat-185"
docker image inspect qlda-xa-phuong:truoc-cap-nhat-185 >/dev/null 2>&1 && echo "(Đã có ảnh trước cập nhật 1.8.5, giữ nguyên để quay về bản 1.8.4)" || docker commit "$APP" qlda-xa-phuong:truoc-cap-nhat-185 >/dev/null
echo "== 5. Sao lưu dữ liệu"; bash "$DIR/sao-luu.sh" </dev/null || echo "(Sao lưu báo lỗi, xem lại trước khi tiếp tục)"
echo "== 6. Chạy bản mới"
cd "$DIR"; cp .env ".env.bak-185"
if grep -q '^QLDA_IMAGE=' .env; then sed -i "s#^QLDA_IMAGE=.*#QLDA_IMAGE=qlda-xa-phuong:$TAG#" .env; else echo "QLDA_IMAGE=qlda-xa-phuong:$TAG" >> .env; fi
docker compose --project-directory "$DIR" -p qlda-thue-bao up -d app </dev/null
for i in $(seq 1 60); do v=$(curl -sk --resolve trithuc.qlda.trithucsoft.vn:443:127.0.0.1 https://trithuc.qlda.trithucsoft.vn/api/health || true); [[ "$v" == *1.8.5* ]] && { echo "Đã chạy: $v"; OK=1; break; }; sleep 2; done
[[ "${OK:-}" == 1 ]] || { echo "Chưa thấy bản 1.8.5 chạy. Quay về: sed -i 's#^QLDA_IMAGE=.*#QLDA_IMAGE=qlda-xa-phuong:truoc-cap-nhat-185#' $DIR/.env && docker compose --project-directory $DIR -p qlda-thue-bao up -d app"; exit 1; }
echo "Xong."
