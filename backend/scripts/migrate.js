const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const getDbConfig = () => {
  if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'infrashop',
    password: process.env.DB_PASSWORD || 'supersecret',
    database: process.env.DB_NAME || 'infrashop',
    port: parseInt(process.env.DB_PORT || '5432', 10)
  };
};

(async () => {
  const pool = new Pool(getDbConfig());
  try {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files.`);

    // Simple migration tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT now()
      )
    `);

    for (const file of files) {
      const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
      if (rows.length > 0) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Migration ${file} applied successfully.`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
    console.log('All migrations processed.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
