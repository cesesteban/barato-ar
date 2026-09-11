-- F006 · Índices GiST para búsqueda con pg_trgm.
-- Se ejecutan con `prisma migrate deploy` en cualquier ambiente.
-- Las extensiones se crean con `previewFeatures = ["postgresqlExtensions"]`
-- desde schema.prisma; aquí solo agregamos los índices.

CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING gist (normalized_name gist_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_brand_trgm
  ON products USING gist ((LOWER(brand)) gist_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_search_logs_ts
  ON search_logs (ts DESC);
