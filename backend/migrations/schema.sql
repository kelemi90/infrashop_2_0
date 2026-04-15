-- schema.sql
-- InfraShop: koko tietokannan rakenne ja minimidata
-- Suorita kerran luodaksesi skeeman ja testidatan.

-- ------------------------------
-- Laajennukset
-- ------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------
-- items: myytävät tuotteet
-- ------------------------------
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  total_stock INT DEFAULT 0,
  available_stock INT DEFAULT 0,
  auto_add_item_id INT,
  auto_add_item_quantity INT NOT NULL DEFAULT 1,
  category TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS auto_add_item_id INT;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS auto_add_item_quantity INT NOT NULL DEFAULT 1;

-- ------------------------------
-- item_images: tuotteen kuvagalleria
-- ------------------------------
CREATE TABLE IF NOT EXISTS item_images (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);


-- ------------------------------
-- users: järjestelmän käyttäjät (asiakkaat/admin)
-- ------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT now()
);

-- ------------------------------
-- events: tapahtumat
-- ------------------------------
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- ------------------------------
-- orders: asiakkaan tilaukset
-- ------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,

  event_id INT REFERENCES events(id),

  customer_name TEXT NOT NULL,
  organization TEXT,
  delivery_point TEXT NOT NULL,

  delivery_start TIMESTAMP NOT NULL,
  return_at TIMESTAMP NOT NULL,

  status TEXT NOT NULL DEFAULT 'placed', -- placed | delivered | returned | archived

  special_requirements JSONB,
  open_comment TEXT,

  pdf_path TEXT, -- polku PDF-tiedostoon

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Ensure event_id exists on already-created orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS event_id INT REFERENCES events(id);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS special_requirements JSONB;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS open_comment TEXT;

-- ------------------------------
-- order_items: tilauksen sisältämät tuotteet
-- ------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  item_id INT NOT NULL REFERENCES items(id),

  item_name TEXT NOT NULL, -- snapshot!
  sku TEXT,
  quantity INT NOT NULL,

  created_at TIMESTAMP DEFAULT now()
);

-- ------------------------------
-- item_groups: valmiit tuotegrupit
-- ------------------------------
CREATE TABLE IF NOT EXISTS item_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- ------------------------------
-- item_group_items: item_groups sisältämät tuotteet
-- ------------------------------
CREATE TABLE IF NOT EXISTS item_group_items (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES item_groups(id) ON DELETE CASCADE,
  item_id INT REFERENCES items(id),
  quantity INT NOT NULL DEFAULT 1
);

-- ------------------------------
-- stock_audit: varastomuutokset
-- ------------------------------
CREATE TABLE IF NOT EXISTS stock_audit (
  id SERIAL PRIMARY KEY,
  item_id INT REFERENCES items(id),
  order_id INT REFERENCES orders(id),
  delta INT,
  reason TEXT,
  actor TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- ------------------------------
-- archived_orders: snapshot of orders when archived/returned
-- ------------------------------
CREATE TABLE IF NOT EXISTS archived_orders (
  id SERIAL PRIMARY KEY,
  original_order_id INT,

  customer_name TEXT NOT NULL,
  organization TEXT,
  delivery_point TEXT NOT NULL,

  delivery_start TIMESTAMP NOT NULL,
  return_at TIMESTAMP NOT NULL,

  status TEXT NOT NULL,

  pdf_path TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  archived_at TIMESTAMP DEFAULT now()
);

-- ------------------------------
-- archived_order_items: snapshot of order items
-- ------------------------------
CREATE TABLE IF NOT EXISTS archived_order_items (
  id SERIAL PRIMARY KEY,
  archived_order_id INT REFERENCES archived_orders(id) ON DELETE CASCADE,
  original_order_item_id INT,
  item_id INT,
  item_name TEXT NOT NULL,
  sku TEXT,
  quantity INT NOT NULL,
  created_at TIMESTAMP
);

/*-- ------------------------------
-- SAMPLE DATA: käyttäjä, tapahtuma ja tuotteet
-- ------------------------------
INSERT INTO users (email, password_hash, display_name, role)
VALUES ('admin@vectorama.fi', '$2b$10$placeholderhash', 'Admin', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO events (name, start_date, end_date)
VALUES ('Vectorama LAN 2025', '2025-12-12', '2025-12-14')
ON CONFLICT DO NOTHING;

INSERT INTO items (sku, name, short_description, image_url, total_stock, available_stock, category)
VALUES
 ('TV-55-01', 'Samsung 55"', '55-inch Full HD TV', '', 20, 20, 'TV'),
 ('HDMI-2m', 'HDMI cable 2m', 'Standard HDMI cable', '', 200, 200, 'Cables'),
 ('PSU-EXT', 'Power extension 4m', '4-socket power extension', '', 50, 50, 'Power')
ON CONFLICT DO NOTHING;

-- sample item group
INSERT INTO item_groups (name, description, image_url)
VALUES ('Full TV Setup', 'TV + HDMI + Extension', '')
ON CONFLICT DO NOTHING;

-- attach items to group
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM item_group_items) THEN
    INSERT INTO item_group_items (group_id, item_id, quantity)
    SELECT g.id, i.id, CASE WHEN i.category='TV' THEN 1 WHEN i.sku='HDMI-2m' THEN 1 ELSE 1 END
    FROM item_groups g, items i
    WHERE g.name = 'Full TV Setup' AND i.sku IN ('TV-55-01','HDMI-2m','PSU-EXT');
  END IF;
END
$$;
*/