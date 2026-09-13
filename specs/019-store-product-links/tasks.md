---

description: "Tasks para F019 — Ir a la tienda lleva al producto real en la cadena"
---

# Tasks: F019 · "Ir a la tienda" externo

**Input**: Design documents from `specs/019-store-product-links/`
**Prerequisites**: [spec.md](./spec.md), [plan.md](./plan.md), [quickstart.md](./quickstart.md)
**Tests**: Incluidos (spec exige test unit por builder — success criteria).
**Organization**: Tareas agrupadas por user story para permitir implementación y testeo independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de otras tasks incompletas)
- **[Story]**: US1..US6
- Todas las tasks incluyen path exacto del archivo

## Path Conventions

- Backend/frontend integrados (Next.js app router monorepo simple)
- Código: `src/`
- Tests: `tests/unit/`
- Docs: `docs/`, `specs/019-store-product-links/`

---

## Phase 1: Setup

- [X] T001 Crear branch `feat/019-store-product-links` desde `main`

## Phase 2: Foundational

- [X] T002 Crear `src/lib/store-links.ts` con exports base
- [X] T003 Crear `tests/unit/lib/store-links.test.ts` con estructura

---

## Phase 3: US1 — Click en super lleva a búsqueda pre-cargada (P1) 🎯 MVP

**Goal**: Los botones "Ir a la tienda →" en super (Coto, Carrefour, Día, Jumbo, Vea, Disco, La Anónima, Changomas) llevan a la búsqueda del producto en cada sitio oficial.

**Independent Test**: `GET /producto/{slug}?zone=X` → grep `<a href>` de "Ir a la tienda" → 100% apuntan a `carrefour.com.ar`, `cotodigital3.com.ar`, etc. (NO a `barato-ar.vercel.app/tienda/`).

- [X] T004 [US1] En `src/lib/store-links.ts`: implementar helper interno `vtexSearch(host: string, q: string): string` que devuelve `https://{host}/{slug}?_q={encoded}&map=ft`. Usa `q.replace(/\s+/g, "-")` para el slug path.
- [X] T005 [US1] En `src/lib/store-links.ts`: agregar `STORE_LINK_BUILDERS: Record<string, (q, ctx) => string>` con builders para carrefour, dia, jumbo, vea, disco, changomas (todas usan `vtexSearch(hostname, q)`).
- [X] T006 [US1] En `src/lib/store-links.ts`: agregar builder custom para `coto` que devuelve `https://www.cotodigital3.com.ar/sitios/cdigi/browse?Ntt={encoded}`.
- [X] T007 [US1] En `src/lib/store-links.ts`: agregar builder custom para `la-anonima` que devuelve `https://laanonimaonline.com/busqueda?q={encoded}`.
- [X] T008 [US1] En `src/lib/store-links.ts`: implementar `resolveStoreLink(ctx: StoreLinkContext): string | null` con la lógica: `if storeProductUrl → return; if STORE_LINK_BUILDERS[chainSlug] → invoke con buildDeliveryQuery(productName, brand); else null`. Importa `buildDeliveryQuery` de `src/lib/deep-links.ts`.
- [X] T009 [P] [US1] En `tests/unit/lib/store-links.test.ts`: agregar 6 tests para las 6 chains VTEX verificando `hostname`, param `_q` y `map=ft`.
- [X] T010 [P] [US1] En `tests/unit/lib/store-links.test.ts`: agregar test para Coto verificando param `Ntt` en URL de `cotodigital3.com.ar`.
- [X] T011 [P] [US1] En `tests/unit/lib/store-links.test.ts`: agregar test para La Anónima verificando path `/busqueda` + param `q`.
- [X] T012 [P] [US1] En `tests/unit/lib/store-links.test.ts`: agregar test "storeProductUrl gana sobre builder" verificando que si `ctx.storeProductUrl` está seteado, se devuelve ese exacto valor.
- [X] T013 [US1] En `src/server/product/types.ts`: agregar `chainWebsiteUrl: string | null` al tipo `ComparisonStoreRow`.
- [X] T014 [US1] En `src/server/product/get-comparison.ts`: agregar `c.website_url AS chain_website_url` al SELECT del raw SQL. Agregar `chain_website_url: string | null` al tipo `LatestPriceRow`. Agregar `chainWebsiteUrl: r.chain_website_url` al mapeo del `row`.
- [X] T015 [US1] En `src/components/domain/price-comparison-row.tsx`: agregar prop opcional `chainWebsiteUrl?: string | undefined` al tipo `PriceComparisonRowProps`.
- [X] T016 [US1] En `src/components/domain/price-comparison-row.tsx`: importar `resolveStoreLink` de `@/lib/store-links`. Reemplazar el `href={props.href}` por un `href` resuelto internamente: `resolveStoreLink({chainSlug, productName, brand, storeProductUrl, chainWebsiteUrl}) ?? chainWebsiteUrl ?? props.href`. Mantener `href` prop como fallback para backward compat.
- [X] T017 [US1] En `src/components/domain/price-comparison-row.tsx`: agregar atributos `target="_blank" rel="noopener noreferrer nofollow"` al `<Link>` cuando el href sea externo (URL absoluta). Detectar externo con `href.startsWith("http")`.
- [X] T018 [US1] En `src/components/domain/price-comparison-row.tsx`: agregar `aria-label` descriptivo para accesibilidad (`aria-label={`Ir a la tienda de ${chainName} (abre en nueva pestaña)`}`) cuando el link sea externo.
- [X] T019 [US1] En `src/app/producto/[slug]/page.tsx`: en `<StoreSection>`, pasar `chainWebsiteUrl` desde `row.chainWebsiteUrl` (que ahora existe post-T013) al `<PriceComparisonRow>`. También pasar `productName` desde `data.product.name` y `brand` desde `data.product.brand` para que el component pueda invocar `resolveStoreLink`. NOTA: puede requerir agregar esas props también al tipo.
- [X] T020 [US1] Verificación manual local: `pnpm dev` → abrir `/producto/{slug}?zone=caba-palermo` de un producto con precios en varias super → confirmar visualmente que cada "Ir a la tienda →" abre nueva pestaña en el sitio correcto de cada cadena.

**US1 checkpoint**: 8 chains super emiten link externo funcional con query pre-cargado.

---

## Phase 4: US5 — Query limpio (P1)

**Goal**: El query mandado a la cadena está libre de códigos SEPA (BOT-N-ml, cc → ml).

**Note**: Esta task depende de T008 (que ya importa `buildDeliveryQuery`). En realidad se resuelve implícitamente al usar el helper compartido de F014. Verificar que efectivamente aplica.

- [X] T021 [P] [US5] En `tests/unit/lib/store-links.test.ts`: agregar test "limpia códigos SEPA antes de armar URL" con input name `"Vino la Celia Elite Malbec 750 cc BOT-750-ml"` y verificar que la URL final NO contiene `BOT-750-ml` ni `cc` como unidad. Debería tener `750+ml` en el query.

**US5 checkpoint**: Query cleanup verificado end-to-end.

---

## Phase 5: US2 — Click en farmacia lleva a Farmacity (P1)

**Goal**: La cadena `farmacity` tiene builder específico (Farmacity usa VTEX también).

**Note**: Este story se resuelve con 1 línea si Farmacity está en el STORE_LINK_BUILDERS de T005.

- [X] T022 [US2] En `src/lib/store-links.ts` (dentro de `STORE_LINK_BUILDERS`): agregar entrada `farmacity: (q) => vtexSearch("www.farmacity.com", q)`. Confirmar que el flow de US1 (T015-T019) aplica igual porque farmacity es solo otro chainSlug.
- [X] T023 [P] [US2] En `tests/unit/lib/store-links.test.ts`: agregar test para Farmacity verificando hostname `www.farmacity.com` y params VTEX.

**US2 checkpoint**: Click en fila de Farmacity abre farmacity.com con búsqueda.

---

## Phase 6: US3 — Click en delivery reutiliza F014 (P1)

**Goal**: Si `chainSlug` matchea PY/Rappi/ML, delegar en `DELIVERY_PARTNERS` de F014.

- [X] T024 [US3] En `src/lib/store-links.ts`: importar `DELIVERY_PARTNERS` y `readAffiliateIds` de `@/lib/deep-links`. En `resolveStoreLink`, después del check de builders custom pero antes del fallback: `const partner = DELIVERY_PARTNERS.find(p => p.slug === chainSlug); if (partner) return partner.buildSearchUrl(cleanedQuery, readAffiliateIds()[partner.slug]);`
- [X] T025 [P] [US3] En `tests/unit/lib/store-links.test.ts`: agregar test "PY reutiliza DELIVERY_PARTNERS" verificando que el URL retornado matchea el que `DELIVERY_PARTNERS.find(p => p.slug === "pedidosya")!.buildSearchUrl(q, undefined)` devuelve.
- [X] T026 [P] [US3] Idem para Rappi y MercadoLibre (2 tests más).

**US3 checkpoint**: Consistencia entre "Ir a la tienda" (fila) y "Comprar por delivery" (card grande de F014).

---

## Phase 7: US4 — Fallback para cadenas desconocidas (P2)

**Goal**: Chains nuevas sin builder específico caen a Google site search sobre `chain.websiteUrl`.

- [X] T027 [US4] En `src/lib/store-links.ts`: implementar helper `googleSiteSearch(hostname: string, q: string): string` que devuelve `https://www.google.com/search?q={encodeURIComponent(`site:${hostname} ${q}`)}`. Puede duplicarse con el de F014 — si es fácil, extraer a un módulo común, si no, duplicar (es 3 líneas).
- [X] T028 [US4] En `src/lib/store-links.ts` `resolveStoreLink`: después de los checks anteriores, si `ctx.chainWebsiteUrl` existe, extraer hostname con `new URL(ctx.chainWebsiteUrl).hostname` y devolver `googleSiteSearch(hostname, cleanedQuery)`.
- [X] T029 [P] [US4] En `tests/unit/lib/store-links.test.ts`: agregar test "chain desconocida con websiteUrl → Google site search" y "chain desconocida sin websiteUrl → null".

**US4 checkpoint**: Cadena nueva que agreguemos al seed sin actualizar `store-links.ts` funciona con fallback razonable.

---

## Phase 8: US6 — Click tracking a Plausible (P2)

**Goal**: Registrar evento `Store Click` con props `{ chainSlug, hasPdp }` para medir CTR.

- [X] T030 [US6] En `src/components/domain/price-comparison-row.tsx`: agregar `data-store-click={chainSlug}` y `data-store-has-pdp={String(!!storeProductUrl)}` al `<a>` externo (útiles para el listener global).
- [X] T031 [US6] Crear nuevo componente `src/components/analytics/store-click-tracker.tsx` client component que usa `useEffect` para agregar un `document.addEventListener("click", handler)` global. Handler detecta `event.target.closest("[data-store-click]")` y llama a `window.plausible?.("Store Click", { props: { chain, hasPdp } })`. Cleanup en unmount.
- [X] T032 [US6] En `src/components/layout/page-shell.tsx`: importar y renderizar `<StoreClickTracker />` una sola vez a nivel layout (fuera del `<main>`). No renderiza nada visible; solo listener.
- [X] T033 [P] [US6] Manual verify: con `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` seteado + DevTools Network → click en "Ir a la tienda" → confirmar POST a `plausible.io/api/event` con event `Store Click` y props correctos. Si Plausible no está configurado localmente, este paso queda como TODO para post-launch.

**US6 checkpoint**: Analytics registra clicks para futuro pitch a partnerships.

---

## Phase 9: Polish & docs (cross-cutting)

- [X] T034 [P] Correr `pnpm typecheck` → 0 errores.
- [X] T035 [P] Correr `pnpm test --run tests/unit/lib/store-links.test.ts` → todos los ~13 tests pasan.
- [X] T036 [P] Correr `pnpm test` completo → 200+ tests siguen pasando (no rompimos nada).
- [X] T037 [P] Correr `SKIP_ENV_VALIDATION=1 pnpm build` → build exitoso local.
- [X] T038 Editar `docs/AUDIT.md`: agregar sección "Bugs cerrados" mencionando "F019 resuelve: el botón 'Ir a la tienda' llevaba a landing interna en lugar de al sitio de la cadena — ahora abre en nueva pestaña con búsqueda pre-cargada".
- [X] T039 Editar `docs/ESTADO_ACTUAL.md`: agregar F019 a la tabla "Post-MVP shipped" con estado 🟢. Actualizar el score global si aplica.
- [X] T040 Editar `docs/VISTAS.md`: en la sección de `/producto/[slug]`, agregar nota "Botones 'Ir a la tienda' abren en nueva pestaña con search en el sitio de cada cadena (F019)".
- [X] T041 Editar `docs/FLUJO_FRONTEND.md`: en "Componentes clave", actualizar la entrada de `<PriceComparisonRow>` mencionando la nueva prop `chainWebsiteUrl` y que ahora resuelve href externo internamente.
- [X] T042 Editar `docs/README.md` si aplica agregar `store-links.ts` como concepto en la lista de utils del backend/frontend.
- [X] T043 Commit con firma Claude, cambios de código + docs
- [X] T044 Merge no-ff + push a main (Vercel auto-deploy)
- [X] T045 Prod verificado: 8/8 chains con URL externa correcta (curl grep confirmó Carrefour/Coto/Día/Jumbo/Disco/PY/Rappi/ML)

---

## Dependency Graph

```
Phase 1 (Setup):     T001
                       │
Phase 2 (Foundational): T002 (crea store-links.ts) → T003 (crea test file)
                       │
        ┌──────────────┼──────────────┬──────────┬──────────┬──────────┐
        ▼              ▼              ▼          ▼          ▼          ▼
Phase 3 (US1)   Phase 4 (US5)   Phase 5 (US2)  Phase 6 (US3) Phase 7 (US4) Phase 8 (US6)
T004→T019         T021           T022-T023      T024-T026     T027-T029     T030-T033
                                     │              │              │
                                     └── depende de STORE_LINK_BUILDERS (T005 de US1)
                                     
Phase 9 (Polish):     T034-T045 (después de todas las stories)
```

**Notas de dependencia**:
- US1 es MVP: SIN esto, ninguna otra story hace efecto visible.
- US5, US2, US3, US4, US6 dependen del shell de US1 (T005 STORE_LINK_BUILDERS + T008 resolveStoreLink + T015-T019 integration en el component). Pero una vez el shell existe, se pueden desarrollar en paralelo.

## Paralelización — ejemplos concretos

**Dentro de US1** (mismo archivo, se serializan):
- T004 → T005 → T006 → T007 → T008 → T013 → T014 → T015-T019 (dependen entre sí)
- T009-T012 [P] pueden hacerse en paralelo (test file distinto, todos independientes entre sí)

**Entre stories** (después que US1 shell exista):
- T021 (US5), T023 (US2 test), T025+T026 (US3 tests), T029 (US4 test) son todos [P] entre sí — mismo archivo test pero secciones independientes.
- Solo cuidado: si dos agentes tocan `store-links.ts` en paralelo (ej. T022 US2 y T027 US4), pueden colisionar merges. Serializar esos.

**Phase 9 Polish**: T034-T037 [P] entre sí (checks independientes). T038-T042 [P] entre sí (docs distintos). T043-T045 secuenciales (commit → merge → verify).

## Implementation Strategy

**MVP scope**: solo US1 + US5. Con eso, las 8 chains super emiten link externo con query limpio — resuelve el 90% del bug reportado por el usuario.

**Incremental delivery**:
1. **Ship 1**: US1 + US5 → merge a main. Deploy. Usuario ve improvement inmediato.
2. **Ship 2**: US2 (farmacia) + US3 (delivery consistency) — 2 tasks extra, súper rápido.
3. **Ship 3**: US4 (fallback) + US6 (tracking) — quality-of-life.

Estimación total: **~1.5-2h** implementación + **~30min** verify + docs = **~2.5h**.

## Independent test criteria per story

Cada story puede validarse solo con los criterios de spec.md:

- **US1**: HTML del `/producto/{slug}` → links a super son externos (dominios de cadenas).
- **US2**: HTML → link farmacity apunta a `farmacity.com`.
- **US3**: URL de fila PY == URL de card DeliveryLinks para el mismo producto.
- **US4**: mock chain con solo `websiteUrl` → link es Google site search.
- **US5**: URL final no contiene "BOT-", "PCK-", "cc" como unidad.
- **US6**: DevTools → evento Plausible con event "Store Click" en cada click.
