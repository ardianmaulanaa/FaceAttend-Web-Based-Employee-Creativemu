#!/usr/bin/env bash

set -euo pipefail

ZIP_NAME="faceattend-office.zip"

echo "========================================"
echo "Membersihkan build lama"
echo "========================================"

rm -rf .next
rm -f "$ZIP_NAME"

echo ""
echo "========================================"
echo "Menjalankan Prisma generate dan build"
echo "========================================"

npm run build

if [ ! -f ".next/standalone/server.js" ]; then
  echo ""
  echo "ERROR: .next/standalone/server.js tidak ditemukan."
  echo "Pastikan output: \"standalone\" ada di next.config.ts."
  exit 1
fi

echo ""
echo "========================================"
echo "Menyalin public dan static"
echo "========================================"

rm -rf .next/standalone/public
rm -rf .next/standalone/.next/static

if [ -d "public" ]; then
  cp -R public .next/standalone/public
fi

mkdir -p .next/standalone/.next

if [ -d ".next/static" ]; then
  cp -R .next/static .next/standalone/.next/static
fi

find .next/standalone -name ".DS_Store" -delete
find .next/standalone -name "*.log" -delete

echo ""
echo "========================================"
echo "Membuat ZIP deployment"
echo "========================================"

(
  cd .next/standalone

  zip -qr "../../$ZIP_NAME" . \
    -x ".env" \
       ".env.*" \
       "*.DS_Store" \
       "*.log"
)

echo ""
echo "========================================"
echo "BUILD STANDALONE BERHASIL"
echo "========================================"

echo "Ukuran standalone setelah diekstrak:"
du -sh .next/standalone

echo ""
echo "Ukuran ZIP untuk upload:"
du -sh "$ZIP_NAME"

echo ""
echo "File siap upload:"
echo "$ZIP_NAME"
