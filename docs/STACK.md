# Stack técnico

Toda decisión de stack es justificable en 1 línea. Ninguna elección por moda.

## Runtime

- **Node.js 20 (LTS)** — soporte de Vercel + estable hasta 2027.
- **pnpm 10** — install rápido, workspaces gratis para futuro monorepo, deterministic lockfile.

## Framework

- **Next.js 15.5.25 (App Router)** — SSR + ISR sin manejar servidor, Vercel-native, RSC para reducir JS al cliente.
- **React 19 RC** — server components estables, `use()` para promesas.
- **TypeScript 5.6 strict** con:
  - `strict: true`
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`

## Base de datos

- **PostgreSQL 16** (Neon serverless) — pooled + unpooled, autoscale, restore point-in-time.
- **Extensions**: `pg_trgm` (fuzzy search), `vector` (pgvector, para embeddings futuros).
- **Prisma 5.22** con `@map("snake_case")` en todos los campos camelCase — schema TS-first, migrations declarativas.
- **Materialized views**: `price_daily_avg` (REFRESH CONCURRENTLY diario).

## Autenticación

- **Auth.js v5 (beta)** con provider Email (magic link)
- Solo para `/admin` — el resto del sitio funciona sin cuenta (Ppio IV Privacy).
- Nodemailer para SMTP, Resend para transactional.

## Almacenamiento de objetos

- **Cloudflare R2** (S3-compatible) via `@aws-sdk/client-s3`.
- 2 buckets: `barato-ar-products` (público, imágenes) + `barato-ar-reports` (privado, fotos user-uploaded).
- Custom domain `img.barato.ar` para servir directo desde R2.

## Email

- **Resend** para producción (HTTPS API, no requiere SMTP).
- **MailPit** para desarrollo local (SMTP en localhost:1025 + UI en localhost:8025).
- Templates con **React Email** (compilan a HTML server-side).
- Jerarquía: `SMTP_URL` → `RESEND_API_KEY` → console fallback.

## Cache

- **Upstash Redis** (REST) — global, serverless-friendly, tier free 10k req/day.
- Fallback: stub in-memory (funciona sin persistencia entre restarts).
- Uso: `runOffers` cache 60s, popular searches, rate limiting.

## Analytics + Observability

- **Plausible** — analytics cookieless, GDPR/LGPD compliant, respetuoso Ppio IV.
- **Sentry** (`@sentry/nextjs`) — errors + performance en el edge.
- **Better Stack** (opcional) — uptime monitoring del `/health` endpoint.

## Ingesta de datos

- **GitHub Actions** cron workflows (8):
  - `ingest-flyers.yml` — lunes 8am ART (parser folletos por cadena)
  - `ingest-pcl.yml` — diario 9am ART (SEPA snapshot)
  - `normalize-weekly.yml` — miércoles (fuzzy match)
  - `refresh-materialized-views.yml` — cada 4h
  - `alerts-scan.yml` — cada 30min (dispara emails cuando precio cae)
  - `reports-purge.yml` — semanal (limpia reports rechazados >30d)
  - `db-migrate-prod.yml` — manual
  - `ci.yml` + `lighthouse.yml` — en cada PR
- **yauzl** — extract streaming de zips anidados (SEPA envía zip-of-zips).
- **csv-parse** — con `delimiter: "|"`, `bom: true`, `quote: false` para el formato SEPA.
- **cheerio** — parse HTML de folletos.

## UI

- **Tailwind CSS 3.4** con design tokens custom en `:root` CSS variables.
- **Radix UI** (dialog, tooltip, popover, switch, select) — accesibilidad AA gratis.
- **lucide-react** para iconos.
- **next/font** con Inter local para LCP < 2.5s.

## Testing

- **Vitest 2.1** con `setupFiles` (`tests/setup.ts`) para env seeding.
- **@testing-library/react** para componentes.
- **fixtures** en `tests/fixtures/` (SEPA CSVs, HTML de folletos).
- Sin E2E en MVP — se agrega si crece la superficie.

## Deploy

- **Vercel** — Production + Preview + Development.
- Cada push a `main` deploya automáticamente.
- Branches → Preview URL con misma DB (compartida, hasta que dupliquemos).
- Env vars gestionadas en Vercel Dashboard (secrets no van al repo).

## CI/CD

- **GitHub Actions**:
  - `ci.yml`: typecheck + lint + test en cada PR
  - `lighthouse.yml`: budget de performance en cada deploy
- Deploy no requiere aprobación (Vercel auto).

## External APIs / SDKs

- **Cloudflare R2** — `@aws-sdk/client-s3` (S3 API)
- **Resend** — SDK oficial
- **Sentry** — `@sentry/nextjs`
- **Upstash Redis** — `@upstash/redis` (REST)

## Herramientas de dev

- **Docker Compose** — stack local completo (Postgres 16 + MailPit + app + redis).
- **Prisma Studio** — GUI de la DB.
- **Zod 3** — validation schemas para envs, forms, ingest.

## Decisiones deliberadas

- **NO Redux/Zustand** — server components + URL como state; hooks nativos (`useZone`, `useSearchParams`).
- **NO GraphQL** — REST + typed Prisma es suficiente.
- **NO CSS-in-JS runtime** — Tailwind resuelve todo, cero runtime cost.
- **NO ORM query builder additional** — Prisma raw SQL para queries complejas (search ranking, offers dedup).
- **NO Cloudflare Workers** — Vercel es más simple para Next.js.
- **NO monorepo aún** — un solo `package.json`, cuando aparezca el segundo servicio se separa.

## Restricciones de versión

- Next 15.x línea backport (15.5.25) — 16.x tiene breaking changes en middleware.
- Prisma 5.22 — 8.x rc tiene nuevo query engine, esperamos estable.
- Node 20 — coincide con la runtime default de Vercel.
