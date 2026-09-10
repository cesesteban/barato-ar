# Implementation Plan: Community Reports

**Branch**: `011-community-reports` | **Date**: 2026-09-09

## Summary

Formulario público sin auth, con Turnstile, rate-limit, storage de fotos en Vercel Blob, cola admin, sistema de votos, purga PII/fotos.

## Technical Context

- **Deps**: `@vercel/blob`, `@marsidev/react-turnstile` (o custom), `sharp` (thumbnail), `nsfwjs` (opt)
- **Storage**: Postgres + Vercel Blob
- **Testing**: Playwright con Blob mock
- **Performance**: submit < 2 s incluyendo upload

## Constitution Check

| Principio | Nota |
|---|---|
| II. Datos honestos | Reports marcados `source=crowdsourced` |
| IV. Privacidad | `ipHash` no IP; purga foto tras 30d de rechazo |
| VI. Legalidad | Crowdsourcing = fuente legal |
| VII. Simplicidad | Sin OAuth |

## Data Model

```prisma
enum ReportStatus {
  pending
  approved
  rejected
  auto_hidden
  re_review
}

model Report {
  id                String        @id @default(cuid())
  productSlug       String?
  productText       String?
  chainSlug         String
  storeText         String?
  storeId           String?
  price             Decimal       @db.Decimal(10, 2)
  previousPrice     Decimal?      @db.Decimal(10, 2)
  validTo           DateTime?
  photoUrl          String?
  photoBlobId       String?
  description       String?       @db.Text
  ipHash            String
  status            ReportStatus  @default(pending)
  reasonRejected    String?
  approvedBy        String?
  approvedAt        DateTime?
  purgedAt          DateTime?
  createdAt         DateTime      @default(now())

  votes             ReportVote[]

  @@index([status, createdAt])
  @@index([ipHash, createdAt])
  @@map("reports")
}

model ReportVote {
  id         String   @id @default(cuid())
  reportId   String
  ipHash     String
  kind       String                                // up | down
  createdAt  DateTime @default(now())

  report     Report   @relation(fields: [reportId], references: [id])

  @@unique([reportId, ipHash])
  @@map("report_votes")
}
```

## Public Form `/reportar`

Route: `src/app/reportar/page.tsx`

Campos:
- Producto: SearchBar con `AutocompleteProducts` (F06). Si no existe → texto libre + flag.
- Cadena: Select de chains cargadas.
- Sucursal: Autocomplete de stores en la zona actual + texto libre.
- Precio actual (obligatorio).
- Precio anterior (opcional).
- Vigencia hasta (date input, default hoy+7).
- Foto (input file, max 10 MB, jpg/png/webp).
- Descripción (textarea, max 500 chars).
- Turnstile widget (a partir del 3er report en 1h).

## API

```ts
// POST /api/reports (multipart)
export const CreateReport = z.object({
  productSlug: z.string().optional(),
  productText: z.string().optional(),
  chainSlug: z.string(),
  storeText: z.string().optional(),
  storeId: z.string().optional(),
  price: z.coerce.number().positive(),
  previousPrice: z.coerce.number().positive().optional(),
  validTo: z.string().datetime().optional(),
  description: z.string().max(500).optional(),
  turnstileToken: z.string().optional(),
});
// photo comes from `formData.get("photo")` File
```

Flujo:
1. Verify rate-limit (Redis token bucket 5/h/IP).
2. Si N previos > 2 en 1h, verify Turnstile.
3. Upload foto a Vercel Blob (con thumbnail 400x400 vía Sharp).
4. Optional NSFW check → si detecta, `status=auto_hidden`.
5. Insert `Report`.
6. Notify admin (email opt).

## Admin `/admin/reports-queue`

- Lista pending + auto_hidden + re_review.
- Cada card: foto (thumbnail), datos, historial reciente del producto en la zona.
- Botones Aprobar / Rechazar (con motivo) / Editar y Aprobar.
- Aprobar:
  - Upsert `Store` si `storeId=null` (marcar como pending_review de zona si texto libre).
  - Upsert `Product` si `productSlug=null`.
  - Insert `Price` con `source=crowdsourced`.
  - Insert `Offer` con `sourceUrl=<report link>`.
- Rechazar: log motivo; schedule purga de foto en 30d.

## Voting en Feed

En `<DealCard>` para offers `source=crowdsourced`:
- Botones 👍 y 👎 con contadores.
- Anonymous vote: `ipHash + reportId` unique.
- ≥ 3 downvotes → `status=re_review`, oculto del feed.

## Purga PII

Cron diario `pnpm reports:purge`:
- Purga `photoUrl` (blob delete) para `status=rejected` y `createdAt < now - 30d`.
- Purga `ipHash` para `createdAt < now - 90d`.

## Testing

- Playwright form flow con foto mock.
- Rate-limit test: 6 reports en 1h → 429.
- Approve → verificar Price inserted.
- Vote flow: 3 downvotes → auto-hide.

## Complexity Tracking

`nsfwjs` es la única dependencia "pesada". Se puede diferir a post-MVP (marcar todas photos como auto_hidden en MVP y depender de moderación humana).
