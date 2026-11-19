#!/usr/bin/env bash
# Cập nhật máy chủ thuê bao (.22) lên bản 1.8.3 (Tổng quan hệ sinh thái, nhà thầu theo danh mục, tỷ lệ liên danh). Chạy bằng root:
# Có tệp gan_nha_thau.sql cạnh tệp này thì sau khi lên bản mới sẽ nạp danh mục nhà thầu cho xã trithuc (chạy lại không tạo trùng).
#   bash cap-nhat-1.8.3.sh qlda-src-a3471e8.tar.gz   (tệp nén tạo bằng: git archive --format=tar.gz -o qlda-src-a3471e8.tar.gz a3471e8)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
TGZ=${1:-qlda-src-a3471e8.tar.gz}; TAG=a3471e8; DIR=/opt/qlda-thue-bao; SRC=/opt/qlda-src-$TAG; APP=qlda-thue-bao-app-1
[[ -f "$TGZ" ]] || { echo "Không thấy $TGZ"; exit 1; }
echo "== 1. Giải nén mã nguồn vào $SRC"; mkdir -p "$SRC"; tar xzf "$TGZ" -C "$SRC"
echo "== 2. Giữ bộ HDSD đang chạy (PDF không có trong mã nguồn)"
rm -rf "$SRC/src/QldaTtts.Web/hdsd"; docker cp "$APP:/app/hdsd" "$SRC/src/QldaTtts.Web/hdsd" && ls "$SRC/src/QldaTtts.Web/hdsd" | head
echo "== 3. Dựng ảnh qlda-xa-phuong:$TAG (vài phút)"; docker build -q -t "qlda-xa-phuong:$TAG" "$SRC"
echo "== 4. Giữ bản đang chạy để quay về: qlda-xa-phuong:truoc-cap-nhat-183"
docker commit "$APP" qlda-xa-phuong:truoc-cap-nhat-183 >/dev/null
echo "== 5. Sao lưu dữ liệu"; bash "$DIR/sao-luu.sh" </dev/null || echo "(Sao lưu báo lỗi, xem lại trước khi tiếp tục)"
echo "== 6. Chạy bản mới"
cd "$DIR"; cp .env ".env.bak-183"
if grep -q '^QLDA_IMAGE=' .env; then sed -i "s#^QLDA_IMAGE=.*#QLDA_IMAGE=qlda-xa-phuong:$TAG#" .env; else echo "QLDA_IMAGE=qlda-xa-phuong:$TAG" >> .env; fi
docker compose --project-directory "$DIR" -p qlda-thue-bao up -d app </dev/null
for i in $(seq 1 60); do v=$(curl -sk --resolve trithuc.qlda.trithucsoft.vn:443:127.0.0.1 https://trithuc.qlda.trithucsoft.vn/api/health || true); [[ "$v" == *1.8.3* ]] && { echo "Đã chạy: $v"; OK=1; break; }; sleep 2; done
[[ "${OK:-}" == 1 ]] || { echo "Chưa thấy bản 1.8.3 chạy. Quay về: sed -i 's#^QLDA_IMAGE=.*#QLDA_IMAGE=qlda-xa-phuong:truoc-cap-nhat-183#' $DIR/.env && docker compose --project-directory $DIR -p qlda-thue-bao up -d app"; exit 1; }
if [[ -f "$HERE/gan_nha_thau.sql" ]]; then
  echo "== 7. Nạp danh mục nhà thầu, thành viên và tỷ lệ liên danh cho xã trithuc"
  PSQL="docker compose --project-directory $DIR -p qlda-thue-bao exec -T db psql -v ON_ERROR_STOP=1 -U qlda_quantri -d qlda_x_trithuc"
  for i in $(seq 1 60); do [[ "$($PSQL -tAc "select count(*) from information_schema.columns where table_name='Packages' and column_name='ContractorShares'")" == 1 ]] && break; sleep 2; done
  $PSQL < "$HERE/gan_nha_thau.sql"
fi
echo "Xong."
