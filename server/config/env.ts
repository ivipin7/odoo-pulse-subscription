import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'odoopulse',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'odoopulse_hackathon_secret_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
};
