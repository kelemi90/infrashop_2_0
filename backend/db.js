const { Pool } = require('pg');

// Use DATABASE_URL if provided, otherwise fall back to individual env vars or defaults
const getDbConfig = () => {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'infrashop',
    password: process.env.DB_PASSWORD || 'supersecret',
    database: process.env.DB_NAME || 'infrashop',
    port: parseInt(process.env.DB_PORT || '5432', 10)
  };
};

const pool = new Pool(getDbConfig());

module.exports = pool;
