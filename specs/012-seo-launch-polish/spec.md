# Feature Specification: SEO, Performance & Launch

**Feature Branch**: `012-seo-launch-polish`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 001–011 (feature transversal, se corre al final)

## Overview

Endurecer todo lo que no es feature de negocio pero define el éxito del comparador: SEO on-page + off-page, sitemap dinámico, robots.txt, OG images estáticas y dinámicas, performance budget verificado end-to-end, analytics, disclaimer legal, página de "acerca de", flujo de takedown, `security.txt`, Lighthouse CI + axe en cada PR, y checklist de launch.

## User Scenarios & Testing

### User Story 1 — SEO on-page completo (P1) 🎯 MVP

**Descripción**: Todas las páginas indexables emiten meta, OG, Twitter Card, canonical, JSON-LD, hreflang (aunque sea solo `es-AR`).

**Independent Test**: crawlear con Screaming Frog o similar → 0 páginas sin title, description, canonical.

**Acceptance Scenarios**:
1. **Given** cualquier ruta pública, **When** el bot la crawlea, **Then** hay `<title>`, `<meta description>`, `<link canonical>`, `<meta property="og:*">`, `<script type="application/ld+json">` cuando aplica.
2. **Given** `/producto/[slug]`, **When** se pega en Rich Results Test, **Then** es rich result válido.

### User Story 2 — Sitemap y robots.txt (P1)

**Descripción**: `/sitemap.xml` dinámico con top 20k productos + categorías + tiendas; `/robots.txt` permite indexación de páginas SEO y bloquea `/admin`, `/api`, `/mis-alertas`.

### User Story 3 — Performance budget en CI (P1)

**Descripción**: Lighthouse CI corre en cada PR sobre 5 rutas clave; falla si Perf < 90 o LCP > 2 s o TBT > 200 ms.

### User Story 4 — Analytics privacy-first (P1)

**Descripción**: Plausible cargado con eventos custom para funnels clave: search, click a tienda, alerta creada, report enviado.

### User Story 5 — Legal & takedown (P1)

**Descripción**: Páginas `/legales/terminos`, `/legales/privacidad`, `/legales/takedown`, `/sobre`, `/contacto`, con contenidos reales.

### User Story 6 — Launch checklist (P1)

**Descripción**: Documento `LAUNCH.md` con checklist de 25 items verificados (DNS, SSL, Sentry, backups, monitoring, etc.) antes de anunciar.

### Edge Cases

- Producto sin datos en zona → NO indexar (noindex).
- URL con params → canonical apunta a la base sin params.
- Redirects: `/products/*` → `/producto/*` (301).
- 404: página con búsqueda + CTAs.

## Requirements

### Functional Requirements

- **FR-001**: Todas las rutas SEO DEBEN tener `generateMetadata` completo.
- **FR-002**: JSON-LD por tipo: `Organization` en layout, `WebSite` + `SearchAction` en home, `Product` + `AggregateOffer` en producto, `Store` en `/tienda/[slug]`.
- **FR-003**: `sitemap.xml` con `<lastmod>` de la última actualización de precio del producto.
- **FR-004**: `robots.txt` con `User-agent: *`, `Sitemap:`, `Disallow: /admin`, `/api`, `/mis-alertas`.
- **FR-005**: OG image dinámica por producto (F07); estática para home, ofertas, sobre.
- **FR-006**: `security.txt` en `/.well-known/`.
- **FR-007**: Lighthouse CI en `.github/workflows/lighthouse.yml` con budget definido.
- **FR-008**: axe-core corre en cada PR en todas las rutas indexables.
- **FR-009**: Plausible tracked events: `search`, `outbound_click`, `alert_created`, `report_submitted`, `filter_applied`.
- **FR-010**: Disclaimer "precios referenciales" visible en cada card de precio y en cada tabla comparativa.
- **FR-011**: Página `/legales/takedown` con form o email para reportar contenido a retirar (SLA 5 días hábiles).
- **FR-012**: 404 amigable con SearchBar y CTAs.
- **FR-013**: 500 amigable con "algo salió mal" + link a estado.
- **FR-014**: `humans.txt` opcional en `/.well-known/`.
- **FR-015**: Redirects HTTP → HTTPS (Vercel default) y www → apex.

### Key Entities

- N/A (feature de plataforma).

## Success Criteria

- **SC-001**: Lighthouse ≥ 95 en `/`, `/ofertas`, `/producto/[slug]`, `/buscar`, `/reportar`.
- **SC-002**: Core Web Vitals p75: LCP < 2 s, INP < 200 ms, CLS < 0.05.
- **SC-003**: Sitemap con > 10k URLs indexables tras primer mes.
- **SC-004**: 0 páginas críticas sin meta o canonical.
- **SC-005**: Rich Results válidos en Google Search Console tras indexación.
- **SC-006**: axe zero-error en todas las rutas indexables.
- **SC-007**: Bundle JS home < 100 KB gz totales.
- **SC-008**: LAUNCH.md 100 % completado antes de anunciar.

## Assumptions

- Dominio `precioya.ar` (o el que el owner defina) ya adquirido.
- Search Console + Bing Webmaster setup manual.
- Plausible dominio configurado.
- Ley 25.326 + Términos ya redactados por asesor legal (contenidos placeholder + revisión).
