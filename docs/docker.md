# Docker · Barato.ar

Todo el stack corre en contenedores sin colisionar con otros proyectos.

## Puertos elegidos

| Servicio | Host | Contenedor | URL |
|---|---|---|---|
| App Next.js | **3900** | 3000 | http://localhost:3900 |
| Postgres | **5434** | 5432 | `postgresql://barato:barato_dev_password@localhost:5434/barato` |
| Redis | **6380** | 6379 | `redis://localhost:6380` |
| MailPit SMTP | **1025** | 1025 | (para clientes) |
| MailPit UI | **8025** | 8025 | http://localhost:8025 |

Estos puertos fueron verificados libres al momento de escribir el compose.
Si algún proyecto tuyo empieza a usarlos, ajustá en `docker-compose.yml`.

## Casos de uso

### A) Sólo infra (Postgres + Redis + MailPit); app corre local con hot reload

```bash
# Levantar infra
docker compose up -d db redis mailpit

# Copiar env y configurar
cp .env.docker.example .env.local

# Correr migraciones + seed contra la DB dockerizada
pnpm db:migrate
pnpm db:seed

# Arrancar Next.js local con hot reload
pnpm dev
# → http://localhost:3900 (según NEXT_PUBLIC_APP_URL; ajustá si querés :3000)
```

### B) Stack completo en Docker (producción-like)

```bash
docker compose up -d --build
# El entrypoint aplica prisma migrate deploy antes de arrancar la app.
# → http://localhost:3900
```

## Verificación

```bash
docker compose ps          # todos healthy
docker compose logs -f app # ver logs de la app
docker compose exec db psql -U barato -d barato -c "\dx"  # extensiones cargadas
```

Deberías ver `pg_trgm` y `vector` en `\dx`.

## Reset total

```bash
docker compose down -v     # borra volúmenes (Postgres + Redis)
docker compose up -d
```

## Emails en dev

Cualquier email que envíe la app (Auth.js magic link, F009 alertas) queda
capturado en MailPit → http://localhost:8025. No sale nada a Internet.

Para eso `RESEND_API_KEY` puede quedar vacío en dev; cuando se implemente
un adapter SMTP genérico en `src/lib/auth.ts`, apuntar a `mailpit:1025`
resuelve el flujo local.

## Colisión de puertos

Si algún puerto se ocupa por otro contenedor tuyo, editá los mapeos en
`docker-compose.yml` (izquierda del `:` es el puerto del host).
