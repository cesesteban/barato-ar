# ADR 0001 — Stack técnico de Barato.ar

**Fecha**: 2026-09-09
**Estado**: Aceptado
**Deciders**: owner (`ces.esteban@gmail.com`)

## Contexto

Barato.ar es un comparador de ofertas de supermercados, delivery, farmacias y bebidas en Argentina (CABA + GBA). El MVP se construye con presupuesto de "hobby / MVP personal" — cero infra proprietaria, priorizando SEO orgánico como canal de distribución primario y tiempo-a-mercado sobre optimización prematura.

Ver [Constitución](../../.specify/memory/constitution.md) y [Clarifications](../../.specify/memory/clarifications.md).

## Decisión

### Runtime + framework
- **Next.js 15 App Router + React 19 + TypeScript strict**.

**Por qué**: SSG/ISR nativo (crítico por [Principio I — SEO-First](../../.specify/memory/constitution.md)), RSC reducen bundle client, deploy Vercel gratuito, ecosistema maduro. TS strict cumple [Principio III](../../.specify/memory/constitution.md).

**Rechazado**: Astro (menos interactivo por default; el comparador tiene búsqueda/filtros ricos). Remix/React Router (menos maduro en SSG por producto). SvelteKit (equipo cero conocimiento).

### DB
- **Postgres (Neon Serverless)** + Prisma ORM + `pg_trgm` + `pgvector`.

**Por qué**: Postgres cubre full-text (`pg_trgm`) sin necesidad de Elasticsearch ([Principio VII](../../.specify/memory/constitution.md)), transaccional, gratis en Neon con branching por PR, `pgvector` deja abierta la puerta a embeddings post-MVP para F05.

**Rechazado**: SQLite (no soporta `pg_trgm` bien; no colabora con serverless). Supabase (bueno pero más vendor lock-in en auth/storage — [C-009](../../.specify/memory/clarifications.md#c-009--cloudflare-r2-como-object-storage) elige R2, no Supabase Storage). MongoDB (queries analíticas peor).

### Hosting
- **Vercel** para Next.js + cron ligero.
- **GitHub Actions** para cron pesado de ingesta (F03/F04) — evita colgar Vercel Serverless Functions largas.
- **Cloudflare R2** para object storage ([C-009](../../.specify/memory/clarifications.md#c-009--cloudflare-r2-como-object-storage)).

**Por qué**: Vercel = deploy fricción-cero + free tier generoso. GitHub Actions gratis con matriz por cadena. R2 = cost-effective vs Vercel Blob al escalar (egress gratis).

**Rechazado**: Railway/Fly.io (más carga operativa). AWS raw (overkill).

### Auth
- **Auth.js (NextAuth) v5** con EmailProvider (Resend SMTP) — solo para `/admin/*`. Público sin auth ([C-010](../../.specify/memory/clarifications.md#c-010--authjs-nextauth-v5-para-admin)).

**Por qué**: OSS, gratis, self-hosted, cero vendor lock-in. Cumple [Principio IV — Privacidad por diseño](../../.specify/memory/constitution.md).

**Rechazado**: Clerk (SaaS, vendor lock-in). Env-token básico (poco seguro cuando abra al mundo).

### Storage
- **Cloudflare R2**: `barato-ar-products` público con `img.barato.ar`, `barato-ar-reports` privado con presigned URLs.

**Por qué**: [C-009](../../.specify/memory/clarifications.md#c-009--cloudflare-r2-como-object-storage). Free tier 10 GB + zero egress cost. Compatible S3 API.

### Email transaccional
- **Resend** con dominio `barato.ar` verificado (SPF/DKIM/DMARC).

**Por qué**: [C-012](../../.specify/memory/clarifications.md#c-012--dominio-de-email-desde-s1). Modern SDK, React Email templates, free tier 3k emails/mes.

### Observabilidad
- **Sentry** (errores + performance).
- **Plausible** o **Umami** (analytics privacy-first, sin cookies).
- **Better Stack** (uptime ping a `/health`).

**Por qué**: privacy-first cumple [Principio IV](../../.specify/memory/constitution.md). Sentry es standard.

### Cache
- **Upstash Redis** para hot queries (F06 popular, autocomplete).
- **Next.js Data Cache + `revalidateTag()`** para on-demand revalidation ([C-008](../../.specify/memory/clarifications.md#c-008--on-demand-revalidation-post-ingesta)).

### Testing
- **Vitest** (unit).
- **Playwright + axe-core** (e2e + a11y).
- **Lighthouse CI** (perf budget).
- **Testing Library** (component).

## Consecuencias

**Positivas**:
- Un solo servicio, un solo runtime, un solo lenguaje → [Principio VII — simplicidad](../../.specify/memory/constitution.md).
- Todo el stack tiene free tier suficiente para MVP.
- Vendor lock-in mitigado: Postgres portable, Auth.js self-hosted, S3 API compatible (R2).

**Negativas**:
- Neon tier free tiene compute suspend tras 5 min inactividad → cold starts en tráfico bajo. Mitigación: uptime ping.
- Sin Elasticsearch limita ranking en F06 a lo que Postgres full-text ofrece — puede requerir migrar si crece.
- Vercel free tier tiene límites de builds/mes; si el proyecto explota, migrar a Pro ($20/mes).

## Compliance con la constitución

| Principio | Cumplimiento |
|---|---|
| I. SEO-First | Next.js SSG/ISR nativo |
| II. Datos frescos | Neon + `captured_at` en cada row |
| III. TS strict + tests | Vitest + Playwright + strict tsconfig |
| IV. Privacidad | Sin auth público, Plausible sin cookies |
| V. Performance | Vercel Edge + R2 CDN + Redis |
| VI. Legalidad | Fuentes públicas (folletos, SEPA) priorizadas |
| VII. Simplicidad | Un servicio, un DB, un cron runner |
| VIII. Accesibilidad | axe-core + shadcn/ui |
