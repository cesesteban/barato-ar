<!--
SYNC IMPACT REPORT
Version change: (initial) → 1.0.0
Modified principles: (initial ratification — none)
Added sections:
  - Core Principles (I–VIII)
  - Technical Constraints & Compliance
  - Development Workflow & Quality Gates
  - Governance
Removed sections: none
Templates status:
  ✅ plan-template.md (existing template respected)
  ✅ spec-template.md (existing template respected)
  ✅ tasks-template.md (existing template respected)
Follow-up TODOs: none
-->

# Barato.ar Constitution

> Nombre confirmado en [C-005](./clarifications.md#c-005--nombre-de-marca-y-dominio).
> Referencias históricas a "Precioya" quedan como placeholder en wireframes y specs
> antiguas; el nombre productivo es **Barato.ar**.

## Core Principles

### I. SEO-First Architecture

Every product, category and offer collection MUST be exposed as an indexable,
human-readable URL. Server-rendered HTML (SSG or ISR) is the default; client-only
rendering is permitted ONLY for interactive widgets that add no discoverable content.
Every indexable page MUST emit valid `schema.org` structured data
(`Product`, `Offer`, `AggregateOffer`, `Organization`) and a canonical `<link>`.
URLs MUST be semantic (`/producto/coca-cola-2-25l`), never opaque (`/p/1234`).
A dynamic `sitemap.xml` MUST be regenerated on each ingestion cron.

Rationale: a comparator lives on organic search — SEO is not "polish", it is the
core distribution channel and MUST NOT be deferred.

### II. Data Freshness, Honesty and Traceability

Every displayed price MUST show its `captured_at` timestamp and its source
(cadena, folleto, Precios Claros, community). A price older than 7 days MUST be
visually flagged as stale. Every offer MUST link to the original source when one
exists. The system MUST NEVER extrapolate, round or synthesize a price it has not
observed. Legal, stable sources (official flyers, Precios Claros/SEPA,
crowdsourcing) MUST be preferred over aggressive scraping of delivery apps.

Rationale: trust is the product. A wrong price shown as fresh destroys the value
proposition faster than a missing price.

### III. TypeScript Strict and Testability (NON-NEGOTIABLE)

`tsconfig.json` MUST enable `strict: true` with `noUncheckedIndexedAccess: true`
and `exactOptionalPropertyTypes: true`. Implicit `any` is forbidden. Every module
that reads, writes or transforms a price MUST have unit tests; every parser
(flyer, SEPA feed, scraper) MUST have snapshot tests using recorded fixtures
committed to the repo. Every public route MUST have at least one integration
test (Playwright) covering the golden path.

Rationale: the correctness of prices is a functional requirement — types and
tests are how we enforce it under change.

### IV. Privacy by Design

The MVP MUST NOT expose account creation, passwords or third-party sign-in.
Email addresses collected for alerts MUST use double opt-in with a signed
unsubscribe token in every message. Personal data retention MUST be limited to
what the alert requires. No cross-site tracking scripts (Google Analytics,
Facebook Pixel) MUST be added; privacy-preserving analytics (Plausible/Umami)
are permitted. The system MUST comply with Argentina's Ley 25.326 and honor
takedown requests within 5 business days.

Rationale: less data collected is less data to leak, less friction for the user,
and less compliance surface. Alerts do not require an account.

### V. Performance as a Feature

Every publicly indexable route MUST maintain Lighthouse ≥ 95 for Performance,
Accessibility, Best-Practices and SEO. Core Web Vitals targets:
LCP < 2.0 s, INP < 200 ms, CLS < 0.05 at p75 on real user devices. A per-page
JavaScript bundle budget MUST be defined in the plan and enforced by CI (fail
on regressions > 10 %). Images MUST be served via `next/image` with explicit
`width`/`height`.

Rationale: users on Argentine mobile networks abandon slow pages; a comparator
that loses to a native app on speed does not survive.

### VI. Legality First, Ambition Second

Data-source strategy is a legal decision before it is a technical one. Sources
are ordered by legal risk: (1) official flyers and Precios Claros — always
permitted; (2) public JSON endpoints of supermarket sites — permitted with
respectful rate-limits and robots.txt compliance; (3) crowdsourced reports —
permitted with moderation; (4) scraping of delivery-app menus (PedidosYa,
Rappi) — DEFERRED to post-MVP and requires an explicit legal review before
enabling. A visible disclaimer stating "Los precios son referenciales y pueden
variar; verificá en la tienda" MUST appear on every page that displays a price.

Rationale: an MVP shut down by a cease-and-desist is an MVP that never learned
whether users cared.

### VII. Operational Simplicity

The MVP MUST run as a single Next.js service on Vercel, a single Postgres
(Neon) database, and one Redis (Upstash) cache. Search MUST use Postgres
`pg_trgm` + full-text; introducing a separate search engine (Meilisearch,
Typesense, Elasticsearch) requires a written justification and documented
scale trigger. Message queues, microservices and event streams are FORBIDDEN
in the MVP. Cron jobs run on GitHub Actions until a documented scale limit is
reached.

Rationale: complexity kills small teams. Every new runtime is a new failure
mode, deployment target and monitoring surface.

### VIII. Accessible by Default

Every interactive component MUST be reachable and operable by keyboard alone.
Every image MUST have a meaningful `alt` (empty `alt=""` for decorative only).
Color contrast MUST meet WCAG 2.2 AA. Every form control MUST have a visible
label and a programmatic association (`<label for>` or `aria-labelledby`).
Focus order MUST follow visual order. Automated axe-core checks MUST run in CI
against every page in the sitemap.

Rationale: accessibility is a legal, ethical and SEO requirement; retrofitting
it is 10× the cost of building it in.

## Technical Constraints & Compliance

**Stack (locked for MVP)**:
- Next.js 15 (App Router), TypeScript strict
- Tailwind CSS + shadcn/ui + Radix + Lucide icons
- Prisma ORM + Postgres (Neon Serverless) with `pg_trgm` and `pgvector`
- Upstash Redis for hot query caching
- Resend for transactional email
- GitHub Actions for cron ingestion
- Sentry (errors) + Plausible/Umami (privacy analytics) + Better Stack (uptime)
- Vercel (hosting)

**Compliance requirements**:
- Argentina Ley 25.326 (Protección de Datos Personales)
- WCAG 2.2 AA
- GDPR-compatible unsubscribe flow (single-click)
- A documented DMCA / takedown procedure at `/legales/takedown`

**Data source order of precedence**: (1) official flyers → (2) Precios Claros
SEPA dataset → (3) supermarket public JSON endpoints → (4) crowdsourcing →
(5) delivery-app scraping (POST-MVP only, requires legal review).

## Development Workflow & Quality Gates

- Every feature MUST pass through the Spec Kit workflow:
  `/speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement`.
  Skipping steps requires a written note in the PR description.
- Every PR MUST include: type-check pass, test suite green, Lighthouse budget
  respected on affected routes, axe-core zero-error, snapshot updates reviewed.
- Ingestion parsers MUST fail loudly (Sentry alert) when they detect ≥ 20 %
  drop in captured rows vs the previous run.
- Every price shown to a user MUST be produced by a code path covered by an
  integration test that verifies the source and freshness fields.
- No PR MAY introduce a dependency older than 12 months without a stated
  reason.
- Secrets MUST live only in Vercel env vars; `.env*` files are gitignored.

## Governance

This constitution supersedes ad-hoc decisions. Amendments MUST:
1. Be proposed via PR that modifies this file and includes a Sync Impact Report.
2. State the motivation (incident, learning, scope change).
3. Bump the version per SemVer:
   - MAJOR: removes or reverses a principle.
   - MINOR: adds a principle or materially expands guidance.
   - PATCH: clarifies wording without changing meaning.
4. Be approved by the project owner before merge.

Every `/speckit-plan` output MUST include a "Constitution Check" section that
lists each principle and either confirms compliance or requests a documented
exception. Complexity that violates a principle MUST be justified in that
section or reworked.

**Version**: 1.0.0 | **Ratified**: 2026-09-09 | **Last Amended**: 2026-09-09
