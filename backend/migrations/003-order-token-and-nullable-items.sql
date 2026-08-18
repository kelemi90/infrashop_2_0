-- Add edit_token to orders for secure unauthenticated access
ALTER TABLE orders ADD COLUMN IF NOT EXISTS edit_token UUID DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS idx_orders_edit_token ON orders(edit_token);

-- Revert NOT NULL on order_items.item_id to allow deleting items while keeping history
ALTER TABLE order_items ALTER COLUMN item_id DROP NOT NULL;

-- Ensure stock_audit.item_id is also nullable (it usually is, but for safety)
ALTER TABLE stock_audit ALTER COLUMN item_id DROP NOT NULL;
