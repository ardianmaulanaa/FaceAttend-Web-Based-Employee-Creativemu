#!/usr/bin/env bash

set -euo pipefail

BUILD_DIR="${NEXT_DIST_DIR:-.next-build}"
STANDALONE_DIR="$BUILD_DIR/standalone"

if [ ! -f "$STANDALONE_DIR/server.js" ]; then
  echo "ERROR: $STANDALONE_DIR/server.js tidak ditemukan."
  echo "Jalankan npm run build terlebih dahulu dan pastikan output standalone aktif."
  exit 1
fi

rm -rf "$STANDALONE_DIR/public"
rm -rf "$STANDALONE_DIR/$BUILD_DIR/static"

if [ -d "public" ]; then
  cp -R public "$STANDALONE_DIR/public"
  rm -rf "$STANDALONE_DIR/public/uploads"
fi

mkdir -p "$STANDALONE_DIR/$BUILD_DIR"

if [ -d "$BUILD_DIR/static" ]; then
  cp -R "$BUILD_DIR/static" "$STANDALONE_DIR/$BUILD_DIR/static"
fi

find "$STANDALONE_DIR" -name ".DS_Store" -delete
find "$STANDALONE_DIR" -name "*.log" -delete

echo "Standalone assets prepared."
