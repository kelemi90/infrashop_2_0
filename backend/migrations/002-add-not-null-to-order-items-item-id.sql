-- Add NOT NULL constraint to order_items.item_id
-- This prevents null item_ids which cause validation errors when editing orders

-- First, delete any problematic rows with null item_id (if any exist)
DELETE FROM order_items WHERE item_id IS NULL;

-- Then add the NOT NULL constraint
ALTER TABLE order_items
  ALTER COLUMN item_id SET NOT NULL;
