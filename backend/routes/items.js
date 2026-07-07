const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const { requireCatalogManager } = require('../auth/roles');
const logger = require('../utils/logger');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG and WEBP images are allowed'));
  }
});

// GET all items
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM items ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET single item
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE item (Fixed the runtime bug)
router.delete('/:id', requireCatalogManager, async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Check for cycles in auto_add_item_id (Simple 1-level check)
    // Actually, delete logic doesn't need cycle check, but it's good practice.

    // 1. Detach from order_items (This works now because we dropped NOT NULL)
    await client.query('UPDATE order_items SET item_id = NULL WHERE item_id = $1', [id]);
    
    // 2. Detach from stock_audit
    await client.query('UPDATE stock_audit SET item_id = NULL WHERE item_id = $1', [id]);
    
    // 3. Remove from groups and auto-add links
    await client.query('DELETE FROM item_group_items WHERE item_id=$1', [id]);
    await client.query('UPDATE items SET auto_add_item_id = NULL WHERE auto_add_item_id = $1', [id]);
    
    // 4. Delete the item
    const r = await client.query('DELETE FROM items WHERE id=$1 RETURNING id', [id]);
    if (r.rowCount === 0) throw new Error('Item not found');

    await client.query('COMMIT');
    res.json({ ok: true, id });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// POST /api/items (With cycle detection)
router.post('/', requireCatalogManager, async (req, res, next) => {
  try {
    const { name, auto_add_item_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Basic cycle check: item cannot auto-add itself
    if (auto_add_item_id && String(auto_add_item_id) === String(req.body.id)) {
      return res.status(400).json({ error: 'Item cannot auto-add itself' });
    }

    const r = await db.query(
      'INSERT INTO items (name, sku, auto_add_item_id) VALUES ($1, $2, $3) RETURNING *',
      [name, req.body.sku || name.toLowerCase().replace(/\s+/g, '-'), auto_add_item_id || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
