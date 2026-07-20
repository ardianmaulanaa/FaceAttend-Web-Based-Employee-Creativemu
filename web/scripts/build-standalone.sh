#!/usr/bin/env bash

set -euo pipefail

ZIP_NAME="faceattend-office.zip"
BUILD_DIR="${NEXT_DIST_DIR:-.next-build}"
STANDALONE_DIR="$BUILD_DIR/standalone"

echo "========================================"
echo "Membersihkan build lama"
echo "========================================"

rm -rf "$BUILD_DIR"
rm -f "$ZIP_NAME"

echo ""
echo "========================================"
echo "Menjalankan Prisma generate dan build"
echo "========================================"

npm run build:standalone

if [ ! -f "$STANDALONE_DIR/server.js" ]; then
  echo ""
  echo "ERROR: $STANDALONE_DIR/server.js tidak ditemukan."
  echo "Pastikan output: \"standalone\" ada di next.config.ts."
  exit 1
fi

echo ""
echo "========================================"
echo "Menyalin public dan static"
echo "========================================"

bash scripts/prepare-standalone-assets.sh

echo ""
echo "========================================"
echo "Membuat ZIP deployment"
echo "========================================"

(
  cd "$STANDALONE_DIR"

  zip -qr "../../$ZIP_NAME" . \
    -x ".env" \
       ".env.*" \
       "public/uploads/*" \
       "public/uploads/**" \
       "*.DS_Store" \
       "*.log"
)

bash scripts/check-artifacts.sh

echo ""
echo "========================================"
echo "BUILD STANDALONE BERHASIL"
echo "========================================"

echo "Ukuran standalone setelah diekstrak:"
du -sh "$STANDALONE_DIR"

echo ""
echo "Ukuran ZIP untuk upload:"
du -sh "$ZIP_NAME"

echo ""
echo "File siap upload:"
echo "$ZIP_NAME"
