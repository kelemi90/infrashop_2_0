// server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const groupsRoutes = require('./routes/itemGroups');
const ordersRoutes = require('./routes/orders');
const eventsRoutes = require('./routes/events');

const app = express();
app.use(morgan('tiny'));
app.use(cors({ origin: true, credemtials: true }));
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/item-groups', groupsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/events', eventsRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Backend listening on port ${port}');
});