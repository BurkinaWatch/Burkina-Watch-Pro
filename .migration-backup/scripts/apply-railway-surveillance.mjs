import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const MIGRATION_ROOT = path.join(process.cwd(), "migrations");
const MIGRATIONS = [
  "0004_runtime_alignment_draft.sql",
  "0005_surveillance_cameras.sql",
  "0006_camera_agents.sql",
  "0007_agent_media_sessions.sql",
];
const SURVEILLANCE_TABLES = [
  "surveillance_cameras",
  "camera_agents",
  "agent_camera_bindings",
  "agent_media_sessions",
];
const MIGRATION_TABLES = {
  "0005_surveillance_cameras.sql": ["surveillance_cameras"],
  "0006_camera_agents.sql": ["camera_agents", "agent_camera_bindings"],
  "0007_agent_media_sessions.sql": ["agent_media_sessions"],
};
const REQUIRED_INDEXES = [
  ["commentaires", "commentaires_signalement_id_idx"],
  ["commentaires", "commentaires_user_id_idx"],
  ["notifications", "notifications_user_id_read_idx"],
  ["notifications", "notifications_user_id_created_at_idx"],
  ["online_sessions", "online_sessions_user_id_idx"],
  ["signalements", "signalements_user_id_idx"],
  ["signalements", "signalements_created_at_idx"],
  ["signalements", "signalements_statut_idx"],
  ["tracking_sessions", "tracking_sessions_user_id_active_idx"],
  ["surveillance_cameras", "surveillance_cameras_owner_created_idx"],
  ["surveillance_cameras", "surveillance_cameras_owner_status_idx"],
  ["camera_agents", "camera_agents_owner_status_idx"],
  ["camera_agents", "camera_agents_owner_last_seen_idx"],
  ["agent_camera_bindings", "agent_camera_bindings_agent_camera_idx"],
  ["agent_camera_bindings", "agent_camera_bindings_owner_idx"],
  ["agent_camera_bindings", "agent_camera_bindings_camera_idx"],
  ["agent_media_sessions", "agent_media_sessions_path_idx"],
  ["agent_media_sessions", "agent_media_sessions_agent_camera_idx"],
  ["agent_media_sessions", "agent_media_sessions_expires_idx"],
];

function fail(message) {
  throw new Error(message);
}

async function getExistingTables(client) {
  const { rows } = await client.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])
    `,
    [SURVEILLANCE_TABLES],
  );
  return new Set(rows.map((row) => row.table_name));
}

async function assertRequiredIndexes(client) {
  const { rows } = await client.query(
    `
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = ANY($1::text[])
    `,
    [REQUIRED_INDEXES.map(([tableName]) => tableName)],
  );
  const present = new Set(rows.map((row) => `${row.tablename}.${row.indexname}`));
  const missing = REQUIRED_INDEXES
    .filter(([tableName, indexName]) => !present.has(`${tableName}.${indexName}`))
    .map(([tableName, indexName]) => `${tableName}.${indexName}`);
  if (missing.length > 0) {
    fail(`Index attendus absents après migration: ${missing.join(", ")}`);
  }
}

async function main() {
  if (process.env.ALLOW_RAILWAY_SURVEILLANCE_MIGRATION !== "true") {
    fail(
      "Migration bloquée. Définir ALLOW_RAILWAY_SURVEILLANCE_MIGRATION=true après revue de la sauvegarde.",
    );
  }

  const databaseUrl = process.env.RAILWAY_DATABASE_URL?.trim();
  if (!databaseUrl) {
    fail("RAILWAY_DATABASE_URL doit être configurée.");
  }

  const client = new Client({
    connectionString: databaseUrl,
    application_name: "burkinawatch-railway-surveillance-migration",
  });

  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '120s'");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('burkinawatch:surveillance-schema'))",
    );

    const { rows: usersRows } = await client.query(
      "SELECT to_regclass('public.users') AS users_table",
    );
    if (!usersRows[0]?.users_table) {
      fail("La table public.users est absente; arrêt sans modification.");
    }

    const existingTables = await getExistingTables(client);
    for (const [fileName, targetTables] of Object.entries(MIGRATION_TABLES)) {
      const present = targetTables.filter((tableName) => existingTables.has(tableName));
      if (present.length > 0 && present.length < targetTables.length) {
        fail(
          `${fileName} semble partiellement appliquée (${present.join(", ")}); revue manuelle requise.`,
        );
      }
    }

    const migrationResults = [];
    for (const fileName of MIGRATIONS) {
      const targetTables = MIGRATION_TABLES[fileName];
      if (
        targetTables &&
        targetTables.every((tableName) => existingTables.has(tableName))
      ) {
        migrationResults.push(`${fileName}: déjà présente`);
        continue;
      }

      const sql = await readFile(path.join(MIGRATION_ROOT, fileName), "utf8");
      await client.query(sql);
      migrationResults.push(`${fileName}: appliquée`);
    }

    const finalTables = await getExistingTables(client);
    for (const tableName of SURVEILLANCE_TABLES) {
      if (!finalTables.has(tableName)) {
        fail(`Table ${tableName} absente après migration.`);
      }
    }
    await assertRequiredIndexes(client);

    await client.query("COMMIT");
    console.log("Migration Railway surveillance terminée dans une transaction.");
    for (const result of migrationResults) console.log(result);
    console.log("Vérification: tables et index critiques présents.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `Migration interrompue: ${error instanceof Error ? error.message : "erreur inconnue"}`,
  );
  process.exitCode = 1;
}