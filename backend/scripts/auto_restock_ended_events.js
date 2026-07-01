#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

typeof process.env.DATABASE_URL === 'undefined' && dotenv.config();

const db = require('../db');
const eventsRoutes = require('../routes/events');

async function main() {
  try {
    const eventsRes = await db.query(
      `SELECT id, name, end_date
       FROM events
       WHERE end_date IS NOT NULL
         AND end_date <= now()
       ORDER BY end_date ASC`
    );

    if (!eventsRes.rows.length) {
      console.log('No ended events to restock.');
      process.exit(0);
    }

    let processed = 0;
    let totalReturned = 0;

    for (const event of eventsRes.rows) {
      processed += 1;
      console.log(`Processing event ${event.id} (${event.name}), ended ${event.end_date}`);
      try {
        const result = await eventsRoutes.restockEvent(event.id, 'auto-restock');
        if (result.returned > 0) {
          console.log(`  Restocked ${result.returned} item lines for event ${event.id}`);
          totalReturned += result.returned;
        } else {
          console.log(`  No placed/fulfilled orders found for event ${event.id}`);
        }
      } catch (err) {
        console.error(`  Failed to restock event ${event.id}:`, err && err.message ? err.message : err);
      }
    }

    console.log(`Completed auto-restock for ${processed} ended event(s). Total restocked order lines: ${totalReturned}.`);
    process.exit(0);
  } catch (err) {
    console.error('Error running auto-restock for ended events:', err && err.message ? err.message : err);
    process.exit(1);
  } finally {
    if (typeof db.end === 'function') {
      await db.end();
    }
  }
}

main();
