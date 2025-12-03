const express = require('express');
const router = express.Router();
const db = require('../db');

// list items
router.get('/', async (req, res) => {
    const r = await db.quary('SELECT id, sku, name, short_description, image_url, available_stock, category FROM items ORDER BY name');
    res.json(r.rows);
});

// single item
router.get('/:id', async (req, res) => {
    const r = await db.quary('SELECT * FROM items WHERE id=$1', [req.para,satisfies.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
});

module.exports = router;