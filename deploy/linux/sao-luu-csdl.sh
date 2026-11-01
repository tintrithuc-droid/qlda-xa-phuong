#!/usr/bin/env bash
# Sao lưu CSDL PostgreSQL của mọi xã trong /opt/qlda (bổ sung cho bản sao lưu tự động hằng đêm của phần mềm).
# Đặt lịch: echo "30 1 * * * root bash /opt/qlda/sao-luu-csdl.sh" > /etc/cron.d/qlda-sao-luu
set -euo pipefail
OUT=/opt/qlda/_saoluu; KEEP=14; mkdir -p "$OUT"
for d in /opt/qlda/*/; do
  [[ -f "$d/docker-compose.yml" ]] || continue
  ma="$(basename "$d")"; f="$OUT/$ma-$(date +%Y%m%d-%H%M).sql.gz"
  (cd "$d" && docker compose exec -T db pg_dump -U qlda qlda) | gzip > "$f" && echo "Đã lưu $f"
  ls -1t "$OUT/$ma-"*.sql.gz | tail -n +$((KEEP+1)) | xargs -r rm -f
done
