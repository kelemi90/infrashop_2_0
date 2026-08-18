const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../auth/roles');

// list events
router.get('/', async (req, res, next) => {
  try {
    const r = await db.query('SELECT * FROM events ORDER BY start_date DESC');
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// create event (admin)
router.post('/', requireAdmin, async (req, res, next) => {
  const { name, start_date, end_date } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Event name is required' });

  try {
    const r = await db.query(
      'INSERT INTO events (name, start_date, end_date) VALUES ($1, $2, $3) RETURNING *',
      [String(name).trim(), start_date || null, end_date || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Summary endpoints (Decided to restrict these to Catalog Managers)
const { requireCatalogManager } = require('../auth/roles');

router.get('/:id/grouped-orders', requireCatalogManager, async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT i.id as item_id, i.name, i.sku, SUM(oi.quantity) AS total_ordered
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN items i ON oi.item_id = i.id
       WHERE o.event_id = $1
       GROUP BY i.id, i.name, i.sku
       ORDER BY i.name`, [req.params.id]
    );
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
