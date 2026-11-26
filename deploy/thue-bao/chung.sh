# Hàm dùng chung cho các script máy chủ cho thuê (được nạp bằng: source chung.sh)
set -euo pipefail
DIR="${QLDA_DIR:-/opt/qlda-thue-bao}"
[[ -f "$DIR/.env" ]] || { echo "Chưa cài đặt: không thấy $DIR/.env (chạy cai-dat.sh trước)"; exit 1; }
cd "$DIR"; set -a; source ./.env; set +a
dc() { docker compose --project-directory "$DIR" -p qlda-thue-bao "$@"; }
# Truy vấn CSDL nền tảng
sql() { dc exec -T db psql -U qlda_quantri -d qlda_nentang -v ON_ERROR_STOP=1 -Atc "$1" < /dev/null; }
# Danh sách xã: mã<TAB>CSDL<TAB>trạng thái
ds_xa() { sql 'select "Code", "DbName", "Status" from tenants order by "Code"' | tr '|' '\t'; }
db_cua() { sql "select \"DbName\" from tenants where \"Code\"='$1'"; }
kiem_ma() { [[ "$1" =~ ^[a-z0-9-]{3,40}$ ]] || { echo "Mã xã không hợp lệ: $1"; exit 1; }; }
