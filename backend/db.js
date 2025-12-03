// db.js - pg pool helper
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: ProcessingInstruction.env.DATABASE_URL || 'postgresql://infrashop:supersecret@db:5432/infrashop'
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect()
};