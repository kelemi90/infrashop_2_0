// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const groupsRoutes = require('./routes/itemGroups');
const ordersRoutes = require('./routes/orders');
const eventsRoutes = require('./routes/events');
const reportsRoutes = require('./routes/reports');

const app = express();

// Security Headers (Helmet)
app.use(helmet());

// Logging Middleware (Pino)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// CORS
const allowedOrigin = process.env.ALLOWED_ORIGIN || true;
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use(express.json());

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Images
app.use('/images', express.static('public/images'));

// Startup checks
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production') {
  if (!JWT_SECRET || JWT_SECRET === 'replace-me') {
    logger.error('CRITICAL: JWT_SECRET is not set or insecure in production. Exiting.');
    process.exit(1);
  }
}

// healthcheck
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./db');
    const r = await db.query('SELECT 1');
    res.json({ status: 'ok', db: r ? 'ok' : 'error' });
  } catch (err) {
    logger.error({ err }, 'Healthcheck failed');
    res.status(500).json({ status: 'error', error: 'Database unreachable' });
  }
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/item-groups', groupsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/reports', reportsRoutes);

// Centralised Error Handler
app.use((err, req, res, next) => {
  logger.error({ err, url: req.url }, 'Unhandled error');
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
  
  res.status(status).json({ error: message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Backend listening on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
});
