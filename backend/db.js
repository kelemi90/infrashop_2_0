const { Pool } = require('pg');

const pool = new Pool({
  host: 'db',               // docker service name
  user: 'infrashop',
  password: 'supersecret',
  database: 'infrashop',
  port: 5432
});

module.exports = pool;
