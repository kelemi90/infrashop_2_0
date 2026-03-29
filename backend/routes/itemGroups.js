const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No auth' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// list groups
router.get('/', async (req, res) => {
  const r = await db.query('SELECT * FROM item_groups ORDER BY name');
  res.json(r.rows);
});

// group items
router.get('/:id/items', async (req, res) => {
  const r = await db.query(
    `SELECT igi.quantity, i.id AS item_id, i.name, i.sku, i.short_description, i.image_url, i.available_stock
     FROM item_group_items igi
     JOIN items i ON i.id = igi.item_id
     WHERE igi.group_id = $1`, [req.params.id]
  );
  res.json(r.rows);
});

// Create a new item group (admin only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Ei oikeuksia' });
  const { name, description, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const r = await db.query('INSERT INTO item_groups (name, description, image_url) VALUES ($1,$2,$3) RETURNING *', [name, description || '', image_url || '']);
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create group' });
  }
});

// Set items for a group (replace existing) (admin only)
router.post('/:id/items', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Ei oikeuksia' });
  const groupId = parseInt(req.params.id, 10);
  const { items } = req.body; // [{ item_id, quantity }, ...]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Items array required' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const g = await client.query('SELECT * FROM item_groups WHERE id=$1 FOR UPDATE', [groupId]);
    if (!g.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Group not found' }); }

    // delete old entries
    await client.query('DELETE FROM item_group_items WHERE group_id=$1', [groupId]);

    // insert new ones
    for (const it of items) {
      const iid = parseInt(it.item_id, 10);
      const qty = parseInt(it.quantity, 10) || 0;
      if (!iid || qty <= 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Invalid item or quantity' }); }
      // ensure item exists
      const check = await client.query('SELECT id FROM items WHERE id=$1', [iid]);
      if (!check.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Item not found: ${iid}` }); }
      await client.query('INSERT INTO item_group_items (group_id, item_id, quantity) VALUES ($1,$2,$3)', [groupId, iid, qty]);
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to set group items' });
  } finally {
    client.release();
  }
});

module.exports = router;
