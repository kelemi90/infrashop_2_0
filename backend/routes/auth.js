// simple auth (signup/login) - uses bcypt + jwt
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auth, ROLE_ADMIN, ROLE_MODERATOR } = require('../auth/roles');

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim();
    const r = await db.query(
        'SELECT * FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1',
        [normalizedEmail]
    );
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role }});
});

router.post('/signup', async (req, res) => {
    const { email, password, display_name } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const r = await db.query('INSERT INTO users (email,password_hash,display_name) VALUEs ($1, $2, $3) RETURNING id,email,display_name,role', [email, hash, display_name]);
    res.json(r.rows[0]);
});

router.post('/change-password', auth, async (req, res) => {
    const userRole = req.user && req.user.role;
    if (userRole !== ROLE_ADMIN && userRole !== ROLE_MODERATOR) {
        return res.status(403).json({ error: 'Moderator or admin required' });
    }

    const userId = req.user && req.user.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (String(newPassword).length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    try {
        const r = await db.query('SELECT id, password_hash FROM users WHERE id=$1 LIMIT 1', [userId]);
        if (!r.rows.length) return res.status(404).json({ error: 'User not found' });

        const user = r.rows[0];
        const ok = await bcrypt.compare(String(currentPassword), user.password_hash || '');
        if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

        const hash = await bcrypt.hash(String(newPassword), 10);
        await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, user.id]);
        return res.json({ ok: true });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ error: 'Failed to change password' });
    }
});

module.exports = router;