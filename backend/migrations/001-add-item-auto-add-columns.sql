-- Add per-item auto-add settings for companion item support
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS auto_add_item_id INT;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS auto_add_item_quantity INT NOT NULL DEFAULT 1;
