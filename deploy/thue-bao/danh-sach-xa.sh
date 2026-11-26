#!/usr/bin/env bash
# In danh sách xã: mã, CSDL, trạng thái
source "$(dirname "$0")/chung.sh"
printf "%-28s %-36s %s\n" "MÃ XÃ" "CƠ SỞ DỮ LIỆU" "TRẠNG THÁI"
ds_xa | while IFS=$'\t' read -r a b c; do printf "%-28s %-36s %s\n" "$a" "$b" "$c"; done
