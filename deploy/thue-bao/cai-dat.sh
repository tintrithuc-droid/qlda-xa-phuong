#!/usr/bin/env bash
# Cài máy chủ cho thuê nhiều xã/phường trên Ubuntu 22.04/24.04 (quyền root), trong thư mục gói cài:
#   sudo bash cai-dat.sh <tên miền gốc> <email nhận thông báo chứng chỉ> [tên đăng nhập quản trị nền tảng]
#   ví dụ: sudo bash cai-dat.sh trithucsoft.vn kythuat@trithucsoft.vn tri
# Trước đó: trỏ bản ghi DNS *.trithucsoft.vn (và quantri.trithucsoft.vn) về IP máy chủ; mở cổng 80, 443.
# Chạy lại cùng lệnh để cập nhật phiên bản mới (dữ liệu giữ nguyên, CSDL từng xã tự nâng cấp lần lượt).
set -euo pipefail
BASE="${1:?Thiếu tên miền gốc, ví dụ trithucsoft.vn}"; EMAIL="${2:?Thiếu email nhận thông báo chứng chỉ}"; QT="${3:-}"
DIR="${QLDA_DIR:-/opt/qlda-thue-bao}"; HERE="$(cd "$(dirname "$0")" && pwd)"
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  echo "== Cài Docker"; apt-get update -qq && apt-get install -y -qq docker.io docker-compose-v2; systemctl enable --now docker
fi
apt-get install -y -qq rsync curl >/dev/null 2>&1 || true
command -v restic >/dev/null || apt-get install -y -qq restic >/dev/null 2>&1 || true
if [[ -f "$HERE/qlda-xa-phuong-image.tar.gz" ]]; then echo "== Nạp ảnh phần mềm"; docker load -i "$HERE/qlda-xa-phuong-image.tar.gz"
elif ! docker image inspect qlda-xa-phuong:latest >/dev/null 2>&1; then echo "Không thấy qlda-xa-phuong-image.tar.gz trong gói cài"; exit 1; fi
mkdir -p "$DIR"/{du-lieu,postgres,caddy}
for f in docker-compose.yml Caddyfile chung.sh sao-luu.sh khoi-phuc-xa.sh xuat-du-lieu-xa.sh xoa-xa.sh kiem-tra.sh danh-sach-xa.sh .env.mau; do cp "$HERE/$f" "$DIR/"; done
chmod +x "$DIR"/*.sh
if [[ -f "$DIR/.env" ]]; then sed -i "s#^BASE_DOMAIN=.*#BASE_DOMAIN=$BASE#; s#^ACME_EMAIL=.*#ACME_EMAIL=$EMAIL#" "$DIR/.env"
else
  PW="$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')"
  sed "s#^BASE_DOMAIN=.*#BASE_DOMAIN=$BASE#; s#^ACME_EMAIL=.*#ACME_EMAIL=$EMAIL#; s#^PG_PASSWORD=.*#PG_PASSWORD=$PW#" "$HERE/.env.mau" > "$DIR/.env"
  # RAM máy chủ ≥ 16 GB: tăng bộ đệm PostgreSQL
  MEM=$(awk '/MemTotal/{print int($2/1048576)}' /proc/meminfo); [[ $MEM -ge 15 ]] && sed -i "s#^PG_SHARED_BUFFERS=.*#PG_SHARED_BUFFERS=$((MEM/4))GB#" "$DIR/.env"
fi
chmod 600 "$DIR/.env"
chown -R 1654:1654 "$DIR/du-lieu"   # tài khoản chạy phần mềm trong ảnh Docker
source "$DIR/chung.sh"
echo "== Khởi động"; dc up -d
ok=""; for i in $(seq 1 90); do dc exec -T caddy wget -qO- --header "Host: quantri.$BASE" http://app:8080/api/health >/dev/null 2>&1 && { ok=1; break; }; sleep 2; done
[[ -n "$ok" ]] || { echo "Phần mềm chưa chạy được, xem: docker compose -p qlda-thue-bao logs app"; exit 1; }
# Tài khoản CSDL của xã không được vào CSDL hệ thống
sql "REVOKE ALL ON DATABASE postgres FROM PUBLIC" >/dev/null || true
if [[ -n "$QT" ]]; then echo "== Tài khoản quản trị nền tảng"; dc exec -T app dotnet QldaTtts.Web.dll --tao-quan-tri-nen-tang "$QT" 2>/dev/null | grep -v -E '^(warn|info)|^ '; fi
# Lịch: sao lưu 1h30 mỗi đêm, kiểm tra mỗi 5 phút
echo "30 1 * * * root bash $DIR/sao-luu.sh >> /var/log/qlda-sao-luu.log 2>&1" > /etc/cron.d/qlda-sao-luu
echo "*/5 * * * * root bash $DIR/kiem-tra.sh >> /var/log/qlda-kiem-tra.log 2>&1" > /etc/cron.d/qlda-kiem-tra
echo
echo "XONG. Trang quản lý thuê bao: https://quantri.$BASE"
echo "Mỗi xã: https://<mã-xã>.$BASE (tạo xã trên trang quản lý thuê bao)."
