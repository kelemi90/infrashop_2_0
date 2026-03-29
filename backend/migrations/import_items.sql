-- Import items from CSV into a staging table, normalize image_url and
-- insert into the real `items` table. This ensures we only store the
-- filename (e.g. "arkkupakastin.jpg") instead of prefixes like
-- "public/images/arkkupakastin.jpg".

DROP TABLE IF EXISTS import_items_stage;

CREATE TEMP TABLE import_items_stage (
  name TEXT,
  total_stock INT,
  category TEXT,
  sku TEXT,
  short_description TEXT,
  long_description TEXT,
  image_url TEXT,
  available_stock INT
);

COPY import_items_stage
FROM '/varasto.csv'
DELIMITER ','
CSV HEADER
NULL AS '';

-- Normalize image_url: remove leading /, optional `public/`, and `images/` prefix
-- then treat empty strings as NULL. Insert into items table.
INSERT INTO items (name, total_stock, category, sku, short_description, long_description, image_url, available_stock)
SELECT
  name,
  COALESCE(total_stock,0),
  category,
  sku,
  short_description,
  long_description,
  NULLIF(regexp_replace(trim(image_url), '^[/\\]?(public[/\\])?images[/\\]', '', 'i'), ''),
  COALESCE(available_stock,0)
FROM import_items_stage;

-- cleanup temp table (optional; temp table will be dropped at session end)
DROP TABLE IF EXISTS import_items_stage;
