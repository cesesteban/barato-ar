# Implementation Plan: Foundation Scaffold

**Branch**: `001-foundation-scaffold` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

## Summary

Levantar el monorepo mínimo con Next.js 15 App Router en TypeScript strict, Prisma + Postgres (Neon), Tailwind + shadcn/ui, y todos los rieles de CI/CD y observabilidad. Sin lógica de negocio: sólo la infraestructura sobre la que el resto del roadmap se construye.

## Technical Context

- **Language/Version**: TypeScript 5.6+, Node.js 20 LTS
- **Primary Dependencies**: Next.js 15 (App Router, React 19), Prisma 5, Zod 3, Tailwind CSS 3.4, shadcn/ui, Radix Primitives, Lucide Icons, Sentry SDK, Plausible
- **Storage**: Postgres 16 (Neon Serverless) con `pg_trgm` y `pgvector` habilitados
- **Testing**: Vitest (unit), Playwright (e2e), Testing Library
- **Target Platform**: Vercel (SSR/ISR/Edge cuando aplique)
- **Project Type**: Web application single-package (no monorepo por ahora, por [Principio VII](../../.specify/memory/constitution.md#vii-operational-simplicity))
- **Performance Goals**: TTFB < 400 ms local, Lighthouse ≥ 95 en `/`
- **Constraints**: strict TS, no `any` implícito, sin secretos en repo
- **Scale/Scope**: 1 desarrollador, 1 servicio, 1 DB

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| I. SEO-First | Sí. `/` es SSG. `robots.txt` y `sitemap.xml` presentes desde day 1. |
| II. Datos frescos | N/A en esta feature. `/health` incluye `timestamp` y `commit`. |
| III. TS strict + tests | Sí. `strict: true`, Vitest configurado, e2e smoke test. |
| IV. Privacidad | Sí. Plausible en vez de GA. No cookies. |
| V. Performance | Sí. Lighthouse budget documentado, `next/image` obligatorio. |
| VI. Legalidad | N/A en esta feature. |
| VII. Operational Simplicity | Sí. Un servicio, una DB, un runtime. |
| VIII. Accesibilidad | Sí. axe-core integrado en Playwright. |

**Sin violaciones. Sin excepciones solicitadas.**

## Data Model

Prisma schema inicial (`prisma/schema.prisma`):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pg_trgm, pgvector]
}

model AppMeta {
  id        Int      @id @default(1)
  version   String
  createdAt DateTime @default(now())
  @@map("app_meta")
}
```

Sólo una tabla para verificar que la conexión funciona; el schema de negocio nace con Feature 03.

## Contracts

### `GET /health`

Response `200`:
```json
{
  "status": "ok",
  "db": "connected",
  "commit": "a1b2c3d",
  "version": "0.1.0",
  "timestamp": "2026-09-09T14:00:00.000Z"
}
```

Response `503` (DB caída):
```json
{
  "status": "degraded",
  "db": "unreachable",
  "commit": "a1b2c3d",
  "version": "0.1.0",
  "timestamp": "2026-09-09T14:00:01.000Z"
}
```

## Environment Variables (validated con Zod)

| Var | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string (Neon) |
| `DATABASE_URL_UNPOOLED` | ✅ | Direct connection para migraciones |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://barato.ar` (prod), preview URL en Vercel |
| `AUTH_SECRET` | ✅ | Auth.js secret (C-010), 32+ bytes random |
| `AUTH_URL` | ✅ | mismo que APP_URL |
| `ADMIN_EMAILS` | ✅ | CSV con emails autorizados a `/admin` (C-010) |
| `RESEND_API_KEY` | ✅ | Para Auth.js EmailProvider (C-010) y alertas (F09) |
| `REVALIDATE_SECRET` | ✅ | Header secret para `/api/revalidate` (C-008) |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare R2 (C-009) |
| `R2_ACCESS_KEY_ID` | ✅ | R2 |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 |
| `R2_BUCKET_PRODUCTS` | ✅ | ej. `barato-ar-products` |
| `R2_BUCKET_REPORTS` | ✅ | ej. `barato-ar-reports` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | ✅ | ej. `https://img.barato.ar` |
| `SENTRY_DSN` | opt | DSN de Sentry server |
| `NEXT_PUBLIC_SENTRY_DSN` | opt | DSN Sentry cliente |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | opt | Dominio a trackear en Plausible (`barato.ar`) |
| `VERCEL_GIT_COMMIT_SHA` | auto | Inyectada por Vercel |

## Project Structure

```
/
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── db-migrate-prod.yml
├── .specify/                        # spec-kit (ya existe)
├── docs/
│   └── adr/
│       └── 0001-stack.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # home minimal
│   │   ├── health/route.ts          # /health
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── lib/
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── env.ts                   # Zod-validated env
│   │   ├── sentry.ts
│   │   └── analytics.tsx            # Plausible loader
│   └── styles/
│       └── globals.css
├── tests/
│   ├── unit/
│   │   └── env.test.ts
│   └── e2e/
│       └── smoke.spec.ts
├── .eslintrc.cjs
├── .prettierrc
├── next.config.mjs
├── package.json
├── playwright.config.ts
├── tsconfig.json                    # strict:true, noUncheckedIndexedAccess:true
└── vitest.config.ts
```

**Structure Decision**: single-package Next.js (no monorepo). Todo el código en `src/`. `tests/` fuera para no bloatear el bundle.

## Deployment

- **Vercel**: preview automático por PR, prod por push a `main`. Env vars gestionadas en Vercel dashboard.
- **Neon**: rama `main` en Vercel apunta al DB prod; PRs apuntan a un branch DB efímero (feature "database branching" de Neon).
- **Migraciones**: `prisma migrate deploy` corre en workflow `.github/workflows/db-migrate-prod.yml` ANTES del deploy de Vercel, disparado por push a `main`.

## Observability

- **Sentry**: SDK en `src/lib/sentry.ts` con `@sentry/nextjs`, `tracesSampleRate: 0.1`, `environment: process.env.VERCEL_ENV`.
- **Logs**: `console.log` estructurado (JSON) en producción; en dev, texto legible.
- **Uptime**: Better Stack ping a `/health` cada 3 min (fuera de scope de esta feature, pero documentado en ADR).

## Testing Strategy

- **Unit** (Vitest): `env.ts` (Zod parsing), `db.ts` (client singleton).
- **E2E** (Playwright): smoke — home responde 200, `/health` responde 200, DB conectada.
- **CI**: lint → typecheck → unit → build → e2e (contra `pnpm start` con DB efímera de Neon).

## Complexity Tracking

Ninguna violación de la constitución. No hay complejidad no justificada.
