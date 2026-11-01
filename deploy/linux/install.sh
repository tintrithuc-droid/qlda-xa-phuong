#!/usr/bin/env bash
# Cài Phần mềm QLDA cho một xã/phường trên máy chủ Linux (Ubuntu 22.04/24.04) bằng Docker + PostgreSQL.
# Cách dùng (quyền root, trong thư mục gói cài):
#   sudo bash install.sh <ma-xa> [cong]        ví dụ: sudo bash install.sh xa-tan-hoa 8080
# Chạy lại cùng lệnh để cập nhật phiên bản mới: dữ liệu giữ nguyên.
set -euo pipefail
MA="${1:?Thiếu mã xã, ví dụ: xa-tan-hoa}"; PORT="${2:-8080}"
[[ "$MA" =~ ^[a-z0-9-]{3,40}$ ]] || { echo "Mã xã chỉ gồm chữ thường không dấu, số, gạch ngang"; exit 1; }
DIR="/opt/qlda/$MA"; HERE="$(cd "$(dirname "$0")" && pwd)"

if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  echo "== Cài Docker từ kho Ubuntu"
  apt-get update -qq && apt-get install -y -qq docker.io docker-compose-v2
  systemctl enable --now docker
fi

if [[ -f "$HERE/qlda-xa-phuong-image.tar.gz" ]]; then
  echo "== Nạp ảnh phần mềm"; docker load -i "$HERE/qlda-xa-phuong-image.tar.gz"
elif ! docker image inspect qlda-xa-phuong:latest >/dev/null 2>&1; then
  echo "Không thấy qlda-xa-phuong-image.tar.gz trong gói cài"; exit 1
fi

mkdir -p "$DIR"; cp "$HERE/docker-compose.yml" "$DIR/"
if [[ ! -f "$DIR/.env" ]]; then
  PW="$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')"
  printf 'COMPOSE_PROJECT_NAME=qlda-%s\nQLDA_PORT=%s\nDB_PASSWORD=%s\n' "$MA" "$PORT" "$PW" > "$DIR/.env"
  chmod 600 "$DIR/.env"
fi
cd "$DIR" && docker compose up -d

echo "== Chờ phần mềm khởi động"
P="$(grep ^QLDA_PORT .env | cut -d= -f2)"
for i in $(seq 1 60); do curl -sf "http://127.0.0.1:$P/api/health" >/dev/null && break; sleep 2; done
curl -sf "http://127.0.0.1:$P/api/health" >/dev/null && echo "XONG: http://$(hostname -I | awk '{print $1}'):$P" || { echo "Chưa chạy được, xem: docker compose -f $DIR/docker-compose.yml logs app"; exit 1; }
