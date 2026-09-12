#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
sandbox="$(mktemp -d "${TMPDIR:-/tmp}/burkinawatch-release-check-test.XXXXXX")"
trap 'rm -rf -- "$sandbox"' EXIT

mkdir -p "$sandbox/bin" "$sandbox/scripts"
cp "$repo_root/scripts/release-check.sh" "$sandbox/scripts/release-check.sh"
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

command_log="$sandbox/commands.log"

cat > "$sandbox/bin/pnpm" <<'FAKE_PNPM'
#!/usr/bin/env bash
set -Eeuo pipefail

: "${RELEASE_CHECK_TEST_LOG:?}"

case "$*" in
  "install --frozen-lockfile --prefer-offline --force")
    printf '%s\n' install >> "$RELEASE_CHECK_TEST_LOG"
    ;;
  "run typecheck")
    printf '%s\n' typecheck >> "$RELEASE_CHECK_TEST_LOG"
    ;;
  "run build:artifacts")
    printf '%s\n' build:artifacts >> "$RELEASE_CHECK_TEST_LOG"
    ;;
  "run build")
    # The root build currently expands to "typecheck && build:artifacts".
    printf '%s\n' build typecheck build:artifacts >> "$RELEASE_CHECK_TEST_LOG"
    ;;
  *)
    printf 'Unexpected pnpm command: %s\n' "$*" >&2
    exit 64
    ;;
esac
FAKE_PNPM
chmod +x "$sandbox/bin/pnpm"

if ! PATH="$sandbox/bin:$PATH" RELEASE_CHECK_TEST_LOG="$command_log" \
  bash "$sandbox/scripts/release-check.sh" >"$sandbox/release-check.log" 2>&1; then
  cat "$sandbox/release-check.log" >&2
  echo "Release check test failed: the release check did not complete." >&2
  exit 1
fi

expected=$'install\ntypecheck\nbuild:artifacts'
actual="$(cat "$command_log")"
if [[ "$actual" != "$expected" ]]; then
  echo "Release check test failed: unexpected command sequence." >&2
  printf 'Expected:\n%s\nActual:\n%s\n' "$expected" "$actual" >&2
  exit 1
fi

typecheck_count="$(grep -c '^typecheck$' "$command_log" || true)"
if [[ "$typecheck_count" != 1 ]]; then
  echo "Release check test failed: expected exactly one typecheck, got $typecheck_count." >&2
  exit 1
fi

echo "Release check test passed: typecheck ran once before artifact builds."