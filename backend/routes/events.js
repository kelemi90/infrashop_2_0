const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No auth' });
  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Ensure archived tables exist (safe to run multiple times)
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS archived_orders (
        id SERIAL PRIMARY KEY,
        original_order_id INT,
        customer_name TEXT NOT NULL,
        organization TEXT,
        delivery_point TEXT NOT NULL,
        delivery_start TIMESTAMP NOT NULL,
        return_at TIMESTAMP NOT NULL,
        status TEXT NOT NULL,
        pdf_path TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        archived_at TIMESTAMP DEFAULT now()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS archived_order_items (
        id SERIAL PRIMARY KEY,
        archived_order_id INT REFERENCES archived_orders(id) ON DELETE CASCADE,
        original_order_item_id INT,
        item_id INT,
        item_name TEXT NOT NULL,
        sku TEXT,
        quantity INT NOT NULL,
        created_at TIMESTAMP
      )
    `);

    // Older schema versions may miss orders.event_id, which breaks archive views.
    await db.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS event_id INT REFERENCES events(id)
    `);
  } catch (err) {
    console.error('Failed to ensure archived tables:', err);
  }
})();

// list events
router.get('/', async (req, res) => {
  const r = await db.query('SELECT * FROM events ORDER BY start_date DESC');
  res.json(r.rows);
});

// create event (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { name, start_date, end_date } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Event name is required' });
  }

  if (start_date && Number.isNaN(Date.parse(start_date))) {
    return res.status(400).json({ error: 'Invalid start_date' });
  }
  if (end_date && Number.isNaN(Date.parse(end_date))) {
    return res.status(400).json({ error: 'Invalid end_date' });
  }
  if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ error: 'end_date must be after start_date' });
  }

  try {
    const r = await db.query(
      `INSERT INTO events (name, start_date, end_date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [String(name).trim(), start_date || null, end_date || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// grouped orders for event - items summed
router.get('/:id/grouped-orders', async (req, res) => {
  const { id } = req.params;
  const r = await db.query(
    `SELECT i.id as item_id, i.name, i.sku, i.image_url, SUM(oi.quantity) AS total_ordered
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN items i ON oi.item_id = i.id
     WHERE o.event_id = $1 AND o.status IN ('placed','fulfilled','returned','archived')
     GROUP BY i.id, i.name, i.sku, i.image_url
     ORDER BY i.name`, [id]
  );
  res.json(r.rows);
});

// return all items to stock for event (admin)
router.post('/:id/return-to-stock', async (req, res) => {
  const { id } = req.params;
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const totals = await client.query(
      `SELECT oi.item_id, SUM(oi.quantity) AS qty
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.event_id = $1 AND o.status IN ('fulfilled','placed') 
       GROUP BY oi.item_id`, [id]
    );

    // Archive orders & order_items for this event before returning stock
    const ordersToArchive = await client.query(
      `SELECT * FROM orders WHERE event_id = $1 AND status IN ('fulfilled','placed')`, [id]
    );

    for (const ord of ordersToArchive.rows) {
      const ar = await client.query(
        `INSERT INTO archived_orders (original_order_id, customer_name, organization, delivery_point, delivery_start, return_at, status, pdf_path, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [ord.id, ord.customer_name, ord.organization, ord.delivery_point, ord.delivery_start, ord.return_at, ord.status, ord.pdf_path, ord.created_at, ord.updated_at]
      );

      const archivedId = ar.rows[0].id;
      const itemsRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [ord.id]);
      for (const it of itemsRes.rows) {
        await client.query(
          `INSERT INTO archived_order_items (archived_order_id, original_order_item_id, item_id, item_name, sku, quantity, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [archivedId, it.id, it.item_id, it.item_name, it.sku, it.quantity, it.created_at]
        );
      }
    }

    for (const row of totals.rows) {
      await client.query('UPDATE items SET available_stock = available_stock + $1, updated_at = now() WHERE id = $2', [row.qty, row.item_id]);
      await client.query('INSERT INTO stock_audit (item_id, delta, reason, actor) VALUES ($1,$2,$3,$4)', [row.item_id, row.qty, `Return from event ${id}`, req.body.actor || 'system']);
    }

    await client.query("UPDATE orders SET status='returned', updated_at = now() WHERE event_id = $1 AND status IN ('fulfilled','placed')", [id]);

    await client.query('COMMIT');
    res.json({ ok: true, returned: totals.rows.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to return to stock' });
  } finally {
    client.release();
  }
});

module.exports = router;
