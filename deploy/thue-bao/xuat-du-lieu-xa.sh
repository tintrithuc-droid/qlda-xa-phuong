#!/usr/bin/env bash
# Xuất trọn dữ liệu một xã để bàn giao (khi xã thôi thuê hoặc chuyển sang tự đặt máy chủ):
#   sudo bash xuat-du-lieu-xa.sh <mã-xã>
# Tạo /srv/qlda-bangiao/<mã-xã>-<ngày>.tar.gz gồm: CSDL dạng SQL (PostgreSQL) và toàn bộ kho tệp.
# Xã cũng tự tải được bản sao dữ liệu trong phần mềm (Quản trị → Sao lưu, tệp .zip) để nạp vào bản cài riêng.
source "$(dirname "$0")/chung.sh"
MA="${1:?Thiếu mã xã}"; kiem_ma "$MA"; CSDL="$(db_cua "$MA")"; [[ -n "$CSDL" ]] || { echo "Không có xã $MA"; exit 1; }
OUT=/srv/qlda-bangiao; T="$(mktemp -d)"; mkdir -p "$OUT" "$T/$MA"
dc exec -T db pg_dump -U qlda_quantri --no-owner --no-privileges "$CSDL" > "$T/$MA/co-so-du-lieu.sql"
cp -r "$DIR/du-lieu/xa/$MA/files" "$T/$MA/tep-dinh-kem" 2>/dev/null || mkdir -p "$T/$MA/tep-dinh-kem"
printf 'Dữ liệu phần mềm Quản lý dự án của %s, xuất ngày %s.\nco-so-du-lieu.sql: PostgreSQL 16 (psql -d <csdl> -f co-so-du-lieu.sql)\ntep-dinh-kem/: kho tệp (đặt vào App_Data/files của bản cài riêng)\n' "$MA" "$(date '+%d/%m/%Y')" > "$T/$MA/DOC_TRUOC.txt"
F="$OUT/$MA-$(date +%Y%m%d).tar.gz"; tar -C "$T" -czf "$F" "$MA"; rm -rf "$T"
sha256sum "$F" > "$F.sha256"; echo "XONG: $F ($(du -h "$F" | cut -f1))"
