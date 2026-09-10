# Implementation Plan: Ingest Supermarket Flyers

**Branch**: `003-ingest-super-flyers` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

## Summary

4 parsers Node/TypeScript (Carrefour, Coto, Día, Jumbo), un runner común, cron GitHub Actions semanal, DB schema completo del core (chains, stores, products, prices, offers, ingestion_runs). Todo idempotente y con snapshot tests.

## Technical Context

- **Language/Version**: TS 5.6, Node 20 (para cron y CLI)
- **Primary Dependencies**: `cheerio` (HTML parsing), `pdf-parse` (PDF), `undici` (HTTP), `zod` (validación), `@prisma/client`, `commander` (CLI), `@sentry/node`
- **Storage**: Postgres (Neon)
- **Testing**: Vitest con snapshots contra fixtures commiteados en `tests/fixtures/flyers/*`
- **Target Platform**: GitHub Actions (Ubuntu runner), disparado por cron
- **Project Type**: Web app + jobs
- **Performance Goals**: cada parser < 3 min, ingesta full < 15 min
- **Constraints**: 1 req/s max por dominio, respetar `robots.txt`
- **Scale/Scope**: 4 cadenas, ~2000 productos totales por semana

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| I. SEO-First | N/A (backend job) |
| II. Datos frescos | Central. `captured_at` en cada row + tabla `ingestion_runs`. |
| III. TS strict + tests | Central. Cada parser tiene snapshot test. |
| IV. Privacidad | N/A |
| V. Performance | N/A (backend) |
| VI. Legalidad | Central. Folletos = fuente pública. Rate-limit + robots.txt. |
| VII. Simplicidad | Sí. Un runner común. Sin cola de mensajes. |
| VIII. Accesibilidad | N/A |

## Data Model (schema completo del core)

> Este schema absorbe las decisiones de [clarifications.md](../../.specify/memory/clarifications.md):
> C-001 (promo types), C-003 (precio por unidad), C-004 (packaging separado).

```prisma
enum Vertical {
  supermarket
  delivery
  pharmacy
  beverages
}

enum PriceSource {
  flyer
  precios_claros
  public_api
  crowdsourced
  scraped
}

enum IngestionStatus {
  running
  success
  partial
  failed
}

enum PromoType {
  unit             // precio simple (default)
  nx1              // "2x1", "3x1"
  nxm              // "3x2"
  second_off       // "segundo al 70%"
  bundle_discount  // "3 iguales, 20% off"
}

model Chain {
  id        String   @id                                // "carrefour"
  name      String                                     // "Carrefour"
  slug      String   @unique
  vertical  Vertical @default(supermarket)
  logoUrl   String?
  websiteUrl String?
  createdAt DateTime @default(now())

  stores   Store[]
  offers   Offer[]
  runs     IngestionRun[]

  @@map("chains")
}

model Zone {
  id        String   @id                                // "caba-palermo"
  name      String                                     // "Palermo, CABA"
  slug      String   @unique
  parentId  String?                                    // nesting: barrio -> ciudad
  lat       Float?
  lng       Float?
  radiusKm  Float?

  stores   Store[]

  @@map("zones")
}

model Store {
  id        String   @id @default(cuid())
  chainId   String
  name      String                                     // "Carrefour Palermo"
  slug      String   @unique
  address   String?
  zoneId    String?                                    // null = national/virtual
  lat       Float?
  lng       Float?
  isVirtual Boolean  @default(false)                   // "cadena virtual" en MVP

  chain    Chain   @relation(fields: [chainId], references: [id])
  zone     Zone?   @relation(fields: [zoneId], references: [id])
  prices   Price[]

  @@index([chainId, zoneId])
  @@map("stores")
}

model Product {
  id               String   @id @default(cuid())
  name             String
  normalizedName   String                              // lowercase, sin acentos, sorted tokens
  brand            String?
  size             Float?                              // 2.25 (valor bruto del folleto)
  unit             String?                             // "L", "g", "ml", "kg"
  standardSize     Decimal? @db.Decimal(10, 4)         // C-003: normalizado (ml→L, g→kg)
  standardUnit     String?                             // C-003: "L", "kg", "un"
  packagingFlag    String?                             // C-004: "retornable" | "descartable" | "light" | "regular" | ...
  category         String?                             // "gaseosas-cola"
  imageUrl         String?
  eanCode          String?  @unique                    // GTIN cuando disponible
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  prices   Price[]
  offers   Offer[]
  history  PriceHistory[]

  @@index([normalizedName])
  @@index([brand])
  @@index([category])
  @@index([standardUnit, standardSize])
  @@map("products")
}

model Price {
  id             String       @id @default(cuid())
  productId      String
  storeId        String
  price          Decimal      @db.Decimal(10, 2)
  previousPrice  Decimal?     @db.Decimal(10, 2)
  currency       String       @default("ARS")
  isOffer        Boolean      @default(false)
  discountPct    Float?
  validFrom      DateTime
  validTo        DateTime?
  source         PriceSource
  sourceUrl      String?
  capturedAt     DateTime     @default(now())

  // C-001: modelado de combos
  promoType                PromoType @default(unit)
  promoBuyQty              Int?
  promoPayQty              Int?
  promoSecondDiscountPct   Float?
  promoDescription         String?

  // C-003: precio por unidad estándar
  pricePerUnit    Decimal?  @db.Decimal(10, 4)         // ARS / standardUnit
  pricePerUnitEff Decimal?  @db.Decimal(10, 4)         // considerando combos (C-001)

  product   Product @relation(fields: [productId], references: [id])
  store     Store   @relation(fields: [storeId], references: [id])

  @@unique([productId, storeId, source, validFrom], name: "unique_capture")
  @@index([storeId, capturedAt])
  @@index([productId, capturedAt])
  @@index([pricePerUnitEff])
  @@map("prices")
}

model PriceHistory {
  id          BigInt   @id @default(autoincrement())
  productId   String
  storeId     String
  price       Decimal  @db.Decimal(10, 2)
  capturedAt  DateTime @default(now())

  product   Product @relation(fields: [productId], references: [id])

  @@index([productId, storeId, capturedAt])
  @@map("price_history")
}

model Offer {
  id           String   @id @default(cuid())
  title        String
  description  String?
  productId    String?                              // nullable — puede ser oferta de categoría
  chainId      String
  discountPct  Float?
  badge        String?                              // "Miércoles Coto", "Día del cliente"
  validFrom    DateTime
  validTo      DateTime?
  sourceUrl    String?
  upvotes      Int      @default(0)
  createdAt    DateTime @default(now())

  product   Product? @relation(fields: [productId], references: [id])
  chain     Chain    @relation(fields: [chainId], references: [id])

  @@index([chainId, validTo])
  @@map("offers")
}

model IngestionRun {
  id             String          @id @default(cuid())
  chainId        String
  source         PriceSource
  startedAt      DateTime        @default(now())
  finishedAt     DateTime?
  status         IngestionStatus @default(running)
  rowsIngested   Int             @default(0)
  rowsSkipped    Int             @default(0)
  errorMessage   String?
  metadata       Json?           // urls, snapshot hash, versión del parser

  chain          Chain           @relation(fields: [chainId], references: [id])

  @@index([chainId, startedAt])
  @@map("ingestion_runs")
}
```

## Parser Architecture

```
src/ingestion/
├── core/
│   ├── runner.ts                     # orquesta ejecución + logging + Sentry
│   ├── http.ts                       # undici wrapper con rate-limit + robots
│   ├── normalize.ts                  # normalizar producto (nombre, size, unit)
│   ├── idempotency.ts                # cálculo de hash + upsert seguro
│   ├── types.ts                      # tipos compartidos
│   └── cli.ts                        # commander CLI (`pnpm ingest <chain>`)
├── chains/
│   ├── carrefour/
│   │   ├── index.ts                  # export parseCarrefour()
│   │   ├── fetcher.ts                # descarga folleto de la semana
│   │   ├── parser.ts                 # cheerio HTML → Product[] + Price[]
│   │   └── __snapshots__/
│   ├── coto/
│   ├── dia/
│   └── jumbo/
└── types.ts
```

## Contract del Parser (una interfaz común)

```ts
export type ParsedItem = {
  productName: string;
  brand?: string;
  size?: number;
  unit?: string;
  packagingFlag?: string;              // C-004
  category?: string;
  eanCode?: string;
  price: number;
  previousPrice?: number;
  // C-001
  promoType?: "unit" | "nx1" | "nxm" | "second_off" | "bundle_discount";
  promoBuyQty?: number;
  promoPayQty?: number;
  promoSecondDiscountPct?: number;
  promoDescription?: string;
  validFrom: string;                   // ISO
  validTo?: string;
  sourceUrl: string;
};

export type ChainParser = {
  chainId: "carrefour" | "coto" | "dia" | "jumbo";
  fetch(): Promise<{ raw: string; sourceUrl: string; }>;
  parse(raw: string, sourceUrl: string): AsyncIterable<ParsedItem>;
};
```

## Ingestion Runner Flow

1. Start `IngestionRun` con `status = running`.
2. `fetch()` → HTML/PDF crudo.
3. `parse()` yield item por item. El parser DEBE reconocer patrones de combo (`2x1`, `3x2`, `2do al 70%`, `Lleva N Paga M`) y llenar `promoType`, `promoBuyQty`, `promoPayQty`, `promoSecondDiscountPct`, `promoDescription`.
4. Para cada `ParsedItem`:
   - `normalizeProduct(item)` → key `{normalizedName, brand, size, unit, packagingFlag}`. **C-004**: si `name` matchea `/retornable/i` → `packagingFlag = "retornable"`; `/descartable/i` → `"descartable"`; light/zero → flag correspondiente.
   - `computeStandardUnit(size, unit)` → `{ standardSize, standardUnit }` (C-003).
   - Upsert Product (crea si no existe, matchea por EAN si existe; separar canonicals por `packagingFlag`).
   - `computePricePerUnit(price, product.standardSize)` → `pricePerUnit`.
   - `computeEffectiveUnitPrice(price, promoType, ...)` → `pricePerUnitEff` (C-001 fórmula en clarifications.md).
   - Upsert Price con unique constraint idempotente.
   - Append a PriceHistory.
5. Finalizar Run con `status`, `rowsIngested`, `finishedAt`.
6. Emitir métrica: `rows_delta` vs corrida anterior; si `< 0.8` → Sentry warning.

## Idempotencia

- **Product**: match por `ean_code` first; fallback por `(normalizedName, brand, size, unit)`.
- **Price**: `@@unique([productId, storeId, source, validFrom])` → 2 corridas del mismo día = misma row (update, no insert).
- **PriceHistory**: append-only, con dedup por `(productId, storeId, ROUND(price), capturedAt::date)`.

## Rate-limit y robots.txt

- `undici` global agent con `connections: 2`, `pipelining: 1`.
- Cola in-memory: 1 request cada 1000 ms por dominio.
- `robotstxt` package para verificar; skip URL si `Disallow`.
- User-Agent: `PrecioyaBot/0.1 (+https://precioya.ar/bot)`.

## CI/CD & Scheduler

`.github/workflows/ingest-flyers.yml`:

```yaml
name: Weekly Flyer Ingestion
on:
  schedule:
    - cron: "0 11 * * 1"                   # lunes 11:00 UTC = 8am ART
  workflow_dispatch:
jobs:
  ingest:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        chain: [carrefour, coto, dia, jumbo]
      fail-fast: false
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm ingest ${{ matrix.chain }}
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_UNPOOLED }}
          SENTRY_DSN: ${{ secrets.SENTRY_DSN_INGEST }}
```

## Testing Strategy

- Fixtures HTML/PDF commiteados en `tests/fixtures/flyers/<chain>/YYYY-WW.html`.
- Cada parser tiene `tests/unit/ingestion/chains/<chain>.test.ts` con:
  - `parse(fixture)` → array de items → snapshot.
  - `normalizeProduct` casos edge (marca ausente, unit inferida).
  - Idempotencia: correr dos veces contra la misma fixture → `prices.count` estable.
- Integration test (`tests/integration/ingestion-runner.test.ts`) con Postgres efímero (`pg-mem` o Neon branch).

## Observability

- `console.log` estructurado JSON `{ level, msg, chain, rows, elapsed_ms }`.
- Sentry span por parser (`Sentry.startSpan`).
- Métrica custom via Sentry attributes: `rows_ingested`, `duration_ms`.

## Complexity Tracking

Sin violaciones. El scheduler dentro de GitHub Actions cumple Principio VII (no message queue).
