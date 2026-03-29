// Create or update an admin user for development
// Usage:
//   node backend/scripts/create_admin.js
// You can override via env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME

const bcrypt = require('bcrypt');
const db = require('../db');

const email = process.env.ADMIN_EMAIL || 'Buildcat';
const password = process.env.ADMIN_PASSWORD || 'buildcat';
const displayName = process.env.ADMIN_DISPLAY_NAME || 'Buildcat';

async function main() {
  try {
    console.log('Creating/updating admin user', email);
    const hash = await bcrypt.hash(password, 10);

    const existing = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) {
      await db.query('UPDATE users SET password_hash=$1, display_name=$2, role=$3 WHERE email=$4', [hash, displayName, 'admin', email]);
      console.log('Updated existing admin user.');
    } else {
      const r = await db.query('INSERT INTO users (email, password_hash, display_name, role) VALUES ($1,$2,$3,$4) RETURNING id', [email, hash, displayName, 'admin']);
      console.log('Created admin user id', r.rows[0].id);
    }
    console.log('Done.');
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  } finally {
    // close pool
    try { await db.end(); } catch (e) {}
  }
}

main();
