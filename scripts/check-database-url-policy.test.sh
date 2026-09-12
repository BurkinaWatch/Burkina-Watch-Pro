#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
sandbox="$(mktemp -d "${TMPDIR:-/tmp}/burkinawatch-database-url-policy-test.XXXXXX")"
trap 'rm -rf -- "$sandbox"' EXIT

mkdir -p "$sandbox/scripts"
cp "$repo_root/scripts/check-database-url-policy.sh" "$sandbox/scripts/check-database-url-policy.sh"

for file in \
  lib/db/src/index.ts \
  lib/db/drizzle.config.ts \
  artifacts/api-server/src/db.ts \
  artifacts/api-server/src/databaseConfig.ts \
  artifacts/api-server/src/securityConfig.ts \
  artifacts/api-server/.env.example \
  replit.md; do
  mkdir -p "$sandbox/$(dirname "$file")"
  cp "$repo_root/$file" "$sandbox/$file"
done

if ! bash "$sandbox/scripts/check-database-url-policy.sh" >/dev/null; then
  echo "Database URL policy test failed: the valid configuration was rejected." >&2
  exit 1
fi

printf '%s\n' 'RAILWAY_DATABASE_URL=postgresql://legacy.example.invalid/db' \
  >> "$sandbox/artifacts/api-server/.env.example"

if bash "$sandbox/scripts/check-database-url-policy.sh" >/dev/null 2>&1; then
  echo "Database URL policy test failed: the deprecated variable was accepted." >&2
  exit 1
fi

echo "Database URL policy test passed: valid configuration passes and legacy divergence fails."