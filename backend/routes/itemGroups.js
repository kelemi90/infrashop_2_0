const express = require('express');
const router = express.Router();
const db = require('../db');

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

module.exports = router;
