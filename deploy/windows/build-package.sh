#!/usr/bin/env bash
# Đóng gói cài Windows: dist/QLDA_XaPhuong_GoiCaiDat_Windows_<phiên bản>.zip
# Chạy trên Linux hoặc Git Bash, cần .NET 8 SDK, curl, unzip, tar có xz, python3 (pip), zip.
# Gói gồm: app\ (phần mềm tự chứa .NET, không cần cài .NET), pgsql\ (PostgreSQL 16 bản nhị phân Windows),
#          cai-dat.ps1, CAI_DAT.bat, go-cai-dat.ps1, sao-luu.ps1, dat-lai-2fa.ps1, hướng dẫn.
# Chép PDF HDSD vào src/QldaTtts.Web/hdsd trước khi chạy để gói kèm sẵn tài liệu.
set -euo pipefail
VER="${1:-1.4}"; PG_VER="${PG_VER:-16.15.0}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; NAME="QLDA_XaPhuong_GoiCaiDat_Windows_$VER"; OUT="$ROOT/dist/$NAME"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
rm -rf "$OUT" "$OUT.zip"; mkdir -p "$OUT"

echo "== Phần mềm (win-x64, tự chứa .NET 8)"
dotnet publish "$ROOT/src/QldaTtts.Web" -c Release -r win-x64 --self-contained -p:DebugType=none -o "$OUT/app"
rm -rf "$OUT/app/App_Data" "$OUT/app/appsettings.Development.json"

echo "== PostgreSQL $PG_VER (bản nhị phân Windows x64)"
curl -fsSL -o "$TMP/pg.jar" "https://repo1.maven.org/maven2/io/zonky/test/postgres/embedded-postgres-binaries-windows-amd64/$PG_VER/embedded-postgres-binaries-windows-amd64-$PG_VER.jar"
unzip -q -o "$TMP/pg.jar" -d "$TMP/pg"
mkdir -p "$OUT/pgsql"; tar -xJf "$TMP/pg/postgres-windows-x86_64.txz" -C "$OUT/pgsql"
rm -f "$OUT/pgsql/bin/"wx*.dll "$OUT/pgsql/bin/testplug.dll"

echo "== Thư viện Visual C++ (đặt cạnh PostgreSQL, máy chưa cài VC++ Redistributable vẫn chạy)"
python3 -m pip download -q --no-deps --only-binary=:all: --platform win_amd64 --python-version 3.12 msvc-runtime -d "$TMP/vc"
unzip -q -o "$TMP"/vc/*.whl -d "$TMP/vc/x"
for f in vcruntime140.dll vcruntime140_1.dll msvcp140.dll; do cp "$(find "$TMP/vc/x" -name "$f" | head -1)" "$OUT/pgsql/bin/"; done

cp "$ROOT/deploy/windows/"{cai-dat.ps1,go-cai-dat.ps1,sao-luu.ps1,dat-lai-2fa.ps1,CAI_DAT.bat} "$OUT/"
sed -i 's/\r*$/\r/' "$OUT/"*.ps1 "$OUT/"*.bat   # Windows: xuống dòng CRLF
cp "$ROOT/docs/HUONG_DAN_CAI_DAT_WINDOWS.md" "$OUT/"
for f in "$ROOT/dist/HUONG_DAN_CAI_DAT_WINDOWS".{pdf,docx}; do [[ -f "$f" ]] && cp "$f" "$OUT/"; done
(cd "$ROOT/dist" && zip -qr -9 "$NAME.zip" "$NAME")
echo "Đã tạo $OUT.zip ($(du -h "$OUT.zip" | cut -f1))"
