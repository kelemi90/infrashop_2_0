const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

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
// - toimii kirjautuneille ja vieraille
// =======================
router.post('/', async (req, res) => {
  const {
    name,
    organization,
    deliveryPoint,
    returnAt,
    items
  } = req.body;

  if (!name || !deliveryPoint || !returnAt) {
    return res.status(400).json({ error: 'Puuttuvia tilaajatietoja' });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Ostoskori on tyhjä' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Luo tilaus ilman emailia
    const orderRes = await client.query(
      `
      INSERT INTO orders (
        customer_name,
        organization,
        delivery_point,
        delivery_start,
        return_at,
        status
      )
      VALUES ($1,$2,$3,now(),$4,'placed')
      RETURNING id
      `,
      [name, organization, deliveryPoint, returnAt]
    );

    const orderId = orderRes.rows[0].id;

    // Lisää tuotteet + lukitse varasto
    for (const it of items) {
      const stockRes = await client.query(
        'SELECT name, sku, available_stock FROM items WHERE id=$1 FOR UPDATE',
        [it.item_id]
      );

      if (!stockRes.rows.length) throw new Error(`Tuotetta ei löydy (${it.item_id})`);
      const item = stockRes.rows[0];

      if (item.available_stock < it.quantity) {
        throw new Error(`Varasto ei riitä tuotteelle ${item.name}`);
      }

      // vähennä saldo
      await client.query(
        'UPDATE items SET available_stock = available_stock - $1 WHERE id=$2',
        [it.quantity, it.item_id]
      );

      // snapshot order_items
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          item_id,
          item_name,
          sku,
          quantity
        )
        VALUES ($1,$2,$3,$4,$5)
        `,
        [orderId, it.item_id, item.name, item.sku, it.quantity]
      );

      // audit
      await client.query(
        `
        INSERT INTO stock_audit (item_id, order_id, delta, reason, actor)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [it.item_id, orderId, -it.quantity, `Order ${orderId}`, name]
      );
    }

    await client.query('COMMIT');
    res.json({ orderId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
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

// =======================
// GET /api/orders/:id
// - vaatii authin
// =======================
router.get('/:id', auth, async (req, res) => {
  const id = req.params.id;

  const orderRes = await db.query('SELECT * FROM orders WHERE id=$1', [id]);
  if (!orderRes.rows.length) return res.status(404).json({ error: 'Tilausta ei löydy' });

  const order = orderRes.rows[0];
  if (order.user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Ei oikeuksia' });

  const itemsRes = await db.query(
    `SELECT oi.*, i.name, i.sku, i.image_url, i.short_description
     FROM order_items oi
     JOIN items i ON i.id = oi.item_id
     WHERE oi.order_id=$1`,
    [id]
  );

  res.json({ order, items: itemsRes.rows });
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
