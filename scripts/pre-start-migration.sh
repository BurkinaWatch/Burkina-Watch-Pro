#!/bin/bash
set -e

echo "[PRE-START] Starting pre-startup migration process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "[PRE-START] ERROR: DATABASE_URL is not set. Cannot run migration."
  exit 1
fi

echo "[PRE-START] DATABASE_URL is available. Running Drizzle migration..."

# Run Drizzle migration
cd /app/lib/db
pnpm run push || {
  echo "[PRE-START] ERROR: Migration failed with exit code $?"
  exit 1
}

echo "[PRE-START] Migration completed successfully!"
echo "[PRE-START] Starting API server..."

# Exit this script and let the caller continue
exit 0

