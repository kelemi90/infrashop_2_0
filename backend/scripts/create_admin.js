// Create or update a backend-managed user with a chosen role.
// Usage:
//   node backend/scripts/create_admin.js
// Environment overrides:
//   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME, ADMIN_ROLE
// The script will attempt to reuse `backend/db.js` (project Pool). If you run this
// script from a temporary Node container (recommended for production images that
// don't include dev tooling), make sure DB connection env vars (DATABASE_URL or
// DB_HOST/DB_USER/DB_PASSWORD/DB_NAME) are provided so the script can connect.

const bcrypt = require('bcrypt');
const { ROLE_ADMIN, ROLE_MODERATOR } = require('../auth/roles');
let pool;

// Try to reuse the project's db pool if available, otherwise create our own.
try {
  // prefer the project pool when running inside the repo (node backend/scripts/..)
  // eslint-disable-next-line import/no-dynamic-require
  pool = require('../db');
} catch (err) {
  // fallback: use pg directly and honor DATABASE_URL or DB_* env vars
  const { Pool } = require('pg');
  const getDbConfig = () => {
    if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
    return {
      host: process.env.DB_HOST || 'db',
      user: process.env.DB_USER || 'infrashop',
      password: process.env.DB_PASSWORD || 'supersecret',
      database: process.env.DB_NAME || 'infrashop',
      port: parseInt(process.env.DB_PORT || '5432', 10)
    };
  };
  pool = new Pool(getDbConfig());
}

const email = (process.env.ADMIN_EMAIL || '').trim();
const password = process.env.ADMIN_PASSWORD || '';
const displayName = (process.env.ADMIN_DISPLAY_NAME || email).trim();
const role = process.env.ADMIN_ROLE || ROLE_ADMIN;

function normalizeRole(inputRole) {
  if (inputRole === ROLE_ADMIN || inputRole === ROLE_MODERATOR) return inputRole;
  throw new Error(`Unsupported role: ${inputRole}`);
}

async function main() {
  try {
    if (!email) throw new Error('ADMIN_EMAIL is required (or pass --email via scripts/run_create_admin.sh).');
    if (!password) throw new Error('ADMIN_PASSWORD is required (or pass --password via scripts/run_create_admin.sh).');

    const normalizedRole = normalizeRole(role);
    console.log(`Creating/updating ${normalizedRole} user`, email);
    const hash = await bcrypt.hash(password, 10);

    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) {
      await pool.query('UPDATE users SET password_hash=$1, display_name=$2, role=$3 WHERE email=$4', [hash, displayName, normalizedRole, email]);
      console.log(`Updated existing ${normalizedRole} user.`);
    } else {
      const r = await pool.query('INSERT INTO users (email, password_hash, display_name, role) VALUES ($1,$2,$3,$4) RETURNING id', [email, hash, displayName, normalizedRole]);
      console.log(`Created ${normalizedRole} user id`, r.rows[0].id);
    }
    console.log('Done.');
  } catch (err) {
    console.error('Error creating user:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    // close pool if it exposes end()
    try {
      if (pool && typeof pool.end === 'function') await pool.end();
    } catch (e) {
      // ignore
    }
  }
}

if (require.main === module) main();

module.exports = { main };
