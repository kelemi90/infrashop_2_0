-- normalize_image_urls.sql
-- Make sure image_url values don't contain `public/images/` or `images/` prefixes.
-- Run this once after an import or include it in your migration sequence.

UPDATE items
SET image_url = regexp_replace(image_url, '^[/\\]?(public[/\\])?images[/\\]', '', 'i')
WHERE image_url IS NOT NULL AND image_url ~* '^[/\\]?(public[/\\])?images[/\\]';
