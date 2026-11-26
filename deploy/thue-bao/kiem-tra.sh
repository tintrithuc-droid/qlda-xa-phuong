#!/usr/bin/env bash
# Kiểm tra tình trạng (cron 5 phút/lần): phần mềm, CSDL từng xã, ổ đĩa, sao lưu đêm qua.
# Có lỗi thì gửi tin tới ALERT_URL (ví dụ Telegram bot), mỗi lỗi nhắc lại tối đa 1 lần/giờ.
source "$(dirname "$0")/chung.sh"
LOI=()
probe() { dc exec -T caddy wget -qO- -T 10 --header "Host: $1" http://app:8080/api/health 2>/dev/null < /dev/null | grep -q '"db":"ok"'; }
probe "quantri.$BASE_DOMAIN" || LOI+=("Trang quản lý thuê bao/CSDL nền tảng không phản hồi")
while IFS=$'\t' read -r ma csdl tt; do
  [[ "$tt" == "hoat-dong" ]] || continue
  probe "$ma.$BASE_DOMAIN" || LOI+=("Xã $ma không truy cập được")
done < <(ds_xa 2>/dev/null || true)
DISK=$(df --output=pcent "$DIR" | tail -1 | tr -dc 0-9); [[ $DISK -ge 85 ]] && LOI+=("Ổ đĩa máy chủ đã dùng $DISK%")
B="${BACKUP_DIR:-/srv/qlda-saoluu}"
if (( 10#$(date +%H) >= 4 )); then
  [[ -f "$B/.lan-cuoi-ok" && $(( $(date +%s) - $(cat "$B/.lan-cuoi-ok") )) -lt 93600 ]] || LOI+=("Chưa có bản sao lưu thành công trong 26 giờ qua")
fi
[[ ${#LOI[@]} -eq 0 ]] && exit 0
MSG="[QLDA thuê bao $(hostname)] $(date '+%d/%m %H:%M'): $(IFS='; '; echo "${LOI[*]}")"
echo "$MSG"
H="/tmp/qlda-canh-bao-$(echo "$MSG" | cut -d: -f3- | md5sum | cut -c1-8)"
if [[ -n "${ALERT_URL:-}" && ( ! -f "$H" || $(( $(date +%s) - $(stat -c %Y "$H") )) -gt 3600 ) ]]; then
  curl -s -m 15 --data-urlencode "text=$MSG" "$ALERT_URL" >/dev/null && touch "$H"
fi
exit 1
