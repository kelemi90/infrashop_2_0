const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

const POWER_ITEMS = new Set([
  'sahkot 1x16a 230v 3000w',
  'sahkot 230v',
  'sahkot 3x16a 400v 9000w',
  'sahkot 3x32a 400v 15000w',
  'sahkot muu'
]);

const NETWORK_ITEMS = new Set([
  'verkko-10g lr',
  'verkko-10g sr',
  'verkko-1g base-t'
]);

const LIGHTING_ITEMS = new Set([
  'valaistus',
  'rgb wash pixel ohjattu'
]);

function normalizeItemName(value) {
  if (!value) return '';
  try {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  } catch (e) {
    return String(value).toLowerCase().trim();
  }
}

function requiredRequirementKeysFromItems(itemNames) {
  const keys = new Set();
  for (const n of itemNames) {
    const nn = normalizeItemName(n);
    if (POWER_ITEMS.has(nn)) keys.add('power');
    if (NETWORK_ITEMS.has(nn)) keys.add('network');
    if (LIGHTING_ITEMS.has(nn)) keys.add('lighting');
  }
  return Array.from(keys);
}

function sanitizeSpecialRequirements(input) {
  const src = (input && typeof input === 'object') ? input : {};
  const out = {};

  if (typeof src.power === 'string' && src.power.trim()) out.power = src.power.trim();
  if (typeof src.network === 'string' && src.network.trim()) out.network = src.network.trim();
  if (typeof src.lighting === 'string' && src.lighting.trim()) out.lighting = src.lighting.trim();

  return out;
}

// Keep schema backward-compatible on existing databases.
(async () => {
  try {
    await db.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_requirements JSONB');
  } catch (err) {
    console.error('Failed to ensure orders.special_requirements:', err);
  }
})();

// =======================
// Auth middleware (vain ryhmien lisäykseen / tilauksen hakuun)
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No auth' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// =======================
// POST /api/orders
// - luo uusi tilaus ilman authia
// - event_id on pakollinen, jotta tilaus voidaan arkistoida tapahtumaan
// =======================
router.post('/', async (req, res) => {
  const { name, organization, deliveryPoint, returnAt, items, eventId, specialRequirements } = req.body || {};

  if (!name || !organization || !deliveryPoint || !returnAt) {
    return res.status(400).json({ error: 'Pakollisia kenttiä puuttuu' });
  }
  if (!eventId) {
    return res.status(400).json({ error: 'Tapahtuma on pakollinen' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Tilauksessa ei ole tuotteita' });
  }

  const parsedEventId = parseInt(eventId, 10);
  if (!parsedEventId) {
    return res.status(400).json({ error: 'Virheellinen tapahtuma' });
  }

  const normalizedItems = items.map((it) => ({
    item_id: parseInt(it.item_id, 10),
    quantity: parseInt(it.quantity, 10)
  })).filter((it) => it.item_id && it.quantity > 0);

  if (!normalizedItems.length) {
    return res.status(400).json({ error: 'Tilauksessa ei ole tuotteita' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const evRes = await client.query('SELECT id FROM events WHERE id = $1', [parsedEventId]);
    if (!evRes.rows.length) {
      throw new Error('Valittua tapahtumaa ei löytynyt');
    }

    const itemIds = Array.from(new Set(normalizedItems.map((it) => it.item_id)));
    const itemsRes = await client.query(
      'SELECT id, name, sku, available_stock FROM items WHERE id = ANY($1::int[]) FOR UPDATE',
      [itemIds]
    );
    const rowsById = new Map(itemsRes.rows.map((r) => [r.id, r]));

    for (const it of normalizedItems) {
      const row = rowsById.get(it.item_id);
      if (!row) throw new Error(`Tuotetta ei löydy (${it.item_id})`);
      if (row.available_stock < it.quantity) {
        throw new Error(`Varasto ei riitä tuotteelle ${row.name}`);
      }
    }

    const selectedItemNames = normalizedItems
      .map((it) => {
        const row = rowsById.get(it.item_id);
        return row ? row.name : null;
      })
      .filter(Boolean);

    const requiredKeys = requiredRequirementKeysFromItems(selectedItemNames);
    const cleanRequirements = sanitizeSpecialRequirements(specialRequirements);

    for (const key of requiredKeys) {
      if (!cleanRequirements[key]) {
        if (key === 'power') throw new Error('Lisatieto pakollinen: Mita laitteita tulet laittamaan tahan?');
        if (key === 'network') throw new Error('Lisatieto pakollinen: Kuinka monta konetta ja tarvitsetko wifia?');
        if (key === 'lighting') throw new Error('Lisatieto pakollinen: Kuinka paljon valoa tarvitset ja minka varista?');
      }
    }

    const requirementsValue = Object.keys(cleanRequirements).length ? cleanRequirements : null;

    const orderRes = await client.query(
      `INSERT INTO orders (
        event_id,
        customer_name,
        organization,
        delivery_point,
        delivery_start,
        return_at,
        status,
        special_requirements
      ) VALUES ($1,$2,$3,$4,now(),$5,'placed',$6) RETURNING id`,
      [parsedEventId, String(name).trim(), String(organization).trim(), String(deliveryPoint).trim(), returnAt, requirementsValue]
    );

    const orderId = orderRes.rows[0].id;
    for (const it of normalizedItems) {
      const row = rowsById.get(it.item_id);
      await client.query(
        `INSERT INTO order_items (order_id, item_id, item_name, sku, quantity)
         VALUES ($1,$2,$3,$4,$5)`,
        [orderId, it.item_id, row.name, row.sku, it.quantity]
      );
      await client.query(
        'UPDATE items SET available_stock = available_stock - $1, updated_at = now() WHERE id=$2',
        [it.quantity, it.item_id]
      );
      await client.query(
        'INSERT INTO stock_audit (item_id, order_id, delta, reason, actor) VALUES ($1,$2,$3,$4,$5)',
        [it.item_id, orderId, -it.quantity, `Order ${orderId} created`, String(name).trim()]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order create error:', err);
    res.status(400).json({ error: err.message || 'Tilauksen luonti epäonnistui' });
  } finally {
    client.release();
  }
});

// =======================
// GET /api/orders/:id
// - Return order details. Owner or admin via JWT can fetch.
// - Additionally, an unauthenticated caller may supply ?customer_name=... which will be
//   compared (case/diacritic-insensitively) against the stored order.customer_name to allow read access.
router.get('/:id', async (req, res) => {
  const id = req.params.id;

  const orderRes = await db.query('SELECT * FROM orders WHERE id=$1', [id]);
  if (!orderRes.rows.length) return res.status(404).json({ error: 'Tilausta ei löydy' });

  const order = orderRes.rows[0];

  // try to verify token if present
  let reqUser = null;
  const authHeader = req.headers && req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      reqUser = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      reqUser = null;
    }
  }

  // if authenticated, check owner/admin
  if (reqUser) {
    if (order.user_id !== reqUser.id && reqUser.role !== 'admin')
      return res.status(403).json({ error: 'Ei oikeuksia' });
  } else {
    // unauthenticated: allow if caller provided matching customer_name via query param
    const provided = req.query.customer_name || '';
    function normalizeForCompare(s) {
      if (!s) return '';
      try {
        const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return n.toLowerCase().replace(/\s+/g, ' ').trim();
      } catch (e) {
        return s.toLowerCase().replace(/\s+/g, ' ').trim();
      }
    }
    const providedNorm = normalizeForCompare(provided || '');
    const storedNorm = normalizeForCompare(order.customer_name || '');
    if (!(providedNorm && storedNorm && providedNorm === storedNorm)) {
      return res.status(403).json({ error: 'Ei oikeuksia' });
    }
  }

  const itemsRes = await db.query(
    `SELECT oi.*, i.name, i.sku, i.image_url, i.short_description
     FROM order_items oi
     JOIN items i ON i.id = oi.item_id
     WHERE oi.order_id=$1`,
    [id]
  );

  res.json({ order, items: itemsRes.rows });
});

// =======================
// POST /api/orders/:orderId/add-group/:groupId
// - vaatii authin
// =======================
router.post('/:orderId/add-group/:groupId', auth, async (req, res) => {
  const { orderId, groupId } = req.params;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const o = await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [orderId]);
    if (!o.rows.length) throw new Error('Tilausta ei löydy');
    const order = o.rows[0];

    if (order.user_id !== req.user.id && req.user.role !== 'admin')
      throw new Error('Ei oikeuksia');

    const itemsRes = await client.query(
      `SELECT igi.quantity, i.id AS item_id, i.available_stock 
       FROM item_group_items igi
       JOIN items i ON igi.item_id = i.id
       WHERE igi.group_id = $1 FOR UPDATE`,
      [groupId]
    );

    for (const row of itemsRes.rows) {
      if (row.available_stock < row.quantity)
        throw new Error(`Varastossa ei tarpeeksi: ${row.item_id}`);
    }

    for (const row of itemsRes.rows) {
      await client.query(
        'UPDATE items SET available_stock = available_stock - $1 WHERE id=$2',
        [row.quantity, row.item_id]
      );
      await client.query(
        'INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1,$2,$3)',
        [orderId, row.item_id, row.quantity]
      );
      await client.query(
        'INSERT INTO stock_audit (item_id, order_id, delta, reason, actor) VALUES ($1,$2,$3,$4,$5)',
        [row.item_id, orderId, -row.quantity, `Group ${groupId} added to order ${orderId}`, req.user.id]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// (GET /api/orders/:id now implemented above with optional unauthenticated name-based access)

// =======================
// PATCH /api/orders/:id
// - muokkaa tilausta (sis. tilauksen rivejä).
// - Owner or admin (via JWT) can edit.
// - If unauthenticated, caller may provide `customer_name` that exactly matches the
//   stored order.customer_name to authorize the edit (convenience for email-less flow).
// =======================
router.patch('/:id', async (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  const {
    customer_name,
    organization,
    delivery_point,
    delivery_start,
    return_at,
    status,
    items
  } = req.body;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const oRes = await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [orderId]);
    if (!oRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tilausta ei löydy' });
    }

    const order = oRes.rows[0];

    // Determine caller identity: if Authorization header with JWT present, verify it.
    // If token missing/invalid, reqUser stays null and we will allow an unauthenticated
    // edit only when the caller provided customer_name matching the stored order name.
    let reqUser = null;
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        reqUser = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        // invalid token -> treat as unauthenticated (do not fail here; we'll check name)
        reqUser = null;
      }
    }

    // permission: owner or admin OR unauthenticated request that provides matching customer_name
    // Compare names in a case-insensitive and diacritic-insensitive way to be forgiving of
    // user input (e.g. "Kimmo" === "kimmo" and "Åke" === "Ake").
    function normalizeForCompare(s) {
      if (!s) return '';
      // Normalize to NFD, strip combining diacritic marks, lowercase, collapse spaces
      try {
        const n = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return n.toLowerCase().replace(/\s+/g, ' ').trim();
      } catch (e) {
        // Fallback if normalize fails for any reason
        return s.toLowerCase().replace(/\s+/g, ' ').trim();
      }
    }

    const providedNameRaw = customer_name || '';
    const storedNameRaw = order.customer_name || '';
    const providedNorm = normalizeForCompare(providedNameRaw);
    const storedNorm = normalizeForCompare(storedNameRaw);
    const isOwnerOrAdmin = reqUser && (order.user_id === reqUser.id || reqUser.role === 'admin');
    const nameMatches = !reqUser && providedNorm && storedNorm && providedNorm === storedNorm;

    if (!isOwnerOrAdmin && !nameMatches) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Ei oikeuksia; kirjaudu sisään tai toimita tilaajan nimi täsmälleen kuten tilauksessa' });
    }

    // If items are provided, update order items and adjust stock
    if (Array.isArray(items)) {
      // load existing order_items
      const oldRes = await client.query('SELECT item_id, quantity FROM order_items WHERE order_id=$1', [orderId]);
      const oldMap = new Map();
      for (const r of oldRes.rows) oldMap.set(r.item_id, r.quantity);

      // build new map and validate quantities
      const newMap = new Map();
      const newIds = [];
      for (const it of items) {
        const iid = parseInt(it.item_id, 10);
        const qty = parseInt(it.quantity, 10) || 0;
        if (!iid || qty < 0) {
          throw new Error('Virheellinen item_id tai quantity');
        }
        newMap.set(iid, qty);
        if (!newIds.includes(iid)) newIds.push(iid);
      }

      // affected ids = union of old and new
      const affected = Array.from(new Set([...oldMap.keys(), ...newMap.keys()]));

      if (affected.length) {
        // lock affected items
        const itemsRes = await client.query('SELECT id, name, sku, available_stock FROM items WHERE id = ANY($1::int[]) FOR UPDATE', [affected]);
        const itemRows = new Map(itemsRes.rows.map(r => [r.id, r]));

        // validate availability
        for (const id of affected) {
          const oldQty = oldMap.get(id) || 0;
          const newQty = newMap.get(id) || 0;
          const change = newQty - oldQty;
          const row = itemRows.get(id);
          if (!row) throw new Error(`Tuotetta ei löydy (${id})`);
          if (change > 0 && row.available_stock < change) {
            throw new Error(`Varasto ei riitä tuotteelle ${row.name}`);
          }
        }

        // apply stock changes and audits
        // Actor: prefer authenticated user id/email, otherwise use provided customer_name so audits are meaningful
        const actor = reqUser ? (reqUser.id || reqUser.email) : (providedName || null);
        for (const id of affected) {
          const oldQty = oldMap.get(id) || 0;
          const newQty = newMap.get(id) || 0;
          const change = newQty - oldQty;
          if (change === 0) continue;
          // subtract change from available_stock (change may be negative)
          await client.query('UPDATE items SET available_stock = available_stock - $1 WHERE id=$2', [change, id]);
          // insert audit: store negative when reserving (consistent with create path)
          await client.query('INSERT INTO stock_audit (item_id, order_id, delta, reason, actor) VALUES ($1,$2,$3,$4,$5)', [id, orderId, -change, `Order ${orderId} update`, actor]);
        }

        // replace order_items snapshot
        await client.query('DELETE FROM order_items WHERE order_id=$1', [orderId]);
        for (const [iid, qty] of newMap.entries()) {
          const itemRow = itemRows.get(iid);
          await client.query(
            `INSERT INTO order_items (order_id, item_id, item_name, sku, quantity) VALUES ($1,$2,$3,$4,$5)`,
            [orderId, iid, itemRow ? itemRow.name : null, itemRow ? itemRow.sku : null, qty]
          );
        }
      }
    }

    // update order meta fields if provided
    const fields = [];
    const values = [];
    let idx = 1;
    if (customer_name !== undefined) { fields.push(`customer_name=$${idx++}`); values.push(customer_name); }
    if (organization !== undefined) { fields.push(`organization=$${idx++}`); values.push(organization); }
    if (delivery_point !== undefined) { fields.push(`delivery_point=$${idx++}`); values.push(delivery_point); }
    if (delivery_start !== undefined) { fields.push(`delivery_start=$${idx++}`); values.push(delivery_start); }
    if (return_at !== undefined) { fields.push(`return_at=$${idx++}`); values.push(return_at); }
    if (status !== undefined) { fields.push(`status=$${idx++}`); values.push(status); }

    if (fields.length) {
      values.push(orderId);
      const q = `UPDATE orders SET ${fields.join(',')}, updated_at=now() WHERE id=$${idx}`;
      await client.query(q, values);
    }

    await client.query('COMMIT');

    // return updated order + items
    const orderRes2 = await db.query('SELECT * FROM orders WHERE id=$1', [orderId]);
    const itemsRes2 = await db.query('SELECT oi.*, i.name, i.sku, i.image_url FROM order_items oi LEFT JOIN items i ON i.id = oi.item_id WHERE oi.order_id=$1', [orderId]);

    res.json({ order: orderRes2.rows[0], items: itemsRes2.rows });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order update error:', err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/orders
// Palauttaa kaikki tilaukset (admin)
router.get('/', async (req, res) => {
  try {
    const ordersRes = await db.query(`
      SELECT
        o.id,
        o.customer_name,
        o.organization,
        o.delivery_point,
        o.delivery_start,
        o.return_at,
        o.status,
        o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
    `);

    res.json(ordersRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Tilauksien haku epäonnistui' });
  }
});

const PDFDocument = require('pdfkit');

// GET /api/orders/:id/pdf
  router.get('/:id/pdf', async (req, res) => {
    const orderId = req.params.id;

    try {
      const orderRes = await db.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (!orderRes.rows.length) {
        return res.status(404).json({ error: 'Tilausta ei löydy' });
      }

      const itemsRes = await db.query(
        'SELECT quantity, item_name, sku FROM order_items WHERE order_id = $1',
        [orderId]
      );

      const order = orderRes.rows[0];
      const items = itemsRes.rows;

      console.log('PDF ORDER:', order);
      console.log('PDF ITEMS:', items);

      const doc = new PDFDocument();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=order_${orderId}.pdf`
      );

      doc.pipe(res);

      doc.fontSize(20).text('Tilaus', { underline: true });
      doc.moveDown();

      doc.fontSize(12);
      doc.text(`Tilausnumero: ${order.id}`);
      doc.text(`Tilaaja: ${order.customer_name}`);
      doc.text(`Organisaatio: ${order.organization || '-'}`);
      doc.text(`Toimituspiste: ${order.delivery_point}`);

      const returnDate = order.return_at
        ? new Date(order.return_at).toISOString().slice(0,10)
        : '-';

      doc.text(`Palautuspäivä: ${returnDate}`);
      doc.text(`Status: ${order.status}`);
      doc.moveDown();

      doc.fontSize(14).text('Tuotteet');
      doc.moveDown(0.5);

      items.forEach(it => {
        doc.text(
          `${it.quantity} x ${it.item_name || 'Tuntematon'} (${it.sku || '-'})`
        );
      });

      doc.end();

    } catch (err) {
      console.error('PDF ERROR:', err);
      res.status(500).json({ error: 'PDF:n luonti epäonnistui' });
    }
  });



module.exports = router;
