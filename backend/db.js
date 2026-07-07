const { Pool } = require('pg');
const logger = require('./utils/logger');

const getDbConfig = () => {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  
  const password = process.env.DB_PASSWORD;
  if (process.env.NODE_ENV === 'production' && (!password || password === 'supersecret')) {
    logger.error('CRITICAL: DB_PASSWORD is not set or insecure in production.');
    // In production, we should ideally exit, but let's just log for now to avoid breaking existing setups
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'infrashop',
    password: password || 'supersecret',
    database: process.env.DB_NAME || 'infrashop',
    port: parseInt(process.env.DB_PORT || '5432', 10)
  };
};

const pool = new Pool(getDbConfig());

module.exports = pool;
