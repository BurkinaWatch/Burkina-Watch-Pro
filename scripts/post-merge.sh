#!/usr/bin/env bash
set -euo pipefail

# Post-merge setup runs with stdin closed, so keep every command non-interactive.
# The application uses an external Railway database; schema changes are not
# applied automatically here.
CI=1 npm ci --no-audit --no-fund
npm run build