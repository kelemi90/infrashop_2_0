const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireCatalogManager } = require('../auth/roles');

router.use(requireCatalogManager);

router.post('/summary', async (req, res, next) => {
  const categories = (req.body.categories || []).map(c => c.toLowerCase().trim());
  if (!categories.length) return res.status(400).json({ error: 'Kategoriat puuttuvat' });

  try {
    const { rows } = await db.query(
      `SELECT i.name, i.category, o.organization, o.delivery_point, SUM(oi.quantity)::int AS total_quantity
       FROM order_items oi
       JOIN items i ON i.id = oi.item_id
       JOIN orders o ON o.id = oi.order_id
       WHERE LOWER(i.category) = ANY($1)
       GROUP BY i.name, i.category, o.organization, o.delivery_point
       ORDER BY i.category, i.name`,
      [categories]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/groups', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT g.id AS group_id, g.name AS group_name, COUNT(oi.id)::int AS times_ordered
       FROM item_groups g
       LEFT JOIN order_items oi ON oi.group_id = g.id
       GROUP BY g.id, g.name
       ORDER BY times_ordered DESC`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
