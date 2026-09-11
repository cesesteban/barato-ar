-- Barato.ar · extensiones Postgres necesarias (F003 pg_trgm, F005 pgvector).
-- Se ejecuta una vez al crear la DB (Postgres corre /docker-entrypoint-initdb.d/*.sql).

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
