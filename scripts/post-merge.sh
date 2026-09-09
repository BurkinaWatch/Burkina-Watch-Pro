#!/bin/bash
set -euo pipefail

# Post-merge setup must be safe to repeat and must not mutate PostgreSQL.
# Schema changes are intentionally handled only through an explicitly
# authorized migration workflow, never automatically after a task merge.
pnpm install --frozen-lockfile
