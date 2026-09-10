# Feature Specification: Design System & Primitives

**Feature Branch**: `002-design-system`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 001-foundation-scaffold

## Overview

Sistema de diseño de Precioya: design tokens (color, tipografía, spacing, radius, shadows, motion), componentes primitives (Button, Card, Badge, Input, Select, Chip, PriceTag, DealCard, ChainLogo) y layouts base (Nav, Footer, PageShell). Estilo Notion/Linear: neutral, whitespace generoso, Inter, indigo/emerald accents. Todo probado con a11y.

## User Scenarios & Testing

### User Story 1 — Devs pueden componer una página nueva con primitives (P1) 🎯 MVP

**Descripción**: Un dev crea una nueva página (ej. `/sobre`) usando exclusivamente componentes del design system, sin definir estilos custom. La página respeta la identidad visual y pasa a11y.

**Independent Test**: crear una página de prueba con Nav + Card + Button + Badge + Chip; correr Playwright + axe-core; verificar 0 errores de contraste, focus visible en tab, ARIA correcto.

**Acceptance Scenarios**:
1. **Given** los primitives instalados, **When** un dev compone una página, **Then** todos los estilos vienen de tokens (no hardcoded).
2. **Given** una `DealCard`, **When** se navega con teclado, **Then** el foco se ve claramente y el orden es lógico.
3. **Given** un `<Button>`, **When** se le pasa `variant="primary"`, **Then** color de fondo es `indigo-600`, contraste con texto ≥ 4.5:1.

### User Story 2 — Storybook navegable con todos los componentes (P1)

**Descripción**: Todo primitive tiene una story con variantes, estados (hover, focus, disabled, loading), viewport mobile/desktop y tests de a11y.

**Independent Test**: `pnpm storybook` levanta, cada componente tiene ≥ 3 stories, `test-storybook` pasa con 0 errores axe.

**Acceptance Scenarios**:
1. **Given** Storybook levantado, **When** se navega a `Button`, **Then** se ven variantes primary/secondary/ghost/destructive + estados.
2. **Given** un cambio de token, **When** se rebuilda Storybook, **Then** todos los componentes reflejan el nuevo valor.

### User Story 3 — Tokens de color soportan tema claro (y placeholder oscuro) (P2)

**Descripción**: El sitio en MVP es tema claro, pero los tokens están definidos como CSS variables para poder agregar tema oscuro post-MVP sin refactor masivo.

**Independent Test**: cambiar `data-theme="dark"` en `<html>` debería intercambiar las CSS vars y no romper layout.

**Acceptance Scenarios**:
1. **Given** el sitio en modo claro, **When** se activa `data-theme="dark"` en dev tools, **Then** el fondo se vuelve `slate-900` y el texto legible.

### Edge Cases

- Texto muy largo en `DealCard` → truncate a 2 líneas con `line-clamp-2`.
- Imagen faltante en `DealCard` → placeholder SVG con marca de agua neutral.
- `PriceTag` con precio negativo → nunca se muestra; se filtra upstream.
- Zoom del navegador al 200 % → todo sigue legible sin scroll horizontal.

## Requirements

### Functional Requirements

- **FR-001**: Todos los colores DEBEN estar definidos como CSS variables en `src/styles/tokens.css` bajo `:root` y `[data-theme="dark"]`.
- **FR-002**: La tipografía primaria DEBE ser Inter (variable, self-hosted vía `next/font`).
- **FR-003**: El sistema DEBE proveer los siguientes primitives: `Button`, `IconButton`, `Card`, `Badge`, `Chip`, `Input`, `Select`, `Checkbox`, `Radio`, `Toggle`, `Alert`, `Skeleton`, `Tooltip`, `Popover`, `Dialog`.
- **FR-004**: El sistema DEBE proveer componentes de dominio: `PriceTag`, `DiscountBadge`, `ChainBadge`, `DealCard`, `DealCardCompact`, `SearchBar`, `ZoneChip`, `AlertCard`.
- **FR-005**: El sistema DEBE proveer layouts: `PageShell`, `Nav`, `Footer`, `MobileBottomNav`.
- **FR-006**: Cada componente DEBE tener al menos una story en Storybook con controles interactivos.
- **FR-007**: axe-core en Storybook y en Playwright DEBE reportar 0 errores en todos los componentes.
- **FR-008**: Contraste texto DEBE cumplir WCAG 2.2 AA (4.5:1 para texto normal, 3:1 para large).
- **FR-009**: Focus indicator DEBE ser visible en todos los elementos interactivos (outline 2 px `indigo-500` con offset).
- **FR-010**: El sistema DEBE incluir `<VisuallyHidden>` para textos accesibles ocultos.
- **FR-011**: Los componentes NO DEBEN usar `px` hardcoded fuera de bordes de 1 px; el resto en tokens de spacing.
- **FR-012**: Los iconos DEBEN venir de Lucide, tamaño 16/20/24 según contexto, `stroke-width: 2`.

### Key Entities

- **Token**: `{name: string, value: string, category: "color" | "spacing" | "radius" | "shadow" | "type"}`
- **ComponentVariant**: enum discriminado por componente (ej. Button: `primary` | `secondary` | `ghost` | `destructive`).

## Success Criteria

- **SC-001**: Composer una nueva página con ≥ 5 primitives toma < 30 min a un dev nuevo.
- **SC-002**: 0 errores axe en Storybook.
- **SC-003**: Contraste ≥ 4.5:1 en todos los pares texto/fondo del sistema.
- **SC-004**: Bundle CSS < 20 KB gzipped.
- **SC-005**: Time to first render de una `DealCard` < 5 ms en dev tools performance.
- **SC-006**: Coverage de tokens: 100 % de estilos usan variables (verificado con lint rule).

## Assumptions

- Wireframes ya diseñados definen la identidad visual (Notion/Linear-like).
- Marca: "Precioya" (nombre tentativo, ajustable).
- Tema claro es el default; oscuro queda para post-MVP.
- No hay branding personalizable por cliente (single-tenant).
