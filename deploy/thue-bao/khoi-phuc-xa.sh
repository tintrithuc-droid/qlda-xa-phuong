#!/usr/bin/env bash
# Khôi phục MỘT xã về một bản sao lưu, các xã khác không bị ảnh hưởng:
#   sudo bash khoi-phuc-xa.sh <mã-xã> <ngày yyyy-mm-dd>
# Xã bị tạm khóa trong lúc khôi phục; dữ liệu hiện tại được sao lưu thêm một bản trước khi ghi đè.
source "$(dirname "$0")/chung.sh"
MA="${1:?Thiếu mã xã}"; NGAY="${2:?Thiếu ngày sao lưu (yyyy-mm-dd), xem trong ${BACKUP_DIR:-/srv/qlda-saoluu}}"; kiem_ma "$MA"
SRC="${BACKUP_DIR:-/srv/qlda-saoluu}/$NGAY"; DUMP="$SRC/csdl/$MA.dump"
[[ -f "$DUMP" ]] || { echo "Không thấy $DUMP"; exit 1; }
CSDL="$(db_cua "$MA")"; [[ -n "$CSDL" ]] || { echo "Không có xã $MA"; exit 1; }
read -r -p "Khôi phục xã $MA về ngày $NGAY? Dữ liệu sau ngày đó sẽ mất. Gõ lại mã xã để xác nhận: " X; [[ "$X" == "$MA" ]] || { echo "Đã hủy."; exit 1; }
CU="$(sql "select \"Status\" from tenants where \"Code\"='$MA'")"
trap 'echo "LỖI: khôi phục chưa xong, xã $MA vẫn đang tạm khóa. Xử lý lỗi rồi chạy lại lệnh, hoặc mở lại xã trên trang quản lý thuê bao (dữ liệu trước khi khôi phục nằm trong ${BACKUP_DIR:-/srv/qlda-saoluu}/truoc-khoi-phuc)."' ERR
sql "update tenants set \"Status\"='tam-khoa', \"LockReason\"='Đang khôi phục dữ liệu, vui lòng quay lại sau ít phút.' where \"Code\"='$MA'" >/dev/null
echo "== Chờ phần mềm nhận trạng thái tạm khóa (35 giây)"; sleep 35
TRUOC="${BACKUP_DIR:-/srv/qlda-saoluu}/truoc-khoi-phuc"; mkdir -p "$TRUOC"
dc exec -T db pg_dump -U qlda_quantri -Fc "$CSDL" > "$TRUOC/$MA-$(date +%Y%m%d-%H%M).dump"
echo "== Khôi phục CSDL"
dc exec -T db psql -U qlda_quantri -d qlda_nentang -c "select pg_terminate_backend(pid) from pg_stat_activity where datname='$CSDL'" >/dev/null
dc exec -T db pg_restore -U qlda_quantri -d "$CSDL" --clean --if-exists --no-owner --role="$CSDL" < "$DUMP"
echo "== Khôi phục kho tệp"
F="$DIR/du-lieu/xa/$MA/files"; mkdir -p "$F"
if [[ ! -d "$SRC/tep/$MA/files" ]]; then echo "  Bản sao lưu không có kho tệp của xã $MA (xã chưa có tệp đính kèm), giữ nguyên kho tệp hiện tại."
elif command -v rsync >/dev/null; then rsync -a --delete "$SRC/tep/$MA/files/" "$F/"
else find "$F" -mindepth 1 -delete; cp -a "$SRC/tep/$MA/files/." "$F/"; fi
chown -R 1654:1654 "$DIR/du-lieu/xa/$MA"
sql "update tenants set \"Status\"='${CU:-hoat-dong}', \"LockReason\"=null where \"Code\"='$MA'" >/dev/null
echo "XONG. Xã $MA đã về dữ liệu ngày $NGAY (mở lại sau khoảng 30 giây). Bản trước khi khôi phục: $TRUOC"
