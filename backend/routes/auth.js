const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { auth, ROLE_ADMIN, ROLE_MODERATOR } = require('../auth/roles');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

// Strict rate limit for login/signup
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 mins
  message: { error: 'Too many requests, please try again later.' }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

// Restricted signup: only admin or if SIGNUP_ENABLED is explicitly true
router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const signupEnabled = process.env.SIGNUP_ENABLED === 'true';
    if (!signupEnabled) {
      return res.status(403).json({ error: 'Public signup is disabled. Please contact an administrator.' });
    }

    const { email, password, display_name } = req.body;
    if (!email || !password || !display_name) {
      return res.status(400).json({ error: 'Email, password and display name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hash = await bcrypt.hash(password, 10);
    const r = await db.query(
      'INSERT INTO users (email,password_hash,display_name) VALUES ($1, $2, $3) RETURNING id,email,display_name,role', 
      [email, hash, display_name]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    next(err);
  }
});

router.post('/change-password', auth, async (req, res, next) => {
  const userId = req.user.id;
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
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
