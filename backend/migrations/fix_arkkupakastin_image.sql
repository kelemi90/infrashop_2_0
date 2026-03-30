-- Fix image mapping for freezer items.
-- Assign arkkupakastin.jpg only to the exact item "Arkkupakastin"
-- and do not attach it to "Lasi-ikkunallinen arkkupakastin".

UPDATE items
SET image_url = 'arkkupakastin.jpg',
    updated_at = now()
WHERE lower(trim(name)) = 'arkkupakastin';

UPDATE items
SET image_url = NULL,
    updated_at = now()
WHERE lower(trim(name)) = 'lasi-ikkunallinen arkkupakastin'
  AND lower(coalesce(image_url, '')) = 'arkkupakastin.jpg';
