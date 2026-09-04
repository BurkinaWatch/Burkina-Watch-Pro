import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.RAILWAY_DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("RAILWAY_DATABASE_URL est requis.");
}
if (process.env.ALLOW_RAILWAY_STREETVIEW_MIGRATION !== "true") {
  throw new Error("Définissez ALLOW_RAILWAY_STREETVIEW_MIGRATION=true pour autoriser cette migration.");
}

const migration = await fs.readFile(
  new URL("../migrations/0008_streetview_contributions.sql", import.meta.url),
  "utf8",
);
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["burkinawatch:streetview:phase3"]);

  const existing = await client.query(
    `SELECT to_regclass('public.streetview_contributions') AS contribution,
            to_regclass('public.streetview_processing_jobs') AS jobs`,
  );
  if (existing.rows[0].contribution || existing.rows[0].jobs) {
    throw new Error("Le schéma StreetView Phase 3 est partiellement présent; arrêt sans modification.");
  }

  await client.query(migration);
  const verification = await client.query(
    `SELECT
       to_regclass('public.streetview_contributions') IS NOT NULL AS contribution,
       to_regclass('public.streetview_processing_jobs') IS NOT NULL AS jobs,
       (SELECT COUNT(*) FROM pg_indexes WHERE indexname IN (
         'streetview_contributions_user_created_idx',
         'streetview_contributions_status_idx',
         'streetview_contributions_location_idx',
         'streetview_jobs_contribution_idx',
         'streetview_jobs_status_idx'
       )) AS index_count`,
  );
  const result = verification.rows[0];
  if (!result.contribution || !result.jobs || Number(result.index_count) !== 5) {
    throw new Error("Vérification du schéma StreetView Phase 3 échouée.");
  }

  await client.query("COMMIT");
  console.log("Migration StreetView Phase 3 appliquée et vérifiée.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}