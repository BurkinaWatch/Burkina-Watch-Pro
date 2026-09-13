#!/usr/bin/env npx tsx
/**
 * Emergency schema migration for tracking_sessions
 * Adds missing columns and renames existing ones to match current Drizzle schema
 */

import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });

async function runMigration() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    // Check current schema
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tracking_sessions'
      ORDER BY ordinal_position
    `);

    console.log("\n📋 Current tracking_sessions columns:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    const hasStartedAt = result.rows.some((r) => r.column_name === "started_at");
    const hasStartTime = result.rows.some((r) => r.column_name === "start_time");
    const hasProtectionStatus = result.rows.some((r) => r.column_name === "protection_status");

    if (hasStartTime && !hasStartedAt) {
      console.log("\n⚠️  Found old column names, running migration...\n");

      const migration = `
BEGIN;

ALTER TABLE "tracking_sessions" 
  RENAME COLUMN "start_time" TO "started_at";

ALTER TABLE "tracking_sessions"
  RENAME COLUMN "end_time" TO "ended_at";

ALTER TABLE "tracking_sessions"
  ADD COLUMN IF NOT EXISTS "is_panic_mode" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "share_token" text,
  ADD COLUMN IF NOT EXISTS "protection_status" text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "destination_label" text,
  ADD COLUMN IF NOT EXISTS "destination_place_id" text,
  ADD COLUMN IF NOT EXISTS "destination_latitude" numeric(10, 7),
  ADD COLUMN IF NOT EXISTS "destination_longitude" numeric(10, 7),
  ADD COLUMN IF NOT EXISTS "shared_contact_ids" text[],
  ADD COLUMN IF NOT EXISTS "arrival_confirmed_at" timestamp;

CREATE INDEX IF NOT EXISTS "tracking_sessions_protection_status_idx" 
  ON "tracking_sessions" ("protection_status");

CREATE INDEX IF NOT EXISTS "tracking_sessions_user_id_active_idx"
  ON "tracking_sessions" ("user_id", "is_active");

COMMIT;
      `;

      await client.query(migration);
      console.log("✅ Migration applied successfully\n");
    } else if (hasStartedAt && hasProtectionStatus) {
      console.log("✅ Schema is already up-to-date\n");
    } else {
      console.log("⚠️  Schema state is partially migrated\n");
    }

    // Verify new schema
    const newResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tracking_sessions'
      ORDER BY ordinal_position
    `);

    console.log("📋 Updated tracking_sessions columns:");
    newResult.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log("\n✅ Schema migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
