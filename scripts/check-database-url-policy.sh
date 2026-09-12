#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

required_files=(
  "$repo_root/lib/db/src/index.ts"
  "$repo_root/lib/db/drizzle.config.ts"
  "$repo_root/artifacts/api-server/src/db.ts"
  "$repo_root/artifacts/api-server/src/databaseConfig.ts"
  "$repo_root/artifacts/api-server/src/securityConfig.ts"
  "$repo_root/artifacts/api-server/.env.example"
  "$repo_root/replit.md"
)

failed=0

require_match() {
  local file="$1"
  local pattern="$2"
  local description="$3"

  if ! grep -Eq "$pattern" "$file"; then
    echo "Database URL policy failed: $description ($file)" >&2
    failed=1
  fi
}

reject_legacy_variable() {
  local file="$1"

  if grep -Fq "RAILWAY_DATABASE_URL" "$file"; then
    echo "Database URL policy failed: deprecated RAILWAY_DATABASE_URL found in $file" >&2
    failed=1
  fi
}

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Database URL policy failed: required file is missing: $file" >&2
    failed=1
    continue
  fi
  reject_legacy_variable "$file"
done

require_match \
  "$repo_root/lib/db/src/index.ts" \
  'process\.env\.DATABASE_URL' \
  "the shared database pool must use DATABASE_URL"
require_match \
  "$repo_root/lib/db/drizzle.config.ts" \
  'process\.env\.DATABASE_URL' \
  "Drizzle must use DATABASE_URL"
require_match \
  "$repo_root/artifacts/api-server/src/db.ts" \
  'getDatabaseUrl' \
  "the API pool must use the shared database URL resolver"
require_match \
  "$repo_root/artifacts/api-server/src/databaseConfig.ts" \
  'process\.env\.DATABASE_URL' \
  "the API database resolver must read DATABASE_URL"
require_match \
  "$repo_root/artifacts/api-server/src/databaseConfig.ts" \
  'function hasDatabaseUrl' \
  "the production check must use the shared DATABASE_URL predicate"
require_match \
  "$repo_root/artifacts/api-server/src/securityConfig.ts" \
  'hasDatabaseUrl' \
  "production security checks must use the shared DATABASE_URL predicate"
require_match \
  "$repo_root/artifacts/api-server/.env.example" \
  '^DATABASE_URL=' \
  "the environment template must define DATABASE_URL"
require_match \
  "$repo_root/replit.md" \
  'DATABASE_URL' \
  "project documentation must name DATABASE_URL"

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "Database URL policy passed: DATABASE_URL is the single PostgreSQL connection variable."