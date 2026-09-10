# Tasks: Design System & Primitives

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Setup

- [ ] T001 Instalar deps: `class-variance-authority`, `tailwind-merge`, `clsx`, `@radix-ui/react-*` (según primitives), `lucide-react`.
- [ ] T002 [P] Crear `src/lib/cn.ts` (clsx + twMerge).
- [ ] T003 [P] Crear `src/lib/format-price.ts` con formato `es-AR` (`$1.234`).
- [ ] T004 Configurar `next/font` con Inter (variable, `display: "swap"`).

## Phase 2: Foundational — Tokens

- [ ] T010 Crear `src/styles/tokens.css` con todas las CSS vars del plan.
- [ ] T011 Importar `tokens.css` en `globals.css` antes de `@tailwind`.
- [ ] T012 Configurar `tailwind.config.ts` para mapear tokens en `theme.extend.colors`, `spacing`, `borderRadius`, `boxShadow`.
- [ ] T013 [P] Agregar ESLint rule custom o `stylelint` que prohíbe colores hex fuera de `tokens.css`.
- [ ] T014 Setup Storybook: `pnpm dlx storybook@latest init` + `@storybook/nextjs`.
- [ ] T015 Instalar addons: `@storybook/addon-a11y`, `@storybook/addon-viewport`.
- [ ] T016 Configurar viewports Storybook: mobile 375, tablet 768, desktop 1440.

**Checkpoint**: `pnpm storybook` levanta con addon a11y visible.

---

## Phase 3: US1 — Devs pueden componer con primitives (P1) 🎯 MVP

### Primitives

- [ ] T020 [P] [US1] `Button` (variants + sizes) en `src/components/ui/button.tsx`.
- [ ] T021 [P] [US1] `IconButton` con `aria-label` requerido a nivel type.
- [ ] T022 [P] [US1] `Card`, `CardHeader`, `CardBody`, `CardFooter`.
- [ ] T023 [P] [US1] `Badge`.
- [ ] T024 [P] [US1] `Chip` (con `removable`).
- [ ] T025 [P] [US1] `Input` + `Label`.
- [ ] T026 [P] [US1] `Select` (Radix wrapper).
- [ ] T027 [P] [US1] `Checkbox`, `Radio`, `Toggle`.
- [ ] T028 [P] [US1] `Alert`.
- [ ] T029 [P] [US1] `Skeleton`.
- [ ] T030 [P] [US1] `Tooltip`, `Popover`, `Dialog` (Radix).
- [ ] T031 [P] [US1] `VisuallyHidden`.
- [ ] T032 [US1] Barrel export en `src/components/ui/index.ts`.

### Domain components

- [ ] T033 [P] [US1] `PriceTag` con `format-price` + prop `pricePerUnit?: {value; unit}` (C-003).
- [ ] T034 [P] [US1] `DiscountBadge`.
- [ ] T034b [P] [US1] `PromoBadge` con variantes por `PromoType` (C-001: nx1, nxm, second_off, bundle_discount).
- [ ] T034c [P] [US1] `NeighborsToggle` chip (C-002).
- [ ] T035 [P] [US1] `ChainBadge` (con mapping slug → nombre + estilo placeholder).
- [ ] T036 [US1] `DealCard` (desktop grid card, ver wireframe).
- [ ] T037 [US1] `DealCardCompact` (mobile horizontal card).
- [ ] T038 [US1] `SearchBar` con slot para dropdown de resultados.
- [ ] T039 [US1] `ZoneChip`.
- [ ] T040 [US1] `AlertCard` (form email + precio target).
- [ ] T041 [US1] `PriceComparisonRow` (fila comparativa).
- [ ] T042 [US1] `PriceHistoryChart` (SVG line chart SSR-safe — placeholder para Feature 10).

### Layouts

- [ ] T045 [US1] `PageShell` (wrapper con tokens + font).
- [ ] T046 [US1] `Nav` (desktop).
- [ ] T047 [US1] `Footer`.
- [ ] T048 [US1] `MobileBottomNav`.

### Tests

- [ ] T050 [P] [US1] Unit test cada primitive: renders + variants correctas.
- [ ] T051 [P] [US1] Unit test `format-price` (negativos, ceros, decimales).
- [ ] T052 [US1] Playwright + axe: página de prueba con Nav + 3 DealCards + Footer → 0 errores.
- [ ] T053 [US1] Test keyboard navigation en `DealCard` (tab order, focus-visible).

**Checkpoint**: Playwright a11y verde + `/sobre` (página de prueba) renderiza con solo primitives.

---

## Phase 4: US2 — Storybook navegable con a11y (P1)

- [ ] T060 [P] [US2] Story de cada primitive con todas las variantes.
- [ ] T061 [P] [US2] Story de cada domain component (data mockeada).
- [ ] T062 [P] [US2] Story de `PageShell + Nav + Feed mock` (integración).
- [ ] T063 [US2] Configurar `test-storybook` en CI (`pnpm test-storybook --browsers chromium`).
- [ ] T064 [US2] Deploy Storybook a Vercel preview (opt, un subproyecto vercel para storybook static).

**Checkpoint**: `pnpm test-storybook` verde. Storybook público (o preview URL) accesible.

---

## Phase 5: US3 — Tokens preparados para dark mode (P2)

- [ ] T070 [US3] Definir todos los tokens equivalentes en `[data-theme="dark"]`.
- [ ] T071 [US3] Agregar toggle en Storybook (addon-themes o custom).
- [ ] T072 [US3] Verificar visualmente cada story en dark; ajustar contrastes.
- [ ] T073 [US3] Documentar en `docs/design/dark-mode.md` que dark queda para post-MVP en app.

**Checkpoint**: Toggle dark en Storybook funciona sin romper stories.

---

## Phase 6: Polish

- [ ] T080 [P] `docs/design/tokens.md` con tabla de tokens y su uso.
- [ ] T081 [P] `docs/design/component-catalog.md` con thumbnails y ejemplos.
- [ ] T082 [P] `docs/design/a11y.md` con reglas del design system.
- [ ] T083 Medir bundle CSS con `next build` → objetivo < 20 KB gz.
- [ ] T084 Purga: eliminar variantes shadcn no usadas.
- [ ] T085 Confirmar Constitution Check al final.

## Dependencies

- Foundational tokens (T010–T016) bloquea el resto.
- Primitives (T020–T032) pueden ir todos en paralelo.
- Domain components dependen de primitives.
- Layouts dependen de primitives.
- US2 (Storybook) depende de que primitives + domain existan.

## Definition of Done

- [ ] Todos los primitives + domain + layouts implementados.
- [ ] Storybook con 0 errores axe.
- [ ] Playwright integration a11y verde.
- [ ] Bundle CSS < 20 KB gz.
- [ ] Docs de tokens, catálogo y a11y publicadas.
