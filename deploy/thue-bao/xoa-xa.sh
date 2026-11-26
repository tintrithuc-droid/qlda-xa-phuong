#!/usr/bin/env bash
# Xóa hẳn một xã khỏi máy chủ (sau khi đã bàn giao dữ liệu, hết thời hạn lưu giữ theo hợp đồng):
#   sudo bash xoa-xa.sh <mã-xã>
# Trước khi xóa: tự xuất dữ liệu bàn giao một lần nữa. Không hoàn tác được.
source "$(dirname "$0")/chung.sh"
MA="${1:?Thiếu mã xã}"; kiem_ma "$MA"; CSDL="$(db_cua "$MA")"; [[ -n "$CSDL" ]] || { echo "Không có xã $MA"; exit 1; }
TT="$(sql "select \"Status\" from tenants where \"Code\"='$MA'")"
[[ "$TT" == "tam-khoa" ]] || { echo "Chỉ xóa được xã đang tạm khóa. Tạm khóa xã $MA trên trang quản lý thuê bao trước."; exit 1; }
read -r -p "XÓA HẲN xã $MA (CSDL $CSDL và toàn bộ tệp)? Gõ 'xoa $MA' để xác nhận: " X; [[ "$X" == "xoa $MA" ]] || { echo "Đã hủy."; exit 1; }
bash "$DIR/xuat-du-lieu-xa.sh" "$MA"
dc exec -T db psql -U qlda_quantri -d qlda_nentang -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$CSDL\" WITH (FORCE)" -c "DROP ROLE IF EXISTS \"$CSDL\""
sql "delete from tenants where \"Code\"='$MA'; insert into logs (\"Ts\",\"Username\",\"Action\",\"Target\") values (now() at time zone 'utc','may-chu','Xóa hẳn xã (dòng lệnh)','$MA')" >/dev/null
rm -rf "$DIR/du-lieu/xa/$MA"
echo "XONG. Đã xóa xã $MA. Bản bàn giao cuối cùng nằm trong /srv/qlda-bangiao."
