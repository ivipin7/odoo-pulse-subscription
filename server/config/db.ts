import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch((err: Error) => {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  });
