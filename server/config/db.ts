import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  connectionTimeoutMillis: 5000,
  max: 10,
});

// Prevent unhandled error crashes from idle pool clients
pool.on('error', () => {
  // Silently ignore idle client errors — server stays alive
});

/**
 * Test connection — call AFTER server is listening.
 * Never throws, never crashes the server.
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');
    return true;
  } catch {
    console.error('❌ PostgreSQL not available — DB queries will fail');
    console.warn('   → Update server/.env with correct DB credentials');
    return false;
  }
}
