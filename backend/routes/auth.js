// simple auth (signup/login) - uses bcypt + jwt
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const r = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expireIn: '12h' });
    res.json({ token, user: { id: user.ud, email: user.email, display_name: user.display_name, role: user.role }});
});

router.post('/signup', async (req, res) => {
    const { email, password, display_name } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const r = await db.query('INSERT INTO users (email,password_hash,display_name) VALUEs ($1, $2, $3) RETURNING id,email,display_name,role', [email, hash, display_name]);
    res.json(r.rows[0]);
});

module.exports = router;