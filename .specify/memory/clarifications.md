# Precioya — Clarifications Log

Registro de decisiones tomadas durante `/speckit-clarify` que actualizan las specs.
Al leer una spec afectada, este documento tiene precedencia.

**Última actualización**: 2026-09-09

---

## C-001 · Modelado de ofertas combo ("2x1", "3x2", "segundo al 70%")

**Decisión**: Agregar campos al schema para modelar promo types explícitamente.

**Cambios al modelo (F03)**:

```prisma
enum PromoType {
  unit            // precio simple (default)
  nx1             // "2x1", "3x1" — llevás N, pagás 1
  nxm             // "3x2" — llevás N, pagás M
  second_off      // "segundo al 70%" — el segundo lleva descuento
  bundle_discount // "3 iguales, 20% off cada uno"
}

model Price {
  // ... campos existentes ...
  promoType                PromoType   @default(unit)
  promoBuyQty              Int?                        // N (buy)
  promoPayQty              Int?                        // M (pay)
  promoSecondDiscountPct   Float?                      // ej: 70 para "segundo al 70%"
  promoDescription         String?                     // texto original del folleto para auditoría
}
```

**Cascada**:
- **F03 parsers**: cada parser reconoce patrones ("2x1", "3x2", "Lleva N Paga M", "2do al 70%"), guarda tipo + qty + description.
- **F07 comparison page**: `PriceTag` muestra badge extra "2x1", "3x2", "2do −30%". El "precio efectivo por unidad" (ver C-003) es el que se usa para rankear.
- **F08 offers feed**: `DealCard` con badge de combo, ordena por `discountEffectivePct` (calculado combinando descuento + combo).
- **Design system (F02)**: nuevo componente `<PromoBadge>` con variantes por `PromoType`.

**Cálculo precio efectivo por unidad**:
```ts
function effectiveUnitPrice(p: Price): number {
  const q = Number(p.price);
  switch (p.promoType) {
    case "unit": return q;
    case "nx1": return q * (p.promoPayQty ?? 1) / (p.promoBuyQty ?? 1);
    case "nxm": return q * (p.promoPayQty ?? 1) / (p.promoBuyQty ?? 1);
    case "second_off": {
      const disc = (p.promoSecondDiscountPct ?? 0) / 100;
      return q * (1 + (1 - disc)) / 2;   // promedio de 2 unidades
    }
    case "bundle_discount": return q * (1 - (p.promoSecondDiscountPct ?? 0) / 100);
  }
}
```

Este valor va guardado en `priceEffective` (Decimal, computed on write) y es el que la comparación usa para rankear.

---

## C-002 · Zona segmentada e híbrida

**Decisión**: barrio discreto como default + fallback opt-in a radio de vecinos. La UI debe segmentar claramente los dos ámbitos para que el usuario entienda qué está viendo.

**Modelo (F03/F04)**: sin cambios al schema — `Store` ya tiene `zoneId`, `lat`, `lng`.

**Query pattern (F07, F08)**:
```sql
SELECT ..., CASE
  WHEN s.zone_id = $userZone THEN 'in_zone'
  ELSE 'nearby'
END AS proximity
FROM prices pr
JOIN stores s ON s.id = pr.store_id
WHERE (
  s.zone_id = $userZone
  OR ($includeNearby AND haversine(s.lat, s.lng, $userLat, $userLng) < 3)
  OR s.is_virtual = true
)
ORDER BY (proximity = 'in_zone') DESC, price ASC;
```

**UI segmentada (F07 y F08)**:
- Comparación de producto → sección "En Palermo" primero, después separador "Cerca de Palermo (< 3 km)" con las tiendas de barrios vecinos.
- Feed → toggle en el sidebar: `● Solo Palermo` / `○ Palermo + vecinos (3 km)`. Chip visible al activar "vecinos".
- Cada card indica `Palermo` o `Belgrano · 1.8 km` para que el usuario entienda de dónde viene.

**Config zona**:
- Default barrio: `caba-palermo` (o el que el user elija del dropdown / cookie).
- Coordenadas del "centro" del barrio se toman de `Zone.lat/lng` (bootstrap manual para los top 20 barrios de CABA + GBA).
- Sin geolocalización requerida en MVP; opt-in "usar mi ubicación" viene post-MVP.

**Cascada**:
- **F02**: `<ZoneChip>` muestra el barrio elegido y un `<NeighborsToggle>` para incluir vecinos.
- **F04 (Precios Claros)**: al seedear zonas, precomputar `Zone.lat/lng` como centroide.
- **F07 & F08**: query pattern arriba.
- **F09 (alertas)**: la alerta se dispara si `min(precio)` en `same-zone OR nearby` cumple target — pero el email muestra la tienda específica y en qué ámbito está.

---

## C-003 · Precio por unidad ($/L, $/kg) prominente en MVP

**Decisión**: Sí. Se calcula al ingestar y se muestra prominente en cards y comparación.

**Cambios al modelo (F03)**:

```prisma
model Product {
  // ... campos existentes ...
  standardUnit    String?    // "L", "kg", "un" — unidad canónica para comparación
  standardSize    Decimal?   @db.Decimal(10, 4)  // 2.25 (L), 0.9 (kg), 6 (un)
}

model Price {
  // ... campos existentes ...
  pricePerUnit    Decimal?   @db.Decimal(10, 4)  // ARS por standardUnit
  pricePerUnitEff Decimal?   @db.Decimal(10, 4)  // considerando combos (C-001)
}
```

**Reglas de conversión** (`src/lib/units.ts`):
- Volumen: siempre en L. `ml → L` dividiendo por 1000.
- Peso: siempre en kg. `g → kg`.
- Unidades: enteros. Un pack de 6 latas 354ml → `standardSize = 2.124`, `standardUnit = "L"`.
- Papel higiénico "x4" → `standardUnit = "un"`, `standardSize = 4`.
- Cuando el normalizador no puede inferir → `pricePerUnit = null` + flag en `NormalizerCandidate` para revisión.

**Cascada**:
- **F03 parsers**: el parser extrae `size + unit` (ya existía); además `size × factor` calcula `standardSize`.
- **F05 normalizer**: dos productos con misma `standardUnit + standardSize` son candidatos aunque el nombre difiera un poco.
- **F02 design system**: `<PriceTag>` muestra el precio grande y debajo, en 11 px muted: `$1.245 / L` (calculado con `pricePerUnitEff`).
- **F07 comparison page**: columna adicional "por litro/kg/un" en la tabla + toggle "ordenar por precio total / por unidad".
- **F08 feed**: cada card muestra `$/L` bajo el precio.
- **F06 search**: opción de ordenar por `pricePerUnitEff` asc.

---

## C-004 · Retornable vs no-retornable = productos distintos

**Decisión**: canonicals separados. El normalizador NO los mergea.

**Modelo**: sin cambios — el `packaging_conflict` en F05 ya cubre esto. Reforzar:

**Cascada**:
- **F05 normalizer**: `detectPackagingConflict(a, b)` incluye patrones:
  - `/retornable|retornables|ret\./i` vs `/descartable|descart\.|no ?ret/i`
  - `/light|lite|zero|diet/i` vs (default)
  - `/entera|light|descremada/i` en lácteos
  - `/con gas|sin gas/i`
  - Detección → confidence = 0, no queda ni siquiera en cola.
- **F06 search**: sugerir explícitamente ambas variantes cuando query es ambigua ("coca 2.25" → 2 resultados destacados: retornable y no-retornable).
- **F07 comparison page**: mostrar "Ver también: [Coca 2.25L descartable]" como card en "productos similares" cuando existe la variante.

---

## Impacto en el orden de implementación

Sin cambios en el sprint plan. Todo se absorbe dentro de las mismas features:
- Los campos nuevos entran en la migración inicial de F03 (no requieren migración posterior).
- La UI de C-002 se agrega a F07 y F08.
- El precio por unidad se calcula en el runner de F03 (`normalize.ts` gana `computeStandardUnit`).
- La lógica de packaging_conflict ya estaba en F05 — solo se refuerza con patrones documentados.

---

## Cambios en el design system (F02)

Agregar a la fase de foundational (F02):
- `<PromoBadge>` con variantes por `PromoType` (unit no renderiza nada; nx1/nxm/second_off/bundle_discount con etiquetas cortas).
- `<PriceTag>` acepta prop `pricePerUnit?: { value: number; unit: string; }` y lo renderiza debajo del precio.
- `<NeighborsToggle>` (chip toggle) para C-002.
- `<PriceComparisonRow>` gana columna opcional "por L/kg/un".
- `<ExpiredBadge>` y estilo `strikethrough` para C-007.
- `<ConsultarBadge>` para precio 0 (C-007).

---

## C-005 · Nombre de marca y dominio

**Decisión**: **Barato.ar** — dominio `barato.ar`.

**Cascada**:
- `package.json` name: `barato-ar`.
- `NEXT_PUBLIC_APP_URL` = `https://barato.ar` (prod), `https://staging.barato.ar` (staging).
- Logo del design system: texto "Barato" con `.ar` en accent color (`--color-primary` indigo).
- OG default: `og-default.png` con "Barato.ar — Comparador de ofertas".
- Metadata `siteName`, `application-name`: "Barato.ar".
- Email `from`: `alertas@barato.ar` (C-012).
- Bot User-Agent: `BaratoBot/0.1 (+https://barato.ar/bot)`.
- Slug interno `precioya` en wireframes/mocks se reemplaza por `barato` progresivamente (no urgente romper wireframes ya publicados).

---

## C-006 · Fotos de producto vía scraping puntual del super

**Decisión**: cuando el folleto trae link al PDP del super (`storeProductUrl`), scrapear la foto de esa página. Guardar en Cloudflare R2 (C-009). Fallback a SVG placeholder por categoría cuando no hay link o el scrape falla.

**Modelo**:

```prisma
model Product {
  // ... campos existentes ...
  imageUrl        String?      // URL final en R2 (o CDN Cloudflare)
  imageSourceUrl  String?      // URL original scrapeada (auditoría)
  imageCapturedAt DateTime?
  imageStatus     String?      // "ok" | "missing" | "failed" | "placeholder"
}
```

**Pipeline (nueva feature ligera, se implementa dentro de F03 tasks)**:
1. Tras cada ingesta, worker asíncrono lee productos sin `imageUrl` o con `imageCapturedAt` > 30 días.
2. Si `Price.storeProductUrl` existe, hace GET (rate-limit 1 req/2 s por dominio, `robots.txt`).
3. Extrae og:image o primer `<img>` relevante del DOM.
4. Sharp: convierte a WebP 400×400 + 800×800 retina, comprime.
5. Upload a R2 bucket `barato-ar-products` con key `products/{eanCode ?? id}.webp`.
6. Actualiza `Product.imageUrl` con URL pública de R2 CDN.
7. Si falla 3 veces, marca `imageStatus = "failed"` y usa placeholder por categoría.

**Placeholder por categoría** (fallback):
- SVG neutrales servidos desde `/public/placeholders/{category-slug}.svg`.
- Categorías cubiertas al MVP: gaseosas, aceite, yerba, papel, detergente, cerveza, farmacia, lácteo, arroz, fideos.
- `<DealCard>` y `<ProductHeader>` reciben `imageUrl` o el placeholder por category.

**Cascada**:
- F03/F04: parsers guardan `storeProductUrl` cuando lo detectan.
- F03 tasks: nueva fase `Photo scraping` (T090–T095).
- F07/F08: usar `imageUrl` con fallback automático.

---

## C-007 · Precios vencidos y precio 0

**Decisión**:
- `valid_to < NOW()` → precio "vencido". No aparece en feeds (F08). En `/producto/[slug]` (F07) va debajo de los vigentes en una sección colapsable "Precios recientes (vencidos)" con estilo tachado.
- `price = 0` → "consultar en tienda". Se muestra con badge especial `<ConsultarBadge>`, no participa de rankings ni de mínimos/máximos. Es válido para farmacia (medicamentos con precio de mostrador).

**Cascada**:
- **F08 query** filtro: `AND (valid_to IS NULL OR valid_to > NOW()) AND price > 0`.
- **F07 query**: dos buckets ("vigentes" y "vencidos_ultimos_14d"). UI colapsable.
- **F06 search**: excluir precio 0 del ranking; los productos con solo precios 0 quedan pero sin `minPrice`.
- **F10 history**: excluye precio 0 del cálculo `avg/min/max` pero los guarda en `PriceHistory` como observación válida.
- Design system: `<ExpiredBadge>` (badge gris con label "vencida hace 3d") y `<ConsultarBadge>` (chip neutro con label "consultar en tienda").

---

## C-008 · On-demand revalidation post-ingesta

**Decisión**: al finalizar cada `IngestionRun` exitoso, el runner llama `revalidateTag()` para invalidar el cache de las páginas afectadas.

**Implementación (F03)**:

```ts
// src/ingestion/core/revalidate.ts
export async function revalidateAfterIngest(chainId: string, affectedZones: string[]) {
  const secret = process.env.REVALIDATE_SECRET!;
  const base = process.env.NEXT_PUBLIC_APP_URL!;
  const tags = [
    "offers-home",
    ...affectedZones.map(z => `offers-${z}`),
    `chain-${chainId}`,
  ];
  await fetch(`${base}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-revalidate-secret": secret },
    body: JSON.stringify({ tags }),
  });
}
```

**Endpoint (F01)**:

```ts
// src/app/api/revalidate/route.ts
export async function POST(req: Request) {
  const secret = req.headers.get("x-revalidate-secret");
  if (secret !== env.REVALIDATE_SECRET) return new Response("forbidden", { status: 403 });
  const { tags } = await req.json();
  for (const tag of tags) revalidateTag(tag);
  return Response.json({ revalidated: tags });
}
```

**Uso en páginas** (F08, F07):
- `/` server component: `fetch(..., { next: { tags: ["offers-home", `offers-${zone}`] } })`.
- `/producto/[slug]`: `unstable_cache` wrapper con tag `product-${slug}`.
- `/ofertas`: tag `offers-${zone}`.

**Cascada**:
- **F01**: endpoint `/api/revalidate` + `REVALIDATE_SECRET` en env.
- **F03/F04**: llamada al endpoint al terminar cada corrida.
- **F07/F08**: consumen datos con tags nombrados.
- **F11**: al aprobar report, revalidar `offers-${zone}` + `product-${slug}`.

---

## C-009 · Cloudflare R2 como object storage

**Decisión**: R2 para todas las imágenes (productos scraped + fotos de reports).

**Setup**:
- Bucket `barato-ar-products` (productos) — público con custom domain `img.barato.ar`.
- Bucket `barato-ar-reports` (crowdsourcing) — privado, se sirve vía presigned URLs con TTL 1h.
- SDK: `@aws-sdk/client-s3` apuntando a R2 endpoint.
- Cache: R2 tiene CDN nativo, `Cache-Control: public, max-age=31536000, immutable` en objetos.

**Env vars**:
```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_PRODUCTS=barato-ar-products
R2_BUCKET_REPORTS=barato-ar-reports
NEXT_PUBLIC_R2_PUBLIC_URL=https://img.barato.ar
```

**Cascada**:
- **F01**: env vars documentadas, wrapper `src/lib/storage.ts` con `uploadImage`, `deleteImage`, `getPresignedUrl`.
- **F03**: photo scraper sube a `products/`.
- **F11**: reports suben a `reports/` con presigned upload.
- **F02**: `<ProductImage>` component con lazy loading + fallback a placeholder.

---

## C-010 · Auth.js (NextAuth v5) para /admin

**Decisión**: Auth.js v5 (beta5+) con Prisma adapter. Solo protege `/admin/*`. El sitio público sigue sin auth (alertas email-only quedan como están en F09).

**Setup**:

```ts
// src/lib/auth.ts
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: { host: "smtp.resend.com", port: 587, auth: { user: "resend", pass: env.RESEND_API_KEY } },
      from: "admin@barato.ar",
    }),
  ],
  callbacks: {
    authorized: ({ auth, request }) => {
      if (request.nextUrl.pathname.startsWith("/admin")) return !!auth?.user && ADMIN_EMAILS.has(auth.user.email!);
      return true;
    },
  },
});

const ADMIN_EMAILS = new Set(env.ADMIN_EMAILS.split(","));
```

**Modelo (Prisma tables que Auth.js necesita)**:
```prisma
model User { id String @id @default(cuid()) email String @unique emailVerified DateTime? name String? image String? accounts Account[] sessions Session[] }
model Account { id String @id @default(cuid()) userId String type String provider String providerAccountId String @@unique([provider, providerAccountId]) user User @relation(fields: [userId], references: [id], onDelete: Cascade) }
model Session { id String @id @default(cuid()) sessionToken String @unique userId String expires DateTime user User @relation(fields: [userId], references: [id], onDelete: Cascade) }
model VerificationToken { identifier String token String @unique expires DateTime @@unique([identifier, token]) }
```

**Cascada**:
- **F01**: instalar `next-auth@beta`, `@auth/prisma-adapter`, agregar tablas User/Account/Session/VerificationToken al schema, middleware `src/middleware.ts` que gatea `/admin`.
- **F03/F05/F11**: páginas `/admin/*` chequean `await auth()`; el env-token approach queda **cancelado**.
- **F09**: alertas siguen sin auth (email-only). NO usan `User`.

---

## C-011 · Retries con backoff exponencial

**Decisión**: 3 reintentos con backoff exponencial (1 s → 4 s → 15 s) por request HTTP fallido en scrapers. Si tras 3 falla, `IngestionRun.status = "partial"` y `Sentry.captureMessage` con contexto (URL, chain, attempt count).

**Implementación** (`src/ingestion/core/http.ts`):
```ts
const DELAYS = [1000, 4000, 15000];
export async function fetchWithRetry(url: string, opts?: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < DELAYS.length + 1; attempt++) {
    try {
      const res = await fetch(url, opts);
      if (res.ok || res.status < 500) return res;   // 4xx no reintenta
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === DELAYS.length) {
        Sentry.captureMessage("scraper_fetch_final_failure", { level: "warning", extra: { url, attempts: attempt + 1 } });
        throw err;
      }
      await sleep(DELAYS[attempt]);
    }
  }
  throw new Error("unreachable");
}
```

**Cascada**: F03/F04/F11 usan `fetchWithRetry`. Parser individual dentro del runner no rompe la corrida entera (loop try/catch por item, mismo `IngestionRun` continúa con `rowsSkipped++`).

---

## C-012 · Dominio de email desde S1

**Decisión**: configurar SPF/DKIM/DMARC en `barato.ar` desde Feature 001 (setup) para que Resend envíe desde `alertas@barato.ar` sin bounces.

**DNS records** (documentar en `LAUNCH.md` y `docs/dev.md`):
- `TXT @ v=spf1 include:_spf.resend.com ~all`
- `TXT resend._domainkey <valor de Resend dashboard>`
- `TXT _dmarc v=DMARC1; p=quarantine; rua=mailto:dmarc@barato.ar;`
- `MX @ feedback-smtp.us-east-1.amazonses.com 10` (para bounce feedback si Resend lo requiere)

**Cascada**:
- **F01**: agregar sección "DNS Setup" en README + task para verificar el dominio en Resend dashboard.
- **F09**: los templates usan `from: "Barato.ar <alertas@barato.ar>"`.
- **F10**: admin usa `from: "Barato.ar <admin@barato.ar>"` para magic links.

---

## C-013 · Sin feature flags en MVP

**Decisión**: cada feature se activa al mergear a `main`. Sin toggles remotos, sin librería de flags.

Consecuencia:
- Los PRs deben ser deployable end-to-end antes de mergear.
- Si se necesita "apagar" algo en prod, se revierte el PR o se define una env var puntual (`ENABLE_REPORTS=false`).
- Env vars como single-flag switches se documentan en `.env.example`.

No hay cascada de código adicional.

---

## C-014 · Deep links de delivery apps: postponer decisión

**Decisión**: como F03/F04 en MVP solo cubren supers/farmacias, no se implementan deep links `pedidosya://` ni `rappi://` ahora.

**Registro**:
- En la spec de una futura "F13-ingest-delivery" (post-MVP), agregar sección "Deep links" con la opción elegida hoy: **Universal Links + fallback web**.
- `<DealCard>` botón "Ir a la tienda" hoy: siempre a URL web (`storeProductUrl` o home de la cadena).
- Cuando se implemente, el mapping `chainSlug → appScheme` va en `src/lib/deep-links.ts`.

