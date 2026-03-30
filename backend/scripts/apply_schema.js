// apply_schema.js - apply migrations/schema.sql against DATABASE_URL or DB_* env vars
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const file = path.join(__dirname, '..', 'migrations', 'schema.sql');
if (!fs.existsSync(file)) {
  console.error('schema.sql not found at', file);
  process.exit(1);
}
const sql = fs.readFileSync(file, 'utf8');

const getDbConfig = () => {
  if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  return {
    host: process.env.DB_HOST || process.env.DB_SERVICE || 'db',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'infrashop',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'supersecret',
    database: process.env.DB_NAME || process.env.POSTGRES_DB || 'infrashop',
    port: parseInt(process.env.DB_PORT || '5432', 10)
  };
};

(async () => {
  const pool = new Pool(getDbConfig());
  try {
    console.log('Applying schema.sql...');
    await pool.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Failed to apply schema:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
