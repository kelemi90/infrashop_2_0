const express = require('express');
const router = express.Router();
const db = require('../db');

/* GET all items */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, sku, name, short_description, image_url, available_stock, category FROM items ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

/* GET single item by id */
router.get('/:id', async (req, res) => {
  try {
    const itemId = req.params.id;

    const result = await db.query(
      'SELECT id, sku, name, short_description, image_url, available_stock, category FROM items WHERE id = $1',
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
