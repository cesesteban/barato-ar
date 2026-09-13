# Diseño

Design system + componentes + principios visuales.

## Principios de diseño

Alineados con [OBJETIVO.md](OBJETIVO.md):

1. **Utilidad primero, decoración después** — cada pixel sirve al objetivo (mostrar precio, comparar, decidir).
2. **Honestidad visual** — precios reales, fuentes visibles, timestamps evidentes. Nada de "ofertazo!" ni scarcity fake.
3. **Accesible por default** — Radix UI + focus rings visibles + contrast AA + labels reales.
4. **Sin fricción para el que va apurado** — 1 tap para elegir zona, 1 tap para ver detalle, 1 tap para ir a la tienda.
5. **Móvil-first** — mayoría del tráfico va a ser mobile-4G. Layout se adapta desde 360px.

## Design tokens

Ubicación: `src/app/globals.css` como CSS variables en `:root` (y overrides `@media (prefers-color-scheme: dark)` cuando aplique).

### Color

```
--color-primary       #4f46e5   (indigo — CTAs, links)
--color-savings       #16a34a   (verde — descuentos, mejor precio)
--color-warning       #f59e0b   (ámbar — validity próxima a expirar)
--color-danger        #dc2626   (rojo — errores, precio subiendo)

--color-text          #0f172a   (slate-900)
--color-text-muted    #475569   (slate-600)
--color-text-subtle   #94a3b8   (slate-400)

--color-surface       #ffffff
--color-surface-muted #f8fafc
--color-surface-alt   #f1f5f9
--color-border        #e2e8f0
--color-focus         #4f46e5
```

### Espaciado

Tailwind default (0, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24). Sin custom.

### Tipografía

- **Family**: Inter (via `next/font/google` — subset latin, `display: swap`).
- **Escala**:
  - `text-2xs` — 10px (labels chips, footnotes)
  - `text-xs` — 12px (metadata, timestamps)
  - `text-sm` — 14px (body compacto, forms)
  - `text-base` — 16px (body)
  - `text-lg` — 18px (subtítulos)
  - `text-xl` a `text-6xl` — headings escalados

### Radius

```
--radius        6px    (buttons, inputs)
--radius-sm     4px    (chips, tags)
--radius-lg     10px   (cards, modals)
```

### Elevation

Solo dos niveles:
- `shadow-sm` para cards en hover
- `shadow-lg` para modals

### Z-index

```
--z-sticky           40   (header, mobile bottom nav)
--z-modal-backdrop   50
--z-modal            60
--z-toast            70
```

### Dark mode

Preparado (variables definidas en `@media (prefers-color-scheme: dark)`) pero
**no activado en el MVP** — probamos primero con light-only para reducir superficie
de bugs visuales.

## Componentes UI primitives (src/components/ui/)

Todos aceptan `className` opcional para overrides puntuales. Todos accesibles.

| Componente | Base | Uso |
|---|---|---|
| `<Alert>` | div con rol y icono | Info/warning/danger banners |
| `<Badge>` | span pequeño | Chips de estado (BETA, activo, etc.) |
| `<Button>` | button/Slot | Primary/secondary/ghost + sizes |
| `<Card>` + `<CardBody>` | div | Contenedor con border + shadow |
| `<Checkbox>` | Radix | Forms |
| `<Chip>` | button toggle | Filtros multi-select |
| `<Dialog>` | Radix | Modal overlay (ZonePicker, etc.) |
| `<IconButton>` | button | Solo icono con aria-label |
| `<Input>` | input | Forms |
| `<Label>` | label | Forms |
| `<Popover>` | Radix | Menu contextual |
| `<RadioGroup>` | Radix | Forms de opciones exclusivas |
| `<Select>` | Radix | Dropdown de selección |
| `<Skeleton>` | div animate-pulse | Loading states |
| `<Switch>` | Radix | Toggle on/off |
| `<Tooltip>` | Radix | Hover hint |
| `<VisuallyHidden>` | span | Accesibilidad (labels invisibles) |

## Componentes de dominio (src/components/domain/)

Estos encapsulan patrones específicos de Barato.ar.

| Componente | Función |
|---|---|
| `<AlertCard>` | Form email para crear alerta de precio con validación |
| `<ChainBadge>` | Chip con nombre de cadena (roadmap: logo) |
| `<DealCard>` | Card grande para grid de ofertas — imagen, precio, descuento, marca |
| `<DealCardCompact>` | Versión chica para listados densos |
| `<DiscountBadge>` | Chip "-27%" en rojo |
| `<ExpiredBadge>` | Chip amarillo cuando validity próxima a vencer |
| `<PriceComparisonRow>` | Fila con ranking + tienda + precio + distancia + CTA |
| `<PriceHistoryCard>` | Wrapper con título + fetch data + chart |
| `<PriceHistoryChart>` | Line chart SVG con Recharts, 90d |
| `<PriceTag>` | Precio principal grande con original tachado + $/unidad |
| `<PromoBadge>` | Chip "2x1", "3x2", "-30% 2da unidad" |
| `<SearchBar>` | Input + autocomplete debounced + submit |
| `<ZoneChip>` | Botón chip con MapPin + nombre de zona (trigger de picker) |
| `<ZonePicker>` | Modal con lista agrupada + botón geolocation |
| `<NeighborsToggle>` | Switch "incluir barrios vecinos N km" |
| `<DeliveryLinks>` | Card con CTAs a PY/Rappi/ML con click tracking |

## Layout components (src/components/layout/)

| Componente | Función |
|---|---|
| `<PageShell>` | Wrapper con Nav + main + Footer + MobileBottomNav |
| `<Nav>` | Header desktop |
| `<NavZoneSlot>` | Client wrapper del ZonePicker en Nav (pasa ssrLabel) |
| `<Logo>` | SVG del logo "Barato.ar" |
| `<Footer>` | Enlaces legales + contacto + GitHub |
| `<MobileBottomNav>` | Bottom bar 4 icons: Inicio · Buscar · Alertas · Zona |

## Patrones de UI recurrentes

### Empty states

Cuando no hay data (búsqueda sin resultados, zona sin ofertas):
- Icono ilustrativo
- Título claro ("No encontramos ofertas en esta zona")
- Sugerencia accionable ("Probá cambiar de zona o quitar filtros")

### Loading states

- **Server components**: Suspense con `<Skeleton>` dimensionado.
- **Client fetches**: skeletons + toast en error con retry.

### Error states

- **Toast** para errores transitorios (fetch failed, form invalid).
- **Alert card** en la vista para errores persistentes.
- **error.tsx** por segmento cuando el server component throws.

### Cards de producto (patrón unificado)

Todas las cards siguen la misma estructura:
- Imagen o glyph placeholder (bottle SVG por default)
- Discount badge (esquina superior izq) + chain badge (esquina superior der)
- Marca (2xs uppercase gray)
- Nombre (line-clamp-2)
- Precio actual grande + original tachado + $/unidad
- Promo badge (2x1, etc.) si aplica
- Footer con distancia OR expiración

### Distancia

- Mostrar en km con 1 decimal.
- Solo si `store.lat` y `store.lng` existen.
- Si distancia null → mostrar "Cadena nacional" en su lugar.

### Precios

- Formato AR: "$1.290,50" (separador miles con punto, decimal con coma).
- Utility en `src/lib/format-price.ts`.
- Precio "por unidad" (ej. $/kg): mostrar chico gris debajo del precio principal.

### Zonas

- Chip con icono MapPin + nombre corto.
- Formato: "Palermo, CABA" · "San Isidro, GBA Norte" (barrio, región).
- Umbrella regions muestran nombre sólo ("Otras zonas GBA Sur").

## Iconografía

- **Set**: lucide-react (~350 icons, tree-shakeable).
- **Consistencia**: siempre `aria-hidden` cuando decorativo + label textual visible o `aria-label`.
- **Tamaños**: `size-3` (12px), `size-4` (16px), `size-5` (20px). Sin más.

## Accesibilidad

Objetivo: WCAG 2.1 AA en todas las vistas core.

- ✅ Contrast ratio >= 4.5:1 para texto normal, >= 3:1 para large.
- ✅ Focus rings visibles con `focus-visible:outline-2 outline-offset-2`.
- ✅ Skip link "Saltar al contenido" al inicio del `<body>`.
- ✅ Landmark roles (`<nav>`, `<main>`, `<footer>`).
- ✅ Forms con labels asociados via `htmlFor`.
- ✅ Radix UI para modales, tooltips, popovers (aria correcto out-of-box).
- ⏳ Alt text de imágenes de producto (post photo scraping).
- ⏳ Testing con screen reader manualmente en cada release.

## Responsive breakpoints

Tailwind default:
- `sm` — 640px
- `md` — 768px (mostrar Nav desktop, ocultar MobileBottomNav)
- `lg` — 1024px (grid 3 cols en cards)
- `xl` — 1280px (grid 4 cols en cards)
- `2xl` — 1536px (rare)

Diseño móvil-first: base sin prefijo, escalar hacia arriba.

## Superficies de la marca

- **Nombre**: Barato.ar
- **Wordmark**: "Barato" en peso normal + ".ar" en primary color (indigo). Sin logo dedicado aún.
- **Beta**: badge visible en el header hasta que Q1 tenga tracción.
- **Colores destacados**: indigo (primary), verde (savings), slate (grays).
- **Tipografía**: Inter — moderna, neutral, legible en cualquier tamaño.
- **Ilustraciones**: por ahora zero (usamos SVG glyphs simple). Roadmap: illustration set custom para empty states + landing.

## Do / Don't

**Do:**
- Mostrar precio + fecha juntos siempre
- Ordenar por precio ascendente en cada bucket
- Usar chips agrupados para filtros multi-select
- Diferenciar visualmente "En tu zona" vs "Cerca" vs "Nacional"

**Don't:**
- Usar emojis en la UI (excepto favicon/OG image)
- Usar hover-only tooltips en mobile (no funcionan)
- Ocultar información importante detrás de accordion en mobile
- Usar countdown timers ni scarcity messaging fake

## Deuda de diseño reconocida

- **Logos de cadena**: hoy solo texto en badges. Post-launch: SVG por cadena.
- **Fotos de producto**: placeholder bottle universal. Post R2 + OFF integration.
- **Dark mode**: variables listas pero no activado. Post-adoption si demanda.
- **Ilustraciones**: cero custom. Empty states con texto solo por ahora.
- **Onboarding tour**: solo el modal de zone. Podría crecer post-tracción.
