#!/usr/bin/env bash
set -Eeuo pipefail

echo "Release check: resetting workspace dependency state"
rm -rf node_modules
for workspace in artifacts/* lib/* scripts; do
  if [[ -d "$workspace" ]]; then
    rm -rf "$workspace/node_modules"
  fi
done

run_gate() {
  local name="$1"
  shift

  echo
  echo "Release gate: $name"
  if ! "$@"; then
    echo >&2
    echo "Release check failed during: $name" >&2
    echo "The command above identifies the failing workspace when a recursive gate fails." >&2
    exit 1
  fi
}

run_gate "clean frozen dependency install" \
  pnpm install --frozen-lockfile --prefer-offline
run_gate "root typecheck" pnpm run typecheck
run_gate "root build" pnpm run build

echo
echo "Release check passed: clean install, typecheck, and build completed."