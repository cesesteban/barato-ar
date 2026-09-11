# Conectar Barato.ar con data real

Dos tracks paralelos. Elegí uno o los dos.

- **Track A — Data real en local (Docker):** hoy corrés con `seed-demo`.
  Reemplazá esa data por ingestas reales de folletos + SEPA. Sigue todo
  en tu máquina.
- **Track B — Deploy a producción (Vercel + Neon):** subir la web al
  mundo. Necesita cuentas externas.

Podés hacer solo A, o A + B en paralelo. Track B ejecuta las mismas
ingestas de A pero en Vercel/GitHub Actions.

---

## Track A — Data real en local

### A0. Limpiar el estado demo

```bash
docker compose down -v          # borra volúmenes (DB + Redis quedan a cero)
docker compose up -d             # levanta stack limpio
pnpm db:seed                     # 11 chains + 15 zones + AppMeta (idempotente)
# NO corras db:seed:demo — la demo pisa la data real.
```

### A1. Ingesta de folletos (F003)

**Parser Carrefour ya listo**. El fetcher descubre el folleto vigente
automáticamente desde `www.carrefour.com.ar/promociones`, o podés
override con env var:

```bash
export CARREFOUR_FLYER_URL="https://www.carrefour.com.ar/folleto-2026-W37.html"
pnpm ingest carrefour
```

Salida esperada (ej. 200-500 productos):
```
[ingest] chain=carrefour store=<id> dryRun=false
[ingest] status=success rows=347 skipped=12 elapsed=45.2s
```

**Coto, Día, Jumbo**: sus parsers están en `spec.md` pero no
implementados aún. Cuando los agregues:
```bash
pnpm ingest coto
pnpm ingest dia
pnpm ingest jumbo
```

Cada uno vive en `src/ingestion/chains/<slug>/` — copiá la estructura
de `carrefour/` (fetcher + parser + index) y registralo en
`src/ingestion/chains/index.ts`.

### A2. Ingesta SEPA / Precios Claros (F004)

Necesita `SEPA_MANIFEST_URL` apuntando a un JSON con las URLs de los
CSVs oficiales. **Los links del dataset son inestables** — Precios
Claros no publica manifest JSON oficial. Dos opciones:

**Opción 1 (recomendada)**: publicar tu propio manifest en un bucket
público. Descargá los 4 CSVs manualmente desde
`https://datos.produccion.gob.ar/dataset/sepa-precios-de-argentina/`,
subilos a R2 o Cloudflare Pages, y creá un JSON como:

```json
{
  "version": "2026-W37",
  "publishedAt": "2026-09-08T10:00:00Z",
  "files": {
    "sucursales": "https://tu-bucket/sucursales.csv",
    "productos":  "https://tu-bucket/productos.csv",
    "precios":    "https://tu-bucket/precios.csv",
    "comercios":  "https://tu-bucket/comercios.csv"
  }
}
```

Después en `.env.local`:
```
SEPA_MANIFEST_URL=https://tu-bucket/manifest.json
```

**Opción 2 (dev rápido)**: descargar los CSVs a tu máquina, publicar
un manifest local con un http server simple:

```bash
mkdir -p sepa-data && cd sepa-data
# descargar los 4 CSVs a esta carpeta
python3 -m http.server 8899 &     # sirve http://localhost:8899/*
cat > manifest.json <<EOF
{
  "files": {
    "sucursales": "http://host.docker.internal:8899/sucursales.csv",
    "productos":  "http://host.docker.internal:8899/productos.csv",
    "precios":    "http://host.docker.internal:8899/precios.csv"
  }
}
EOF
```

Luego:
```bash
export SEPA_MANIFEST_URL=http://host.docker.internal:8899/manifest.json
pnpm ingest pcl
```

**Ajustar el mapping de comercios** en `src/ingestion/pcl/chains.ts`
según los IDs reales del dataset (los del código son placeholders).
Verificar contra `comercios.csv`:

```bash
head -20 comercios.csv
```

### A3. Normalizer (F005) — matching multi-cadena

Después de las ingestas:

```bash
pnpm normalize:full
# → agrupa Product por EAN + fuzzy match por (nombre, marca, size, unit)
```

Los matches con confidence 0.60-0.89 quedan en `/admin/normalizer-queue`
para revisión manual (necesita Auth.js).

### A4. Photos scraper (C-006) — opcional

Requiere `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET_PRODUCTS` en env. Setup R2 abajo en la sección
[Cloudflare R2](#cloudflare-r2).

```bash
# No hay CLI todavía. La función existe en src/ingestion/photos/scraper.ts
# y se llamaría desde un script custom o en el cron de ingesta.
```

### A5. Materialized view refresh

```bash
pnpm views:refresh
# refresca price_daily_avg — F010 charts históricos.
# Correlo después de ingestas grandes.
```

### A6. Verificar que la data llegó

```bash
docker compose exec db psql -U barato -d barato -c "
  SELECT c.name, COUNT(*) AS precios
  FROM prices pr JOIN stores s ON s.id=pr.store_id JOIN chains c ON c.id=s.chain_id
  WHERE pr.captured_at > NOW() - INTERVAL '7 days'
  GROUP BY c.name ORDER BY 2 DESC;
"
```

Abrí http://localhost:3900 — debería mostrar ofertas reales.

### A7. Cron local (opcional)

Si querés que las ingestas se corran solas en tu máquina, agregá al
crontab (Linux/Mac) o Task Scheduler (Windows). Ejemplo Linux:

```
# Ingestas
0 8 * * 1  cd /path/to/repo && pnpm ingest carrefour
0 9 * * 2  cd /path/to/repo && pnpm ingest pcl
0 3 * * 3  cd /path/to/repo && pnpm normalize:full
5 * * * *  cd /path/to/repo && pnpm alerts:scan
0 3 * * *  cd /path/to/repo && pnpm views:refresh
0 2 * * *  cd /path/to/repo && pnpm reports:purge
```

Cargá las envs con `direnv` o `dotenv` para el crontab.

---

## Track B — Deploy a producción

Sigue el orden. Cada paso desbloquea el siguiente. Todo cabe en free
tiers al principio.

### B1. Dominio (barato.ar)

1. Registrar `barato.ar` en [nic.ar](https://nic.ar) (~$500 ARS/año).
2. Delegar nameservers a Cloudflare (recomendado — DNS rápido + WAF).
3. Guardar credenciales de acceso al panel del registrar.

### B2. Neon Postgres

1. Crear cuenta en [neon.tech](https://neon.tech).
2. New Project → `barato-ar` en región `AWS US East 2` (Ohio, más
   cercano a AR desde free tier).
3. Habilitar extensiones en la consola SQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Neon Console → Connection Details → copiar 2 URLs:
   - **Pooled** (para app): `DATABASE_URL`
   - **Direct/Unpooled** (para migraciones): `DATABASE_URL_UNPOOLED`
5. Aplicar migraciones localmente contra Neon:
   ```bash
   export DATABASE_URL_UNPOOLED="postgresql://user:pass@..."
   pnpm prisma migrate deploy
   pnpm db:seed
   ```
6. **Backups**: Neon free tier tiene 7 días de PITR. Verificar en
   Console → Settings → Backup.

### B3. Cloudflare R2

1. Cuenta en [cloudflare.com](https://cloudflare.com).
2. R2 → Overview → Create bucket:
   - `barato-ar-products` — público con custom domain `img.barato.ar`
   - `barato-ar-reports` — privado
3. R2 → Manage R2 API Tokens → Create API token con permisos
   read+write sobre ambos buckets. Copiar:
   - Account ID
   - Access Key ID
   - Secret Access Key
4. Custom domain para el bucket public: R2 → bucket → Settings →
   Custom Domains → `img.barato.ar` (agregar el registro DNS que
   Cloudflare pide, apuntando al CNAME que te da).

Verificar localmente:
```bash
export R2_ACCOUNT_ID=...
export R2_ACCESS_KEY_ID=...
export R2_SECRET_ACCESS_KEY=...
export R2_BUCKET_PRODUCTS=barato-ar-products
export NEXT_PUBLIC_R2_PUBLIC_URL=https://img.barato.ar
# Test subida simple con aws cli o SDK.
```

### B4. Resend (email transaccional)

1. Cuenta en [resend.com](https://resend.com).
2. Add Domain → `barato.ar`.
3. Configurar registros DNS en Cloudflare (ver [docs/dns.md](./dns.md)):
   ```
   TXT   @                      v=spf1 include:_spf.resend.com ~all
   TXT   resend._domainkey      <valor exacto del dashboard Resend>
   TXT   _dmarc                 v=DMARC1; p=quarantine; rua=mailto:dmarc@barato.ar;
   ```
4. En Resend, esperar hasta ver ✅ Verified en el dominio (5-30 min).
5. Copiar API key (una sola vez visible).

Test:
```bash
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"alertas@barato.ar","to":"vos@ejemplo.com","subject":"test","html":"ok"}'
```

### B5. Upstash Redis

1. Cuenta en [upstash.com](https://upstash.com).
2. Create Redis Database → nombre `barato-ar-cache`, region más
   cercana (US East / South America).
3. Copiar:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### B6. Sentry

1. Cuenta en [sentry.io](https://sentry.io).
2. Create project → Platform: Next.js → nombre `barato-ar-web`.
3. Copiar DSN (server + client — mismo valor).

### B7. Plausible (opcional)

1. Cuenta en [plausible.io](https://plausible.io) (o self-hosted).
2. Add site → `barato.ar`.
3. En envs de Vercel: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=barato.ar`.

### B8. Vercel (hosting)

1. Cuenta en [vercel.com](https://vercel.com).
2. Import Git Repository (necesita el repo en GitHub — ver B9).
3. Framework: Next.js (auto-detect).
4. **Environment Variables** — pegar todo esto en el dashboard:

   ```
   NEXT_PUBLIC_APP_URL=https://barato.ar
   AUTH_URL=https://barato.ar
   AUTH_SECRET=<openssl rand -base64 32>
   ADMIN_EMAILS=vos@ejemplo.com

   DATABASE_URL=<Neon pooled>
   DATABASE_URL_UNPOOLED=<Neon direct>

   RESEND_API_KEY=<Resend key>
   MAIL_FROM=Barato.ar <alertas@barato.ar>

   REVALIDATE_SECRET=<openssl rand -base64 32>

   R2_ACCOUNT_ID=<Cloudflare>
   R2_ACCESS_KEY_ID=<...>
   R2_SECRET_ACCESS_KEY=<...>
   R2_BUCKET_PRODUCTS=barato-ar-products
   R2_BUCKET_REPORTS=barato-ar-reports
   NEXT_PUBLIC_R2_PUBLIC_URL=https://img.barato.ar

   SENTRY_DSN=<Sentry>
   NEXT_PUBLIC_SENTRY_DSN=<Sentry>

   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=barato.ar

   UPSTASH_REDIS_REST_URL=<Upstash>
   UPSTASH_REDIS_REST_TOKEN=<...>

   SEPA_MANIFEST_URL=https://tu-bucket/manifest.json
   ```

5. Domain settings → Add `barato.ar` + `www.barato.ar` (redirect www→apex).
6. Deploy. La primera build corre `prisma generate` + `next build`.
   Al arrancar, `entrypoint.sh` no aplica; Vercel usa su propio flow
   pero el schema ya está migrado en Neon desde B2.

### B9. GitHub — repo + secrets

1. Crear repo `barato-ar` en GitHub (privado o público, tu decisión).
2. Push:
   ```bash
   cd /path/to/repo
   git remote add origin git@github.com:tu-usuario/barato-ar.git
   git push -u origin main
   ```
3. Repository → Settings → Secrets and variables → Actions →
   pegar todos los secrets:
   - `DATABASE_URL_UNPOOLED` (para migrate deploy)
   - `AUTH_SECRET`, `AUTH_URL`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_APP_URL`
   - `RESEND_API_KEY`, `MAIL_FROM`
   - `SEPA_MANIFEST_URL`
   - `SENTRY_DSN_INGEST`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

4. Los workflows en `.github/workflows/` van a arrancar:
   - `ci.yml` — en cada PR
   - `db-migrate-prod.yml` — en push a `main`
   - `ingest-flyers.yml` — lunes 8am ART
   - `ingest-pcl.yml` — martes 8am ART
   - `normalize-weekly.yml` — miércoles 3am ART
   - `refresh-materialized-views.yml` — diario 3am ART
   - `alerts-scan.yml` — cada hora :05
   - `reports-purge.yml` — diario 2am ART
   - `lighthouse.yml` — en PRs

### B10. Primera corrida contra prod

En GitHub → Actions → cada workflow → Run workflow (workflow_dispatch):

1. `ingest-flyers` con `chain: carrefour` → verificar en Neon:
   ```sql
   SELECT COUNT(*) FROM prices WHERE source='flyer';
   ```
2. `ingest-pcl` (si tenés SEPA_MANIFEST_URL válido).
3. `normalize-weekly`.
4. `refresh-materialized-views`.

Verificar https://barato.ar → home debería mostrar ofertas reales.

### B11. Better Stack (uptime — opcional)

1. Cuenta en [betterstack.com](https://betterstack.com).
2. Monitors → Create → HTTP → `https://barato.ar/health` cada 3 min.
3. Alertas por email cuando devuelve ≠ 200.

### B12. Google Search Console + Bing Webmaster

1. [Search Console](https://search.google.com/search-console) →
   Add property → `barato.ar` → verificar via DNS TXT en Cloudflare.
2. Submit sitemap: `https://barato.ar/sitemap.xml`.
3. [Bing Webmaster](https://www.bing.com/webmasters) → Add site →
   Import from GSC (más rápido).
4. Test un producto con
   [Rich Results Test](https://search.google.com/test/rich-results) —
   debería mostrar Product + AggregateOffer.

### B13. LAUNCH.md

Abrir `LAUNCH.md` y tildar cada item que fuiste completando. Cuando
todo esté ✅, tirá el post de anuncio.

---

## Rollback plan

Si algo rompe en prod:

1. **Deploy roto**: Vercel Dashboard → Deployments → click en el
   deploy anterior verde → "Promote to Production".
2. **Migration rota**: correr en Neon SQL Console:
   ```sql
   UPDATE _prisma_migrations
   SET rolled_back_at = NOW()
   WHERE migration_name = '<nombre>';
   ```
   Luego revert manual del DDL. Prisma no tiene rollback automático.
3. **Ingesta rota**: pausar el workflow en GitHub Actions →
   Settings → Actions → Disable.
4. **Sentry alerts spam**: temporalmente muteá el proyecto.
5. **DDoS o abuso**: Cloudflare → Under Attack Mode en el dominio.

---

## Preguntas frecuentes

**¿Puedo usar solo Track A y quedarme en local?**
Sí. Es un buen setup de dev incluso a mediano plazo. La app corre en
Docker igual que en prod, sólo cambia el dominio y el DNS de email.

**¿Los folletos siguen la misma URL semana a semana?**
No. El fetcher de Carrefour tiene fallback via regex sobre
`/promociones`. Si Carrefour rediseña la página, hay que ajustar el
parser. Tests con snapshots (`tests/fixtures/flyers/`) detectan
regresiones.

**¿Qué pasa si SEPA cambia el formato del CSV?**
Zod schemas fallan al parsear → Sentry captura → ingesta marca
`IngestionRun.status = failed`. Rehacé el schema.

**¿Cuánto sale el stack completo por mes?**
En free tier: **$0** para MVP (< 5k users/mes).
Cuando crece: ~$20/mes Vercel Pro + ~$10 Neon + ~$0 Cloudflare R2 +
~$0 Resend hasta 3k emails.
