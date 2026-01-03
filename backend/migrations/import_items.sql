
\copy items(
  sku,
  name,
  short_description,
  image_url,
  total_stock,
  category
)
FROM '/varasto.csv'
DELIMITER ','
CSV HEADER;
