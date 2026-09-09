#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Post-merge setup must be safe to repeat and must never mutate Railway
# PostgreSQL implicitly. Schema changes require their own reviewed workflow.
npm ci --no-audit --no-fund
npm run check
npm run build