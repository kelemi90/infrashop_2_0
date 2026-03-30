# Order Reset Instructions

This guide explains how to clear all orders, return reserved stock back to available inventory, and remove archive records.

## What This Does

1. Returns stock from active orders (`placed`, `fulfilled`) back to `items.available_stock`.
2. Deletes all current orders and order lines.
3. Deletes all archive records.

This process keeps items and events intact.

## 1. Take a Backup First

```bash
cd /srv/infrashop
set -a; source .env; set +a
pg_dump "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" > before_order_reset.sql
```

## 2. Run Full Reset SQL

```bash
cd /srv/infrashop
set -a; source .env; set +a
psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" <<'SQL'
BEGIN;

-- Return reserved stock from active orders only
WITH to_return AS (
  SELECT oi.item_id, SUM(oi.quantity)::int AS qty
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('placed', 'fulfilled')
  GROUP BY oi.item_id
)
UPDATE items i
SET available_stock = i.available_stock + tr.qty,
    updated_at = now()
FROM to_return tr
WHERE i.id = tr.item_id;

-- Optional audit entries for traceability
INSERT INTO stock_audit (item_id, delta, reason, actor)
SELECT tr.item_id, tr.qty, 'Full order reset: return stock', 'admin-reset'
FROM (
  SELECT oi.item_id, SUM(oi.quantity)::int AS qty
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('placed', 'fulfilled')
  GROUP BY oi.item_id
) tr;

-- Remove all active order records
TRUNCATE TABLE order_items, orders RESTART IDENTITY CASCADE;

-- Remove all archive records
TRUNCATE TABLE archived_order_items, archived_orders RESTART IDENTITY CASCADE;

COMMIT;
SQL
```

## 3. Verify Result

```bash
psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" -c "SELECT COUNT(*) AS orders_left FROM orders;"
psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" -c "SELECT COUNT(*) AS archived_orders_left FROM archived_orders;"
```

## Optional: Also Clear Stock Audit

If you want a fully clean order history including audit lines, run:

```sql
TRUNCATE TABLE stock_audit RESTART IDENTITY;
```
