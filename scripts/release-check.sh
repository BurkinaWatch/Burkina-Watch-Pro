#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"
validation_root="$(mktemp -d "${TMPDIR:-/tmp}/burkinawatch-release-check.XXXXXX")"

cleanup_validation_root() {
  chmod -R u+w "$validation_root" 2>/dev/null || true
  rm -rf -- "$validation_root" 2>/dev/null || true
}

trap cleanup_validation_root EXIT

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

echo "Release check: creating an isolated validation workspace"
tar \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='*/node_modules' \
  --exclude='./dist' \
  --exclude='*/dist' \
  --exclude='./static-build' \
  --exclude='*/static-build' \
  --exclude='./.expo' \
  --exclude='*/.expo' \
  --exclude='./.cache' \
  --exclude='*/.cache' \
  --exclude='*.tsbuildinfo' \
  --exclude='*/.tsbuildinfo' \
  -C "$repo_root" -cf - . | tar -C "$validation_root" -xf -

(
  cd "$validation_root"

  run_gate "frozen dependency install" \
    pnpm install --frozen-lockfile --prefer-offline
  run_gate "root typecheck" pnpm run typecheck

  run_isolated_mobile_build() {
    local output_dir status
    output_dir="$(mktemp -d "${TMPDIR:-/tmp}/burkinawatch-mobile-release.XXXXXX")"

    echo "Using isolated mobile build output: $output_dir"
    if env STATIC_BUILD_DIR="$output_dir" METRO_PORT="${METRO_PORT:-8082}" pnpm run build:artifacts; then
      status=0
    else
      status=$?
    fi

    rm -rf -- "$output_dir"
    return "$status"
  }

  run_gate "artifact builds" run_isolated_mobile_build

  echo
  echo "Release check passed: isolated install, typecheck, and artifact builds completed."
)
