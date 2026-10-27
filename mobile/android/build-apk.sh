#!/usr/bin/env bash
# Dựng APK không cần Android Studio/Gradle.
# Cần: JDK 17+, aapt, dalvik-exchange (dx), zipalign, apksigner (Ubuntu: apt install aapt dalvik-exchange zipalign apksigner)
# và android.jar API 34 (biến ANDROID_JAR).
# Ký bằng KEYSTORE/KS_PASS/KEY_ALIAS; mọi bản cập nhật phải dùng cùng một khóa.
set -euo pipefail
cd "$(dirname "$0")"
: "${ANDROID_JAR:?Đặt ANDROID_JAR=/duong/dan/android.jar (API 34)}"
: "${KEYSTORE:?Đặt KEYSTORE=/duong/dan/qlda-ttts.jks}"
: "${KS_PASS:?Đặt KS_PASS}"
KEY_ALIAS="${KEY_ALIAS:-qldattts}"
OUT="${OUT:-build}"
VER=$(sed -n 's/.*android:versionName="\([^"]*\)".*/\1/p' AndroidManifest.xml)
rm -rf "$OUT"; mkdir -p "$OUT/gen" "$OUT/classes"

aapt package -f -m -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$ANDROID_JAR" -F "$OUT/app.unsigned.apk"
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 -bootclasspath "$ANDROID_JAR" \
  -d "$OUT/classes" $(find src "$OUT/gen" -name '*.java')
dalvik-exchange --dex --min-sdk-version=24 --output="$OUT/classes.dex" "$OUT/classes"
(cd "$OUT" && aapt add app.unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 "$OUT/app.unsigned.apk" "$OUT/app.aligned.apk"
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$KS_PASS" --ks-key-alias "$KEY_ALIAS" \
  --out "$OUT/QLDA_TTTS_v$VER.apk" "$OUT/app.aligned.apk"
apksigner verify --print-certs "$OUT/QLDA_TTTS_v$VER.apk" | head -3
echo "Xong: $OUT/QLDA_TTTS_v$VER.apk"
