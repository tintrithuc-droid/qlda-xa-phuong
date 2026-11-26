#!/usr/bin/env bash
# Cập nhật máy chủ thuê bao (.22) lên bản 1.8.8 (ô chọn gõ để tìm, hợp đồng chưa có số, nhà thầu theo giai đoạn, dải các bước gói thầu; không đổi cấu trúc dữ liệu). Chạy bằng root:
#   bash cap-nhat-1.8.8.sh qlda-src-<mã>.tar.gz <mã> [tệp-sql-dữ-liệu-trithuc]   (tệp nén tạo bằng: git archive --format=tar.gz -o qlda-src-<mã>.tar.gz <mã>).
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
TGZ=${1:-qlda-src-CHUA_CO_MA.tar.gz}; SQL=${3:+$(realpath "$3")}; TAG=${2:-CHUA_CO_MA}; DIR=/opt/qlda-thue-bao; SRC=/opt/qlda-src-$TAG; APP=qlda-thue-bao-app-1
[[ -f "$TGZ" ]] || { echo "Không thấy $TGZ"; exit 1; }
echo "== 1. Giải nén mã nguồn vào $SRC"; mkdir -p "$SRC"; tar xzf "$TGZ" -C "$SRC"
echo "== 2. Giữ bộ HDSD đang chạy (PDF không có trong mã nguồn)"
rm -rf "$SRC/src/QldaTtts.Web/hdsd"; docker cp "$APP:/app/hdsd" "$SRC/src/QldaTtts.Web/hdsd" && ls "$SRC/src/QldaTtts.Web/hdsd" | head
echo "== 3. Dựng ảnh qlda-xa-phuong:$TAG (vài phút)"; docker build -q -t "qlda-xa-phuong:$TAG" "$SRC"
echo "== 4. Giữ bản đang chạy để quay về: qlda-xa-phuong:truoc-cap-nhat-188"
docker image inspect qlda-xa-phuong:truoc-cap-nhat-188 >/dev/null 2>&1 && echo "(Đã có ảnh trước cập nhật 1.8.8, giữ nguyên để quay về bản 1.8.7)" || docker commit "$APP" qlda-xa-phuong:truoc-cap-nhat-188 >/dev/null
echo "== 5. Sao lưu dữ liệu"; bash "$DIR/sao-luu.sh" </dev/null || echo "(Sao lưu báo lỗi, xem lại trước khi tiếp tục)"
# Giữ riêng bản CSDL của lần cập nhật này (sao lưu cùng ngày ghi vào cùng thư mục ngày, lần sau sẽ ghi đè)
BK="/srv/qlda-saoluu/truoc-cap-nhat-$TAG-$(date +%H%M)"; mkdir -p "$BK" && cp -a "/srv/qlda-saoluu/$(date +%Y-%m-%d)/csdl" "$BK/" && chmod -R go-rwx "$BK" && echo "  Bản CSDL riêng của lần cập nhật: $BK"
echo "== 6. Chạy bản mới"
cd "$DIR"; cp .env ".env.bak-188"
if grep -q '^QLDA_IMAGE=' .env; then sed -i "s#^QLDA_IMAGE=.*#QLDA_IMAGE=qlda-xa-phuong:$TAG#" .env; else echo "QLDA_IMAGE=qlda-xa-phuong:$TAG" >> .env; fi
docker compose --project-directory "$DIR" -p qlda-thue-bao up -d app </dev/null
for i in $(seq 1 60); do v=$(curl -sk --resolve trithuc.qlda.trithucsoft.vn:443:127.0.0.1 https://trithuc.qlda.trithucsoft.vn/api/health || true); [[ "$v" == *1.8.8* ]] && { echo "Đã chạy: $v"; OK=1; break; }; sleep 2; done
[[ "${OK:-}" == 1 ]] || { echo "Chưa thấy bản 1.8.8 chạy. Quay về: sed -i 's#^QLDA_IMAGE=.*#QLDA_IMAGE=qlda-xa-phuong:truoc-cap-nhat-188#' $DIR/.env && docker compose --project-directory $DIR -p qlda-thue-bao up -d app"; exit 1; }
if [[ -n "$SQL" ]]; then echo "== 7. Cập nhật dữ liệu trithuc: $SQL (đã sao lưu ở bước 5)"
  docker compose --project-directory "$DIR" -p qlda-thue-bao exec -T db psql -v ON_ERROR_STOP=1 -U qlda_quantri -d qlda_x_trithuc < "$SQL"; fi
echo "Xong."
