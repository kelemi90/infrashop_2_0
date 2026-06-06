-- Add varasto (warehouse) and rama_id columns to items
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS varasto TEXT;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS rama_id TEXT;
