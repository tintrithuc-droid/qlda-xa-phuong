#!/usr/bin/env bash
# Đóng gói cài máy chủ Linux: dist/QLDA_XaPhuong_GoiCaiDat_Linux_<phiên bản>.tar.gz (cần Docker trên máy đóng gói)
set -euo pipefail
VER="${1:-1.0}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; OUT="$ROOT/dist/QLDA_XaPhuong_GoiCaiDat_Linux_$VER"
rm -rf "$OUT"; mkdir -p "$OUT"
docker build -t qlda-xa-phuong:latest -t "qlda-xa-phuong:$VER" "$ROOT"
docker save qlda-xa-phuong:latest | gzip > "$OUT/qlda-xa-phuong-image.tar.gz"
cp "$ROOT/deploy/linux/"{install.sh,sao-luu-csdl.sh,docker-compose.yml,.env.example} "$ROOT/docs/HUONG_DAN_CAI_DAT_LINUX.md" "$OUT/"
tar -C "$ROOT/dist" -czf "$OUT.tar.gz" "$(basename "$OUT")"
echo "Đã tạo $OUT.tar.gz"
