const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/reports/summary
 * body: { categories: ["TV", "Pöydät"] }
 */
router.post('/summary', async (req, res) => {
  const categories = (req.body.categories || []).map(c =>
    c.toLowerCase().trim()
  );

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: 'Kategoriat puuttuvat' });
  }

  try {
    const { rows } = await db.query(
      `
      SELECT
        i.name,
        i.category,
        o.delivery_point,
        SUM(oi.quantity)::int AS total_quantity
      FROM order_items oi
      JOIN items i ON i.id = oi.item_id
      JOIN orders o ON o.id = oi.order_id
      WHERE LOWER(i.category) = ANY($1)
      GROUP BY i.name, i.category, o.delivery_point
      ORDER BY i.category, i.name, o.delivery_point
      `,
      [categories]
    );

    res.json(rows);
  } catch (err) {
    console.error('REPORT ERROR', err);
    res.status(500).json({ error: 'Raportin luonti epäonnistui' });
  }
});


module.exports = router;

// ------------------------------
// Group-level reporting
// ------------------------------
router.post('/groups', async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        g.id AS group_id,
        g.name AS group_name,
        COUNT(oi_header.id)::int AS times_ordered,
        COALESCE(SUM(child.quantity),0)::int AS total_items_from_groups
      FROM item_groups g
      LEFT JOIN order_items oi_header ON oi_header.group_id = g.id AND oi_header.group_parent_id IS NULL
      LEFT JOIN order_items child ON child.group_parent_id = oi_header.id
      GROUP BY g.id, g.name
      ORDER BY times_ordered DESC, g.name
      `
    );
    res.json(rows);
  } catch (err) {
    console.error('REPORT GROUPS ERROR', err);
    res.status(500).json({ error: 'Group report failed' });
  }
});
