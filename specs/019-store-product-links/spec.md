# Feature Specification: "Ir a la tienda" lleva al producto real en el sitio de la cadena

**Feature Branch**: `019-store-product-links`
**Created**: 2026-09-13
**Status**: Draft
**Type**: UX enhancement (P1)
**Depends on**: F007 (comparación producto), F014 (deep links delivery)
**Relates to**: B-08 (fotos), B-16 (contenido) — comparte estrategia de URL building

## Overview

Hoy el botón **"Ir a la tienda →"** en `/producto/[slug]` (dentro de `PriceComparisonRow`) usa:

```typescript
href={row.storeProductUrl ?? tiendaHref(row.chainSlug, zone)}
```

**Problema**: `storeProductUrl` está NULL en 121,061 / 121,061 prices (0%) porque SEPA no publica URLs a productos individuales — solo precios crudos. En consecuencia, TODOS los botones caen al fallback `tiendaHref` que lleva a nuestra propia landing interna `/tienda/coto` — no al producto en el sitio de Coto.

**Objetivo**: cuando el usuario clickea "Ir a la tienda", debe llegar al producto (o al menos a la búsqueda pre-cargada del producto) en el sitio de la cadena — para que pueda ver detalles, agregar al carrito, verificar disponibilidad, etc.

## User Scenarios & Testing

### User Story 1 — Click en super lleva a la búsqueda pre-cargada en el sitio (P1) 🎯

**Descripción**: Al clickear "Ir a la tienda" en cualquier fila de super (Coto, Carrefour, Día, Jumbo, Vea, Disco, La Anónima, Changomas), el usuario aterriza en una nueva pestaña con la búsqueda del producto pre-cargada en el sitio oficial.

**Independent Test**: `GET /producto/{slug}?zone=X` → inspect HTML, todos los `<a href>` de "Ir a la tienda" deberían apuntar al dominio de la cadena correspondiente con el nombre del producto como query param.

**Acceptance Scenarios**:
1. **Given** usuario en `/producto/coca-cola-2-25`, **When** clickea "Ir a la tienda →" en la fila de Coto, **Then** abre nueva pestaña en `https://www.cotodigital3.com.ar/sitios/cdigi/browse?Ntt=Coca-Cola+2.25L`
2. **Given** producto tiene `storeProductUrl` seteado (parser folleto lo capturó), **When** clickea "Ir a la tienda", **Then** abre directamente el PDP (product detail page) sin pasar por búsqueda.

### User Story 2 — Click en farmacia lleva al sitio de la farmacia (P1)

**Descripción**: Idéntico para Farmacity — búsqueda pre-cargada en su sitio.

**Independent Test**: fila con `chainSlug: "farmacity"` → href apunta a `farmacity.com` con query.

### User Story 3 — Click en delivery reutiliza deep-links de F014 (P1)

**Descripción**: Si la fila corresponde a PedidosYa, Rappi o MercadoLibre, reutilizar el mismo builder que `<DeliveryLinks>` (F014) para consistencia — no reinventar.

**Independent Test**: fila con `chainSlug: "pedidosya"` → mismo URL que emite `DeliveryLinks` para PY.

### User Story 4 — Fallback para cadenas sin builder configurado (P2)

**Descripción**: Si aparece una `chain` cuyo builder no está configurado (roadmap: cadena nueva no seedeada aún), fallback razonable a Google site search con `chain.websiteUrl` como dominio.

**Acceptance Scenarios**:
1. **Given** chain nueva sin builder específico, **When** usuario clickea "Ir a la tienda", **Then** abre Google site search filtrado por el dominio de la cadena.

### User Story 5 — Query limpio (P1)

**Descripción**: El query mandado a la cadena debe estar limpio de códigos SEPA (`BOT-750-ml`, `cc` como unidad, EANs) — reutilizar `buildDeliveryQuery` de F014.

**Independent Test**: producto con name `"Vino la Celia Elite Malbec 750 cc BOT-750-ml"` → query final `"Vino la Celia Elite Malbec 750 ml"`.

### User Story 6 — Click tracking a Plausible (P2)

**Descripción**: Registrar evento `Store Click` con props `{ chainSlug, hasStoreProductUrl }` para medir CTR + eventualmente monetizar via afiliados.

## Non-functional requirements

- **Rendering**: URL builders son puros — evaluados server-side al renderizar `PriceComparisonRow`. Sin overhead cliente.
- **Cache**: la URL depende solo de `chainSlug` + `productName` + `brand` — puede cachearse con la comparison view (ya cacheada).
- **Nuevo item de tab**: los links abren con `target="_blank" rel="noopener noreferrer nofollow"` (o `sponsored` cuando exista afiliado — Ley 25.326 + best practice SEO).
- **Backwards compatible**: si `storeProductUrl` existe (folletos parseados), se prioriza sobre el builder — no rompe F003.

## Out of scope

- **Verificación server-side de que el link funciona** — trust the chain's search endpoint. Si cambia, sale un P2 issue del ticket de audit.
- **Scraping para obtener PDP real de cada producto** — costoso, frágil. Deferred hasta que un partnership B2B nos dé feed oficial.
- **UX para "producto no encontrado en tienda"** — la cadena maneja ese caso. Nosotros solo redirigimos.
- **Preview del producto en la cadena** (thumbnail o resumen) — no compatible con CORS ni ToS de las cadenas.
- **Botones separados para "Ver en la tienda" vs "Buscar en"** — un solo CTA, comportamiento claro.
- **Deep links móviles a apps nativas** (`carrefour://`) — no publicadas por las cadenas.

## Success criteria

- ✅ 100% de las filas `<PriceComparisonRow>` en `/producto/[slug]` tienen un `href` externo al sitio de la cadena (no interno `/tienda/[slug]`)
- ✅ Al menos 8/11 cadenas tienen builder específico probado (7 super + Farmacity)
- ✅ Delivery apps (PY, Rappi, ML) reusan builders de F014
- ✅ Test unit por builder verificando format del URL
- ✅ Fallback razonable para cadenas nuevas (Google site search)
- ✅ Click tracking en Plausible con evento `Store Click`
- ✅ `PROD_LAUNCH_PLAN.md` no requiere actualizar (URLs son evergreen)
- ✅ `docs/AUDIT.md` menciona resolución de "botón lleva a landing interna en lugar de tienda"
- ✅ `docs/ESTADO_ACTUAL.md` reflejará F019 en el scorecard
