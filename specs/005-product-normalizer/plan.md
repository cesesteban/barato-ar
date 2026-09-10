# Implementation Plan: Product Normalizer

**Branch**: `005-product-normalizer` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

## Summary

Algoritmo de matching por (1) EAN exacto y (2) similitud fuzzy `(name, brand, size, unit)` con thresholds y cola de revisión manual. Se ejecuta como paso post-ingesta y en cron semanal.

## Technical Context

- **Language/Version**: TS 5.6
- **Primary Dependencies**: `string-similarity` (o custom Levenshtein), `natural` (opt para stemming ES), `@prisma/client`
- **Storage**: Postgres — se agregan `Product.canonicalId`, `NormalizerCandidate`, `NormalizerReject`
- **Testing**: Vitest con dataset de 200 pares etiquetados manualmente (`tests/fixtures/normalizer/ground-truth.json`)
- **Target Platform**: Node script + Next.js admin page
- **Performance Goals**: procesar 10k productos en < 5 min
- **Constraints**: no bloquear ingesta si falla; correr async
- **Scale/Scope**: 10-20k productos totales en MVP

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| I. SEO | La página `/producto/[slug]` usa el `canonical` (mejor para SEO). |
| II. Datos honestos | Confidence loggeada; matches no destruyen data original. |
| III. TS strict + tests | Ground truth dataset commiteado. |
| VII. Simplicidad | Sin ML complejo en MVP; string metrics. |

## Data Model Changes

```prisma
model Product {
  // ... campos existentes ...
  canonicalId  String?
  canonical    Product?  @relation("Canonical", fields: [canonicalId], references: [id])
  aliases      Product[] @relation("Canonical")
  @@index([canonicalId])
}

model NormalizerCandidate {
  id           String   @id @default(cuid())
  productAId   String
  productBId   String
  confidence   Float
  features     Json                     // {ean_match, name_sim, brand_sim, size_match, unit_match}
  status       String   @default("pending")   // pending, approved, rejected
  decidedBy    String?
  decidedAt    DateTime?
  createdAt    DateTime @default(now())

  @@unique([productAId, productBId])
  @@index([status, confidence])
  @@map("normalizer_candidates")
}

model NormalizerReject {
  id           String   @id @default(cuid())
  productAId   String
  productBId   String
  reason       String?
  rejectedBy   String
  rejectedAt   DateTime @default(now())

  @@unique([productAId, productBId])
  @@map("normalizer_rejects")
}
```

## Algorithm

### Pass 1 — EAN Match

```sql
UPDATE products a
SET canonical_id = COALESCE(b.canonical_id, b.id)
FROM products b
WHERE a.ean_code = b.ean_code
  AND a.ean_code IS NOT NULL
  AND a.id != b.id
  AND (a.canonical_id IS NULL OR a.canonical_id != b.id);
```

### Pass 2 — Fuzzy Match (only for products with `canonicalId IS NULL`)

Para cada par `(a, b)` de la misma categoría (o sin categoría) que aún no comparten canonical:

```ts
function score(a: Product, b: Product): { confidence: number; features: Features } {
  const features = {
    ean_match: a.eanCode && b.eanCode ? a.eanCode === b.eanCode : null,
    name_sim: jaroWinkler(a.normalizedName, b.normalizedName),      // 0..1
    brand_sim: a.brand && b.brand ? jaroWinkler(a.brand.toLowerCase(), b.brand.toLowerCase()) : 0,
    // C-003: usar standard normalized
    size_match: a.standardSize === b.standardSize && a.standardUnit === b.standardUnit,
    unit_match: a.standardUnit === b.standardUnit,
    // C-004: si `packagingFlag` difiere, es un conflicto duro
    packaging_conflict: (a.packagingFlag && b.packagingFlag && a.packagingFlag !== b.packagingFlag)
                        || detectPackagingConflict(a.name, b.name),
  };

  if (features.packaging_conflict) return { confidence: 0, features };
  if (!features.size_match) return { confidence: 0.2 * features.name_sim, features };

  const w_name = 0.5, w_brand = 0.3, w_size = 0.2;
  const confidence = w_name * features.name_sim
                   + w_brand * features.brand_sim
                   + w_size * (features.size_match ? 1 : 0);
  return { confidence, features };
}
```

Bucket:
- `confidence >= 0.90` → auto-mergear (Pass 3).
- `0.60 <= confidence < 0.90` → upsert en `NormalizerCandidate` (status pending), skip si está en `NormalizerReject`.
- `confidence < 0.60` → ignorar.

### Pass 3 — Merge

Elegir un canonical: el producto con `eanCode` no-null gana; si empate, el más viejo (`createdAt`).

## Admin UI `/admin/normalizer-queue`

- Lista candidatos `pending` ordenados por confidence desc.
- Muestra ambos productos side-by-side: nombre, marca, size, unit, sample de precios recientes.
- Botones: **Aprobar** (mergea) / **Rechazar** (a `NormalizerReject`) / **Ver más**.
- Auth por env token (mismo esquema de F03 admin).

## API Contracts

```ts
// GET /api/admin/normalizer/queue?limit=20&offset=0
// → { items: Candidate[], total: number }

// POST /api/admin/normalizer/candidates/[id]/approve
// POST /api/admin/normalizer/candidates/[id]/reject { reason?: string }
```

## Post-Ingest Hook

En `src/ingestion/core/runner.ts` post-finish:
```ts
await runNormalizer({ chainId, since: startedAt });
```

Corre incrementally solo sobre productos afectados.

## Testing

- Ground truth: 200 pares etiquetados en JSON (`match`/`no-match`).
- Evaluar precision/recall al cambiar threshold; loguear en tests.
- Test unit por `jaroWinkler`, `detectPackagingConflict`.
- Test de rollback / des-merge.

## Complexity Tracking

Simplicidad: no embeddings ni pgvector en MVP. Si precision < 0.95, considerar pgvector con OpenAI embeddings post-MVP; queda documentado como escalación.
