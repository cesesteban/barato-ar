# Barato.ar — Specs Index

> Nombre productivo del proyecto: **Barato.ar** ([C-005](../.specify/memory/clarifications.md#c-005--nombre-de-marca-y-dominio)).
> Wireframes y specs antiguas usan "Precioya" como placeholder — no bloquea código.

Backlog completo del MVP, planeado con spec-kit. Cada feature tiene:
- `spec.md` — user scenarios, requirements funcionales, success criteria.
- `plan.md` — technical context, arquitectura, contratos, data model, constitution check.
- `tasks.md` — tareas numeradas fase por fase con checkpoints e independent tests.

Antes de tocar código, leer:
1. [Constitución del proyecto](../.specify/memory/constitution.md) — 8 principios no-negociables.
2. [Clarifications log](../.specify/memory/clarifications.md) — decisiones que actualizan las specs (tiene precedencia sobre versiones más viejas de spec/plan).
3. Roadmap general: [../02-plan-desarrollo.md](../02-plan-desarrollo.md).
4. Investigación de plataformas: [../01-investigacion-plataformas.md](../01-investigacion-plataformas.md).

## Roadmap por sprints

| Sprint | Features |
|---|---|
| **S1 — Foundation** | [001-foundation-scaffold](./001-foundation-scaffold), [002-design-system](./002-design-system) |
| **S2 — Ingesta base** | [003-ingest-super-flyers](./003-ingest-super-flyers), [004-ingest-precios-claros](./004-ingest-precios-claros), [005-product-normalizer](./005-product-normalizer) |
| **S3 — Búsqueda + comparación** | [006-product-search](./006-product-search), [007-product-comparison-page](./007-product-comparison-page) |
| **S4 — Feed** | [008-offers-feed](./008-offers-feed) |
| **S5 — Alertas + Historial** | [009-price-alerts-email](./009-price-alerts-email), [010-price-history-charts](./010-price-history-charts) |
| **S6 — Comunidad + Launch** | [011-community-reports](./011-community-reports), [012-seo-launch-polish](./012-seo-launch-polish) |

## Dependencias entre features

```
001 (foundation) ─┬─→ 002 (design system) ─┐
                  │                         ├─→ 007 (comparison page)
                  ├─→ 003 (flyers) ────────┤       │
                  │                         │       ├─→ 009 (alerts) ─→ 012 (SEO/launch)
                  ├─→ 004 (pcl) ───────────┤       │
                  │                         │       ├─→ 010 (history)  ─┘
                  ├─→ 005 (normalizer) ────┤       │
                                            │       │
                                            └─→ 006 (search) ─→ 008 (feed) ─→ 011 (reports)
```

## Cómo trabajar una feature

```bash
# 1. Leer spec + plan + tasks
cd specs/003-ingest-super-flyers
cat spec.md plan.md tasks.md

# 2. Crear rama
git switch -c 003-ingest-super-flyers

# 3. Ejecutar tasks en orden respetando checkpoints
# 4. En cada checkpoint: correr independent tests
# 5. Constitution Check antes de mergear
# 6. PR con link al spec
```

## Convenciones

- **Priorities**: P1 = MVP, P2 = post-MVP dentro del sprint, P3 = fuera del sprint.
- **[Story] tag**: cada tarea lleva `[USn]` para trazabilidad al user story.
- **[P] tag**: tarea que puede paralelizarse con otras `[P]` de la misma fase.
- **Checkpoint**: momento verificable donde se valida un user story independiente.
- **Constitution Check**: se re-verifica al final de cada feature.

## Estado

Todas las specs en estado **Draft**. Se pasan a **Ready** tras revisión.

_Última actualización: 2026-09-09_
