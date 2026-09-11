# LAUNCH · Barato.ar

Checklist previo a anunciar la web. Cada item debe estar en `[x]` antes
de comunicar públicamente.

## Servicios externos

- [ ] Dominio `barato.ar` registrado en nic.ar
- [ ] DNS: SPF/DKIM/DMARC configurado (ver `docs/dns.md`)
- [ ] Resend: dominio `barato.ar` verificado + API key en Vercel envs
- [ ] Neon: proyecto creado, extensiones `pg_trgm` + `vector`, `DATABASE_URL` + `DATABASE_URL_UNPOOLED` en Vercel
- [ ] Cloudflare R2: buckets `barato-ar-products` (público con `img.barato.ar`) + `barato-ar-reports` (privado) + API tokens en Vercel
- [ ] Upstash Redis: instancia + `UPSTASH_REDIS_REST_URL` + token en Vercel
- [ ] Sentry: proyecto Node/Next + `SENTRY_DSN` (server) + `NEXT_PUBLIC_SENTRY_DSN` (client) en Vercel
- [ ] Plausible: dominio `barato.ar` agregado + `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` en Vercel
- [ ] Better Stack (opt): heartbeat a `/health` cada 3 min
- [ ] Vercel: repo conectado, prod deploy verde

## Infra

- [ ] `pnpm prisma migrate deploy` corrió en prod (tabla `_prisma_migrations` con las 4 filas)
- [ ] `pnpm db:seed` corrió en prod (11 chains + 15 zones + AppMeta)
- [ ] Materialized view `price_daily_avg` creada
- [ ] `AUTH_SECRET` y `REVALIDATE_SECRET` generados con `openssl rand -base64 32` y guardados en Vercel
- [ ] `ADMIN_EMAILS` seteado con el owner
- [ ] Neon backups activados (retención ≥ 7 días)

## Cron jobs (GitHub Actions)

- [ ] `ingest-flyers.yml` — programado (lunes 8am ART) y probado con `workflow_dispatch`
- [ ] `ingest-pcl.yml` — martes 8am ART
- [ ] `normalize-weekly.yml` — miércoles 3am ART
- [ ] `refresh-materialized-views.yml` — diario 3am ART
- [ ] `alerts-scan.yml` — cada hora :05
- [ ] `reports-purge.yml` — diario 2am ART
- [ ] `SEPA_MANIFEST_URL` configurada como secret

## SEO

- [ ] Sitemap indexado en Google Search Console
- [ ] Sitemap indexado en Bing Webmaster
- [ ] Verificar propiedad del dominio en GSC + Bing
- [ ] Google Rich Results Test verde en 3 productos distintos
- [ ] `robots.txt` bloquea `/admin`, `/api`, `/dev`
- [ ] `security.txt` accesible en `/.well-known/security.txt`

## Contenido

- [ ] Legales revisados por asesor (`/legales/{terminos,privacidad,takedown}`)
- [ ] Página `/sobre` refleja fuentes reales
- [ ] Emails desde `alertas@barato.ar` — nombre visible correcto
- [ ] OG default image (`og-default.png`) subida a `/public`
- [ ] Favicon + `logo-512.png` en `/public`

## Verificación funcional

- [ ] `GET /` → 200 con feed real
- [ ] `GET /ofertas?vertical=supermarket` → 200 con productos filtrados
- [ ] `GET /producto/<slug>` → 200 con JSON-LD válido
- [ ] `GET /buscar?q=coca` → 200 con resultados
- [ ] `POST /api/alerts` end-to-end (verify → notify)
- [ ] `POST /api/reports` funcional; queue admin visible
- [ ] `/admin/*` protegido por Auth.js
- [ ] `pnpm test` verde localmente

## Performance

- [ ] Lighthouse Performance ≥ 85 en las 6 rutas
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse SEO ≥ 95
- [ ] Bundle home < 200 kB First Load JS
- [ ] LCP < 3s en 3G simulado

## Comunicación

- [ ] Post en LinkedIn/X redactado
- [ ] Producthunt draft
- [ ] Runbook interno (qué hacer si cae X)

Cuando todo lo de arriba esté `[x]`, tirá el tweet y a rezarle a la SEO gods.
