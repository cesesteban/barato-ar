---
teamctl: project-overview
project_id: 37-bot-pedidos-ya
status: onboarded
stack: node-fullstack
updated_at: 2026-11-08T21:52:14.333024+00:00
---

# Project Overview - 37-bot-pedidos-ya

> Estado: **onboarded** | Stack: **node-fullstack** | Features implementadas: **2/15**

<details>
<summary>Indice del documento</summary>

1. Resumen ejecutivo
2. Identidad y clasificacion
3. Stack y senales
4. Features y progreso
5. Tareas pendientes
6. Estado del repositorio
7. Control plane y actualizacion

</details>

## 1. Resumen ejecutivo

| Indicador | Estado |
|---|---|
| Control plane | ONBOARDED |
| Tipo de producto | product |
| Tipo de aplicacion | web application or full-stack app |
| Equipo recomendado | standard-product-squad |
| Workflow | new-product-feature |
| Tareas pendientes | **559** |

## 2. Identidad y clasificacion

| Campo | Valor |
|---|---|
| ID | 37-bot-pedidos-ya |
| Nombre | 37-bot-pedidos-ya |
| Ruta | D:\PersonalWS\37-bot-pedidos-ya |
| Tipo | product |
| Presupuesto soft | 100 USD |
| Presupuesto hard | 150 USD |

## 3. Stack y senales

> **Razon de deteccion:** Node/JavaScript project markers detected

| Evidencia | Resultado |
|---|---|
| Stack | node-fullstack |
| Marcadores | package.json, docker-compose.yml, .github/workflows, tests, src, docs, specs |
| Senales | has_package_json, has_docker_compose |

## 4. Features y progreso

| Feature | Estado | Progreso | Ubicacion |
|---|---|---|---|
| Feature Specification: Foundation Scaffold (001-foundation-scaffold) | PLANIFICADA | ---------- 0/78 | specs/001-foundation-scaffold |
| Feature Specification: Design System & Primitives (002-design-system) | PLANIFICADA | ---------- 0/64 | specs/002-design-system |
| Feature Specification: Ingest Supermarket Flyers (003-ingest-super-flyers) | PLANIFICADA | ---------- 0/51 | specs/003-ingest-super-flyers |
| Feature Specification: Ingest Precios Claros (SEPA) (004-ingest-precios-claros) | PLANIFICADA | ---------- 0/37 | specs/004-ingest-precios-claros |
| Feature Specification: Product Normalizer (005-product-normalizer) | PLANIFICADA | ---------- 0/28 | specs/005-product-normalizer |
| Feature Specification: Product Search (006-product-search) | PLANIFICADA | ---------- 0/39 | specs/006-product-search |
| Feature Specification: Product Comparison Page (007-product-comparison-page) | PLANIFICADA | ---------- 0/44 | specs/007-product-comparison-page |
| Feature Specification: Offers Feed (Home + Listing) (008-offers-feed) | PLANIFICADA | ---------- 0/49 | specs/008-offers-feed |
| Feature Specification: Price Alerts (Email-only) (009-price-alerts-email) | PLANIFICADA | ---------- 0/45 | specs/009-price-alerts-email |
| Feature Specification: Price History & Charts (010-price-history-charts) | PLANIFICADA | ---------- 0/28 | specs/010-price-history-charts |
| Feature Specification: Community Reports (Report an Offer) (011-community-reports) | PLANIFICADA | ---------- 0/45 | specs/011-community-reports |
| Feature Specification: SEO, Performance & Launch (012-seo-launch-polish) | PLANIFICADA | ---------- 0/51 | specs/012-seo-launch-polish |
| Feature Specification: Fix zone_id NULL en todos los stores (B-01) (018-fix-zone-id-null) | PLANIFICADA | ---------- 0/0 | specs/018-fix-zone-id-null |
| Feature Specification: "Ir a la tienda" lleva al producto real en el sitio de la cadena (019-store-product-links) | IMPLEMENTADA (implemented) | ########## 45/45 | specs/019-store-product-links |
| Feature Specification: Calidad de nombres de productos (F020) (020-product-naming-quality) | IMPLEMENTADA (implemented) | ########## 51/51 | specs/020-product-naming-quality |

## 5. Tareas pendientes

- [ ] specs/001-foundation-scaffold/tasks.md:7 - T001 Crear repo Git con `.gitignore` (Next.js + node + `.env*` + `.vercel`).
- [ ] specs/001-foundation-scaffold/tasks.md:8 - T002 `pnpm init` y agregar `packageManager` fijo (`pnpm@9.x`).
- [ ] specs/001-foundation-scaffold/tasks.md:9 - T003 [P] Crear `.env.example` con todas las vars documentadas.
- [ ] specs/001-foundation-scaffold/tasks.md:10 - T004 [P] Crear `docs/adr/0001-stack.md` (por qué Next.js + Prisma + Neon + Vercel).
- [ ] specs/001-foundation-scaffold/tasks.md:14 - T010 Instalar Next.js 15 App Router (`create-next-app` con TS + Tailwind + App Router).
- [ ] specs/001-foundation-scaffold/tasks.md:15 - T011 Configurar `tsconfig.json` con `strict:true`, `noUncheckedIndexedAccess:true`, `exactOptionalPropertyTypes:true`, `moduleResolution: "bundler"`.
- [ ] specs/001-foundation-scaffold/tasks.md:16 - T012 [P] Configurar ESLint (`next/core-web-vitals` + `@typescript-eslint/strict`).
- [ ] specs/001-foundation-scaffold/tasks.md:17 - T013 [P] Configurar Prettier + `.editorconfig`.
- [ ] specs/001-foundation-scaffold/tasks.md:18 - T014 [P] Instalar Zod y crear `src/lib/env.ts` con schema validado al boot.
- [ ] specs/001-foundation-scaffold/tasks.md:19 - T015 Instalar Prisma 5, `pnpm prisma init`, apuntar `schema.prisma` a Neon.
- [ ] specs/001-foundation-scaffold/tasks.md:20 - T016 Habilitar extensiones `pg_trgm` y `pgvector` en `schema.prisma` (`previewFeatures = ["postgresqlExtensions"]`).
- [ ] specs/001-foundation-scaffold/tasks.md:21 - T017 Escribir modelo `AppMeta` en `schema.prisma`. Correr `pnpm prisma migrate dev --name init`.
- [ ] specs/001-foundation-scaffold/tasks.md:22 - T018 Crear singleton en `src/lib/db.ts` (guard para hot-reload).
- [ ] specs/001-foundation-scaffold/tasks.md:23 - T019 [P] Instalar Tailwind (viene con `create-next-app`) y verificar `globals.css`.
- [ ] specs/001-foundation-scaffold/tasks.md:24 - T020 [P] Inicializar shadcn/ui (`pnpm dlx shadcn@latest init`) con paleta neutral base.
- [ ] specs/001-foundation-scaffold/tasks.md:25 - T021 [P] Instalar Lucide Icons.
- [ ] specs/001-foundation-scaffold/tasks.md:33 - T030 [P] [US1] Escribir `tests/unit/env.test.ts` — Zod falla si falta var requerida.
- [ ] specs/001-foundation-scaffold/tasks.md:34 - T031 [P] [US1] Escribir `tests/e2e/smoke.spec.ts` — `/` 200 + `/health` 200 + `db=connected`.
- [ ] specs/001-foundation-scaffold/tasks.md:38 - T032 [US1] Implementar `src/app/page.tsx` — landing minimal con `<h1>Precioya</h1>` + link a `/health`.
- [ ] specs/001-foundation-scaffold/tasks.md:39 - T033 [US1] Implementar `src/app/health/route.ts` — query a `AppMeta`, responde JSON con `status`, `db`, `commit`, `version`, `timestamp`.
- [ ] specs/001-foundation-scaffold/tasks.md:40 - T034 [US1] Implementar `src/app/layout.tsx` — meta tags base, viewport, `<html lang="es-AR">`.
- [ ] specs/001-foundation-scaffold/tasks.md:41 - T035 [P] [US1] Implementar `src/app/robots.ts` y `src/app/sitemap.ts` (vacío por ahora).
- [ ] specs/001-foundation-scaffold/tasks.md:42 - T036 [US1] Crear scripts en `package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:studio`.
- [ ] specs/001-foundation-scaffold/tasks.md:43 - T037 [US1] Correr smoke local: `pnpm dev` → visitar `/` y `/health`.
- [ ] specs/001-foundation-scaffold/tasks.md:53 - T040 [US2] Crear `.github/workflows/ci.yml` con jobs `lint`, `typecheck`, `test`, `build`, `e2e`.
- [ ] specs/001-foundation-scaffold/tasks.md:54 - T041 [US2] Configurar `pnpm/action-setup@v4` + cache de pnpm store.
- [ ] specs/001-foundation-scaffold/tasks.md:55 - T042 [US2] Configurar branch DB de Neon efímero para el job `e2e` (usando `neondatabase/create-branch-action`).
- [ ] specs/001-foundation-scaffold/tasks.md:56 - T043 [US2] Agregar `.github/workflows/db-migrate-prod.yml` — corre `prisma migrate deploy` en push a `main` ANTES del deploy Vercel.
- [ ] specs/001-foundation-scaffold/tasks.md:57 - T044 [US2] Configurar branch protection en `main`: require CI verde + 1 review.
- [ ] specs/001-foundation-scaffold/tasks.md:58 - T045 [P] [US2] Agregar `pnpm audit` como job informativo (warn, no fail).
- [ ] specs/001-foundation-scaffold/tasks.md:68 - T050 [US3] Conectar el repo a Vercel via CLI o dashboard.
- [ ] specs/001-foundation-scaffold/tasks.md:69 - T051 [US3] Configurar env vars en Vercel (Production, Preview, Development).
- [ ] specs/001-foundation-scaffold/tasks.md:70 - T052 [US3] Configurar Neon branching en Vercel integration.
- [ ] specs/001-foundation-scaffold/tasks.md:71 - T053 [US3] Verificar preview URL en un PR de prueba.
- [ ] specs/001-foundation-scaffold/tasks.md:72 - T054 [US3] Verificar prod deploy tras merge a `main`.
- [ ] specs/001-foundation-scaffold/tasks.md:82 - T060 [US4] Instalar `@sentry/nextjs` con wizard (`pnpm dlx @sentry/wizard@latest -i nextjs`).
- [ ] specs/001-foundation-scaffold/tasks.md:83 - T061 [US4] Editar `src/lib/sentry.ts` con `tracesSampleRate: 0.1`, tag `environment`, tag `release: process.env.VERCEL_GIT_COMMIT_SHA`.
- [ ] specs/001-foundation-scaffold/tasks.md:84 - T062 [US4] Crear endpoint efímero `/debug/throw` (removido antes de merge) que arroja.
- [ ] specs/001-foundation-scaffold/tasks.md:85 - T063 [US4] Deploy preview + hit al endpoint + ver evento en Sentry.
- [ ] specs/001-foundation-scaffold/tasks.md:86 - T064 [US4] Eliminar `/debug/throw` y agregar test que garantiza que no existe en prod.
- [ ] specs/001-foundation-scaffold/tasks.md:95 - T065 Agregar `REVALIDATE_SECRET` a `src/lib/env.ts` y `.env.example`.
- [ ] specs/001-foundation-scaffold/tasks.md:96 - T066 Implementar `src/app/api/revalidate/route.ts` (POST, header `x-revalidate-secret`, llama a `revalidateTag()`).
- [ ] specs/001-foundation-scaffold/tasks.md:97 - T067 [P] Test integración: POST con secret ok → 200; secret malo → 403.
- [ ] specs/001-foundation-scaffold/tasks.md:100 - T068 Crear buckets `barato-ar-products` (público, custom domain `img.barato.ar`) y `barato-ar-reports` (privado). Documentar en `docs/dev.md`.
- [ ] specs/001-foundation-scaffold/tasks.md:101 - T069 Agregar env vars R2 a `env.ts` + `.env.example`.
- [ ] specs/001-foundation-scaffold/tasks.md:102 - T070 Instalar `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner`.
- [ ] specs/001-foundation-scaffold/tasks.md:103 - T071 Implementar `src/lib/storage.ts` con `uploadImage(bucket, key, buffer, contentType)`, `deleteImage(bucket, key)`, `getPresignedUrl(bucket, key, ttl)`.
- [ ] specs/001-foundation-scaffold/tasks.md:104 - T072 [P] Unit test contra un mock S3 (aws-sdk-client-mock) — no toca R2 real.
- [ ] specs/001-foundation-scaffold/tasks.md:107 - T073 Instalar `next-auth@beta`, `@auth/prisma-adapter`, `nodemailer`.
- [ ] specs/001-foundation-scaffold/tasks.md:108 - T074 Agregar modelos `User`, `Account`, `Session`, `VerificationToken` a `schema.prisma` + migration.
- [ ] specs/001-foundation-scaffold/tasks.md:109 - T075 Escribir `src/lib/auth.ts` con `EmailProvider` (Resend SMTP), `PrismaAdapter`, callback `authorized` gateando `/admin/*`.
- [ ] specs/001-foundation-scaffold/tasks.md:110 - T076 Crear `src/middleware.ts` que exporta `auth` para gating.
- [ ] specs/001-foundation-scaffold/tasks.md:111 - T077 Escribir `src/app/api/auth/[...nextauth]/route.ts` que re-exporta `handlers`.
- [ ] specs/001-foundation-scaffold/tasks.md:112 - T078 Crear `/admin/page.tsx` placeholder que muestra el email del user autenticado.
- [ ] specs/001-foundation-scaffold/tasks.md:113 - T079 [P] Playwright: acceso a `/admin` sin login → redirect a `/api/auth/signin`.
- [ ] specs/001-foundation-scaffold/tasks.md:116 - T080 [P] Implementar `src/lib/http-retry.ts` con `fetchWithRetry(url, opts)` (delays 1s/4s/15s, no reintenta 4xx, Sentry warning final).
- [ ] specs/001-foundation-scaffold/tasks.md:117 - T081 [P] Unit test con fetch mockeado: 2 fallos → succeed en 3ro; 3 fallos → throw + Sentry.
- [ ] specs/001-foundation-scaffold/tasks.md:120 - T082 Registrar `barato.ar` en el registrar (fuera de código, documentar en `LAUNCH.md`).
- [ ] specs/001-foundation-scaffold/tasks.md:121 - T083 [P] Documentar records DNS en `docs/dns.md` (SPF, DKIM, DMARC values del dashboard Resend).
- [ ] specs/001-foundation-scaffold/tasks.md:122 - T084 Verificar dominio en Resend dashboard.
- [ ] specs/001-foundation-scaffold/tasks.md:123 - T085 [P] Test smoke: enviar email de prueba desde `alertas@barato.ar` a inbox del owner; verificar delivery + SPF/DKIM en headers.
- [ ] specs/001-foundation-scaffold/tasks.md:126 - T086 [P] `package.json` name = `barato-ar`, description con "Comparador de ofertas AR".
- [ ] specs/001-foundation-scaffold/tasks.md:127 - T087 [P] `metadataBase` = `https://barato.ar` en layout.
- [ ] specs/001-foundation-scaffold/tasks.md:128 - T088 [P] Título default = "Barato.ar — Comparador de ofertas".
- [ ] specs/001-foundation-scaffold/tasks.md:129 - T089 [P] Favicon + `og-default.png` con logo "Barato.ar".
- [ ] specs/001-foundation-scaffold/tasks.md:133 - T090 [P] Escribir README con setup en < 5 min (incluye env vars R2, Auth.js, Resend, Neon).
- [ ] specs/001-foundation-scaffold/tasks.md:134 - T091 [P] Documentar comandos de dev en `docs/dev.md`.
- [ ] specs/001-foundation-scaffold/tasks.md:135 - T092 [P] Agregar `CODEOWNERS` (dueño del repo).
- [ ] specs/001-foundation-scaffold/tasks.md:136 - T093 [P] Instalar Plausible via env var (script en `src/lib/analytics.tsx`, incluido solo en prod).
- [ ] specs/001-foundation-scaffold/tasks.md:137 - T094 [P] Configurar Better Stack ping a `/health` (out of scope de código pero documentado en README).
- [ ] specs/001-foundation-scaffold/tasks.md:138 - T095 Correr `pnpm build && pnpm start` + Lighthouse en `/` — target ≥ 95.
- [ ] specs/001-foundation-scaffold/tasks.md:148 - Todos los tests verde.
- [ ] specs/001-foundation-scaffold/tasks.md:149 - Lighthouse ≥ 95 en `/`.
- [ ] specs/001-foundation-scaffold/tasks.md:150 - Preview URL funcionando.
- [ ] specs/001-foundation-scaffold/tasks.md:151 - Prod desplegada.
- [ ] specs/001-foundation-scaffold/tasks.md:152 - Sentry recibiendo eventos.
- [ ] specs/001-foundation-scaffold/tasks.md:153 - README completo.
- [ ] specs/001-foundation-scaffold/tasks.md:154 - Constitution Check re-verificado (sin nuevas violaciones).
- [ ] specs/002-design-system/tasks.md:7 - T001 Instalar deps: `class-variance-authority`, `tailwind-merge`, `clsx`, `@radix-ui/react-*` (según primitives), `lucide-react`.
- [ ] specs/002-design-system/tasks.md:8 - T002 [P] Crear `src/lib/cn.ts` (clsx + twMerge).
- [ ] specs/002-design-system/tasks.md:9 - T003 [P] Crear `src/lib/format-price.ts` con formato `es-AR` (`$1.234`).
- [ ] specs/002-design-system/tasks.md:10 - T004 Configurar `next/font` con Inter (variable, `display: "swap"`).
- [ ] specs/002-design-system/tasks.md:14 - T010 Crear `src/styles/tokens.css` con todas las CSS vars del plan.
- [ ] specs/002-design-system/tasks.md:15 - T011 Importar `tokens.css` en `globals.css` antes de `@tailwind`.
- [ ] specs/002-design-system/tasks.md:16 - T012 Configurar `tailwind.config.ts` para mapear tokens en `theme.extend.colors`, `spacing`, `borderRadius`, `boxShadow`.
- [ ] specs/002-design-system/tasks.md:17 - T013 [P] Agregar ESLint rule custom o `stylelint` que prohíbe colores hex fuera de `tokens.css`.
- [ ] specs/002-design-system/tasks.md:18 - T014 Setup Storybook: `pnpm dlx storybook@latest init` + `@storybook/nextjs`.
- [ ] specs/002-design-system/tasks.md:19 - T015 Instalar addons: `@storybook/addon-a11y`, `@storybook/addon-viewport`.
- [ ] specs/002-design-system/tasks.md:20 - T016 Configurar viewports Storybook: mobile 375, tablet 768, desktop 1440.
- [ ] specs/002-design-system/tasks.md:30 - T020 [P] [US1] `Button` (variants + sizes) en `src/components/ui/button.tsx`.
- [ ] specs/002-design-system/tasks.md:31 - T021 [P] [US1] `IconButton` con `aria-label` requerido a nivel type.
- [ ] specs/002-design-system/tasks.md:32 - T022 [P] [US1] `Card`, `CardHeader`, `CardBody`, `CardFooter`.
- [ ] specs/002-design-system/tasks.md:33 - T023 [P] [US1] `Badge`.
- [ ] specs/002-design-system/tasks.md:34 - T024 [P] [US1] `Chip` (con `removable`).
- [ ] specs/002-design-system/tasks.md:35 - T025 [P] [US1] `Input` + `Label`.
- [ ] specs/002-design-system/tasks.md:36 - T026 [P] [US1] `Select` (Radix wrapper).
- [ ] specs/002-design-system/tasks.md:37 - T027 [P] [US1] `Checkbox`, `Radio`, `Toggle`.
- [ ] specs/002-design-system/tasks.md:38 - T028 [P] [US1] `Alert`.
- [ ] specs/002-design-system/tasks.md:39 - T029 [P] [US1] `Skeleton`.
- [ ] specs/002-design-system/tasks.md:40 - T030 [P] [US1] `Tooltip`, `Popover`, `Dialog` (Radix).
- [ ] specs/002-design-system/tasks.md:41 - T031 [P] [US1] `VisuallyHidden`.
- [ ] specs/002-design-system/tasks.md:42 - T032 [US1] Barrel export en `src/components/ui/index.ts`.
- [ ] specs/002-design-system/tasks.md:46 - T033 [P] [US1] `PriceTag` con `format-price` + prop `pricePerUnit?: {value; unit}` (C-003).
- [ ] specs/002-design-system/tasks.md:47 - T034 [P] [US1] `DiscountBadge`.
- [ ] specs/002-design-system/tasks.md:48 - T034b [P] [US1] `PromoBadge` con variantes por `PromoType` (C-001: nx1, nxm, second_off, bundle_discount).
- [ ] specs/002-design-system/tasks.md:49 - T034c [P] [US1] `NeighborsToggle` chip (C-002).
- [ ] specs/002-design-system/tasks.md:50 - T035 [P] [US1] `ChainBadge` (con mapping slug → nombre + estilo placeholder).
- [ ] specs/002-design-system/tasks.md:51 - T036 [US1] `DealCard` (desktop grid card, ver wireframe).
- [ ] specs/002-design-system/tasks.md:52 - T037 [US1] `DealCardCompact` (mobile horizontal card).
- [ ] specs/002-design-system/tasks.md:53 - T038 [US1] `SearchBar` con slot para dropdown de resultados.
- [ ] specs/002-design-system/tasks.md:54 - T039 [US1] `ZoneChip`.
- [ ] specs/002-design-system/tasks.md:55 - T040 [US1] `AlertCard` (form email + precio target).
- [ ] specs/002-design-system/tasks.md:56 - T041 [US1] `PriceComparisonRow` (fila comparativa).
- [ ] specs/002-design-system/tasks.md:57 - T042 [US1] `PriceHistoryChart` (SVG line chart SSR-safe — placeholder para Feature 10).
- [ ] specs/002-design-system/tasks.md:61 - T045 [US1] `PageShell` (wrapper con tokens + font).
- [ ] specs/002-design-system/tasks.md:62 - T046 [US1] `Nav` (desktop).
- [ ] specs/002-design-system/tasks.md:63 - T047 [US1] `Footer`.
- [ ] specs/002-design-system/tasks.md:64 - T048 [US1] `MobileBottomNav`.
- [ ] specs/002-design-system/tasks.md:68 - T050 [P] [US1] Unit test cada primitive: renders + variants correctas.
- [ ] specs/002-design-system/tasks.md:69 - T051 [P] [US1] Unit test `format-price` (negativos, ceros, decimales).
- [ ] specs/002-design-system/tasks.md:70 - T052 [US1] Playwright + axe: página de prueba con Nav + 3 DealCards + Footer → 0 errores.
- [ ] specs/002-design-system/tasks.md:71 - T053 [US1] Test keyboard navigation en `DealCard` (tab order, focus-visible).
- [ ] specs/002-design-system/tasks.md:79 - T060 [P] [US2] Story de cada primitive con todas las variantes.
- [ ] specs/002-design-system/tasks.md:80 - T061 [P] [US2] Story de cada domain component (data mockeada).
- [ ] specs/002-design-system/tasks.md:81 - T062 [P] [US2] Story de `PageShell + Nav + Feed mock` (integración).
- [ ] specs/002-design-system/tasks.md:82 - T063 [US2] Configurar `test-storybook` en CI (`pnpm test-storybook --browsers chromium`).
- [ ] specs/002-design-system/tasks.md:83 - T064 [US2] Deploy Storybook a Vercel preview (opt, un subproyecto vercel para storybook static).
- [ ] specs/002-design-system/tasks.md:91 - T070 [US3] Definir todos los tokens equivalentes en `[data-theme="dark"]`.
- [ ] specs/002-design-system/tasks.md:92 - T071 [US3] Agregar toggle en Storybook (addon-themes o custom).
- [ ] specs/002-design-system/tasks.md:93 - T072 [US3] Verificar visualmente cada story en dark; ajustar contrastes.
- [ ] specs/002-design-system/tasks.md:94 - T073 [US3] Documentar en `docs/design/dark-mode.md` que dark queda para post-MVP en app.
- [ ] specs/002-design-system/tasks.md:102 - T080 [P] `docs/design/tokens.md` con tabla de tokens y su uso.
- [ ] specs/002-design-system/tasks.md:103 - T081 [P] `docs/design/component-catalog.md` con thumbnails y ejemplos.
- [ ] specs/002-design-system/tasks.md:104 - T082 [P] `docs/design/a11y.md` con reglas del design system.
- [ ] specs/002-design-system/tasks.md:105 - T083 Medir bundle CSS con `next build` → objetivo < 20 KB gz.
- [ ] specs/002-design-system/tasks.md:106 - T084 Purga: eliminar variantes shadcn no usadas.
- [ ] specs/002-design-system/tasks.md:107 - T085 Confirmar Constitution Check al final.
- [ ] specs/002-design-system/tasks.md:119 - Todos los primitives + domain + layouts implementados.
- [ ] specs/002-design-system/tasks.md:120 - Storybook con 0 errores axe.
- [ ] specs/002-design-system/tasks.md:121 - Playwright integration a11y verde.
- [ ] specs/002-design-system/tasks.md:122 - Bundle CSS < 20 KB gz.
- [ ] specs/002-design-system/tasks.md:123 - Docs de tokens, catálogo y a11y publicadas.
- [ ] specs/003-ingest-super-flyers/tasks.md:7 - T001 Instalar deps: `cheerio`, `pdf-parse`, `undici`, `commander`, `robotstxt-parser`, `@sentry/node`.
- [ ] specs/003-ingest-super-flyers/tasks.md:8 - T002 Crear estructura `src/ingestion/` según plan.
- [ ] specs/003-ingest-super-flyers/tasks.md:9 - T003 [P] Seed inicial de cadenas: `pnpm db:seed:chains` (Carrefour, Coto, Día, Jumbo).
- [ ] specs/003-ingest-super-flyers/tasks.md:13 - T010 Actualizar `prisma/schema.prisma` con: `Chain`, `Zone`, `Store`, `Product` (incl. `standardSize`, `standardUnit`, `packagingFlag`), `Price` (incl. `promoType`, `promoBuyQty/PayQty`, `promoSecondDiscountPct`, `promoDescription`, `pricePerUnit`, `pricePerUnitEff`), `PriceHistory`, `Offer`, `IngestionRun` + enums (incl. `PromoType`).
- [ ] specs/003-ingest-super-flyers/tasks.md:14 - T011 Crear migración `prisma migrate dev --name core_schema`.
- [ ] specs/003-ingest-super-flyers/tasks.md:15 - T012 Seed inicial: 4 chains + 4 stores virtuales (`isVirtual = true, zoneId = null`).
- [ ] specs/003-ingest-super-flyers/tasks.md:16 - T013 [P] Escribir `src/ingestion/core/normalize.ts` — normaliza nombre (lowercase, unaccent, tokens ordenados alfabéticamente) + detecta `packagingFlag` (retornable/descartable/light/zero…).
- [ ] specs/003-ingest-super-flyers/tasks.md:17 - T013b [P] Escribir `src/lib/units.ts` — `computeStandardUnit(size, unit)` y `computePricePerUnit(price, standardSize)` (C-003).
- [ ] specs/003-ingest-super-flyers/tasks.md:18 - T013c [P] Escribir `src/lib/promo.ts` — `computeEffectiveUnitPrice(price, promoType, promoBuyQty, promoPayQty, promoSecondDiscountPct)` (C-001).
- [ ] specs/003-ingest-super-flyers/tasks.md:19 - T013d [P] Escribir `src/ingestion/core/parse-promo.ts` — reconoce patrones de combo en texto de folleto (`2x1`, `3x2`, `LLEVA 3 PAGA 2`, `2do al 70%`, `3 iguales 20%`).
- [ ] specs/003-ingest-super-flyers/tasks.md:20 - T014 [P] Escribir `src/ingestion/core/http.ts` — undici + rate-limit + robots.txt.
- [ ] specs/003-ingest-super-flyers/tasks.md:21 - T015 [P] Escribir `src/ingestion/core/idempotency.ts` — upsert helpers.
- [ ] specs/003-ingest-super-flyers/tasks.md:22 - T016 Escribir `src/ingestion/core/runner.ts` — orquestador con logging + Sentry + llamadas a compute helpers.
- [ ] specs/003-ingest-super-flyers/tasks.md:23 - T017 Escribir `src/ingestion/core/cli.ts` — `pnpm ingest <chain>` con commander.
- [ ] specs/003-ingest-super-flyers/tasks.md:24 - T017b [P] Tests unit `parse-promo.test.ts` con snapshots de textos reales de folletos.
- [ ] specs/003-ingest-super-flyers/tasks.md:25 - T017c [P] Tests unit `units.test.ts` (ml→L, g→kg, x4 rollos, 6-pack lata).
- [ ] specs/003-ingest-super-flyers/tasks.md:26 - T017d [P] Tests unit `promo.test.ts` para cada `PromoType`.
- [ ] specs/003-ingest-super-flyers/tasks.md:36 - T020 [P] [US1] Descargar folleto Carrefour semana actual → guardar como fixture en `tests/fixtures/flyers/carrefour/YYYY-WW.html`.
- [ ] specs/003-ingest-super-flyers/tasks.md:37 - T021 [P] [US1] Escribir test `parser.test.ts` — parse(fixture) → snapshot; asserts sobre estructura.
- [ ] specs/003-ingest-super-flyers/tasks.md:38 - T022 [P] [US1] Test `idempotency.test.ts` — dos corridas contra fixture → mismo count.
- [ ] specs/003-ingest-super-flyers/tasks.md:42 - T023 [US1] `src/ingestion/chains/carrefour/fetcher.ts` — descubre URL del folleto vigente.
- [ ] specs/003-ingest-super-flyers/tasks.md:43 - T024 [US1] `src/ingestion/chains/carrefour/parser.ts` — cheerio + heurísticas para extraer `ParsedItem[]`.
- [ ] specs/003-ingest-super-flyers/tasks.md:44 - T025 [US1] `src/ingestion/chains/carrefour/index.ts` — export `ChainParser`.
- [ ] specs/003-ingest-super-flyers/tasks.md:45 - T026 [US1] Registrar Carrefour en el runner.
- [ ] specs/003-ingest-super-flyers/tasks.md:46 - T027 [US1] Correr localmente `pnpm ingest carrefour` contra DB dev; verificar rows.
- [ ] specs/003-ingest-super-flyers/tasks.md:54 - T030 [P] [US1] Fixture + parser Coto.
- [ ] specs/003-ingest-super-flyers/tasks.md:55 - T031 [P] [US1] Fixture + parser Día.
- [ ] specs/003-ingest-super-flyers/tasks.md:56 - T032 [P] [US1] Fixture + parser Jumbo (Cencosud → similar a Vea y Disco, se agregarán en F04).
- [ ] specs/003-ingest-super-flyers/tasks.md:57 - T033 [US1] Registrar los 3 en runner y verificar.
- [ ] specs/003-ingest-super-flyers/tasks.md:65 - T040 [US2] Crear `.github/workflows/ingest-flyers.yml` con cron lunes 8am ART y matrix por cadena.
- [ ] specs/003-ingest-super-flyers/tasks.md:66 - T041 [US2] Configurar secrets `DATABASE_URL_UNPOOLED`, `SENTRY_DSN_INGEST` en GH Actions.
- [ ] specs/003-ingest-super-flyers/tasks.md:67 - T042 [US2] Verificar corrida manual del workflow (`workflow_dispatch`).
- [ ] specs/003-ingest-super-flyers/tasks.md:68 - T043 [US2] Documentar el schedule en `docs/ingest/README.md`.
- [ ] specs/003-ingest-super-flyers/tasks.md:76 - T050 [US3] Crear página `src/app/admin/ingest-status/page.tsx` con auth por env token (middleware).
- [ ] specs/003-ingest-super-flyers/tasks.md:77 - T051 [US3] Query últimas 10 runs por cadena con `IngestionRun`.
- [ ] specs/003-ingest-super-flyers/tasks.md:78 - T052 [US3] Renderizar tabla: cadena, started_at, duration, status, rows, error.
- [ ] specs/003-ingest-super-flyers/tasks.md:79 - T053 [US3] Playwright test: login con token → tabla renderiza.
- [ ] specs/003-ingest-super-flyers/tasks.md:87 - T060 [US4] En `runner.ts`, tras finalizar, comparar `rowsIngested` vs corrida anterior exitosa.
- [ ] specs/003-ingest-super-flyers/tasks.md:88 - T061 [US4] Si delta < 0.8, `Sentry.captureMessage(warning)` con contexto.
- [ ] specs/003-ingest-super-flyers/tasks.md:89 - T062 [US4] Test: mock IngestionRun anterior con 500 rows; nueva con 300 → expect Sentry mock called.
- [ ] specs/003-ingest-super-flyers/tasks.md:97 - T070 [P] `docs/ingest/parser-authoring.md` — cómo agregar una cadena nueva.
- [ ] specs/003-ingest-super-flyers/tasks.md:98 - T071 [P] Métricas custom en `IngestionRun.metadata`: parser_version, snapshot_hash, http_timing.
- [ ] specs/003-ingest-super-flyers/tasks.md:99 - T072 [P] Refactor: extraer helpers de cheerio comunes (`parsePrice`, `parseSize`) a `core/parse-utils.ts`.
- [ ] specs/003-ingest-super-flyers/tasks.md:100 - T073 Correr `pnpm ingest` de todas las cadenas en secuencia; medir tiempo total (target < 15 min).
- [ ] specs/003-ingest-super-flyers/tasks.md:101 - T074 Constitution Check final.
- [ ] specs/003-ingest-super-flyers/tasks.md:112 - 4 parsers implementados y con snapshot tests.
- [ ] specs/003-ingest-super-flyers/tasks.md:113 - Ingesta semanal automática funcionando.
- [ ] specs/003-ingest-super-flyers/tasks.md:114 - Dashboard admin funcional.
- [ ] specs/003-ingest-super-flyers/tasks.md:115 - Alerta de caída ≥ 20 % verificada.
- [ ] specs/003-ingest-super-flyers/tasks.md:116 - > 400 rows totales por semana.
- [ ] specs/003-ingest-super-flyers/tasks.md:117 - Docs de parser authoring publicadas.
- [ ] specs/004-ingest-precios-claros/tasks.md:7 - T001 Instalar `csv-parse`, `zod` (ya está), `haversine-distance`.
- [ ] specs/004-ingest-precios-claros/tasks.md:8 - T002 Crear `src/ingestion/pcl/` según plan.
- [ ] specs/004-ingest-precios-claros/tasks.md:9 - T003 [P] Investigar URL oficial actual del dataset SEPA y documentar en `docs/ingest/sepa.md`.
- [ ] specs/004-ingest-precios-claros/tasks.md:10 - T004 Definir seed de zonas base en `prisma/seed/zones.ts` (CABA barrios + PBA GBA norte/oeste/sur).
- [ ] specs/004-ingest-precios-claros/tasks.md:14 - T010 Escribir `src/ingestion/pcl/manifest.ts` — fetch + parse manifest.json.
- [ ] specs/004-ingest-precios-claros/tasks.md:15 - T011 Escribir `src/ingestion/pcl/downloader.ts` — download CSV con retry y `Retry-After` honor.
- [ ] specs/004-ingest-precios-claros/tasks.md:16 - T012 [P] Escribir `src/ingestion/pcl/chains.ts` con mapeo `id_comercio → chainId`.
- [ ] specs/004-ingest-precios-claros/tasks.md:17 - T013 [P] Escribir `src/ingestion/pcl/zones.ts` con función `resolveZone(provincia, ciudad, localidad, lat, lng)`.
- [ ] specs/004-ingest-precios-claros/tasks.md:18 - T014 Escribir `src/ingestion/pcl/geo.ts` — `isInGBA(lat, lng)` con radio 50 km desde Obelisco.
- [ ] specs/004-ingest-precios-claros/tasks.md:19 - T015 Schemas Zod: `SepaSucursalSchema`, `SepaProductoSchema`, `SepaPrecioSchema` en `src/ingestion/pcl/schemas.ts`.
- [ ] specs/004-ingest-precios-claros/tasks.md:29 - T020 [P] [US1] Fixture `tests/fixtures/pcl/sucursales-sample.csv` (~30 rows mix CABA/PBA/Ushuaia).
- [ ] specs/004-ingest-precios-claros/tasks.md:30 - T021 [P] [US1] Fixture `precios-sample.csv` (~100 rows).
- [ ] specs/004-ingest-precios-claros/tasks.md:31 - T022 [P] [US1] Test `pcl.test.ts` — pipeline completo contra fixtures → assert counts.
- [ ] specs/004-ingest-precios-claros/tasks.md:35 - T023 [US1] Implementar `src/ingestion/pcl/stores.ts` — pass 1 (upsert Zone + Store).
- [ ] specs/004-ingest-precios-claros/tasks.md:36 - T024 [US1] Implementar `src/ingestion/pcl/products.ts` — pass 2 (upsert Product por EAN).
- [ ] specs/004-ingest-precios-claros/tasks.md:37 - T025 [US1] Implementar `src/ingestion/pcl/prices.ts` — pass 3 (streaming, upsert Price + PriceHistory).
- [ ] specs/004-ingest-precios-claros/tasks.md:38 - T026 [US1] Integrar en `src/ingestion/core/runner.ts` como fuente `pcl`.
- [ ] specs/004-ingest-precios-claros/tasks.md:39 - T027 [US1] `pnpm ingest pcl` funciona local contra dataset real; verificar > 5000 rows.
- [ ] specs/004-ingest-precios-claros/tasks.md:47 - T030 [US1] Crear `.github/workflows/ingest-pcl.yml` (cron martes 8am ART, `workflow_dispatch`).
- [ ] specs/004-ingest-precios-claros/tasks.md:48 - T031 [US1] Configurar `timeout-minutes: 30`.
- [ ] specs/004-ingest-precios-claros/tasks.md:49 - T032 [US1] Correr `workflow_dispatch` manual y verificar rows en prod.
- [ ] specs/004-ingest-precios-claros/tasks.md:57 - T040 [US2] Confirmar que `stores` post-corrida tiene > 200 rows con `is_virtual = false`.
- [ ] specs/004-ingest-precios-claros/tasks.md:58 - T041 [US2] Confirmar que `zones` tiene > 20 rows con jerarquía correcta.
- [ ] specs/004-ingest-precios-claros/tasks.md:59 - T042 [US2] Test `zones.test.ts` — casos: "Palermo" → `caba-palermo`, "Morón" → `pba-gba-oeste`.
- [ ] specs/004-ingest-precios-claros/tasks.md:60 - T043 [US2] Correr script `pnpm db:validate:zones` para detectar sucursales sin zona asignada.
- [ ] specs/004-ingest-precios-claros/tasks.md:68 - T050 [US3] En `prices.ts`, agregar check de `existingFlyer` antes de upsert.
- [ ] specs/004-ingest-precios-claros/tasks.md:69 - T051 [US3] Test `dedup.test.ts` — mock `Price` con `source='flyer'` → PCL skip.
- [ ] specs/004-ingest-precios-claros/tasks.md:70 - T052 [US3] Correr F03 + F04 en secuencia contra DB dev; query dedup:
- [ ] specs/004-ingest-precios-claros/tasks.md:83 - T060 [P] `docs/ingest/sepa.md` con endpoints, formato y troubleshooting.
- [ ] specs/004-ingest-precios-claros/tasks.md:84 - T061 [P] Alerta si manifest.json cambia formato (schema violation).
- [ ] specs/004-ingest-precios-claros/tasks.md:85 - T062 [P] Considerar chunking del pass 3 en batches de 1000 para reducir memoria.
- [ ] specs/004-ingest-precios-claros/tasks.md:86 - T063 Constitution Check final.
- [ ] specs/004-ingest-precios-claros/tasks.md:90 - > 5000 rows de PCL ingestados por semana.
- [ ] specs/004-ingest-precios-claros/tasks.md:91 - > 200 sucursales reales con lat/lng.
- [ ] specs/004-ingest-precios-claros/tasks.md:92 - 0 duplicados con folletos.
- [ ] specs/004-ingest-precios-claros/tasks.md:93 - Cron programado y verificado.
- [ ] specs/004-ingest-precios-claros/tasks.md:94 - Docs completos.
- [ ] specs/005-product-normalizer/tasks.md:4 - T001 Instalar `string-similarity` (Jaro-Winkler + Levenshtein).
- [ ] specs/005-product-normalizer/tasks.md:5 - T002 Crear `src/normalizer/` (index, matcher, features, merger).
- [ ] specs/005-product-normalizer/tasks.md:8 - T010 Migration: agregar `Product.canonicalId` self-ref + `NormalizerCandidate` + `NormalizerReject`.
- [ ] specs/005-product-normalizer/tasks.md:9 - T011 Índice `products(canonical_id)`.
- [ ] specs/005-product-normalizer/tasks.md:10 - T012 [P] Crear `tests/fixtures/normalizer/ground-truth.json` con 200 pares etiquetados.
- [ ] specs/005-product-normalizer/tasks.md:11 - T013 [P] Escribir `src/normalizer/features.ts` — jaroWinkler, sizeMatch, detectPackagingConflict.
- [ ] specs/005-product-normalizer/tasks.md:12 - T014 Escribir `src/normalizer/matcher.ts` — score + bucket.
- [ ] specs/005-product-normalizer/tasks.md:15 - T020 [US1] Implementar `src/normalizer/pass-ean.ts` con la query SQL del plan.
- [ ] specs/005-product-normalizer/tasks.md:16 - T021 [P] [US1] Test: 3 productos con mismo EAN → todos comparten `canonicalId`.
- [ ] specs/005-product-normalizer/tasks.md:17 - T022 [US1] Hook en runner F03/F04 post-ingest.
- [ ] specs/005-product-normalizer/tasks.md:20 - T030 [US2] Implementar `src/normalizer/pass-fuzzy.ts` con thresholds.
- [ ] specs/005-product-normalizer/tasks.md:21 - T031 [US2] Evaluar contra ground-truth: precision/recall ≥ 0.95/0.80.
- [ ] specs/005-product-normalizer/tasks.md:22 - T032 [P] [US2] Test packaging conflict: retornable vs no-retornable → confidence = 0.
- [ ] specs/005-product-normalizer/tasks.md:23 - T033 [P] [US2] Test size mismatch → no auto-merge.
- [ ] specs/005-product-normalizer/tasks.md:26 - T040 [US3] `src/app/admin/normalizer-queue/page.tsx` con lista + side-by-side.
- [ ] specs/005-product-normalizer/tasks.md:27 - T041 [US3] Endpoints `POST /api/admin/normalizer/candidates/:id/approve|reject`.
- [ ] specs/005-product-normalizer/tasks.md:28 - T042 [US3] Playwright test: aprobar en UI → canonical updated.
- [ ] specs/005-product-normalizer/tasks.md:29 - T043 [US3] Auth por env token (middleware).
- [ ] specs/005-product-normalizer/tasks.md:32 - T050 [US4] Script `pnpm normalize:full` corre pass 1 + 2 full.
- [ ] specs/005-product-normalizer/tasks.md:33 - T051 [US4] Workflow `.github/workflows/normalize-weekly.yml` (miércoles 3am ART).
- [ ] specs/005-product-normalizer/tasks.md:34 - T052 [US4] Verificar que aprobados en cola no se rompen tras recomputo.
- [ ] specs/005-product-normalizer/tasks.md:37 - T060 [P] Métrica: `/admin/normalizer-status` con canonical count, orphans, queue length.
- [ ] specs/005-product-normalizer/tasks.md:38 - T061 [P] Docs `docs/normalizer/algorithm.md`.
- [ ] specs/005-product-normalizer/tasks.md:39 - T062 Constitution Check.
- [ ] specs/005-product-normalizer/tasks.md:42 - Precision ≥ 0.98 en auto-matches.
- [ ] specs/005-product-normalizer/tasks.md:43 - > 70 % productos con canonical en 4 semanas.
- [ ] specs/005-product-normalizer/tasks.md:44 - Cola manual funcional.
- [ ] specs/005-product-normalizer/tasks.md:45 - Rollback de merge implementado.
- [ ] specs/006-product-search/tasks.md:4 - T001 Instalar `@upstash/redis` y configurar client.
- [ ] specs/006-product-search/tasks.md:5 - T002 Migration: extensiones `pg_trgm`, `unaccent` + índices GiST en products.
- [ ] specs/006-product-search/tasks.md:6 - T003 Migration: tabla `search_logs`.
- [ ] specs/006-product-search/tasks.md:9 - T010 [P] Crear `src/lib/redis.ts` (singleton Upstash).
- [ ] specs/006-product-search/tasks.md:10 - T011 [P] Crear `src/lib/hash.ts` — `ipHash(ip, dailySalt)`.
- [ ] specs/006-product-search/tasks.md:11 - T012 Crear `src/server/search/query.ts` con ranking query.
- [ ] specs/006-product-search/tasks.md:12 - T013 [P] Zod schemas de `SearchParams`, `SearchResult`, `Autocomplete` en `src/server/search/schemas.ts`.
- [ ] specs/006-product-search/tasks.md:16 - T020 [P] [US1] Seed test data en `tests/fixtures/search-seed.sql`.
- [ ] specs/006-product-search/tasks.md:17 - T021 [P] [US1] Test unit ranking: dataset con 5 productos → orden esperado.
- [ ] specs/006-product-search/tasks.md:18 - T022 [P] [US1] Test integration `/api/search?q=coca` → top 2 Coca-Cola.
- [ ] specs/006-product-search/tasks.md:21 - T023 [US1] Endpoint `src/app/api/search/route.ts` con Zod validate.
- [ ] specs/006-product-search/tasks.md:22 - T024 [US1] Implementar `src/server/search/service.ts` (call query + shape response + timing).
- [ ] specs/006-product-search/tasks.md:23 - T025 [US1] Log en `search_logs` cada request con `ipHash`.
- [ ] specs/006-product-search/tasks.md:24 - T026 [US1] Página `src/app/buscar/page.tsx` SSR con `?q=` param.
- [ ] specs/006-product-search/tasks.md:25 - T027 [US1] Meta tags de la página `<meta name="robots" content="noindex">`.
- [ ] specs/006-product-search/tasks.md:30 - T030 [US2] Endpoint `src/app/api/search/autocomplete/route.ts`.
- [ ] specs/006-product-search/tasks.md:31 - T031 [US2] Cache Redis 60 s por prefijo.
- [ ] specs/006-product-search/tasks.md:32 - T032 [US2] Componente `SearchBar` en `src/components/domain/search-bar.tsx` con debounce.
- [ ] specs/006-product-search/tasks.md:33 - T033 [US2] Dropdown con productos/marcas/categorías.
- [ ] specs/006-product-search/tasks.md:34 - T034 [US2] Keyboard nav (↑↓ Enter Esc) con `useReducer`.
- [ ] specs/006-product-search/tasks.md:35 - T035 [P] [US2] Test Playwright: escribir "coc" → dropdown aparece < 300 ms.
- [ ] specs/006-product-search/tasks.md:36 - T036 [P] [US2] Test Playwright: Enter → navigate.
- [ ] specs/006-product-search/tasks.md:37 - T037 [P] [US2] Test a11y: axe 0 errores en `SearchBar` con dropdown abierto.
- [ ] specs/006-product-search/tasks.md:42 - T040 [US3] Endpoint `/api/search/popular?zone={slug}` con Redis cache 5 min.
- [ ] specs/006-product-search/tasks.md:43 - T041 [US3] Query: top 10 queries de `search_logs` últimos 7d por zona.
- [ ] specs/006-product-search/tasks.md:44 - T042 [US3] Renderizar chips en dropdown cuando input vacío.
- [ ] specs/006-product-search/tasks.md:45 - T043 [US3] Guardar última búsqueda en localStorage y mostrar en empty state.
- [ ] specs/006-product-search/tasks.md:48 - T050 [US4] Query de `word_similarity` en `service.ts` cuando `total < 3`.
- [ ] specs/006-product-search/tasks.md:49 - T051 [US4] UI: "Buscabas 'X'? No encontramos nada. ¿Quisiste decir Y?"
- [ ] specs/006-product-search/tasks.md:50 - T052 [US4] Log `suggestion_shown` y `suggestion_clicked` en Plausible.
- [ ] specs/006-product-search/tasks.md:53 - T060 [P] Load test k6: 100 rps → p95 < 200 ms.
- [ ] specs/006-product-search/tasks.md:54 - T061 [P] Analytics Plausible custom events: `search`, `autocomplete_select`, `did_you_mean_click`.
- [ ] specs/006-product-search/tasks.md:55 - T062 [P] `docs/search/ranking.md` con explicación del algoritmo.
- [ ] specs/006-product-search/tasks.md:56 - T063 Constitution Check.
- [ ] specs/006-product-search/tasks.md:59 - p95 < 200 ms.
- [ ] specs/006-product-search/tasks.md:60 - Autocomplete < 300 ms.
- [ ] specs/006-product-search/tasks.md:61 - Ranking testeado.
- [ ] specs/006-product-search/tasks.md:62 - a11y 0 errores.
- [ ] specs/006-product-search/tasks.md:63 - Docs completos.
- [ ] specs/007-product-comparison-page/tasks.md:4 - T001 Añadir `Product.slug` unique en Prisma + migration + backfill de slugs desde `normalizedName`.
- [ ] specs/007-product-comparison-page/tasks.md:5 - T002 [P] Instalar `@vercel/og`, `date-fns`.
- [ ] specs/007-product-comparison-page/tasks.md:8 - T010 [P] Escribir `src/lib/slug.ts` — `slugify(name)` kebab-case sin acentos.
- [ ] specs/007-product-comparison-page/tasks.md:9 - T011 Backfill: script `pnpm slugs:backfill` genera slugs para todos los canonicales.
- [ ] specs/007-product-comparison-page/tasks.md:10 - T012 Endpoint helper `src/server/product/get-comparison.ts` con query raw.
- [ ] specs/007-product-comparison-page/tasks.md:11 - T013 [P] Type `ComparisonView` en `src/server/product/types.ts`.
- [ ] specs/007-product-comparison-page/tasks.md:15 - T020 [P] [US1] Seed test: 1 canonical con 3 stores.
- [ ] specs/007-product-comparison-page/tasks.md:16 - T021 [P] [US1] Unit test `get-comparison`: rank ok, delta ok.
- [ ] specs/007-product-comparison-page/tasks.md:17 - T022 [US1] Playwright: `/producto/coca-cola-2-25l` renderiza con 3 stores ordenadas.
- [ ] specs/007-product-comparison-page/tasks.md:20 - T023 [US1] `src/app/producto/[slug]/page.tsx` (RSC).
- [ ] specs/007-product-comparison-page/tasks.md:21 - T024 [US1] `<ProductHeader>` (foto, nombre, marca, presentación).
- [ ] specs/007-product-comparison-page/tasks.md:22 - T025 [US1] `<ComparisonTable>` con ranking (usa `PriceComparisonRow` del design system).
- [ ] specs/007-product-comparison-page/tasks.md:23 - T026 [US1] `<HistoryPlaceholder>`, `<AlertCardMount>`, `<SimilarProductsPlaceholder>`.
- [ ] specs/007-product-comparison-page/tasks.md:24 - T027 [US1] `loading.tsx` con skeleton.
- [ ] specs/007-product-comparison-page/tasks.md:25 - T028 [US1] `not-found.tsx` amigable.
- [ ] specs/007-product-comparison-page/tasks.md:30 - T030 [US2] `generateMetadata` con `title`, `description`, `openGraph`, `canonical`.
- [ ] specs/007-product-comparison-page/tasks.md:31 - T031 [US2] `<script type="application/ld+json">` con Product + AggregateOffer + Offer[].
- [ ] specs/007-product-comparison-page/tasks.md:32 - T032 [US2] `opengraph-image.tsx` con `@vercel/og`.
- [ ] specs/007-product-comparison-page/tasks.md:33 - T033 [US2] `generateStaticParams` top 10k productos.
- [ ] specs/007-product-comparison-page/tasks.md:34 - T034 [P] [US2] Test unit: JSON-LD shape valida contra schema con `schema-dts`.
- [ ] specs/007-product-comparison-page/tasks.md:35 - T035 [US2] Manual: pegar URL en Google Rich Results Test → válido.
- [ ] specs/007-product-comparison-page/tasks.md:38 - T040 [US3] Query `avg30d` en `get-comparison`.
- [ ] specs/007-product-comparison-page/tasks.md:39 - T041 [US3] Badge `-X%` en `ComparisonTable` (usa `<DiscountBadge>`).
- [ ] specs/007-product-comparison-page/tasks.md:40 - T042 [P] [US3] Test unit: delta = ((price - avg) / avg) * 100.
- [ ] specs/007-product-comparison-page/tasks.md:43 - T050 [US4] Campo opcional `storeProductUrl` en `Price` (migration).
- [ ] specs/007-product-comparison-page/tasks.md:44 - T051 [US4] En parsers F03 guardar `storeProductUrl` si el folleto lo trae.
- [ ] specs/007-product-comparison-page/tasks.md:45 - T052 [US4] Botón `Ir a la tienda` usa `storeProductUrl` o fallback a `/tienda/[chainSlug]`.
- [ ] specs/007-product-comparison-page/tasks.md:46 - T053 [US4] Registrar `outbound_click` con Plausible al click.
- [ ] specs/007-product-comparison-page/tasks.md:49 - T054 [C-001] Badge `<PromoBadge>` en cada `PriceComparisonRow` cuando `promoType != 'unit'`.
- [ ] specs/007-product-comparison-page/tasks.md:50 - T055 [C-001] Rank por `pricePerUnitEff` en lugar de `price`; mostrar ambos en columnas.
- [ ] specs/007-product-comparison-page/tasks.md:51 - T056 [C-002] Query devuelve `proximity: 'in_zone' | 'nearby'`; renderizar dos secciones: "En {zone}" primero, "Cerca de {zone} (< 3 km)" después.
- [ ] specs/007-product-comparison-page/tasks.md:52 - T057 [C-002] Toggle `<NeighborsToggle>` reactivo (URL param `?nearby=1`).
- [ ] specs/007-product-comparison-page/tasks.md:53 - T058 [C-003] Columna "por L/kg/un" en la tabla; toggle "ordenar por precio total / por unidad".
- [ ] specs/007-product-comparison-page/tasks.md:54 - T059 [C-003] `<PriceTag>` muestra `$/L` debajo del precio grande.
- [ ] specs/007-product-comparison-page/tasks.md:55 - T059b [C-004] Sección "Ver también" con la variante contraria de `packagingFlag` cuando existe.
- [ ] specs/007-product-comparison-page/tasks.md:58 - T060 [P] Lighthouse CI: `/producto/coca-cola-2-25l` Perf ≥ 95, LCP < 2 s.
- [ ] specs/007-product-comparison-page/tasks.md:59 - T061 [P] `docs/product-page.md`.
- [ ] specs/007-product-comparison-page/tasks.md:60 - T062 Bundle analysis: verificar < 40 KB gz.
- [ ] specs/007-product-comparison-page/tasks.md:61 - T063 Constitution Check.
- [ ] specs/007-product-comparison-page/tasks.md:64 - Página funcional con datos reales.
- [ ] specs/007-product-comparison-page/tasks.md:65 - JSON-LD válido.
- [ ] specs/007-product-comparison-page/tasks.md:66 - Rich Result válido en Google.
- [ ] specs/007-product-comparison-page/tasks.md:67 - Lighthouse ≥ 95.
- [ ] specs/007-product-comparison-page/tasks.md:68 - a11y 0 errores axe.
- [ ] specs/008-offers-feed/tasks.md:4 - T001 Añadir campo `upvotes_cache INT DEFAULT 0` en `Price` (para score); migration + backfill 0.
- [ ] specs/008-offers-feed/tasks.md:5 - T002 [P] Zod schemas `OffersParams`, `OffersResponse` en `src/server/offers/schemas.ts`.
- [ ] specs/008-offers-feed/tasks.md:8 - T010 Query en `src/server/offers/query.ts` (raw con params tipados).
- [ ] specs/008-offers-feed/tasks.md:9 - T011 [P] Cursor helpers `encodeCursor`/`decodeCursor` (base64 JSON) en `src/lib/cursor.ts`.
- [ ] specs/008-offers-feed/tasks.md:10 - T012 [P] Redis cache wrapper en `src/server/offers/cache.ts`.
- [ ] specs/008-offers-feed/tasks.md:14 - T020 [P] [US1] Seed test: 20 ofertas en 3 zonas.
- [ ] specs/008-offers-feed/tasks.md:15 - T021 [US1] Playwright `/` renderiza 8 cards ordenadas por descuento.
- [ ] specs/008-offers-feed/tasks.md:18 - T022 [US1] `src/app/page.tsx` con `<HeroSection>` + `<TrustBar>` + `<OffersGrid>` + `<HowItWorks>`.
- [ ] specs/008-offers-feed/tasks.md:19 - T023 [US1] Server component fetch top 8 con `sort=discount`.
- [ ] specs/008-offers-feed/tasks.md:20 - T024 [US1] `revalidate = 300`.
- [ ] specs/008-offers-feed/tasks.md:21 - T025 [US1] Zone default = `caba-palermo`; usar cookie si existe.
- [ ] specs/008-offers-feed/tasks.md:22 - T026 [US1] Meta OG + JSON-LD `WebSite` con `potentialAction: SearchAction`.
- [ ] specs/008-offers-feed/tasks.md:27 - T030 [US2] `/ofertas/page.tsx` con `<FiltersSidebar>` + `<ActiveChips>` + `<OffersGrid>`.
- [ ] specs/008-offers-feed/tasks.md:28 - T031 [US2] Endpoint `/api/offers/route.ts`.
- [ ] specs/008-offers-feed/tasks.md:29 - T032 [US2] `<FiltersSidebar>` con: vertical (radio), cadenas (checkbox), minDiscount (slider), validity (radio), distance (chip group).
- [ ] specs/008-offers-feed/tasks.md:30 - T033 [US2] Cambios de filtro → `router.push` con nuevos params.
- [ ] specs/008-offers-feed/tasks.md:31 - T034 [P] [US2] Playwright: filtrar chain=carrefour → todos los items son Carrefour.
- [ ] specs/008-offers-feed/tasks.md:32 - T035 [P] [US2] Test API: params → SQL correcto.
- [ ] specs/008-offers-feed/tasks.md:35 - T040 [US3] `<ActiveChips>` lee de searchParams y renderiza chips con X.
- [ ] specs/008-offers-feed/tasks.md:36 - T041 [US3] Click X → remove param del URL.
- [ ] specs/008-offers-feed/tasks.md:37 - T042 [P] [US3] Test keyboard: Tab → chip → Enter/Space quita filtro.
- [ ] specs/008-offers-feed/tasks.md:38 - T043 [P] [US3] "Limpiar todos" resetea filters manteniendo `zone`.
- [ ] specs/008-offers-feed/tasks.md:41 - T050 [US4] `<InfiniteLoader>` con IntersectionObserver.
- [ ] specs/008-offers-feed/tasks.md:42 - T051 [US4] Cliente hace fetch a `/api/offers?cursor=...` y appendea.
- [ ] specs/008-offers-feed/tasks.md:43 - T052 [US4] `nextCursor = null` → mostrar "no hay más".
- [ ] specs/008-offers-feed/tasks.md:44 - T053 [P] [US4] Playwright: scroll hasta bottom → segunda page cargada.
- [ ] specs/008-offers-feed/tasks.md:47 - T060 [US5] En mobile (`< 768`), sidebar oculto; mostrar tabs de vertical horizontal.
- [ ] specs/008-offers-feed/tasks.md:48 - T061 [US5] Botón "Más filtros" → abre `<FiltersSheet>` (Radix Dialog fullscreen mobile).
- [ ] specs/008-offers-feed/tasks.md:49 - T062 [US5] Focus trap y escape close.
- [ ] specs/008-offers-feed/tasks.md:50 - T063 [P] [US5] Playwright viewport 375: tabs visibles; sheet abre/cierra.
- [ ] specs/008-offers-feed/tasks.md:53 - T064 [C-001] Filtro sidebar `promoType` (checkboxes: unit / 2x1 / 3x2 / segundo off / bundle).
- [ ] specs/008-offers-feed/tasks.md:54 - T065 [C-001] Sort option: "por precio efectivo por unidad" además de "mayor descuento".
- [ ] specs/008-offers-feed/tasks.md:55 - T066 [C-001] `<DealCard>` muestra `<PromoBadge>` cuando aplique.
- [ ] specs/008-offers-feed/tasks.md:56 - T067 [C-002] `<NeighborsToggle>` en sidebar + chip activo "También Palermo + 3 km".
- [ ] specs/008-offers-feed/tasks.md:57 - T068 [C-002] Separador en el grid: "En Palermo" (destacado) vs "Cerca de Palermo".
- [ ] specs/008-offers-feed/tasks.md:58 - T069 [C-002] Query respeta el toggle; ranking penaliza `nearby` 0.15 puntos vs `in_zone`.
- [ ] specs/008-offers-feed/tasks.md:59 - T069b [C-003] `<DealCard>` muestra `$1.245 / L` bajo el precio.
- [ ] specs/008-offers-feed/tasks.md:62 - T070 [P] `<HowItWorks>` con 3 tarjetas (Buscá / Compará / Alertas).
- [ ] specs/008-offers-feed/tasks.md:63 - T071 [P] Sección "Cadenas rastreadas" (`<TrustBar>`) en home.
- [ ] specs/008-offers-feed/tasks.md:64 - T072 [P] Empty state con "reportá una oferta" (link a F11).
- [ ] specs/008-offers-feed/tasks.md:65 - T073 [P] Load test k6 sobre `/api/offers`.
- [ ] specs/008-offers-feed/tasks.md:66 - T074 Lighthouse `/` y `/ofertas` ≥ 95.
- [ ] specs/008-offers-feed/tasks.md:67 - T075 Bundle < 60 KB gz.
- [ ] specs/008-offers-feed/tasks.md:68 - T076 Constitution Check.
- [ ] specs/008-offers-feed/tasks.md:71 - `/` feed funcional, LCP < 2 s.
- [ ] specs/008-offers-feed/tasks.md:72 - `/ofertas` filtros + paginación funcional.
- [ ] specs/008-offers-feed/tasks.md:73 - Mobile UX verificado.
- [ ] specs/008-offers-feed/tasks.md:74 - p95 `/api/offers` < 250 ms.
- [ ] specs/008-offers-feed/tasks.md:75 - Bundle en presupuesto.
- [ ] specs/009-price-alerts-email/tasks.md:4 - T001 Instalar `resend`, `@react-email/components`, `@react-email/render`.
- [ ] specs/009-price-alerts-email/tasks.md:5 - T002 Generar `ALERT_TOKEN_SECRET` y agregar a env vars.
- [ ] specs/009-price-alerts-email/tasks.md:6 - T003 Migration: tabla `alerts` + `email_events`.
- [ ] specs/009-price-alerts-email/tasks.md:9 - T010 [P] `src/lib/tokens.ts` — sign, verify, purpose-scoped, expiry.
- [ ] specs/009-price-alerts-email/tasks.md:10 - T011 [P] `src/lib/rate-limit.ts` — token bucket sobre Redis.
- [ ] specs/009-price-alerts-email/tasks.md:11 - T012 [P] Templates React Email en `src/emails/`.
- [ ] specs/009-price-alerts-email/tasks.md:12 - T013 [P] Wrapper `src/lib/resend.ts` con retry + logging.
- [ ] specs/009-price-alerts-email/tasks.md:16 - T020 [P] [US1] Unit: token sign/verify.
- [ ] specs/009-price-alerts-email/tasks.md:17 - T021 [P] [US1] Unit: `CreateAlert` Zod schema (invalid emails).
- [ ] specs/009-price-alerts-email/tasks.md:18 - T022 [P] [US1] Integration: POST → mock Resend called with expected params.
- [ ] specs/009-price-alerts-email/tasks.md:19 - T023 [US1] Playwright: form → email mock → verify link → success page.
- [ ] specs/009-price-alerts-email/tasks.md:22 - T024 [US1] `POST /api/alerts/route.ts` con dedup (email+product+target).
- [ ] specs/009-price-alerts-email/tasks.md:23 - T025 [US1] Envío email con Resend (`AlertVerify`).
- [ ] specs/009-price-alerts-email/tasks.md:24 - T026 [US1] `GET /api/alerts/verify` route verifica token, activa alert.
- [ ] specs/009-price-alerts-email/tasks.md:25 - T027 [US1] Página `/alerts/verified` con confirmación.
- [ ] specs/009-price-alerts-email/tasks.md:26 - T028 [US1] Integrar `<AlertCard>` (design system) en `/producto/[slug]` (llena mount de F07).
- [ ] specs/009-price-alerts-email/tasks.md:31 - T030 [US2] Script `src/scripts/alerts-scan.ts`.
- [ ] specs/009-price-alerts-email/tasks.md:32 - T031 [US2] Query batch por producto+zona.
- [ ] specs/009-price-alerts-email/tasks.md:33 - T032 [US2] Enqueue emails con `p-limit(10)`.
- [ ] specs/009-price-alerts-email/tasks.md:34 - T033 [US2] Registrar `notifiedAt` y `EmailEvent`.
- [ ] specs/009-price-alerts-email/tasks.md:35 - T034 [US2] Workflow `.github/workflows/alerts-scan.yml`.
- [ ] specs/009-price-alerts-email/tasks.md:36 - T035 [P] [US2] Integration test: seed alerta + precio bajo → mock Resend called.
- [ ] specs/009-price-alerts-email/tasks.md:37 - T036 [P] [US2] Test cooldown: notificar dos veces mismo día → segunda no envía.
- [ ] specs/009-price-alerts-email/tasks.md:40 - T040 [US3] `GET /api/alerts/unsubscribe` verifica token, cancela.
- [ ] specs/009-price-alerts-email/tasks.md:41 - T041 [US3] Página `/alerts/cancelled`.
- [ ] specs/009-price-alerts-email/tasks.md:42 - T042 [US3] Todos los emails incluyen link unsubscribe visible.
- [ ] specs/009-price-alerts-email/tasks.md:43 - T043 [P] [US3] Test: cancelar → cron no envía más.
- [ ] specs/009-price-alerts-email/tasks.md:46 - T050 [US4] Middleware IP rate-limit en `/api/alerts`.
- [ ] specs/009-price-alerts-email/tasks.md:47 - T051 [US4] Check email max 20 activas antes de crear.
- [ ] specs/009-price-alerts-email/tasks.md:48 - T052 [P] [US4] Test 6ta alerta en 1h → 429.
- [ ] specs/009-price-alerts-email/tasks.md:51 - T060 [US5] `POST /api/alerts/manage-link` (email-only) → envía email con `manageToken`.
- [ ] specs/009-price-alerts-email/tasks.md:52 - T061 [US5] `/mis-alertas?token=X` — lista + cancelar individual.
- [ ] specs/009-price-alerts-email/tasks.md:53 - T062 [P] [US5] Playwright: manage link → panel → cancelar → confirmado.
- [ ] specs/009-price-alerts-email/tasks.md:56 - T070 [P] Webhook Resend `POST /api/webhooks/resend` + verificación firma.
- [ ] specs/009-price-alerts-email/tasks.md:57 - T071 [P] `pnpm alerts:cleanup` purga `ipHash` > 30d.
- [ ] specs/009-price-alerts-email/tasks.md:58 - T072 [P] Página `/privacidad` y `/terminos` actualizadas con política de emails.
- [ ] specs/009-price-alerts-email/tasks.md:59 - T073 [P] Métrica dashboard `/admin/alerts-status` (activas, notificadas 7d, bounce rate).
- [ ] specs/009-price-alerts-email/tasks.md:60 - T074 [P] Bounce hard → status=bounced automatic.
- [ ] specs/009-price-alerts-email/tasks.md:61 - T075 Constitution Check.
- [ ] specs/009-price-alerts-email/tasks.md:64 - Doble opt-in verificado end-to-end.
- [ ] specs/009-price-alerts-email/tasks.md:65 - Cron horario en prod.
- [ ] specs/009-price-alerts-email/tasks.md:66 - Unsubscribe funcional.
- [ ] specs/009-price-alerts-email/tasks.md:67 - Rate-limit activo.
- [ ] specs/009-price-alerts-email/tasks.md:68 - Webhook Resend integrado.
- [ ] specs/009-price-alerts-email/tasks.md:69 - PII cleanup script listo.
- [ ] specs/010-price-history-charts/tasks.md:4 - T001 Migration: crear materialized view `price_daily_avg` con índices.
- [ ] specs/010-price-history-charts/tasks.md:5 - T002 Backfill inicial refrescando la view.
- [ ] specs/010-price-history-charts/tasks.md:8 - T010 [P] `src/server/history/get-history.ts`.
- [ ] specs/010-price-history-charts/tasks.md:9 - T011 [P] Helpers puros `src/lib/chart.ts`: `computeScales`, `pathFromData`, `areaFromData`, `bisectDate`.
- [ ] specs/010-price-history-charts/tasks.md:10 - T012 [P] Types `HistoryResponse`.
- [ ] specs/010-price-history-charts/tasks.md:14 - T020 [P] [US1] Snapshot test: `<PriceHistoryChart data={fixture}>` → SVG estable.
- [ ] specs/010-price-history-charts/tasks.md:15 - T021 [P] [US1] Test unit: `pathFromData`, `computeScales` con edge cases (1 punto, 0 puntos).
- [ ] specs/010-price-history-charts/tasks.md:18 - T022 [US1] Componente `<PriceHistoryChart>` en design system (F02 lo dejó placeholder).
- [ ] specs/010-price-history-charts/tasks.md:19 - T023 [US1] Integración en `/producto/[slug]` (RSC llama a `getHistory` y pasa `data`).
- [ ] specs/010-price-history-charts/tasks.md:20 - T024 [US1] Fallback "sin historial" cuando `data.length < 7`.
- [ ] specs/010-price-history-charts/tasks.md:25 - T030 [US2] Endpoint `GET /api/product/[slug]/history`.
- [ ] specs/010-price-history-charts/tasks.md:26 - T031 [US2] Client `<PriceHistoryInteractive>` con state de range.
- [ ] specs/010-price-history-charts/tasks.md:27 - T032 [US2] Botones 30D/90D/180D/1A en design system.
- [ ] specs/010-price-history-charts/tasks.md:28 - T033 [P] [US2] Playwright: click 30D → fetch → chart update.
- [ ] specs/010-price-history-charts/tasks.md:31 - T040 [US3] Card row con Current / Avg / Min (fecha) / Max (fecha).
- [ ] specs/010-price-history-charts/tasks.md:32 - T041 [US3] `stats` calculado server-side.
- [ ] specs/010-price-history-charts/tasks.md:33 - T042 [P] [US3] Test: Min tiene fecha correcta.
- [ ] specs/010-price-history-charts/tasks.md:36 - T050 [US4] Workflow `.github/workflows/refresh-materialized-views.yml` diario.
- [ ] specs/010-price-history-charts/tasks.md:37 - T051 [US4] Alerta Sentry si `REFRESH` toma > 60 s.
- [ ] specs/010-price-history-charts/tasks.md:40 - T060 [P] Tooltip on-hover (client component); accesible por teclado.
- [ ] specs/010-price-history-charts/tasks.md:41 - T061 [P] Outlier filter en `getHistory`.
- [ ] specs/010-price-history-charts/tasks.md:42 - T062 [P] Playwright a11y: chart tiene `role="img"` y `aria-label` correcto.
- [ ] specs/010-price-history-charts/tasks.md:43 - T063 Bundle client chart < 15 KB gz.
- [ ] specs/010-price-history-charts/tasks.md:44 - T064 Constitution Check.
- [ ] specs/010-price-history-charts/tasks.md:47 - Materialized view refrescándose noctumo.
- [ ] specs/010-price-history-charts/tasks.md:48 - Chart SSR-safe y accesible.
- [ ] specs/010-price-history-charts/tasks.md:49 - Endpoint < 100 ms p95.
- [ ] specs/010-price-history-charts/tasks.md:50 - Bundle en presupuesto.
- [ ] specs/011-community-reports/tasks.md:4 - T001 Instalar `@vercel/blob`, `sharp`, `@marsidev/react-turnstile`.
- [ ] specs/011-community-reports/tasks.md:5 - T002 Configurar `BLOB_READ_WRITE_TOKEN`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- [ ] specs/011-community-reports/tasks.md:6 - T003 Migration: tablas `reports` + `report_votes`.
- [ ] specs/011-community-reports/tasks.md:9 - T010 [P] Zod schemas `CreateReport`.
- [ ] specs/011-community-reports/tasks.md:10 - T011 [P] Rate-limit wrapper `checkReportRateLimit(ipHash)`.
- [ ] specs/011-community-reports/tasks.md:11 - T012 [P] Turnstile verify util `verifyTurnstile(token, ip)`.
- [ ] specs/011-community-reports/tasks.md:12 - T013 [P] Blob helpers: `uploadPhoto(file)` → `{ url, blobId, thumbUrl }`.
- [ ] specs/011-community-reports/tasks.md:16 - T020 [P] [US1] Test unit: `uploadPhoto` genera thumbnail 400x400.
- [ ] specs/011-community-reports/tasks.md:17 - T021 [US1] Playwright: llenar form + submit → 200 + confirmación.
- [ ] specs/011-community-reports/tasks.md:20 - T022 [US1] `src/app/reportar/page.tsx` con form completo.
- [ ] specs/011-community-reports/tasks.md:21 - T023 [US1] Autocomplete producto (usa F06 API).
- [ ] specs/011-community-reports/tasks.md:22 - T024 [US1] Autocomplete cadena/sucursal con fallback texto libre.
- [ ] specs/011-community-reports/tasks.md:23 - T025 [US1] Widget Turnstile client-side (mostrado condicional).
- [ ] specs/011-community-reports/tasks.md:24 - T026 [US1] `POST /api/reports/route.ts` con Zod + rate-limit + upload.
- [ ] specs/011-community-reports/tasks.md:25 - T027 [US1] Página success `/reportar/gracias`.
- [ ] specs/011-community-reports/tasks.md:30 - T030 [US2] `src/app/admin/reports-queue/page.tsx` con lista.
- [ ] specs/011-community-reports/tasks.md:31 - T031 [US2] Componente `<ReportReviewCard>` con foto + datos + historial.
- [ ] specs/011-community-reports/tasks.md:32 - T032 [US2] Endpoint `POST /api/admin/reports/:id/approve`.
- [ ] specs/011-community-reports/tasks.md:33 - T033 [US2] Endpoint `POST /api/admin/reports/:id/reject`.
- [ ] specs/011-community-reports/tasks.md:34 - T034 [US2] Al aprobar: upsert store/product/price/offer.
- [ ] specs/011-community-reports/tasks.md:35 - T035 [P] [US2] Test integration: approve → Price row nuevo.
- [ ] specs/011-community-reports/tasks.md:36 - T036 [US2] Auth admin (token env).
- [ ] specs/011-community-reports/tasks.md:39 - T040 [US3] Middleware count reports por IP en última hora.
- [ ] specs/011-community-reports/tasks.md:40 - T041 [US3] Retornar 429 si > 5.
- [ ] specs/011-community-reports/tasks.md:41 - T042 [US3] Retornar 428 si count > 2 y no viene turnstileToken.
- [ ] specs/011-community-reports/tasks.md:42 - T043 [P] [US3] Test: submit 6 veces → 429.
- [ ] specs/011-community-reports/tasks.md:45 - T050 [US4] Endpoint `POST /api/reports/:id/vote` (kind up|down).
- [ ] specs/011-community-reports/tasks.md:46 - T051 [US4] `ReportVote` unique index vía ipHash.
- [ ] specs/011-community-reports/tasks.md:47 - T052 [US4] Trigger o cron: downvotes ≥ 3 → status=re_review.
- [ ] specs/011-community-reports/tasks.md:48 - T053 [US4] `<DealCard>` con botones vote para crowdsourced.
- [ ] specs/011-community-reports/tasks.md:49 - T054 [P] [US4] Test: 3 downvotes → hidden del feed.
- [ ] specs/011-community-reports/tasks.md:52 - T060 [US5] Integrar `nsfwjs` en `POST /api/reports` (server serverless).
- [ ] specs/011-community-reports/tasks.md:53 - T061 [US5] Si score > 0.7 → `status=auto_hidden`.
- [ ] specs/011-community-reports/tasks.md:54 - T062 [P] [US5] Test con foto ok → NO auto_hidden.
- [ ] specs/011-community-reports/tasks.md:57 - T070 [P] Cron `pnpm reports:purge` diario (foto + ipHash retention).
- [ ] specs/011-community-reports/tasks.md:58 - T071 [P] Workflow `.github/workflows/reports-purge.yml`.
- [ ] specs/011-community-reports/tasks.md:59 - T072 [P] `/reportar` link en Nav + empty states.
- [ ] specs/011-community-reports/tasks.md:60 - T073 [P] Métricas dashboard: total reports, aprobados, rejected, cola.
- [ ] specs/011-community-reports/tasks.md:61 - T074 Constitution Check.
- [ ] specs/011-community-reports/tasks.md:64 - Form público funcional con Turnstile.
- [ ] specs/011-community-reports/tasks.md:65 - Cola admin funcional.
- [ ] specs/011-community-reports/tasks.md:66 - Approval crea `Price + Offer` con `source=crowdsourced`.
- [ ] specs/011-community-reports/tasks.md:67 - Voting + auto-hide funcional.
- [ ] specs/011-community-reports/tasks.md:68 - Purga PII/foto cron activo.
- [ ] specs/011-community-reports/tasks.md:69 - Rate-limit y captcha probados.
- [ ] specs/012-seo-launch-polish/tasks.md:4 - T001 Instalar `@lhci/cli`, `schema-dts`.
- [ ] specs/012-seo-launch-polish/tasks.md:5 - T002 Configurar `.lighthouserc.json` con budget.
- [ ] specs/012-seo-launch-polish/tasks.md:8 - T010 [P] `src/lib/jsonld.ts` con helpers `orgJsonLd`, `websiteJsonLd`, `productJsonLd`, `storeJsonLd`.
- [ ] specs/012-seo-launch-polish/tasks.md:9 - T011 [P] `src/lib/seo.ts` con builder de metadata por página.
- [ ] specs/012-seo-launch-polish/tasks.md:10 - T012 Actualizar `layout.tsx` con metadata global + org JSON-LD.
- [ ] specs/012-seo-launch-polish/tasks.md:13 - T020 [US1] `generateMetadata` en cada ruta pública (`/`, `/ofertas`, `/producto/[slug]`, `/tienda/[slug]`, `/buscar`, `/reportar`, `/sobre`, `/legales/*`).
- [ ] specs/012-seo-launch-polish/tasks.md:14 - T021 [US1] JSON-LD `WebSite + SearchAction` en home.
- [ ] specs/012-seo-launch-polish/tasks.md:15 - T022 [US1] JSON-LD `Product + AggregateOffer` en `/producto/[slug]` (revisado de F07).
- [ ] specs/012-seo-launch-polish/tasks.md:16 - T023 [US1] JSON-LD `Store` en `/tienda/[slug]` (crear página si no existía).
- [ ] specs/012-seo-launch-polish/tasks.md:17 - T024 [P] [US1] Screaming Frog crawl staging → 0 páginas sin meta.
- [ ] specs/012-seo-launch-polish/tasks.md:18 - T025 [US1] `noindex` en `/buscar` y `/admin`.
- [ ] specs/012-seo-launch-polish/tasks.md:19 - T026 [US1] Canonical explicito en cada página.
- [ ] specs/012-seo-launch-polish/tasks.md:22 - T030 [US2] `src/app/sitemap.ts` dinámico con productos, cadenas, categorías.
- [ ] specs/012-seo-launch-polish/tasks.md:23 - T031 [US2] `src/app/robots.ts` con reglas + link a sitemap.
- [ ] specs/012-seo-launch-polish/tasks.md:24 - T032 [P] [US2] Test unit: sitemap ≤ 50k URLs (split si excede).
- [ ] specs/012-seo-launch-polish/tasks.md:25 - T033 [US2] Sitemap submit en Google Search Console + Bing (manual).
- [ ] specs/012-seo-launch-polish/tasks.md:28 - T040 [US3] Workflow `.github/workflows/lighthouse.yml` corriendo en PRs.
- [ ] specs/012-seo-launch-polish/tasks.md:29 - T041 [US3] Verificar que budget se cumple en `main`.
- [ ] specs/012-seo-launch-polish/tasks.md:30 - T042 [P] [US3] axe integrado en Playwright para las 5 rutas críticas.
- [ ] specs/012-seo-launch-polish/tasks.md:33 - T050 [P] [US4] `src/lib/analytics.tsx` con Plausible script conditional (solo en prod).
- [ ] specs/012-seo-launch-polish/tasks.md:34 - T051 [P] [US4] Instrumentar `trackEvent("search")` en SearchBar submit.
- [ ] specs/012-seo-launch-polish/tasks.md:35 - T052 [P] [US4] `trackEvent("outbound_click", { chain })` en botón Ir a tienda.
- [ ] specs/012-seo-launch-polish/tasks.md:36 - T053 [P] [US4] `trackEvent("alert_created")` en success de F09.
- [ ] specs/012-seo-launch-polish/tasks.md:37 - T054 [P] [US4] `trackEvent("report_submitted")` en success de F11.
- [ ] specs/012-seo-launch-polish/tasks.md:38 - T055 [P] [US4] `trackEvent("filter_applied", { filter })` en `/ofertas`.
- [ ] specs/012-seo-launch-polish/tasks.md:39 - T056 [P] [US4] `trackEvent("zone_changed")` en ZoneChip.
- [ ] specs/012-seo-launch-polish/tasks.md:42 - T060 [P] [US5] `/legales/terminos/page.tsx` con contenido.
- [ ] specs/012-seo-launch-polish/tasks.md:43 - T061 [P] [US5] `/legales/privacidad/page.tsx`.
- [ ] specs/012-seo-launch-polish/tasks.md:44 - T062 [P] [US5] `/legales/takedown/page.tsx` con form o mailto.
- [ ] specs/012-seo-launch-polish/tasks.md:45 - T063 [P] [US5] `/sobre/page.tsx`.
- [ ] specs/012-seo-launch-polish/tasks.md:46 - T064 [P] [US5] `/contacto/page.tsx` (o mailto).
- [ ] specs/012-seo-launch-polish/tasks.md:47 - T065 [P] [US5] `/.well-known/security.txt` (via `next.config.mjs` rewrites o `public/`).
- [ ] specs/012-seo-launch-polish/tasks.md:48 - T066 [P] [US5] Footer con links a todas las legales.
- [ ] specs/012-seo-launch-polish/tasks.md:49 - T067 [P] [US5] Disclaimer "precios referenciales" visible en cards y comparación.
- [ ] specs/012-seo-launch-polish/tasks.md:50 - T068 [P] [US5] `not-found.tsx` global con SearchBar + CTAs.
- [ ] specs/012-seo-launch-polish/tasks.md:51 - T069 [P] [US5] `error.tsx` global (500 amigable).
- [ ] specs/012-seo-launch-polish/tasks.md:54 - T070 [US6] Crear `LAUNCH.md` con checklist detallado:
- [ ] specs/012-seo-launch-polish/tasks.md:80 - T071 [US6] Marcar los 25 items 100 % antes de anunciar.
- [ ] specs/012-seo-launch-polish/tasks.md:83 - T080 [P] Redirects legacy si aplica (`/products/*` → `/producto/*`).
- [ ] specs/012-seo-launch-polish/tasks.md:84 - T081 [P] Optimización de imagenes: convertir a AVIF/WebP en pipeline.
- [ ] specs/012-seo-launch-polish/tasks.md:85 - T082 [P] Font: `next/font` con `preload` y `font-display: swap`.
- [ ] specs/012-seo-launch-polish/tasks.md:86 - T083 [P] Prefetch strategy: `<Link prefetch>` selectivo.
- [ ] specs/012-seo-launch-polish/tasks.md:87 - T084 Constitution Check final para el proyecto.
- [ ] specs/012-seo-launch-polish/tasks.md:90 - Lighthouse ≥ 95 en las 5 rutas.
- [ ] specs/012-seo-launch-polish/tasks.md:91 - CWV p75 dentro de target.
- [ ] specs/012-seo-launch-polish/tasks.md:92 - Sitemap indexado por Google.
- [ ] specs/012-seo-launch-polish/tasks.md:93 - Rich Results válidos.
- [ ] specs/012-seo-launch-polish/tasks.md:94 - Analytics recibiendo eventos.
- [ ] specs/012-seo-launch-polish/tasks.md:95 - Legales publicadas.
- [ ] specs/012-seo-launch-polish/tasks.md:96 - LAUNCH.md al 100 %.
- [ ] specs/012-seo-launch-polish/tasks.md:97 - Anuncio publicado.

## 6. Estado del repositorio

| Indicador | Estado |
|---|---|
| Git disponible | Si |
| Branch | main |
| Cambios sin commitear | Si |
| Ultimo commit | 0132b04\\|2026-11-08 17:26:01 -0300\\|fix(ingest): PCL workflow + zone_id resolution for AR-C (B-01) |

<details>
<summary>Cambios recientes sin commit</summary>

- M .gitignore
- ?? .agents/
- ?? .claude/agents/
- ?? .claude/commands/
- ?? .claude/skills/auditing-code-for-vulnerabilities/
- ?? .claude/skills/auditing-mcp-servers/
- ?? .claude/skills/auditing-supply-chain/
- ?? .claude/skills/clean-code-principles/
- ?? .claude/skills/defending-kubernetes/
- ?? .claude/skills/design-code-architecture/
- ?? .claude/skills/design-taste-frontend/
- ?? .claude/skills/devops-engineer/
- ?? .claude/skills/domain-driven-design/
- ?? .claude/skills/env-and-assets-bootstrap/
- ?? .claude/skills/hardening-cloud-posture/
- ?? .claude/skills/impeccable/
- ?? .claude/skills/improve-codebase-architecture/
- ?? .claude/skills/managing-vulnerabilities/
- ?? .claude/skills/marketing-skills/
- ?? .claude/skills/mysql/

</details>

## 7. Control plane y actualizacion

| Artefacto | Ubicacion |
|---|---|
| Perfil | .teamctl/project.json |
| Analisis de onboarding | .teamctl/project-analysis.json |
| Ledger | .teamctl/data/harness.sqlite3 |
| Handoff | docs/workflow/harness-handoff.json |
| Este reporte | docs/PROJECT_OVERVIEW.md |

> El reporte se refresca al ejecutar comandos de teamctl sobre el proyecto. Tambien puede regenerarse con teamctl project-report --project-root .

<details>
<summary>Limitaciones de la deteccion</summary>

- El stack y el tipo de aplicacion se estiman por archivos marcadores.
- Una feature se considera implementada por estado explicito o por tener todas sus tareas completas.
- Las features deben estar documentadas en specs/ u openspec/specs/ para aparecer.
- Una edicion externa se refleja en la proxima ejecucion de teamctl.

</details>
\n