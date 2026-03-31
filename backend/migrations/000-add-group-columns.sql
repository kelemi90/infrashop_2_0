-- 000-add-group-columns.sql
-- Add nullable group columns to order_items to support group/bundle order expansion
BEGIN;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS group_id INT;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS group_parent_id INT;

-- Add indexes to speed up reporting queries that will filter by group_id / group_parent_id
CREATE INDEX IF NOT EXISTS order_items_group_id_idx ON order_items (group_id);
CREATE INDEX IF NOT EXISTS order_items_group_parent_id_idx ON order_items (group_parent_id);

COMMIT;
