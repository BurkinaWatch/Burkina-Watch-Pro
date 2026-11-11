#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

for path in \
  .android-sdk-local/.checkpoint-ignore-probe \
  .gradle-local/.checkpoint-ignore-probe
do
  if ! git check-ignore --no-index -q "$path"; then
    echo "Android build cache is not ignored: $path" >&2
    exit 1
  fi
done

grep -Fqx '.android-sdk-local' .replitignore
grep -Fqx '.gradle-local' .replitignore

echo "Android cache ignore test passed: local toolchains stay out of checkpoints and published artifacts."
