#!/bin/sh
set -e

echo "[entrypoint] esperando Postgres..."
i=0
until node -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL_UNPOOLED});c.connect().then(()=>c.end()).then(()=>process.exit(0)).catch(()=>process.exit(1))" 2>/dev/null; do
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

echo "[entrypoint] iniciando app..."
exec "$@"
