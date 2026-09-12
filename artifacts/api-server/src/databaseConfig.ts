/**
 * PostgreSQL connection policy.
 *
 * DATABASE_URL is the only supported PostgreSQL connection variable in every
 * environment. Railway should expose its PostgreSQL connection through this
 * variable as well.
 */
export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be configured.");
  }

  return databaseUrl;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}