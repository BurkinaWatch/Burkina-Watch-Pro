/**
 * PostgreSQL connection policy.
 *
 * Railway PostgreSQL is the production source of truth. DATABASE_URL remains
 * a local-development fallback only when the Railway-specific variable is not
 * available.
 */
export function getDatabaseUrl(): string {
  const railwayDatabaseUrl = process.env.RAILWAY_DATABASE_URL?.trim();
  const standardDatabaseUrl = process.env.DATABASE_URL?.trim();
  const databaseUrl = railwayDatabaseUrl || standardDatabaseUrl;

  if (!databaseUrl) {
    throw new Error(
      "RAILWAY_DATABASE_URL must be set for production, or DATABASE_URL for local development.",
    );
  }

  return databaseUrl;
}

export function hasRailwayDatabaseUrl(): boolean {
  return Boolean(process.env.RAILWAY_DATABASE_URL?.trim());
}