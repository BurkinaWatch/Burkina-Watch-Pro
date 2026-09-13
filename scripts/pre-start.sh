#!/bin/bash
set -e

echo "[PRE-START] 🚀 Starting pre-deployment migration..."

# Run schema migration first
echo "[PRE-START] ⚙️ Running tracking_sessions schema migration..."
npx tsx scripts/migrate-tracking-schema.ts

echo "[PRE-START] ✅ Schema migration complete"

echo "[PRE-START] 🔄 Running Drizzle push..."
pnpm --filter @workspace/db run push

echo "[PRE-START] ✅ Drizzle push complete"
echo "[PRE-START] 🎯 Starting application..."

# Start the actual app
npm run start
