import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const EXPECTED_TABLES = [
  "audit_logs",
  "chat_history",
  "chat_messages",
  "commentaires",
  "emergency_contacts",
  "location_points",
  "magic_links",
  "moderation_logs",
  "notification_preferences",
  "notifications",
  "online_sessions",
  "otp_codes",
  "ouaga3d_coverage",
  "ouaga3d_image_assets",
  "ouaga3d_reconstruction_jobs",
  "ouaga3d_scene_tiles",
  "ouaga3d_scheduler_runs",
  "panic_alerts",
  "place_verifications",
  "places",
  "push_subscriptions",
  "refresh_tokens",
  "sessions",
  "signalement_likes",
  "signalements",
  "surveillance_cameras",
  "camera_agents",
  "agent_camera_bindings",
  "agent_media_sessions",
  "streetview_points",
  "tracking_sessions",
  "users",
  "virtual_tours",
];

const TARGET_TABLES = [
  "commentaires",
  "notifications",
  "online_sessions",
  "signalements",
  "tracking_sessions",
];

const EXPECTED_INDEXES = [
  ["commentaires", "commentaires_signalement_id_idx"],
  ["commentaires", "commentaires_user_id_idx"],
  ["notifications", "notifications_user_id_read_idx"],
  ["notifications", "notifications_user_id_created_at_idx"],
  ["online_sessions", "online_sessions_user_id_idx"],
  ["signalements", "signalements_user_id_idx"],
  ["signalements", "signalements_created_at_idx"],
  ["signalements", "signalements_statut_idx"],
  ["tracking_sessions", "tracking_sessions_user_id_active_idx"],
];

const SURVEILLANCE_TABLES = [
  "surveillance_cameras",
  "camera_agents",
  "agent_camera_bindings",
  "agent_media_sessions",
];

const SURVEILLANCE_INDEXES = [
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

const migrationPath = path.join(
  process.cwd(),
  "migrations",
  "0004_runtime_alignment_draft.sql",
);

function status(label, value) {
  console.log(`${label}: ${value}`);
}

function sorted(values) {
  return [...values].sort();
}

function sameValues(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

async function main() {
  const databaseUrl = process.env.RAILWAY_DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "Précontrôle interrompu : RAILWAY_DATABASE_URL doit être configurée.",
    );
    process.exitCode = 1;
    return;
  }

  let migrationSql;
  try {
    migrationSql = await readFile(migrationPath, "utf8");
  } catch {
    console.error(
      "Précontrôle interrompu : migration 0004 introuvable ou illisible.",
    );
    process.exitCode = 1;
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    application_name: "burkinawatch-railway-migration-preflight",
  });

  try {
    await client.connect();

    const { rows: tableRows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const { rows: indexRows } = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = ANY($1::text[])
      ORDER BY tablename, indexname
    `, [Array.from(new Set([...TARGET_TABLES, ...SURVEILLANCE_TABLES]))]);

    const { rows: onlineRows } = await client.query(`
      SELECT data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'online_sessions'
        AND column_name = 'id'
    `);

    const { rows: functionRows } = await client.query(`
      SELECT
        to_regprocedure('gen_random_uuid()') IS NOT NULL AS function_exists,
        has_function_privilege(current_user, 'gen_random_uuid()', 'EXECUTE') AS can_execute
    `);

    const { rows: journalRows } = await client.query(`
      SELECT n.nspname AS schema_name, c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = '__drizzle_migrations'
        AND c.relkind IN ('r', 'p')
      ORDER BY n.nspname
    `);

    const countRows = [];
    for (const tableName of [...TARGET_TABLES, ...SURVEILLANCE_TABLES]) {
      const { rows } = await client.query(
        `SELECT count(*)::text AS row_count FROM public."${tableName}"`,
      );
      countRows.push([tableName, rows[0].row_count]);
    }

    const actualTables = tableRows.map((row) => row.table_name);
    const exactTableSet = sameValues(actualTables, EXPECTED_TABLES);
    const indexesByName = new Map(
      indexRows.map((row) => [`${row.tablename}.${row.indexname}`, row]),
    );
    const missingIndexes = EXPECTED_INDEXES.filter(
      ([tableName, indexName]) =>
        !indexesByName.has(`${tableName}.${indexName}`),
    );
    const missingSurveillanceIndexes = SURVEILLANCE_INDEXES.filter(
      ([tableName, indexName]) =>
        !indexesByName.has(`${tableName}.${indexName}`),
    );
    const unexpectedTargetIndexes = indexRows.filter(
      (row) =>
        ![...EXPECTED_INDEXES, ...SURVEILLANCE_INDEXES].some(
          ([tableName, indexName]) =>
            tableName === row.tablename && indexName === row.indexname,
        ) &&
        row.indexname !== `${row.tablename}_pkey`,
    );
    const onlineId = onlineRows[0] ?? {};
    const defaultAlreadyCorrect =
      onlineId.column_default?.includes("gen_random_uuid()") ?? false;
    const sqlHasOnlyAllowedOperations =
      !/\b(drop|truncate|delete)\b/i.test(migrationSql) &&
      (migrationSql.match(/CREATE INDEX IF NOT EXISTS/g) ?? []).length === 9 &&
      migrationSql.includes('ALTER COLUMN "id" SET DEFAULT gen_random_uuid()');
    const functionAvailable =
      functionRows[0]?.function_exists && functionRows[0]?.can_execute;

    console.log("Railway migration preflight (lecture seule)");
    console.log("------------------------------------------------");
    status("Tables publiques", `${actualTables.length}/${EXPECTED_TABLES.length}`);
    status("Structure exacte", exactTableSet ? "PASS" : "FAIL");
    status(
      "Journal __drizzle_migrations",
      journalRows.length === 0
        ? "ABSENT — runner forward-only contrôlé"
        : `PRÉSENT — ${journalRows.map((row) => `${row.schema_name}.${row.table_name}`).join(", ")}`,
    );
    status(
      "gen_random_uuid()",
      functionAvailable ? "DISPONIBLE" : "INDISPONIBLE",
    );
    status(
      "online_sessions.id",
      `${onlineId.data_type ?? "introuvable"} / default=${onlineId.column_default || "absent"}`,
    );
    status("SQL de 0004", sqlHasOnlyAllowedOperations ? "PASS" : "FAIL");
    status(
      "Schéma surveillance",
      SURVEILLANCE_TABLES.every((tableName) => actualTables.includes(tableName)) &&
        missingSurveillanceIndexes.length === 0
        ? "PASS — tables et index présents"
        : "FAIL — tables ou index manquants",
    );
    console.log("Compteurs des tables ciblées:");
    for (const [tableName, rowCount] of countRows) {
      console.log(`  ${tableName}: ${rowCount}`);
    }

    console.log("Index attendus par 0004:");
    for (const [tableName, indexName] of EXPECTED_INDEXES) {
      const present = indexesByName.has(`${tableName}.${indexName}`);
      console.log(`  ${indexName}: ${present ? "présent" : "à créer"}`);
    }
    console.log("Index surveillance:");
    for (const [tableName, indexName] of SURVEILLANCE_INDEXES) {
      const present = indexesByName.has(`${tableName}.${indexName}`);
      console.log(`  ${indexName}: ${present ? "présent" : "à créer"}`);
    }

    if (unexpectedTargetIndexes.length > 0) {
      console.log("Index secondaires non prévus détectés sur les tables ciblées:");
      for (const row of unexpectedTargetIndexes) {
        console.log(`  ${row.tablename}.${row.indexname}: ${row.indexdef}`);
      }
    }

    const safeReadOnlyPreflight =
      exactTableSet &&
      functionAvailable &&
      sqlHasOnlyAllowedOperations &&
      (missingIndexes.length === 0 || missingIndexes.length === EXPECTED_INDEXES.length) &&
      missingSurveillanceIndexes.length === 0 &&
      unexpectedTargetIndexes.length === 0 &&
      onlineRows.length === 1 &&
      journalRows.length === 0;

    status(
      "Précontrôle lecture seule",
      safeReadOnlyPreflight
        ? "PASS — aucune modification exécutée"
        : "FAIL — revue structurelle requise",
    );
    status(
      "Application de 0004",
      missingIndexes.length === 0 && defaultAlreadyCorrect
        ? "DÉJÀ APPLIQUÉE — vérification lecture seule"
        : "À REVOIR — index ou default manquant",
    );

    if (!safeReadOnlyPreflight) {
      process.exitCode = 1;
    }
  } catch (error) {
    const code = error && typeof error === "object" ? error.code : undefined;
    console.error(
      `Précontrôle interrompu : connexion ou requête PostgreSQL échouée${code ? ` (${code})` : ""}.`,
    );
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

await main();