-- F010 · Materialized view con promedio diario por producto+zona.
-- Refrescada por cron nocturno (`.github/workflows/refresh-materialized-views.yml`).
-- Se puede materializar con CONCURRENTLY porque el índice único abajo lo habilita.

CREATE MATERIALIZED VIEW IF NOT EXISTS price_daily_avg AS
SELECT
  COALESCE(p.canonical_id, p.id) AS product_id,
  COALESCE(s.zone_id, 'national') AS zone_slug,
  DATE(pr.captured_at) AS day,
  AVG(pr.price)::float AS avg_price,
  MIN(pr.price)::float AS min_price,
  MAX(pr.price)::float AS max_price,
  COUNT(*)::int AS obs_count
FROM prices pr
JOIN products p ON p.id = pr.product_id
JOIN stores s ON s.id = pr.store_id
WHERE pr.captured_at > NOW() - INTERVAL '400 days'
  AND pr.price > 0
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX IF NOT EXISTS price_daily_avg_uq
  ON price_daily_avg (product_id, zone_slug, day);

CREATE INDEX IF NOT EXISTS price_daily_avg_recent
  ON price_daily_avg (product_id, day DESC);
