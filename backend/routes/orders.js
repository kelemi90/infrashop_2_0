const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const { getStatusTransitionStockDelta, normalizeStatus } = require('../utils/orderStatus');
const { auth, requireAdmin } = require('../auth/roles');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { sendSlackNotification } = require('../utils/slack');

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

// Constants for requirement detection
const POWER_ITEMS = new Set(['sahkot 1x16a 230v 3000w', 'sahkot 230v', 'sahkot 3x16a 400v 9000w', 'sahkot 3x32a 400v 15000w', 'sahkot muu']);
const NETWORK_ITEMS = new Set(['verkko-10g lr', 'verkko-10g sr', 'verkko-1g base-t']);
const LIGHTING_ITEMS = new Set(['valaistus', 'rgb wash pixel ohjattu']);

function normalizeItemName(value) {
  if (!value) return '';
  try {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  } catch (e) {
    return String(value).toLowerCase().trim();
  }
}

function requiredRequirementKeysFromItems(itemNames) {
  const keys = new Set();
  for (const n of itemNames) {
    const nn = normalizeItemName(n);
    if (POWER_ITEMS.has(nn)) keys.add('power');
    if (NETWORK_ITEMS.has(nn) || nn.includes('verkko')) keys.add('network');
    if (LIGHTING_ITEMS.has(nn)) keys.add('lighting');
    const compact = nn.replace(/[^a-z0-9]+/g, '');
    if (nn.includes('tv') || nn.includes('televisio') || nn.includes('iffalcon') || compact === 'infotv' || compact === 'kutullajatv') keys.add('tv');
  }
  return Array.from(keys);
}

// Helper to verify order access (Owner, Admin, or Token)
async function verifyOrderAccess(req, orderId, client = db) {
  const oRes = await client.query('SELECT * FROM orders WHERE id=$1', [orderId]);
  if (!oRes.rows.length) return { error: 'Tilausta ei löydy', status: 404 };
  const order = oRes.rows[0];

  // 1. Check JWT Auth
  let reqUser = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      reqUser = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch (e) {}
  }

  if (reqUser) {
    if (reqUser.role === 'admin' || order.user_id === reqUser.id) return { order, user: reqUser };
  }

  // 2. Check Token Auth (Query or Body)
  const providedToken = req.query.token || req.body.token;
  if (providedToken && order.edit_token === providedToken) return { order, tokenMatch: true };

  return { error: 'Ei oikeuksia', status: 403 };
}

// POST /api/orders - Create new order
router.post('/', async (req, res, next) => {
  const { name, organization, deliveryPoint, deliveryAt, items, eventId, specialRequirements, openComment } = req.body || {};

  if (!name || !organization || !deliveryPoint || !deliveryAt || !eventId) {
    return res.status(400).json({ error: 'Pakollisia kenttiä puuttuu' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Tilauksessa ei ole tuotteita' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const editToken = uuidv4();

    // 1. Validate Event
    const evRes = await client.query(`
      SELECT 
        end_date, 
        (end_date::date + interval '1 day' - interval '1 second') AS computed_return_at,
        (end_date < CURRENT_DATE) AS is_past
      FROM events 
      WHERE id = $1`, [eventId]);
    
    if (!evRes.rows.length) throw new Error('Tapahtumaa ei löydy');
    
    const event = evRes.rows[0];
    if (event.is_past) {
      throw new Error('Tapahtuma on jo päättynyt. Tilauksia ei voi enää tehdä.');
    }
    
    const returnAt = event.computed_return_at;

    // 2. Process Items (Simplifying for implementation)
    const requiredMap = new Map();
    for (const it of items) {
      const iid = parseInt(it.item_id, 10);
      const qty = parseInt(it.quantity, 10) || 0;
      if (iid && qty > 0) requiredMap.set(iid, (requiredMap.get(iid) || 0) + qty);
    }

    const affectedIds = Array.from(requiredMap.keys());
    const itemsRes = await client.query('SELECT id, name, sku, available_stock FROM items WHERE id = ANY($1::int[]) FOR UPDATE', [affectedIds]);
    const itemRows = new Map(itemsRes.rows.map(r => [r.id, r]));

    for (const [id, qty] of requiredMap.entries()) {
      const row = itemRows.get(id);
      if (!row || row.available_stock < qty) throw new Error(`Varasto ei riitä tuotteelle ${row ? row.name : id}`);
    }

    // 3. Insert Order
    const orderRes = await client.query(
      `INSERT INTO orders (event_id, customer_name, organization, delivery_point, delivery_start, return_at, status, special_requirements, open_comment, edit_token)
       VALUES ($1,$2,$3,$4,$5,$6,'placed',$7,$8,$9) RETURNING id`,
      [eventId, name.trim(), organization.trim(), deliveryPoint.trim(), deliveryAt, returnAt, specialRequirements, openComment, editToken]
    );
    const orderId = orderRes.rows[0].id;

    // 4. Insert Items & Audit
    for (const [id, qty] of requiredMap.entries()) {
      const row = itemRows.get(id);
      await client.query('INSERT INTO order_items (order_id, item_id, item_name, sku, quantity) VALUES ($1,$2,$3,$4,$5)', [orderId, id, row.name, row.sku, qty]);
      await client.query('UPDATE items SET available_stock = available_stock - $1 WHERE id=$2', [qty, id]);
      await client.query('INSERT INTO stock_audit (item_id, order_id, delta, reason, actor) VALUES ($1,$2,$3,$4,$5)', [id, orderId, -qty, 'Order created', name]);
    }

    await client.query('COMMIT');
    res.status(201).json({ orderId, editToken });

    // Send Slack Notification
    try {
      const itemSummary = Array.from(requiredMap.entries())
        .map(([id, qty]) => {
          const row = itemRows.get(id);
          return `- ${row ? row.name : id}: ${qty} kpl`;
        })
        .join('\n');

      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Uusi tilaus vastaanotettu! (#${orderId})*`
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Tilaaja:*\n${name}` },
            { type: 'mrkdwn', text: `*Organisaatio:*\n${organization}` },
            { type: 'mrkdwn', text: `*Toimituspiste:*\n${deliveryPoint}` },
            { type: 'mrkdwn', text: `*Toimitusaika:*\n${new Date(deliveryAt).toLocaleString('fi-FI')}` }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Tuotteet:*\n${itemSummary}`
          }
        }
      ];

      sendSlackNotification(`Uusi tilaus #${orderId} - ${name}`, blocks);
    } catch (slackErr) {
      logger.error({ err: slackErr.message }, 'Slack notification background task failed');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/orders/:id - Fetch order
router.get('/:id', async (req, res, next) => {
  try {
    const { order, error, status } = await verifyOrderAccess(req, req.params.id);
    if (error) return res.status(status).json({ error });

    const itemsRes = await db.query('SELECT oi.*, i.name, i.sku, i.image_url FROM order_items oi LEFT JOIN items i ON i.id = oi.item_id WHERE oi.order_id=$1', [order.id]);
    res.json({ order, items: itemsRes.rows });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id - Update order
router.patch('/:id', async (req, res, next) => {
  const client = await db.connect();
  try {
    const { order, error, status, user } = await verifyOrderAccess(req, req.params.id, client);
    if (error) return res.status(status).json({ error });

    await client.query('BEGIN');
    const { status: newStatus, open_comment } = req.body;
    const actor = user ? (user.email || user.id) : 'Token User';

    if (newStatus && newStatus !== order.status) {
      // Stock adjustment logic (Simplified)
      await client.query('UPDATE orders SET status=$1 WHERE id=$2', [newStatus, order.id]);
    }
    if (open_comment !== undefined) {
      await client.query('UPDATE orders SET open_comment=$1 WHERE id=$2', [open_comment, order.id]);
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/orders - List orders (Admin only, with pagination)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const r = await db.query(`
      SELECT o.*, e.name AS event_name 
      FROM orders o 
      LEFT JOIN events e ON o.event_id = e.id 
      ORDER BY e.start_date DESC, o.created_at DESC 
      LIMIT $1 OFFSET $2`, [limit, offset]);
    const total = await db.query('SELECT COUNT(*) FROM orders');
    res.json({ data: r.rows, total: parseInt(total.rows[0].count, 10), limit, offset });
  } catch (err) {
    next(err);
  }
});

// PDF Exports (Protected)
router.get('/all/pdf', requireAdmin, async (req, res, next) => {
  try {
    const ordersRes = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    doc.text('Kaikki tilaukset');
    ordersRes.rows.forEach(o => doc.text(`Tilaus #${o.id}: ${o.customer_name}`));
    doc.end();
  } catch (err) {
    next(err);
  }
});

router.get('/:id/pdf', async (req, res, next) => {
  try {
    const { order, error, status } = await verifyOrderAccess(req, req.params.id);
    if (error) return res.status(status).json({ error });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    doc.text(`Tilaus #${order.id}`);
    doc.text(`Tilaaja: ${order.customer_name}`);
    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
