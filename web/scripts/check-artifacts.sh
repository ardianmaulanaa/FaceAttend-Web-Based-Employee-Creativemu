#!/usr/bin/env bash

set -euo pipefail

failures=0
BUILD_DIR="${NEXT_DIST_DIR:-.next-build}"

fail() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

for path in .env .env.local .env.production .env.tidb; do
  if git ls-files --error-unmatch "$path" >/dev/null 2>&1; then
    fail "$path is tracked by git"
  fi
done

if git ls-files --error-unmatch public/uploads >/dev/null 2>&1; then
  fail "public/uploads contains tracked user-uploaded files"
fi

while IFS= read -r zip_file; do
  [ -n "$zip_file" ] || continue

  zip_listing="$(unzip -Z1 "$zip_file")"

  if printf '%s\n' "$zip_listing" | grep -Eq '(^|/)\.env($|[.])'; then
    fail "$zip_file contains environment files"
  fi

  if printf '%s\n' "$zip_listing" | grep -Eq '(^|/)public/uploads/'; then
    fail "$zip_file contains public/uploads"
  fi
done < <(find . -maxdepth 2 -type f -name '*.zip' -print)

if [ -d "$BUILD_DIR/standalone/public/uploads" ]; then
  fail "$BUILD_DIR/standalone/public/uploads exists in deploy output"
fi

if [ "$failures" -gt 0 ]; then
  exit 1
fi

echo "Artifact safety checks passed."
