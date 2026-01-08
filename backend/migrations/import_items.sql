COPY items(
  name,
  total_stock,
  category,
  sku,
  short_description,
  long_description,
  image_url,
  available_stock
)
FROM '/varasto.csv'
DELIMITER ','
CSV HEADER
NULL AS '';
