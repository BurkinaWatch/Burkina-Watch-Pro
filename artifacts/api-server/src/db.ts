import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getDatabaseUrl } from "./databaseConfig";

const connectionString = getDatabaseUrl();

const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool);

export { pool };
