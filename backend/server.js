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
        console.log('Ensured thumbnail_url column exists on items');
    } catch (err) {
        console.error('Failed to ensure thumbnail_url column:', err);
    }
})();


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
