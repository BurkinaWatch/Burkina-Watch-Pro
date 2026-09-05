import { readFile } from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.RAILWAY_DATABASE_URL?.trim();
const requiredFlag = (name) => {
  if (process.env[name] !== "true") {
    throw new Error(`${name}=true est requis avant toute écriture Railway.`);
  }
};

if (!databaseUrl) {
  throw new Error("RAILWAY_DATABASE_URL est requis.");
}
requiredFlag("ALLOW_RAILWAY_STREETVIEW_MIGRATION");
requiredFlag("RAILWAY_STREETVIEW_BACKUP_CONFIRMED");
requiredFlag("RAILWAY_STREETVIEW_PREFLIGHT_CONFIRMED");

const migration = await readFile(
  new URL("../migrations/0010_streetview_cpu_first.sql", import.meta.url),
  "utf8",
);
const phase14Columns = [
  "captured_at",
  "location_accuracy_m",
  "altitude_m",
  "location_source",
  "location_captured_at",
  "temporal_version",
  "quality_metrics",
];
const phase14Tables = [
  "streetview_scenes",
  "streetview_scene_artifacts",
];
const phase14Indexes = [
  ["streetview_scenes", "streetview_scenes_contribution_idx"],
  ["streetview_scenes", "streetview_scenes_publication_idx"],
  ["streetview_scene_artifacts", "streetview_scene_artifacts_scene_idx"],
];
const protectedStreetviewTables = [
  "streetview_contributions",
  "streetview_processing_jobs",
  "streetview_points",
];

async function readPhase14State(client) {
  const { rows: columnRows } = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'streetview_contributions'
        AND column_name = ANY($1::text[])
    `,
    [phase14Columns],
  );
  const { rows: tableRows } = await client.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
    `,
    [phase14Tables],
  );
  const { rows: indexRows } = await client.query(
    `
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = ANY($1::text[])
    `,
    [phase14Indexes.map(([, indexName]) => indexName)],
  );
  return {
    columns: new Set(columnRows.map((row) => row.column_name)),
    tables: new Set(tableRows.map((row) => row.table_name)),
    indexes: new Set(indexRows.map((row) => `${row.tablename}.${row.indexname}`)),
  };
}

function hasAllPhase14Objects(state) {
  return (
    phase14Columns.every((columnName) => state.columns.has(columnName)) &&
    phase14Tables.every((tableName) => state.tables.has(tableName)) &&
    phase14Indexes.every(([tableName, indexName]) =>
      state.indexes.has(`${tableName}.${indexName}`),
    )
  );
}

function hasAnyPhase14Object(state) {
  return state.columns.size > 0 || state.tables.size > 0 || state.indexes.size > 0;
}

const client = new Client({
  connectionString: databaseUrl,
  application_name: "burkinawatch-railway-streetview-phase14",
});

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SET LOCAL lock_timeout = '10s'");
  await client.query("SET LOCAL statement_timeout = '120s'");
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('burkinawatch:streetview:phase14'))",
  );

  const prerequisites = await client.query(
    `
      SELECT
        to_regclass('public.users') AS users_table,
        to_regclass('public.streetview_contributions') AS contributions_table,
        to_regclass('public.streetview_processing_jobs') AS jobs_table
    `,
  );
  const prerequisiteRow = prerequisites.rows[0];
  if (
    !prerequisiteRow.users_table ||
    !prerequisiteRow.contributions_table ||
    !prerequisiteRow.jobs_table
  ) {
    throw new Error(
      "Le schéma users/StreetView Phase 3/5 est incomplet; arrêt sans modification.",
    );
  }

  const beforeState = await readPhase14State(client);
  if (hasAllPhase14Objects(beforeState)) {
    throw new Error("La migration 0010 est déjà appliquée; vérification seule requise.");
  }
  if (hasAnyPhase14Object(beforeState)) {
    throw new Error("Le schéma StreetView Phase 14 est partiellement présent; revue manuelle requise.");
  }

  const beforeCounts = new Map();
  for (const tableName of protectedStreetviewTables) {
    const { rows } = await client.query(
      `SELECT count(*)::text AS row_count FROM public."${tableName}"`,
    );
    beforeCounts.set(tableName, rows[0].row_count);
  }

  await client.query(migration);

  const afterState = await readPhase14State(client);
  if (!hasAllPhase14Objects(afterState)) {
    throw new Error("Vérification du schéma StreetView Phase 14 échouée.");
  }

  for (const tableName of protectedStreetviewTables) {
    const { rows } = await client.query(
      `SELECT count(*)::text AS row_count FROM public."${tableName}"`,
    );
    if (rows[0].row_count !== beforeCounts.get(tableName)) {
      throw new Error(`Le compteur ${tableName} a changé pendant la migration; transaction annulée.`);
    }
  }

  await client.query("COMMIT");
  console.log("Migration Railway StreetView Phase 14 appliquée et vérifiée une seule fois.");
  console.log("Vérification: colonnes de capture, tables de scènes et index présents.");
  console.log("Vérification: compteurs StreetView existants inchangés.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end().catch(() => undefined);
}