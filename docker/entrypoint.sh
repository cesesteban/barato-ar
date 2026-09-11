#!/bin/sh
set -e

# Parse host y puerto de DATABASE_URL_UNPOOLED sin depender de `pg`.
# Regex minimal: postgresql://user:pass@host:port/db → host y port.
DB_HOST=$(printf '%s' "${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" | sed -E 's|^[^@]+@([^:/]+).*|\1|')
DB_PORT=$(printf '%s' "${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" | sed -nE 's|^[^@]+@[^:/]+:([0-9]+).*|\1|p')
DB_PORT=${DB_PORT:-5432}

echo "[entrypoint] esperando Postgres en ${DB_HOST}:${DB_PORT}..."
i=0
until node -e "require('net').createConnection({host:'${DB_HOST}',port:${DB_PORT}}).on('connect',function(){this.end();process.exit(0)}).on('error',()=>process.exit(1))" 2>/dev/null; do
  i=$((i+1))
  if [ $i -gt 60 ]; then
    echo "[entrypoint] Postgres no responde tras 60 intentos. Abortando."
    exit 1
  fi
  sleep 2
done

echo "[entrypoint] aplicando migraciones Prisma..."
./node_modules/.bin/prisma migrate deploy || {
  echo "[entrypoint] migrate deploy falló"
  exit 1
}

echo "[entrypoint] iniciando app en puerto ${PORT:-3000}..."
exec "$@"
