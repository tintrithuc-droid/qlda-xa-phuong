#!/usr/bin/env bash
# Đóng gói máy chủ cho thuê: dist/QLDA_XaPhuong_GoiThueBao_<phiên bản>.tar.gz (cần Docker trên máy đóng gói)
#   bash deploy/thue-bao/build-package.sh 1.6            dựng ảnh từ Dockerfile
#   SKIP_BUILD=1 bash deploy/thue-bao/build-package.sh 1.6   dùng ảnh qlda-xa-phuong:latest đã có
set -euo pipefail
VER="${1:-1.6}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; OUT="$ROOT/dist/QLDA_XaPhuong_GoiThueBao_$VER"
rm -rf "$OUT"; mkdir -p "$OUT"
[[ -n "${SKIP_BUILD:-}" ]] || docker build -t qlda-xa-phuong:latest -t "qlda-xa-phuong:$VER" "$ROOT"
docker save qlda-xa-phuong:latest | gzip > "$OUT/qlda-xa-phuong-image.tar.gz"
D="$ROOT/deploy/thue-bao"
cp "$D/"{docker-compose.yml,Caddyfile,.env.mau,chung.sh,cai-dat.sh,danh-sach-xa.sh,sao-luu.sh,khoi-phuc-xa.sh,xuat-du-lieu-xa.sh,xoa-xa.sh,kiem-tra.sh} "$ROOT/docs/HUONG_DAN_MAY_CHU_THUE_BAO.md" "$OUT/"
chmod +x "$OUT"/*.sh
tar -C "$ROOT/dist" -czf "$OUT.tar.gz" "$(basename "$OUT")"
echo "Đã tạo $OUT.tar.gz"
