# Database Migrations Guide

This directory contains database schema and migration files. Migrations ensure your database structure stays synchronized with application code.

## Structure

```
migrations/
├── schema.sql                           # Initial database schema (all tables)
├── 000-add-group-columns.sql           # Migration #0
├── 001-add-item-auto-add-columns.sql   # Migration #1
├── 002-add-not-null-to-order-items-item-id.sql  # Migration #2
├── fix_arkkupakastin_image.sql         # Data fix
├── import_items.sql                    # Data import
├── normalize_image_urls.sql            # Data migration
└── guide.md                            # This file
```

## How Migrations Work

Migrations are applied **in order** by filename:
1. `schema.sql` - Run once when creating new database
2. `000-*.sql` - Applied in numerical order
3. `001-*.sql`, `002-*.sql`, etc.

The application tracks which migrations have been applied to avoid re-running them.

## Creating a New Migration

### 1. Create Migration File

Create a new file with the next number in sequence:

```
migrations/003-add-customer-phone.sql
```

### 2. Write Migration SQL

Use clear, idempotent SQL:

```sql
-- Add phone column to orders table
-- We use ADD COLUMN IF NOT EXISTS to be safe on re-runs

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);

-- For data changes, check if column exists first
UPDATE orders SET phone = '' WHERE phone IS NULL;
ALTER TABLE orders ALTER COLUMN phone SET NOT NULL;
```

### 3. Apply Migration

```bash
# From backend directory
npm run migrate:apply
```

This runs `backend/scripts/apply_schema.js` which:
1. Reads all `.sql` files in order
2. Tracks which migrations have been applied
3. Applies only new migrations (not yet applied)
4. Updates the migration log

## Applying Migrations Manually

If automatic application fails, apply migrations directly using `psql`:

### Via psql Command Line

```bash
# Connect to database and run migration
psql $DATABASE_URL < migrations/003-add-customer-phone.sql

# Or provide connection details explicitly
psql -h localhost -U infrashop_user -d infrashop_db < migrations/003-add-customer-phone.sql
```

### Verify Migration Applied

```bash
# List all migrations applied (if tracking table exists)
psql $DATABASE_URL -c "SELECT * FROM migration_log ORDER BY applied_at;"
```

## Rolling Back Migrations

**Note**: By default, migrations don't have rollback capabilities. Design carefully!

### Safe Rollback Strategy

1. **Create a rollback migration** (separate file):

```sql
-- migrations/004-rollback-customer-phone.sql
-- Reverses migration 003

ALTER TABLE orders DROP COLUMN IF EXISTS phone;
```

2. **For data fixes**, keep history:

```sql
-- migrations/005-fix-bad-phone-data.sql
-- First backup bad data
CREATE TABLE IF NOT EXISTS orders_phone_backup AS
  SELECT * FROM orders WHERE phone LIKE '555%';

-- Then fix
UPDATE orders SET phone = NULL WHERE phone LIKE '555%';
```

## Production Deployment

### Before Applying Migrations

1. **Test locally** with a copy of production data
2. **Backup database**:
   ```bash
   sudo -u postgres pg_dump infrashop_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Schedule maintenance window** if migration is long-running

4. **Notify users** if application will be read-only during migration

### Applying Migrations in Production

1. **Stop application**:
   ```bash
   sudo systemctl stop infrashop-backend
   ```

2. **Apply migrations**:
   ```bash
   # Via npm script (recommended)
   cd /srv/infrashop && npm run migrate:apply
   
   # Or manually via psql
   psql $DATABASE_URL < migrations/003-add-customer-phone.sql
   ```

3. **Verify success**:
   ```bash
   psql $DATABASE_URL -c "\d orders"  # Show table structure
   ```

4. **Start application**:
   ```bash
   sudo systemctl start infrashop-backend
   ```

5. **Check logs**:
   ```bash
   sudo journalctl -u infrashop-backend -n 50
   ```

## Migration Best Practices

### DO

✅ **Make migrations small and focused** - One logical change per file
```sql
-- GOOD: One change
ALTER TABLE orders ADD COLUMN phone TEXT;
```

✅ **Use IF NOT EXISTS / IF EXISTS** - Safe to re-run
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
DROP TABLE IF EXISTS old_data;
```

✅ **Document the purpose** - Add comments
```sql
-- Add phone column for delivery notifications (Issue #123)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
```

✅ **Test rollbacks** - Plan for failure
```sql
-- Can be reversed by DROP COLUMN IF EXISTS phone;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
```

✅ **Use transactions** - For data consistency
```sql
BEGIN;
  DELETE FROM orders WHERE status = 'invalid';
  UPDATE order_items SET quantity = 0 WHERE order_id IN (...);
COMMIT;
```

### DON'T

❌ **Make schema and data changes in one migration** - Separate them
```sql
-- BAD: Two concerns mixed
ALTER TABLE orders ADD COLUMN phone TEXT;
UPDATE orders SET phone = SUBSTRING(customer_name, 1, 10);
```

❌ **Assume column/index doesn't exist** - Always use IF NOT EXISTS
```sql
-- BAD: Will fail if already exists
ALTER TABLE orders ADD COLUMN phone TEXT;

-- GOOD
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
```

❌ **Make blocking changes during business hours** - Lock tables carefully
```sql
-- BAD: Locks entire orders table
ALTER TABLE orders ADD COLUMN phone TEXT;  -- this locks the table

-- GOOD: In Postgres 11+, most ALTERs don't lock
```

❌ **Run migrations manually without backup** - Always backup first
```bash
# BAD: running blind
psql $DATABASE_URL < migration.sql

# GOOD: backup first
pg_dump $DATABASE_URL > backup.sql
psql $DATABASE_URL < migration.sql
```

## Troubleshooting

### Migration Fails to Apply

**Error**: `relation "table_name" does not exist`

```bash
# Check if schema.sql was applied first
psql $DATABASE_URL -c "\dt"  # List all tables

# If no tables, apply schema first
psql $DATABASE_URL < migrations/schema.sql

# Then apply migrations
npm run migrate:apply
```

### Application Starts But Database Missing Columns

**Cause**: Migration wasn't applied

**Solution**:
```bash
# Check applied migrations
psql $DATABASE_URL -c "SELECT * FROM migration_log;"

# Apply missing migrations
npm run migrate:apply
```

### Need to Reset Database

```bash
# WARNING: This deletes all data!
# Drop all tables
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Recreate schema from scratch
psql $DATABASE_URL < migrations/schema.sql

# Apply all migrations
npm run migrate:apply
```

## Common Migration Examples

### Add Column with Default Value

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT now();
```

### Create Index for Performance

```sql
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
```

### Add Foreign Key Constraint

```sql
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_event
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
```

### Rename Column (Postgres 10+)

```sql
ALTER TABLE orders RENAME COLUMN old_name TO new_name;
```

### Change Column Type

```sql
-- First backup data if needed
ALTER TABLE orders ALTER COLUMN phone_number TYPE VARCHAR(20);
```

### Create Table

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

## Viewing Schema

### Current Schema

```bash
# List all tables
psql $DATABASE_URL -c "\dt"

# Show specific table structure
psql $DATABASE_URL -c "\d orders"

# Show table with indexes
psql $DATABASE_URL -c "\d+ orders"

# Show foreign keys
psql $DATABASE_URL -c "\d orders" | grep REFERENCES
```

### Applied Migrations

```bash
# View migration history (if tracking table exists)
psql $DATABASE_URL -c "SELECT * FROM migration_log ORDER BY id DESC LIMIT 10;"
```

## See Also

- `../guide.md` - Backend guide
- `../../README.md` - Project overview
