import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.RAILWAY_DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("RAILWAY_DATABASE_URL est requis.");
if (process.env.ALLOW_RAILWAY_STREETVIEW_MIGRATION !== "true") {
  throw new Error("Définissez ALLOW_RAILWAY_STREETVIEW_MIGRATION=true pour autoriser cette migration.");
}

const migration = await fs.readFile(
  new URL("../migrations/0009_streetview_processing_queue.sql", import.meta.url),
  "utf8",
);
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["burkinawatch:streetview:phase5"]);
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