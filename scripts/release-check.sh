#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

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

run_gate "PostgreSQL connection variable policy" \
  bash "$script_dir/check-database-url-policy.sh"

echo "Release check: resetting workspace dependency state"
rm -rf node_modules
for workspace in artifacts/* lib/* scripts; do
  if [[ -d "$workspace" ]]; then
    rm -rf "$workspace/node_modules"
  fi
done

run_gate "clean frozen dependency install" \
  pnpm install --frozen-lockfile --prefer-offline
run_gate "root typecheck" pnpm run typecheck

run_isolated_mobile_build() {
  local output_dir status
  output_dir="$(mktemp -d "${TMPDIR:-/tmp}/burkinawatch-mobile-release.XXXXXX")"

  echo "Using isolated mobile build output: $output_dir"
  if env STATIC_BUILD_DIR="$output_dir" pnpm run build:artifacts; then
    status=0
  else
    status=$?
  fi

  rm -rf -- "$output_dir"
  return "$status"
}

run_gate "artifact builds" run_isolated_mobile_build

echo
echo "Release check passed: clean install, typecheck, and artifact builds completed."
