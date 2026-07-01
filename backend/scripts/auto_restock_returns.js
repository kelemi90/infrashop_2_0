#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const yargs = require('yargs/yargs');

const argv = yargs(process.argv.slice(2)).option('event', { type: 'number', demandOption: true }).argv;
const eventId = argv.event;

const EXPORT_DIR = path.join(__dirname, '..', 'exports');
async function ensureExportDir() {
  try {
    await fs.promises.mkdir(EXPORT_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Please set DATABASE_URL in the environment.');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('BEGIN');

    // Fetch archived items for the event
    const archivedRes = await client.query(
      `SELECT ao.id AS archived_order_id, ao.original_order_id, aoi.item_id, aoi.quantity
       FROM archived_order_items aoi
       JOIN archived_orders ao ON aoi.archived_order_id = ao.id
       JOIN orders o ON ao.original_order_id = o.id
       WHERE o.event_id = $1
       ORDER BY ao.id, aoi.item_id`,
      [eventId]
    );

    const restockedByItem = new Map();

    for (const r of archivedRes.rows) {
      const qty = Number(r.quantity || 0);
      if (qty <= 0) continue; // ignore non-positive archived quantities

      const reason = `auto-restock event ${eventId} archived_order ${r.archived_order_id}`;

      // Idempotency: check if we've already restocked this archived_order/item
      const existsRes = await client.query(
        `SELECT 1 FROM stock_audit WHERE order_id = $1 AND item_id = $2 AND reason = $3 LIMIT 1`,
        [r.original_order_id, r.item_id, reason]
      );
      if (existsRes.rowCount > 0) continue;

      // Apply restock to items
      await client.query(
        `UPDATE items SET available_stock = COALESCE(available_stock,0) + $1, total_stock = COALESCE(total_stock,0) + $1, updated_at = now() WHERE id = $2`,
        [qty, r.item_id]
      );

      // Insert stock audit row
      await client.query(
        `INSERT INTO stock_audit (item_id, order_id, delta, reason, actor, created_at) VALUES ($1, $2, $3, $4, $5, now())`,
        [r.item_id, r.original_order_id, qty, reason, 'system']
      );

      restockedByItem.set(r.item_id, (restockedByItem.get(r.item_id) || 0) + qty);
    }

    await client.query('COMMIT');

    // Build CSV report: ordered, archived, restocked_by_script
    await ensureExportDir();

    const reportRows = [];

    const orderedRes = await client.query(
      `SELECT oi.item_id, i.name, SUM(oi.quantity) AS ordered_qty FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN items i ON oi.item_id = i.id WHERE o.event_id = $1 GROUP BY oi.item_id, i.name`,
      [eventId]
    );

    const archivedSumRes = await client.query(
      `SELECT aoi.item_id, SUM(aoi.quantity) AS archived_qty FROM archived_order_items aoi JOIN archived_orders ao ON aoi.archived_order_id = ao.id JOIN orders o ON ao.original_order_id = o.id WHERE o.event_id = $1 GROUP BY aoi.item_id`,
      [eventId]
    );

    const archivedMap = new Map(archivedSumRes.rows.map(r => [Number(r.item_id), Number(r.archived_qty || 0)]));

    // restocked amounts by this script (reason starts with auto-restock event X)
    const restockedRes = await client.query(
      `SELECT item_id, SUM(delta) AS restocked_qty FROM stock_audit WHERE reason LIKE $1 GROUP BY item_id`,
      [`auto-restock event ${eventId}%`]
    );
    const restockedMap = new Map(restockedRes.rows.map(r => [Number(r.item_id), Number(r.restocked_qty || 0)]));

    for (const r of orderedRes.rows) {
      const itemId = Number(r.item_id);
      const ordered = Number(r.ordered_qty || 0);
      const archived = archivedMap.get(itemId) || 0;
      const restocked = restockedMap.get(itemId) || 0;
      const missing_after = ordered - (archived + restocked);
      reportRows.push({ item_id: itemId, name: r.name, ordered, archived, restocked, missing_after });
    }

    const csvPath = path.join(EXPORT_DIR, `event-${eventId}-restock-report.csv`);
    const header = 'item_id,name,ordered_qty,archived_qty,restocked_by_script,missing_after_restock\n';
    const csvLines = reportRows.map(r => `${r.item_id},"${(r.name || '').replace(/"/g,'""')}",${r.ordered},${r.archived},${r.restocked},${r.missing_after}`).join('\n');
    await fs.promises.writeFile(csvPath, header + csvLines, 'utf8');

    console.log('Auto-restock completed for event', eventId);
    console.log('Report written to', csvPath);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error during auto-restock:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
