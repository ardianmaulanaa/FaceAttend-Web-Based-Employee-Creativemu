#!/usr/bin/env bash

set -euo pipefail

failures=0

fail() {
  echo "ERROR: $1" >&2
  failures=$((failures + 1))
}

tracked_env_files="$(git ls-files '.env' '.env.*' '*.env' '*.env.*' 2>/dev/null || true)"

if [ -n "$tracked_env_files" ]; then
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    case "$file" in
      *.env.example|.env.example) ;;
      *) fail "$file is tracked by git" ;;
    esac
  done <<< "$tracked_env_files"
fi

scan_files="$(
  git ls-files \
    ':!:package-lock.json' \
    ':!:public/uploads/**' \
    ':!:coverage/**' \
    ':!:.next/**'
)"

patterns=(
  'AKIA[0-9A-Z]{16}'
  'ASIA[0-9A-Z]{16}'
  'github_pat_[A-Za-z0-9_]{20,}'
  'gh[pousr]_[A-Za-z0-9_]{20,}'
  'xox[baprs]-[A-Za-z0-9-]{20,}'
  'sk-[A-Za-z0-9_-]{20,}'
  '-----BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----'
  'cloudinary://[0-9A-Za-z_:-]+@[A-Za-z0-9_-]+'
  '(mysql|mariadb|postgres|postgresql)://[^[:space:]'\''"]+:[^[:space:]'\''"@]+@'
)

for pattern in "${patterns[@]}"; do
  matches="$(
    printf '%s\n' "$scan_files" |
      xargs grep -nEI "$pattern" 2>/dev/null || true
  )"

  if [ -n "$matches" ]; then
    fail "possible secret found for pattern: $pattern"
    printf '%s\n' "$matches" >&2
  fi
done

if [ "$failures" -gt 0 ]; then
  exit 1
fi

echo "Secret checks passed."
