#!/usr/bin/env bash
# Cập nhật .22: bản 1.8.1 bổ sung (ô gõ tìm, HDSD theo vai trò, HDSD riêng Tri Thức). Chạy trên .22: bash ~/cap-nhat-181c.sh
set -euo pipefail
TAG=903d056; SRC=/opt/qlda-src-$TAG; DIR=/opt/qlda-thue-bao; TAR=/root/qlda-181c.tar.gz
[[ -f "$TAR" ]] || { echo "Thiếu $TAR"; exit 1; }
rm -rf "$SRC"; mkdir -p "$SRC"; tar -xzf "$TAR" -C "$SRC" --strip-components=1
ls "$SRC/src/QldaTtts.Web/hdsd/"*.pdf >/dev/null && ls "$SRC/src/QldaTtts.Web/hdsd/trithuc/vai-tro.json" >/dev/null
echo "== Dựng ảnh qlda-xa-phuong:$TAG"; docker build -q -t qlda-xa-phuong:$TAG "$SRC"
cd "$DIR"; OLDIMG=$(grep '^QLDA_IMAGE=' .env | cut -d= -f2-); echo "== Bản đang chạy: $OLDIMG (quay về: đặt lại QLDA_IMAGE=$OLDIMG trong .env)"
echo "== Sao lưu"; bash "$DIR/sao-luu.sh" </dev/null || echo "(sao lưu báo lỗi)"
cp .env .env.bak-181c; sed -i "s#^QLDA_IMAGE=.*#QLDA_IMAGE=qlda-xa-phuong:$TAG#" .env
docker compose --project-directory "$DIR" -p qlda-thue-bao up -d app </dev/null
for i in $(seq 1 90); do v=$(curl -sk --resolve quantri.qlda.trithucsoft.vn:443:127.0.0.1 https://quantri.qlda.trithucsoft.vn/api/health || true); [[ "$v" == *'"ok"'* ]] && break; sleep 2; done
echo "Ảnh đang chạy: $(docker inspect -f '{{.Config.Image}}' qlda-thue-bao-app-1)"
for x in quantri trithuc chau-thanh; do echo "$x: $(curl -sk --resolve $x.qlda.trithucsoft.vn:443:127.0.0.1 https://$x.qlda.trithucsoft.vn/api/health)"; done
docker logs --since 3m qlda-thue-bao-app-1 2>&1 | grep -iE "fail|error|exception" | tail -5 || true
grep -c "qlda-shell-v15" "$SRC/src/QldaTtts.Web/wwwroot/sw.js"
