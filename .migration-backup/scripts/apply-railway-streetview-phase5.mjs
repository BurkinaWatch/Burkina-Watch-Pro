import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.RAILWAY_DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("RAILWAY_DATABASE_URL est requis.");
for (const name of [
  "ALLOW_RAILWAY_STREETVIEW_MIGRATION",
  "RAILWAY_STREETVIEW_BACKUP_CONFIRMED",
  "RAILWAY_STREETVIEW_PREFLIGHT_CONFIRMED",
]) {
  if (process.env[name] !== "true") {
    throw new Error(`${name}=true est requis avant toute écriture Railway.`);
  }
}

const migration = await fs.readFile(
  new URL("../migrations/0009_streetview_processing_queue.sql", import.meta.url),
  "utf8",
);
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SET LOCAL lock_timeout = '10s'");
  await client.query("SET LOCAL statement_timeout = '120s'");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["burkinawatch:streetview:phase5"]);
  const prerequisite = await client.query(
    `SELECT
       to_regclass('public.users') AS users_table,
       to_regclass('public.streetview_contributions') AS contribution_table,
       to_regclass('public.streetview_processing_jobs') AS jobs_table`,
  );
  const prerequisiteRow = prerequisite.rows[0];
  if (!prerequisiteRow.users_table || !prerequisiteRow.contribution_table || !prerequisiteRow.jobs_table) {
    throw new Error("Le schéma StreetView Phase 3 est incomplet; arrêt sans modification.");
  }
  await client.query(migration);
  const verification = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'streetview_processing_jobs'
        AND column_name IN ('max_attempts', 'available_at', 'locked_at', 'lease_until', 'locked_by', 'updated_at')`,
  );
  if (verification.rowCount !== 6) {
    throw new Error("Vérification du schéma StreetView Phase 5 échouée.");
  }
  await client.query("COMMIT");
  console.log("Migration StreetView Phase 5 appliquée et vérifiée.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}