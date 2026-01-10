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
        SUM(oi.quantity)::int AS total_quantity
      FROM order_items oi
      JOIN items i ON i.id = oi.item_id
      JOIN orders o ON o.id = oi.order_id
      WHERE LOWER(i.category) = ANY($1)
      GROUP BY i.name, i.category
      ORDER BY i.category, i.name
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
