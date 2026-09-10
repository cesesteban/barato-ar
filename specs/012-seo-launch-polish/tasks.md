# Tasks: SEO, Performance & Launch

## Phase 1: Setup
- [ ] T001 Instalar `@lhci/cli`, `schema-dts`.
- [ ] T002 Configurar `.lighthouserc.json` con budget.

## Phase 2: Foundational
- [ ] T010 [P] `src/lib/jsonld.ts` con helpers `orgJsonLd`, `websiteJsonLd`, `productJsonLd`, `storeJsonLd`.
- [ ] T011 [P] `src/lib/seo.ts` con builder de metadata por página.
- [ ] T012 Actualizar `layout.tsx` con metadata global + org JSON-LD.

## Phase 3: US1 — SEO on-page (P1) 🎯 MVP
- [ ] T020 [US1] `generateMetadata` en cada ruta pública (`/`, `/ofertas`, `/producto/[slug]`, `/tienda/[slug]`, `/buscar`, `/reportar`, `/sobre`, `/legales/*`).
- [ ] T021 [US1] JSON-LD `WebSite + SearchAction` en home.
- [ ] T022 [US1] JSON-LD `Product + AggregateOffer` en `/producto/[slug]` (revisado de F07).
- [ ] T023 [US1] JSON-LD `Store` en `/tienda/[slug]` (crear página si no existía).
- [ ] T024 [P] [US1] Screaming Frog crawl staging → 0 páginas sin meta.
- [ ] T025 [US1] `noindex` en `/buscar` y `/admin`.
- [ ] T026 [US1] Canonical explicito en cada página.

## Phase 4: US2 — Sitemap + robots.txt (P1)
- [ ] T030 [US2] `src/app/sitemap.ts` dinámico con productos, cadenas, categorías.
- [ ] T031 [US2] `src/app/robots.ts` con reglas + link a sitemap.
- [ ] T032 [P] [US2] Test unit: sitemap ≤ 50k URLs (split si excede).
- [ ] T033 [US2] Sitemap submit en Google Search Console + Bing (manual).

## Phase 5: US3 — Lighthouse CI (P1)
- [ ] T040 [US3] Workflow `.github/workflows/lighthouse.yml` corriendo en PRs.
- [ ] T041 [US3] Verificar que budget se cumple en `main`.
- [ ] T042 [P] [US3] axe integrado en Playwright para las 5 rutas críticas.

## Phase 6: US4 — Analytics (P1)
- [ ] T050 [P] [US4] `src/lib/analytics.tsx` con Plausible script conditional (solo en prod).
- [ ] T051 [P] [US4] Instrumentar `trackEvent("search")` en SearchBar submit.
- [ ] T052 [P] [US4] `trackEvent("outbound_click", { chain })` en botón Ir a tienda.
- [ ] T053 [P] [US4] `trackEvent("alert_created")` en success de F09.
- [ ] T054 [P] [US4] `trackEvent("report_submitted")` en success de F11.
- [ ] T055 [P] [US4] `trackEvent("filter_applied", { filter })` en `/ofertas`.
- [ ] T056 [P] [US4] `trackEvent("zone_changed")` en ZoneChip.

## Phase 7: US5 — Legal & páginas complementarias (P1)
- [ ] T060 [P] [US5] `/legales/terminos/page.tsx` con contenido.
- [ ] T061 [P] [US5] `/legales/privacidad/page.tsx`.
- [ ] T062 [P] [US5] `/legales/takedown/page.tsx` con form o mailto.
- [ ] T063 [P] [US5] `/sobre/page.tsx`.
- [ ] T064 [P] [US5] `/contacto/page.tsx` (o mailto).
- [ ] T065 [P] [US5] `/.well-known/security.txt` (via `next.config.mjs` rewrites o `public/`).
- [ ] T066 [P] [US5] Footer con links a todas las legales.
- [ ] T067 [P] [US5] Disclaimer "precios referenciales" visible en cards y comparación.
- [ ] T068 [P] [US5] `not-found.tsx` global con SearchBar + CTAs.
- [ ] T069 [P] [US5] `error.tsx` global (500 amigable).

## Phase 8: US6 — Launch checklist (P1)
- [ ] T070 [US6] Crear `LAUNCH.md` con checklist detallado:
  - DNS + SSL válido en apex + www.
  - Redirect www → apex.
  - Sitemap sometido en GSC + Bing.
  - Plausible dominio confirmado.
  - Sentry receiving.
  - Better Stack uptime configurado.
  - Neon backups habilitados.
  - Todos los crons con último run OK (`/admin/ingest-status`).
  - Rich Results Test OK en 3 productos.
  - Lighthouse ≥ 95 en producción real.
  - CoreWebVitals p75 dentro de target (Chrome UX Report o `web-vitals` package).
  - 404 / 500 amigables verificados.
  - `security.txt` accesible.
  - Contenidos legales revisados por owner.
  - Take-down form testeado.
  - Rate-limit endpoints verificados.
  - Cache Redis operativo.
  - Env vars prod completas.
  - Feature flags: sólo habilitadas las que corresponden al MVP.
  - Documentación de runbook: qué hacer si cae una cadena, si Sentry alerta, si un abuso masivo.
  - Alerta si `/health` responde no-200.
  - Comunicación: post en LinkedIn/X + Producthunt draft.
  - Analytics baseline capturado.
  - Backups scripted verificados.
  - Load test de smoke pre-launch (`k6` sobre `/` y `/ofertas`).
- [ ] T071 [US6] Marcar los 25 items 100 % antes de anunciar.

## Phase 9: Polish
- [ ] T080 [P] Redirects legacy si aplica (`/products/*` → `/producto/*`).
- [ ] T081 [P] Optimización de imagenes: convertir a AVIF/WebP en pipeline.
- [ ] T082 [P] Font: `next/font` con `preload` y `font-display: swap`.
- [ ] T083 [P] Prefetch strategy: `<Link prefetch>` selectivo.
- [ ] T084 Constitution Check final para el proyecto.

## Definition of Done
- [ ] Lighthouse ≥ 95 en las 5 rutas.
- [ ] CWV p75 dentro de target.
- [ ] Sitemap indexado por Google.
- [ ] Rich Results válidos.
- [ ] Analytics recibiendo eventos.
- [ ] Legales publicadas.
- [ ] LAUNCH.md al 100 %.
- [ ] Anuncio publicado.
