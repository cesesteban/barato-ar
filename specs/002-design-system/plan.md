# Implementation Plan: Design System & Primitives

**Branch**: `002-design-system` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

## Summary

Crear el layer de tokens en CSS variables + Tailwind config, instalar shadcn/ui como base de primitives y extenderla con componentes de dominio (PriceTag, DealCard, etc.). Documentar todo en Storybook con tests de a11y.

## Technical Context

- **Language/Version**: TS 5.6, React 19
- **Primary Dependencies**: Tailwind CSS, shadcn/ui, Radix Primitives, Lucide Icons, class-variance-authority (cva), tailwind-merge, Storybook 8, @storybook/addon-a11y
- **Storage**: N/A
- **Testing**: Vitest + Testing Library (component unit tests), Playwright + axe-core (integration a11y), Chromatic o Storybook visual regression (opt para MVP)
- **Target Platform**: Web
- **Project Type**: Web app (single package)
- **Performance Goals**: Bundle CSS < 20 KB gz, componente render < 5 ms
- **Constraints**: WCAG 2.2 AA, no hardcoded colors, no `px` fuera de bordes
- **Scale/Scope**: ~15 primitives + ~8 domain components + 4 layouts

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| I. SEO-First | Sí. Componentes SSR-safe (no `useEffect`-only). |
| II. Datos frescos | N/A |
| III. TS strict | Sí. Props tipadas con `cva` variants. |
| IV. Privacidad | Sí. Sin trackers en componentes. |
| V. Performance | Sí. CSS budget, tree-shakeable. |
| VI. Legalidad | N/A |
| VII. Simplicidad | Sí. Un design system, sin herramientas custom. |
| VIII. Accesibilidad | **Central**. axe zero-error obligatorio. |

## Design Tokens

`src/styles/tokens.css`:

```css
:root {
  /* Color · neutral base */
  --color-bg: #f8fafc;              /* slate-50 */
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;   /* slate-100 */
  --color-border: #e2e8f0;          /* slate-200 */
  --color-border-strong: #cbd5e1;   /* slate-300 */
  --color-text: #0f172a;            /* slate-900 */
  --color-text-muted: #475569;      /* slate-600 */
  --color-text-subtle: #94a3b8;     /* slate-400 */

  /* Color · brand */
  --color-primary: #4f46e5;         /* indigo-600 */
  --color-primary-hover: #4338ca;   /* indigo-700 */
  --color-primary-soft: #eef2ff;    /* indigo-50 */

  /* Color · savings & alert */
  --color-savings: #10b981;         /* emerald-500 */
  --color-savings-soft: #ecfdf5;
  --color-discount: #f43f5e;        /* rose-500 */
  --color-discount-soft: #fef2f2;
  --color-warning: #f59e0b;
  --color-info: #0ea5e9;

  /* Spacing (rem-based, 8pt grid) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Radius */
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(15,23,42,0.05);
  --shadow-sm: 0 2px 4px rgba(15,23,42,0.06);
  --shadow-md: 0 4px 12px rgba(15,23,42,0.08);
  --shadow-lg: 0 10px 30px rgba(15,23,42,0.12);

  /* Motion */
  --duration-fast: 120ms;
  --duration-med: 200ms;
  --ease: cubic-bezier(0.2, 0, 0, 1);

  /* Type ramp */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --leading-tight: 1.15;
  --leading-normal: 1.5;
}

[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-surface-muted: #334155;
  --color-border: #334155;
  --color-text: #f8fafc;
  --color-text-muted: #cbd5e1;
  --color-primary-soft: #1e1b4b;
  /* … resto invertido */
}
```

`tailwind.config.ts` mapea estos tokens a `theme.extend.colors`, `spacing`, etc., para que las utilities de Tailwind los consuman.

## Component Catalog

### Primitives (shadcn/ui base + extendidos)

| Componente | Variantes | Notas |
|---|---|---|
| `Button` | primary / secondary / ghost / destructive / outline | `size: sm/md/lg`, `loading`, `iconLeft/iconRight` |
| `IconButton` | primary / ghost | Requiere `aria-label` obligatorio (guard en TS) |
| `Card` | default / elevated / outlined | `padding: sm/md/lg` |
| `Badge` | neutral / info / savings / discount / warning | Solo texto corto |
| `Chip` | neutral / selected / removable | `onRemove` opt |
| `Input` | text / search / email / number | Con `<label>` obligatorio |
| `Select` | — | Radix wrapper |
| `Checkbox` / `Radio` / `Toggle` | — | Radix wrappers, focus-visible |
| `Alert` | info / success / warning / error | Con icono |
| `Skeleton` | — | `w`/`h` props |
| `Tooltip` / `Popover` / `Dialog` | — | Radix wrappers |
| `VisuallyHidden` | — | Utilidad a11y |

### Domain Components

| Componente | Props principales |
|---|---|
| `PriceTag` | `{amount: number, currency?: "ARS", strikethrough?: boolean, size: "sm"/"md"/"lg"}` |
| `DiscountBadge` | `{pct: number, tone?: "coral"/"neutral"}` |
| `ChainBadge` | `{chain: ChainSlug, variant?: "logo"/"text"}` |
| `DealCard` | Card de oferta grid (desktop). Ver wireframe Main. |
| `DealCardCompact` | Card horizontal para mobile. Ver wireframe HomeMobile. |
| `SearchBar` | Buscador con `onSearch`, autocomplete slot |
| `ZoneChip` | Muestra zona actual, `onChangeZone` |
| `AlertCard` | Card de "avisame cuando baje" (formulario email + precio target) |
| `PriceComparisonRow` | Fila de la tabla de comparación por tienda |
| `PriceHistoryChart` | SVG line chart (SSR-safe) |

### Layouts

| Layout | Contiene |
|---|---|
| `PageShell` | `<html>` + `<body>` + tokens |
| `Nav` | Logo + tabs + search compact + ZoneChip + "Reportar oferta" |
| `Footer` | Logo + links + copyright |
| `MobileBottomNav` | 4 tabs (Inicio, Buscar, Alertas, Zona) |

## Variant API (cva pattern)

```ts
// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        secondary: "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
        ghost: "text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
        destructive: "bg-[var(--color-discount)] text-white hover:opacity-90",
        outline: "border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]",
      },
      size: {
        sm: "text-sm px-3 py-1.5",
        md: "text-sm px-4 py-2",
        lg: "text-base px-5 py-2.5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { loading?: boolean };
```

## Project Structure

```
src/
├── styles/
│   ├── globals.css                      # imports tokens + tailwind
│   └── tokens.css                       # CSS variables
├── components/
│   ├── ui/                              # primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── chip.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── ...
│   │   └── index.ts                     # barrel export
│   ├── domain/                          # componentes de dominio
│   │   ├── price-tag.tsx
│   │   ├── discount-badge.tsx
│   │   ├── chain-badge.tsx
│   │   ├── deal-card.tsx
│   │   ├── deal-card-compact.tsx
│   │   ├── search-bar.tsx
│   │   ├── zone-chip.tsx
│   │   ├── alert-card.tsx
│   │   ├── price-comparison-row.tsx
│   │   └── price-history-chart.tsx
│   └── layout/
│       ├── page-shell.tsx
│       ├── nav.tsx
│       ├── footer.tsx
│       └── mobile-bottom-nav.tsx
├── stories/
│   ├── ui/*.stories.tsx
│   └── domain/*.stories.tsx
└── lib/
    ├── cn.ts                            # clsx + twMerge
    └── format-price.ts                  # `$1.234` según es-AR
```

## Storybook Setup

- Storybook 8, `@storybook/nextjs`, `@storybook/addon-a11y`, `@storybook/addon-viewport`.
- Cada story define `parameters.a11y = { config: {...} }` cuando aplica.
- CI corre `pnpm test-storybook` con `--browsers chromium` en Playwright.

## Contracts (Component API sample)

```ts
// PriceTag
export type PriceTagProps = {
  amount: number;              // en centavos o pesos; el componente maneja formato
  currency?: "ARS";
  strikethrough?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

// DealCard
export type DealCardProps = {
  product: { slug: string; name: string; brand?: string; imageUrl?: string; };
  price: number;
  previousPrice?: number;
  discountPct?: number;
  chain: { slug: string; name: string; };
  validUntil?: string;         // ISO date
  distanceKm?: number;
  freshnessLabel?: string;     // "hace 2h", "válida hoy"
  href: string;                // navigate target
};
```

## Testing Strategy

- **Unit** (Vitest): variantes de cada primitive, `cn()` merges, `format-price()`.
- **Story tests** (`play` function + `test-storybook`): interacciones básicas.
- **a11y** (axe-core): 0 errores en TODAS las stories.
- **Visual**: opcional en MVP; sí sanity checks manuales de responsive en Storybook viewports (desktop 1440, tablet 768, mobile 375).

## Complexity Tracking

Ninguna violación. `cva` y `tailwind-merge` son estándar del ecosistema shadcn.
