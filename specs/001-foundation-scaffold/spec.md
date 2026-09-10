# Feature Specification: Foundation Scaffold

**Feature Branch**: `001-foundation-scaffold`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: —

## Overview

Establecer la base técnica del proyecto **Barato.ar** ([C-005](../../.specify/memory/clarifications.md#c-005--nombre-de-marca-y-dominio)): repo, Next.js 15 App Router en TypeScript strict, Prisma + Postgres (Neon), Tailwind + shadcn/ui, pipeline de deploy en Vercel, CI en GitHub Actions, observabilidad (Sentry), analytics (Plausible), Auth.js v5 para `/admin` ([C-010](../../.specify/memory/clarifications.md#c-010--authjs-nextauth-v5-para-admin)), Cloudflare R2 ([C-009](../../.specify/memory/clarifications.md#c-009--cloudflare-r2-como-object-storage)), endpoint de revalidación on-demand ([C-008](../../.specify/memory/clarifications.md#c-008--on-demand-revalidation-post-ingesta)), DNS de email verificado en Resend ([C-012](../../.specify/memory/clarifications.md#c-012--dominio-de-email-desde-s1)). Ninguna feature de negocio se implementa aquí — solo un "hello world" verificable end-to-end.

## User Scenarios & Testing

### User Story 1 — Devs pueden clonar y correr el proyecto (P1) 🎯 MVP

**Descripción**: Un dev clona el repo, corre `pnpm install`, `pnpm db:migrate` y `pnpm dev`, y ve una página en `http://localhost:3000` que consulta la DB y muestra "OK".

**Independent Test**: correr `pnpm test:e2e:smoke` y verificar que la home levanta, la DB responde y no hay errores de type-check.

**Acceptance Scenarios**:
1. **Given** un checkout limpio, **When** el dev corre `pnpm install && pnpm dev`, **Then** la app arranca sin errores y `/` responde 200.
2. **Given** la DB configurada, **When** se pega en `/health`, **Then** responde `{status: "ok", db: "connected", commit: "<sha>"}`.
3. **Given** un push a `main`, **When** el CI corre, **Then** los checks de lint, typecheck, test y build pasan verde.

### User Story 2 — Cada PR queda auto-verificado (P1)

**Descripción**: Un contribuidor abre un PR; GitHub Actions corre linting, typecheck y tests automáticamente, y muestra el estado en el PR.

**Independent Test**: abrir un PR con un error de tipo intencional y verificar que el check falla.

**Acceptance Scenarios**:
1. **Given** un PR con `any` implícito, **When** el CI corre, **Then** el check de typecheck falla.
2. **Given** un PR con un test roto, **When** el CI corre, **Then** el check de tests falla y el mensaje señala el test.

### User Story 3 — Deploy automático a preview y producción (P2)

**Descripción**: Cada PR genera un preview URL en Vercel. Merge a `main` deploya a producción.

**Independent Test**: abrir un PR y verificar que el preview URL aparece en 2 minutos.

**Acceptance Scenarios**:
1. **Given** un PR abierto, **When** Vercel termina el build, **Then** el comentario del bot muestra el URL y su status.
2. **Given** un merge a `main`, **When** el deploy termina, **Then** el commit aparece en el dashboard de Vercel como "Production".

### User Story 4 — Errores en producción llegan a Sentry (P2)

**Descripción**: Si una request en prod tira 500, el error queda registrado en Sentry con stack trace, request id y contexto.

**Independent Test**: forzar un throw en un endpoint de prueba y ver el evento en Sentry.

**Acceptance Scenarios**:
1. **Given** un endpoint que arroja, **When** un request lo hitea en prod, **Then** aparece un evento en Sentry con `environment=production` y stack trace legible.

### Edge Cases

- Falla temporal de DB → `/health` devuelve 503 con `db: "unreachable"`, no 500.
- Variables de entorno faltantes → app rompe al arrancar con mensaje claro, no un stack trace opaco.
- Migración pendiente en prod → deploy falla el step de release, no rompe la app.

## Requirements

### Functional Requirements

- **FR-001**: El sistema DEBE arrancar localmente con un solo comando (`pnpm dev`) tras `pnpm install` y `pnpm db:migrate`.
- **FR-002**: El sistema DEBE exponer `/health` que retorna JSON con `status`, `db`, `commit` y `version`.
- **FR-003**: Todos los archivos TS DEBEN pasar `tsc --noEmit` con `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- **FR-004**: El sistema DEBE tener CI en GitHub Actions que corra `lint`, `typecheck`, `test`, `build` en cada PR.
- **FR-005**: El sistema DEBE integrar Sentry en runtime cliente y server, con release tagging por commit.
- **FR-006**: El sistema DEBE tener un ADR (`docs/adr/0001-stack.md`) que documenta el stack y sus razones.
- **FR-007**: El repo DEBE tener `.env.example` y README con instrucciones de setup en < 5 minutos.
- **FR-008**: Los secretos NO DEBEN quedar en el repo — sólo en Vercel env vars y `.env.local` (gitignored).
- **FR-009**: El sistema DEBE emitir un `robots.txt` y `sitemap.xml` (aunque estén vacíos en esta fase).
- **FR-010**: El sistema DEBE cargar Plausible como analytics privacy-first (sin cookies).

### Key Entities

- **HealthResponse**: `{status: "ok" | "degraded", db: "connected" | "unreachable", commit: string, version: string, timestamp: ISO8601}`
- **AppConfig**: variables de entorno tipadas y validadas al boot con Zod.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Un dev nuevo puede correr el proyecto en < 5 minutos desde `git clone`.
- **SC-002**: Tiempo de build de PR en CI < 3 minutos (lint + typecheck + test + build).
- **SC-003**: Deploy a preview en Vercel < 90 s desde el push.
- **SC-004**: La app inicia con < 400 ms de TTFB en `/` en un plan free de Vercel.
- **SC-005**: Cobertura de types 100 % (`tsc` sin errores en modo strict).
- **SC-006**: 0 alertas de seguridad "high" en `pnpm audit` al momento de merge.

## Assumptions

- El equipo usa Node 20 LTS y pnpm.
- Neon Postgres tier free es suficiente para el MVP.
- Sentry tier free (5k events/mes) alcanza para MVP.
- Vercel tier free alcanza para MVP.
- No se implementa auth ni features de negocio en esta iteración.
- Windows dev environment soportado además de macOS/Linux.
