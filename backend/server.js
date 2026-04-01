// server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const groupsRoutes = require('./routes/itemGroups');
const ordersRoutes = require('./routes/orders'); // uusi routes versio
const eventsRoutes = require('./routes/events');

const app = express();

// middleware
app.use(morgan('tiny'));
app.use(cors({ origin: true, credentials: true })); // typo korjattu
app.use(express.json());

// images
app.use('/images', express.static('public/images'));

// Ensure items table has thumbnail_url column (safe to run multiple times)
const db = require('./db');
(async () => {
    try {
        await db.query("ALTER TABLE items ADD COLUMN IF NOT EXISTS thumbnail_url TEXT");
                await db.query(`
                    CREATE TABLE IF NOT EXISTS item_images (
                        id SERIAL PRIMARY KEY,
                        item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
                        image_url TEXT NOT NULL,
                        thumbnail_url TEXT,
                        sort_order INT NOT NULL DEFAULT 0,
                        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT now()
                    )
                `);

                // Backfill the first image row for legacy items that only have image_url on items.
                await db.query(`
                    INSERT INTO item_images (item_id, image_url, thumbnail_url, sort_order, is_primary)
                    SELECT i.id, i.image_url, i.thumbnail_url, 0, TRUE
                    FROM items i
                    WHERE i.image_url IS NOT NULL
                        AND i.image_url <> ''
                        AND NOT EXISTS (
                            SELECT 1 FROM item_images im WHERE im.item_id = i.id
                        )
                `);
        console.log('Ensured thumbnail_url column exists on items');
    } catch (err) {
        console.error('Failed to ensure thumbnail_url column:', err);
    }
})();

// Startup checks for production readiness
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';
(async () => {
    try {
        if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET === 'replace-me')) {
            console.error('\nERROR: JWT_SECRET is not set or uses the insecure default.\nPlease set a strong JWT_SECRET in your environment before starting in production.\n');
            process.exit(1);
        }

        // warn if default admin user exists
        const r = await db.query("SELECT id,email,display_name,role FROM users WHERE email=$1 OR display_name=$1", ['Buildcat']);
        if (r.rows.length) {
            console.warn('WARNING: Default admin account (Buildcat) exists. Replace or remove this account before public release.');
        }
    } catch (err) {
        console.error('Startup checks failed:', err && err.message ? err.message : err);
        // don't exit; allow server to continue in dev environments
    }
})();

// healthcheck
app.get('/api/health', async (req, res) => {
    try {
        const r = await db.query('SELECT 1');
        res.json({ status: 'ok', db: r ? 'ok' : 'error' });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});


// routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/item-groups', groupsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/reports', require('./routes/reports'))

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
