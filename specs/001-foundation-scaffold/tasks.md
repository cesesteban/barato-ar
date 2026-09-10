# Tasks: Foundation Scaffold

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Setup

- [ ] T001 Crear repo Git con `.gitignore` (Next.js + node + `.env*` + `.vercel`).
- [ ] T002 `pnpm init` y agregar `packageManager` fijo (`pnpm@9.x`).
- [ ] T003 [P] Crear `.env.example` con todas las vars documentadas.
- [ ] T004 [P] Crear `docs/adr/0001-stack.md` (por qué Next.js + Prisma + Neon + Vercel).

## Phase 2: Foundational

- [ ] T010 Instalar Next.js 15 App Router (`create-next-app` con TS + Tailwind + App Router).
- [ ] T011 Configurar `tsconfig.json` con `strict:true`, `noUncheckedIndexedAccess:true`, `exactOptionalPropertyTypes:true`, `moduleResolution: "bundler"`.
- [ ] T012 [P] Configurar ESLint (`next/core-web-vitals` + `@typescript-eslint/strict`).
- [ ] T013 [P] Configurar Prettier + `.editorconfig`.
- [ ] T014 [P] Instalar Zod y crear `src/lib/env.ts` con schema validado al boot.
- [ ] T015 Instalar Prisma 5, `pnpm prisma init`, apuntar `schema.prisma` a Neon.
- [ ] T016 Habilitar extensiones `pg_trgm` y `pgvector` en `schema.prisma` (`previewFeatures = ["postgresqlExtensions"]`).
- [ ] T017 Escribir modelo `AppMeta` en `schema.prisma`. Correr `pnpm prisma migrate dev --name init`.
- [ ] T018 Crear singleton en `src/lib/db.ts` (guard para hot-reload).
- [ ] T019 [P] Instalar Tailwind (viene con `create-next-app`) y verificar `globals.css`.
- [ ] T020 [P] Inicializar shadcn/ui (`pnpm dlx shadcn@latest init`) con paleta neutral base.
- [ ] T021 [P] Instalar Lucide Icons.

## Phase 3: User Story 1 — Dev puede clonar y correr (P1) 🎯 MVP

**Goal**: hello world verificable end-to-end.

### Tests

- [ ] T030 [P] [US1] Escribir `tests/unit/env.test.ts` — Zod falla si falta var requerida.
- [ ] T031 [P] [US1] Escribir `tests/e2e/smoke.spec.ts` — `/` 200 + `/health` 200 + `db=connected`.

### Implementation

- [ ] T032 [US1] Implementar `src/app/page.tsx` — landing minimal con `<h1>Precioya</h1>` + link a `/health`.
- [ ] T033 [US1] Implementar `src/app/health/route.ts` — query a `AppMeta`, responde JSON con `status`, `db`, `commit`, `version`, `timestamp`.
- [ ] T034 [US1] Implementar `src/app/layout.tsx` — meta tags base, viewport, `<html lang="es-AR">`.
- [ ] T035 [P] [US1] Implementar `src/app/robots.ts` y `src/app/sitemap.ts` (vacío por ahora).
- [ ] T036 [US1] Crear scripts en `package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:studio`.
- [ ] T037 [US1] Correr smoke local: `pnpm dev` → visitar `/` y `/health`.

**Checkpoint**: `pnpm test && pnpm test:e2e:smoke` pasan verde localmente.

---

## Phase 4: User Story 2 — CI por PR (P1)

**Goal**: cada PR queda auto-verificado.

- [ ] T040 [US2] Crear `.github/workflows/ci.yml` con jobs `lint`, `typecheck`, `test`, `build`, `e2e`.
- [ ] T041 [US2] Configurar `pnpm/action-setup@v4` + cache de pnpm store.
- [ ] T042 [US2] Configurar branch DB de Neon efímero para el job `e2e` (usando `neondatabase/create-branch-action`).
- [ ] T043 [US2] Agregar `.github/workflows/db-migrate-prod.yml` — corre `prisma migrate deploy` en push a `main` ANTES del deploy Vercel.
- [ ] T044 [US2] Configurar branch protection en `main`: require CI verde + 1 review.
- [ ] T045 [P] [US2] Agregar `pnpm audit` como job informativo (warn, no fail).

**Checkpoint**: PR con error de tipo intencional → CI rojo. PR limpio → CI verde en < 3 min.

---

## Phase 5: User Story 3 — Deploy automático (P2)

**Goal**: cada PR con preview URL; merge → prod.

- [ ] T050 [US3] Conectar el repo a Vercel via CLI o dashboard.
- [ ] T051 [US3] Configurar env vars en Vercel (Production, Preview, Development).
- [ ] T052 [US3] Configurar Neon branching en Vercel integration.
- [ ] T053 [US3] Verificar preview URL en un PR de prueba.
- [ ] T054 [US3] Verificar prod deploy tras merge a `main`.

**Checkpoint**: PR abierto → preview URL en < 2 min. Merge → prod verde.

---

## Phase 6: User Story 4 — Errores llegan a Sentry (P2)

**Goal**: 500s trackeados con contexto.

- [ ] T060 [US4] Instalar `@sentry/nextjs` con wizard (`pnpm dlx @sentry/wizard@latest -i nextjs`).
- [ ] T061 [US4] Editar `src/lib/sentry.ts` con `tracesSampleRate: 0.1`, tag `environment`, tag `release: process.env.VERCEL_GIT_COMMIT_SHA`.
- [ ] T062 [US4] Crear endpoint efímero `/debug/throw` (removido antes de merge) que arroja.
- [ ] T063 [US4] Deploy preview + hit al endpoint + ver evento en Sentry.
- [ ] T064 [US4] Eliminar `/debug/throw` y agregar test que garantiza que no existe en prod.

**Checkpoint**: throw en prod → evento visible en Sentry con stack trace.

---

## Phase 6b — Clarifications aplicadas

### C-008 · On-demand revalidation
- [ ] T065 Agregar `REVALIDATE_SECRET` a `src/lib/env.ts` y `.env.example`.
- [ ] T066 Implementar `src/app/api/revalidate/route.ts` (POST, header `x-revalidate-secret`, llama a `revalidateTag()`).
- [ ] T067 [P] Test integración: POST con secret ok → 200; secret malo → 403.

### C-009 · Cloudflare R2
- [ ] T068 Crear buckets `barato-ar-products` (público, custom domain `img.barato.ar`) y `barato-ar-reports` (privado). Documentar en `docs/dev.md`.
- [ ] T069 Agregar env vars R2 a `env.ts` + `.env.example`.
- [ ] T070 Instalar `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner`.
- [ ] T071 Implementar `src/lib/storage.ts` con `uploadImage(bucket, key, buffer, contentType)`, `deleteImage(bucket, key)`, `getPresignedUrl(bucket, key, ttl)`.
- [ ] T072 [P] Unit test contra un mock S3 (aws-sdk-client-mock) — no toca R2 real.

### C-010 · Auth.js v5 para `/admin`
- [ ] T073 Instalar `next-auth@beta`, `@auth/prisma-adapter`, `nodemailer`.
- [ ] T074 Agregar modelos `User`, `Account`, `Session`, `VerificationToken` a `schema.prisma` + migration.
- [ ] T075 Escribir `src/lib/auth.ts` con `EmailProvider` (Resend SMTP), `PrismaAdapter`, callback `authorized` gateando `/admin/*`.
- [ ] T076 Crear `src/middleware.ts` que exporta `auth` para gating.
- [ ] T077 Escribir `src/app/api/auth/[...nextauth]/route.ts` que re-exporta `handlers`.
- [ ] T078 Crear `/admin/page.tsx` placeholder que muestra el email del user autenticado.
- [ ] T079 [P] Playwright: acceso a `/admin` sin login → redirect a `/api/auth/signin`.

### C-011 · Retries con backoff exponencial
- [ ] T080 [P] Implementar `src/lib/http-retry.ts` con `fetchWithRetry(url, opts)` (delays 1s/4s/15s, no reintenta 4xx, Sentry warning final).
- [ ] T081 [P] Unit test con fetch mockeado: 2 fallos → succeed en 3ro; 3 fallos → throw + Sentry.

### C-012 · Dominio de email (DNS)
- [ ] T082 Registrar `barato.ar` en el registrar (fuera de código, documentar en `LAUNCH.md`).
- [ ] T083 [P] Documentar records DNS en `docs/dns.md` (SPF, DKIM, DMARC values del dashboard Resend).
- [ ] T084 Verificar dominio en Resend dashboard.
- [ ] T085 [P] Test smoke: enviar email de prueba desde `alertas@barato.ar` a inbox del owner; verificar delivery + SPF/DKIM en headers.

### C-005 · Naming Barato.ar
- [ ] T086 [P] `package.json` name = `barato-ar`, description con "Comparador de ofertas AR".
- [ ] T087 [P] `metadataBase` = `https://barato.ar` en layout.
- [ ] T088 [P] Título default = "Barato.ar — Comparador de ofertas".
- [ ] T089 [P] Favicon + `og-default.png` con logo "Barato.ar".

## Phase 7: Polish

- [ ] T090 [P] Escribir README con setup en < 5 min (incluye env vars R2, Auth.js, Resend, Neon).
- [ ] T091 [P] Documentar comandos de dev en `docs/dev.md`.
- [ ] T092 [P] Agregar `CODEOWNERS` (dueño del repo).
- [ ] T093 [P] Instalar Plausible via env var (script en `src/lib/analytics.tsx`, incluido solo en prod).
- [ ] T094 [P] Configurar Better Stack ping a `/health` (out of scope de código pero documentado en README).
- [ ] T095 Correr `pnpm build && pnpm start` + Lighthouse en `/` — target ≥ 95.

## Dependencies & Execution Order

- **Setup** → **Foundational** → US1 → (US2 + US3 en paralelo) → US4 → Polish
- US2 y US3 pueden ir en paralelo tras US1 (distintos archivos).
- Ningún user story depende de otro para su test independiente.

## Definition of Done

- [ ] Todos los tests verde.
- [ ] Lighthouse ≥ 95 en `/`.
- [ ] Preview URL funcionando.
- [ ] Prod desplegada.
- [ ] Sentry recibiendo eventos.
- [ ] README completo.
- [ ] Constitution Check re-verificado (sin nuevas violaciones).
