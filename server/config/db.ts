import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

let dbConnected = false;

pool.query('SELECT NOW()')
  .then(() => {
    dbConnected = true;
    console.log('✅ PostgreSQL connected');
  })
  .catch((err) => {
    console.error('❌ PostgreSQL connection failed:', err.message);
    console.error('⚠️  Server will stay up but DB calls will fail.');
    console.error('   → Edit server/.env with your real DB_PASSWORD');
    console.error('   → Make sure PostgreSQL is running on localhost:5432');
    console.error('   → Run: psql -U postgres -c "CREATE DATABASE odoopulse;"');
  });

export { dbConnected };
