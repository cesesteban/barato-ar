-- F006 · Índices GiST para búsqueda con pg_trgm.
-- Corre DESPUÉS de la migración init_schema que crea `products` y `search_logs`.

CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING gist (normalized_name gist_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_brand_trgm
  ON products USING gist ((LOWER(brand)) gist_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_search_logs_ts
  ON search_logs (ts DESC);
