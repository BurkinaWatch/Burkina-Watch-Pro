import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with connection error handling
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool);

// Export pool for graceful shutdown
export { pool };
