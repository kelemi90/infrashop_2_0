const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

async function hydrateItemsWithImages(rows) {
  if (!rows || rows.length === 0) return rows;
  const itemIds = rows.map((r) => r.id);
  const imgRes = await db.query(
    `SELECT item_id, image_url, thumbnail_url, sort_order, is_primary
     FROM item_images
     WHERE item_id = ANY($1::int[])
     ORDER BY item_id, is_primary DESC, sort_order ASC, id ASC`,
    [itemIds]
  );

  const byItemId = new Map();
  for (const r of imgRes.rows) {
    if (!byItemId.has(r.item_id)) byItemId.set(r.item_id, []);
    byItemId.get(r.item_id).push(r);
  }

  return rows.map((row) => {
    const imgs = byItemId.get(row.id) || [];
    const imageUrls = imgs.map((i) => i.image_url).filter(Boolean);
    const thumbUrls = imgs.map((i) => i.thumbnail_url).filter(Boolean);
    const primary = imgs.find((i) => i.is_primary) || imgs[0] || null;
    return {
      ...row,
      image_urls: imageUrls,
      thumbnail_urls: thumbUrls,
      image_url: row.image_url || (primary ? primary.image_url : null),
      thumbnail_url: row.thumbnail_url || (primary ? primary.thumbnail_url : null)
    };
  });
}

function getUploadedFiles(req) {
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === 'object') {
    const fromImages = Array.isArray(req.files.images) ? req.files.images : [];
    const fromImage = Array.isArray(req.files.image) ? req.files.image : [];
    return [...fromImages, ...fromImage];
  }
  if (req.file) return [req.file];
  return [];
}

async function processAndSaveImage(file, imagesDir) {
  const original = file.originalname || 'upload';
  const noExt = original.replace(/\.[^/.]+$/, '');
  const base = noExt.replace(/[^a-z0-9.\-]/gi, '_');

  let ext = 'jpg';
  let format = 'jpeg';
  if (file.mimetype === 'image/png') {
    ext = 'png';
    format = 'png';
  } else if (file.mimetype === 'image/webp') {
    ext = 'webp';
    format = 'webp';
  }

  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const filename = `${stamp}_${base}.${ext}`;
  const outPath = path.join(imagesDir, filename);

  const transformer = sharp(file.buffer).rotate().resize({ width: 1200, withoutEnlargement: true });
  if (format === 'jpeg') transformer.jpeg({ quality: 80 });
  if (format === 'png') transformer.png({ compressionLevel: 8 });
  if (format === 'webp') transformer.webp({ quality: 80 });
  await transformer.toFile(outPath);

  const thumbFilename = `${stamp}_${base}_thumb.${ext}`;
  const thumbPath = path.join(imagesDir, thumbFilename);
  const thumbTransformer = sharp(file.buffer).rotate().resize({ width: 300, withoutEnlargement: true });
  if (format === 'jpeg') thumbTransformer.jpeg({ quality: 70 });
  if (format === 'png') thumbTransformer.png({ compressionLevel: 9 });
  if (format === 'webp') thumbTransformer.webp({ quality: 70 });
  await thumbTransformer.toFile(thumbPath);

  return { filename, thumbFilename };
}

// generate a reasonable SKU from the name and ensure uniqueness
async function generateSkuFromName(name) {
  const base = (name || 'item').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'item';
  let attempt = 0;
  while (true) {
    let candidate = base;
    if (attempt > 0) {
      // append a short random suffix to avoid collisions
      candidate = `${base}-${Math.random().toString(36).slice(2,6)}`;
    }
    const exists = await db.query('SELECT 1 FROM items WHERE sku=$1', [candidate]);
    if (exists.rows.length === 0) return candidate;
    attempt++;
    if (attempt > 20) {
      // fallback: timestamp-based
      return `${base}-${Date.now().toString().slice(-6)}`;
    }
  }
}

function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No auth' });
  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// configure multer to store uploads in memory so we can validate/resize with sharp
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // limit to 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG and WEBP images are allowed'));
  }
});

/* GET all items */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, sku, name, short_description, long_description, image_url, thumbnail_url, available_stock, category FROM items ORDER BY name'
    );
    const hydrated = await hydrateItemsWithImages(result.rows);
    res.json(hydrated);
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
      'SELECT id, sku, name, short_description, long_description, image_url, thumbnail_url, available_stock, category FROM items WHERE id = $1',
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const hydrated = await hydrateItemsWithImages(result.rows);
    res.json(hydrated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/items/:id/image - upload one or more images for an item
router.post('/:id/image', authAdmin, upload.fields([{ name: 'image', maxCount: 10 }, { name: 'images', maxCount: 10 }]), async (req, res) => {
  try {
    const id = req.params.id;
    const files = getUploadedFiles(req);
    if (!files.length) return res.status(400).json({ error: 'No file uploaded' });

    const exists = await db.query('SELECT id FROM items WHERE id=$1', [id]);
    if (!exists.rows.length) return res.status(404).json({ error: 'Item not found' });

    // ensure images dir exists
    const imagesDir = path.join(__dirname, '..', 'public', 'images');
    await fs.promises.mkdir(imagesDir, { recursive: true });

    const countRes = await db.query('SELECT COUNT(*)::int AS count FROM item_images WHERE item_id=$1', [id]);
    let sortOrder = countRes.rows[0]?.count || 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { filename, thumbFilename } = await processAndSaveImage(file, imagesDir);
      const isPrimary = sortOrder === 0 && i === 0;
      await db.query(
        `INSERT INTO item_images (item_id, image_url, thumbnail_url, sort_order, is_primary)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, filename, thumbFilename, sortOrder, isPrimary]
      );
      sortOrder += 1;
    }

    const primaryRes = await db.query(
      `SELECT image_url, thumbnail_url
       FROM item_images
       WHERE item_id=$1
       ORDER BY is_primary DESC, sort_order ASC, id ASC
       LIMIT 1`,
      [id]
    );
    const primary = primaryRes.rows[0] || {};
    await db.query('UPDATE items SET image_url=$1, thumbnail_url=$2, updated_at=now() WHERE id=$3', [primary.image_url || null, primary.thumbnail_url || null, id]);

    const itemRow = (await db.query('SELECT id, sku, name, short_description, image_url, thumbnail_url, available_stock, category FROM items WHERE id=$1', [id])).rows;
    const item = (await hydrateItemsWithImages(itemRow))[0];
    res.json({ ok: true, item });
  } catch (err) {
    console.error('Image upload error:', err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large (max 5MB)' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected upload field' });
      }
      return res.status(400).json({ error: err.message || 'Upload validation failed' });
    }

    // fileFilter custom validation error
    if (err.message && err.message.includes('Only')) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;

// PUT /api/items/:id - update item (admin only)
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { sku, name, short_description, total_stock, available_stock, category } = req.body;

    const existingRes = await db.query('SELECT * FROM items WHERE id=$1', [id]);
    if (!existingRes.rows.length) return res.status(404).json({ error: 'Item not found' });
    const existing = existingRes.rows[0];

    const newSku = sku !== undefined ? sku : existing.sku;
    const newName = name !== undefined ? name : existing.name;
    const newShort = short_description !== undefined ? short_description : existing.short_description;
    const newTotal = total_stock !== undefined ? total_stock : existing.total_stock;
    const newAvail = available_stock !== undefined ? available_stock : existing.available_stock;
    const newCat = category !== undefined ? category : existing.category;

    await db.query(
      `UPDATE items SET sku=$1, name=$2, short_description=$3, total_stock=$4, available_stock=$5, category=$6, updated_at=now() WHERE id=$7`,
      [newSku, newName, newShort, newTotal, newAvail, newCat, id]
    );

    const item = (await db.query('SELECT id, sku, name, short_description, image_url, thumbnail_url, total_stock, available_stock, category FROM items WHERE id=$1', [id])).rows[0];
    res.json(item);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// POST /api/items - create a new item (admin only)
router.post('/', authAdmin, async (req, res) => {
  try {
    const { sku, name, short_description, total_stock, available_stock, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    // if sku not provided, generate one from the name and ensure uniqueness
    let finalSku = sku && String(sku).trim() ? String(sku).trim() : await generateSkuFromName(name);
    const r = await db.query(
      `INSERT INTO items (sku, name, short_description, total_stock, available_stock, category, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6, now(), now()) RETURNING id, sku, name, short_description, image_url, thumbnail_url, total_stock, available_stock, category`,
      [finalSku, name, short_description || null, total_stock || 0, available_stock || 0, category || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

