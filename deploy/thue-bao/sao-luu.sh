#!/usr/bin/env bash
# Sao lưu tập trung mọi xã (chạy 1h30 hằng đêm qua cron; chạy tay được bất cứ lúc nào):
#  - CSDL nền tảng và CSDL từng xã (pg_dump, định dạng nén), mỗi xã một tệp: khôi phục được riêng từng xã
#  - Kho tệp của mọi xã: ảnh chụp theo ngày, tệp không đổi dùng chung (hard link) nên tốn ít dung lượng
#  - Giữ BACKUP_KEEP_DAYS bản hằng ngày + BACKUP_KEEP_MONTHS bản đầu tháng
#  - Có RESTIC_REPOSITORY: đẩy bản sao mã hóa ra máy chủ/địa điểm khác
source "$(dirname "$0")/chung.sh"
ROOT="${BACKUP_DIR:-/srv/qlda-saoluu}"; DAY="$(date +%Y-%m-%d)"; OUT="$ROOT/$DAY"; LOI=0
mkdir -p "$OUT/csdl"; chmod 700 "$ROOT"
echo "== $(date '+%F %T') Sao lưu vào $OUT"
dc exec -T db pg_dump -U qlda_quantri -Fc qlda_nentang > "$OUT/csdl/_nentang.dump" || LOI=1
while IFS=$'\t' read -r ma csdl tt; do
  [[ -z "$ma" || "$tt" == "dang-tao" ]] && continue
  if dc exec -T db pg_dump -U qlda_quantri -Fc "$csdl" > "$OUT/csdl/$ma.dump.tmp" < /dev/null; then mv "$OUT/csdl/$ma.dump.tmp" "$OUT/csdl/$ma.dump"; echo "  CSDL $ma: $(du -h "$OUT/csdl/$ma.dump" | cut -f1)"
  else echo "  LỖI sao lưu CSDL $ma"; rm -f "$OUT/csdl/$ma.dump.tmp"; LOI=1; fi
done < <(ds_xa)
# Kho tệp: ảnh chụp theo ngày, dùng chung tệp với bản hôm trước
PREV="$(ls -1d "$ROOT"/20??-??-?? 2>/dev/null | grep -v "$DAY" | tail -1 || true)"
mkdir -p "$OUT/tep"
if command -v rsync >/dev/null; then
  rsync -a --delete --exclude 'backups/' ${PREV:+--link-dest="$PREV/tep"} "$DIR/du-lieu/xa/" "$OUT/tep/" || LOI=1
  rsync -a "$DIR/du-lieu/keys/" "$OUT/keys/" 2>/dev/null || true
else
  # Máy chưa có rsync: chép đầy đủ bằng tar (không dùng chung tệp với bản hôm trước nên tốn dung lượng hơn)
  echo "  Lưu ý: máy chủ chưa cài rsync, kho tệp được chép đầy đủ. Cài rsync để tiết kiệm dung lượng."
  tar -C "$DIR/du-lieu/xa" --exclude='./*/backups' -cf - . | tar -C "$OUT/tep" -xf - || LOI=1
  mkdir -p "$OUT/keys"; cp -a "$DIR/du-lieu/keys/." "$OUT/keys/" 2>/dev/null || true
fi
cp "$DIR/.env" "$OUT/env.txt"; chmod -R go-rwx "$OUT"
echo "  Kho tệp: $(du -sh "$OUT/tep" | cut -f1) (dung lượng thực tế mới: $(du -sh --apparent-size "$OUT" | cut -f1))"
# Dọn bản cũ: giữ N ngày gần nhất + bản ngày 01 của M tháng gần nhất
mapfile -t ALL < <(ls -1d "$ROOT"/20??-??-?? 2>/dev/null | sort)
KEEP_D="${BACKUP_KEEP_DAYS:-14}"; KEEP_M="${BACKUP_KEEP_MONTHS:-12}"
mapfile -t MONTHLY < <(printf '%s\n' "${ALL[@]}" | grep -E -- '-01$' | tail -n "$KEEP_M")
for d in "${ALL[@]:0:$(( ${#ALL[@]} > KEEP_D ? ${#ALL[@]} - KEEP_D : 0 ))}"; do
  printf '%s\n' "${MONTHLY[@]}" | grep -qx "$d" || { rm -rf "$d"; echo "  Xóa bản cũ $(basename "$d")"; }
done
# Bản sao ngoài máy chủ (mã hóa)
if [[ -n "${RESTIC_REPOSITORY:-}" ]]; then
  export RESTIC_REPOSITORY RESTIC_PASSWORD
  restic snapshots >/dev/null 2>&1 || restic init
  restic backup --tag qlda "$OUT" && restic forget --tag qlda --keep-daily "$KEEP_D" --keep-monthly "$KEEP_M" --prune || LOI=1
fi
date +%s > "$ROOT/.lan-cuoi-$( [[ $LOI == 0 ]] && echo ok || echo loi )"; [[ $LOI == 0 ]] && rm -f "$ROOT/.lan-cuoi-loi"
echo "== $(date '+%F %T') Xong $( [[ $LOI == 0 ]] && echo 'không lỗi' || echo 'CÓ LỖI')"; exit $LOI
