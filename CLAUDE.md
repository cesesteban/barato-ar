# Barato.ar — Instrucciones para Claude Code

Comparador de precios de super/delivery/farmacia en Argentina.
Deploy: `https://barato-ar.vercel.app` · Repo: `cesesteban/barato-ar` · Stack: Next 15 + Prisma + Neon.

## 🔴 REGLA NO NEGOCIABLE — Documentación viva

**Cada vez que avanzás con algo del proyecto, actualizá los documentos relevantes en `docs/` en el mismo commit del cambio.**

Sin excepciones. Un feature/fix/refactor está incompleto hasta que la documentación refleja la nueva realidad. No dejar el doc "para después" — se acumula deuda invisible y el próximo agente (o vos mismo en la próxima sesión) toma decisiones sobre información falsa.

### ¿Qué actualizar según el tipo de cambio?

| Tipo de cambio | Docs a actualizar (mínimo) |
|---|---|
| Feature nuevo (F###) | `docs/ESTADO_ACTUAL.md` (agregar al scorecard), `specs/###-*/spec.md`, `specs/###-*/plan.md`, `specs/###-*/tasks.md` |
| Bug fix | `docs/AUDIT.md` (marcar B-## como ✅ resuelto), `docs/ESTADO_ACTUAL.md` (actualizar scorecard afectado) |
| Cambio de stack o dependency mayor | `docs/STACK.md` + `docs/ARQUITECTURA.md` |
| Nueva vista o cambio en routing | `docs/VISTAS.md` + `docs/FLUJO_FRONTEND.md` |
| Cambio en ingest, cron o API interna | `docs/FLUJO_BACKEND.md` + `docs/ARQUITECTURA.md` |
| Cambio en design tokens / componente global | `docs/DISENO.md` |
| Cambio en scope, features prioritarios | `docs/ALCANCE.md` + `docs/PRODUCTO.md` |
| Cambio en monetización o nichos | `docs/PLAN_NEGOCIO.md` |
| Cambio en objetivos o principios | `docs/OBJETIVO.md` + `.specify/memory/constitution.md` |
| Config externa nueva (env, servicio) | `docs/ESTADO_ACTUAL.md` (sección Infraestructura) |

**Después de un fix crítico**: re-correr `pnpm tsx scripts/audit-data.ts` y actualizar los counts reales en `ESTADO_ACTUAL.md`.

## Fuentes de verdad (leer primero al empezar sesión)

1. [`docs/README.md`](docs/README.md) — índice completo
2. [`docs/ESTADO_ACTUAL.md`](docs/ESTADO_ACTUAL.md) — qué está hecho / qué falta con scoring granular
3. [`docs/AUDIT.md`](docs/AUDIT.md) — bugs actuales con IDs B-##
4. [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — 8 principios NO negociables
5. [`.specify/memory/clarifications.md`](.specify/memory/clarifications.md) — decisiones C-001 a C-014

## Convenciones de repo

### Branches y commits
- Trabajo en `feat/###-nombre` o `fix/###-nombre`, merge a `main` con `--no-ff`
- Cada push a `main` deploya automático a Vercel — asegurate de que build + typecheck + tests pasen local antes
- Commits siguen convención `type(scope): descripción` (feat, fix, chore, docs, refactor, test)
- Firma commits con:
  ```
  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```

### Antes de commitear
1. `pnpm typecheck` — sin errores
2. `pnpm test` — todos pasan (~200 tests)
3. `SKIP_ENV_VALIDATION=1 pnpm build` — build local exitoso
4. **Actualizar docs si aplica** (ver tabla arriba)

### Nunca hacer
- Skip hooks (`--no-verify`, `--no-gpg-sign`)
- Push force a main
- Commitear secrets (envs van a Vercel Dashboard)
- Marcar feature como ✅ si data o config no están OK (leer scoring 3D en `ESTADO_ACTUAL.md`)
- Inventar precios o forzar data (Principio II de la constitución)

## Comandos frecuentes

```bash
# Dev
pnpm dev                          # Next dev server localhost:3000
pnpm typecheck                    # tsc --noEmit
pnpm test                         # vitest run
pnpm build                        # SKIP_ENV_VALIDATION=1 pnpm build (sin envs prod)

# DB
pnpm prisma migrate dev           # crea migration en dev
pnpm prisma migrate deploy        # aplica en prod
pnpm tsx prisma/seed.ts           # seed chains + zones + app_meta

# Ingesta
pnpm ingest carrefour             # parser folleto
pnpm ingest pcl                   # SEPA snapshot completo (~30-60 min)

# Auditoría
pnpm tsx scripts/audit-data.ts    # counts + calidad de data
pnpm tsx scripts/audit-zones.ts   # verificar zone linkage
pnpm tsx scripts/status.ts        # resumen rápido

# Docker local
docker compose up -d              # Postgres + MailPit + app en localhost:3900
```

## Ejecución con cuidado (blast radius)

Ver también `docs/ARQUITECTURA.md` sección "Failure modes conocidos".

**Antes de ejecutar en producción (Neon prod)**:
- Cualquier `TRUNCATE`, `DELETE`, `UPDATE` masivo → pedir confirmación al usuario
- Migrations: `pnpm prisma migrate deploy` OK; `db push --force-reset` NUNCA sin OK explícito
- Ingesta: OK correr sin pedir permiso (idempotente por EAN)

**Antes de push a main**:
- Verificar que el build local funcionó
- Verificar que los tests pasan
- Verificar que los docs relevantes están actualizados

## Speckit workflow

Feature nuevo o fix grande sigue este flujo:

1. `/speckit-specify` → genera `specs/###-*/spec.md`
2. `/speckit-clarify` → resuelve ambigüedades (opcional pero recomendado)
3. `/speckit-plan` → genera `plan.md` + artifacts (research, contracts, quickstart)
4. `/speckit-tasks` → genera `tasks.md` ejecutable
5. `/speckit-implement` → ejecuta las tasks
6. **Actualizar docs pertinentes** (ver regla arriba)

Bug fixes chicos pueden saltear a `/speckit-plan` directo con un `spec.md` mínimo.

## Idioma

- Código, tests, tipos: **inglés** (naming, comments cortos)
- Commits, PRs, docs, specs, comentarios de contexto: **español rioplatense**
- Textos del sitio: **español rioplatense** (voseo, "elegí", "aprovechá")
- Constitution principle names en inglés (SEO-First, Testability, etc.) para consistencia con specs

## Convenciones del código

- Prisma models: PascalCase en TS + `@map("snake_case")` a la columna real
- Server components por default; `"use client"` solo cuando hace falta state/browser API
- Zod para validation de inputs, envs y forms
- URL params como fuente de verdad para state compartido (zone, filters); localStorage como fallback client-side
- Tests unit en `tests/unit/**`; sin E2E en MVP
