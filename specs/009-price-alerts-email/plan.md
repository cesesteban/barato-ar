# Implementation Plan: Price Alerts (Email-only)

**Branch**: `009-price-alerts-email` | **Date**: 2026-09-09

## Summary

Modelo `Alert` con estados, endpoints `POST /api/alerts` + `GET /api/alerts/verify|unsubscribe`, cron horario que detecta bajas, envío con Resend + React Email templates.

## Technical Context

- **Deps**: `resend` SDK, `@react-email/components`, `zod`, `jose` (para JWT-like tokens) o crypto nativo HMAC
- **Storage**: Postgres
- **Testing**: Vitest + Playwright (con Resend mock)
- **Performance**: cron < 5 min para 10k alertas

## Constitution Check

| Principio | Nota |
|---|---|
| IV. Privacidad | **Central**. Doble opt-in, unsubscribe fácil, PII mínima |
| II. Datos | Alertas usan snapshot de precios |
| VI. Legalidad | Ley 25.326 compliant |
| VII. Simplicidad | Un cron GitHub Actions horario |

## Data Model

```prisma
enum AlertStatus {
  pending
  active
  notified
  cancelled
  bounced
}

model Alert {
  id                String      @id @default(cuid())
  email             String
  productId         String
  targetPrice       Decimal     @db.Decimal(10, 2)
  zoneSlug          String
  status            AlertStatus @default(pending)
  verifyTokenHash   String                          // sha256(token)
  unsubTokenHash    String                          // sha256(token)
  verifiedAt        DateTime?
  notifiedAt        DateTime?
  cancelledAt       DateTime?
  ipHash            String?
  createdAt         DateTime    @default(now())
  expiresAt         DateTime                        // verify expiry (24h)

  product           Product     @relation(fields: [productId], references: [id])

  @@index([status, verifiedAt])
  @@index([email])
  @@unique([email, productId, targetPrice])         // dedup
  @@map("alerts")
}

model EmailEvent {
  id        BigInt   @id @default(autoincrement())
  alertId   String
  kind      String                                  // sent, delivered, opened, clicked, bounced, complained
  metadata  Json?
  ts        DateTime @default(now())

  @@index([alertId, ts])
  @@map("email_events")
}
```

## Token Design

```ts
// src/lib/tokens.ts
import { createHmac } from "node:crypto";

const SECRET = env.ALERT_TOKEN_SECRET; // 256-bit random

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function makeVerifyToken(alertId: string) {
  const exp = Date.now() + 24 * 3600 * 1000;
  const body = `${alertId}:verify:${exp}`;
  return `${body}:${sign(body)}`;
}
```

Se guarda `sha256(token)` en DB para no leakear en logs.

## API Contracts

```ts
// POST /api/alerts
export const CreateAlert = z.object({
  email: z.string().email(),
  productSlug: z.string(),
  targetPrice: z.coerce.number().positive(),
  zoneSlug: z.string(),
});
// → 202 { alertId, message: "Revisá tu casilla" } (idempotente por email+product+target)

// GET /api/alerts/verify?token=...
// → redirect a /alerts/verified

// GET /api/alerts/unsubscribe?token=...
// → redirect a /alerts/cancelled

// GET /mis-alertas?token=<manageToken>
// → panel con lista de alertas del email
```

## Email Templates (React Email)

`src/emails/`:
- `AlertVerify.tsx` — "Confirmá tu alerta para Coca-Cola 2.25L"
- `AlertTriggered.tsx` — "¡Bajó a $790! Coca-Cola 2.25L está más barata en Carrefour Palermo"
- `AlertUnsubscribeConfirm.tsx` — "Listo, cancelaste tu alerta"

Cada uno con footer: dirección, botón unsubscribe, política de privacidad.

## Cron Job

`.github/workflows/alerts-scan.yml`:
```yaml
on:
  schedule: [{ cron: "5 * * * *" }]     # hourly at :05
jobs:
  scan:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm alerts:scan
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          ALERT_TOKEN_SECRET: ${{ secrets.ALERT_TOKEN_SECRET }}
```

Script `src/scripts/alerts-scan.ts`:
1. Query alertas `status=active AND (notifiedAt IS NULL OR notifiedAt < NOW() - INTERVAL '7 days')`.
2. Batch por producto+zona.
3. Para cada batch, obtener `minPrice` actual en la zona.
4. Filtrar alertas con `target >= minPrice`.
5. Enqueue email vía Resend con concurrencia limitada (10 en paralelo).
6. Update `notifiedAt`, insert `EmailEvent`.

## Webhooks de Resend

`POST /api/webhooks/resend` recibe `delivered`, `opened`, `clicked`, `bounced`, `complained`; guarda en `EmailEvent`. Bounce hard → `alerts.status = bounced`.

## Rate limits

- Por IP: 5 alerts nuevas / hora (Redis token bucket).
- Por email: 20 alertas activas. 422 con mensaje si excede.

## Privacy

- Retention: `ipHash` purgado tras 30 días (script `pnpm alerts:cleanup`).
- Logs: nunca loggear email completo — solo hash o `n***@dominio`.
- Página `/privacidad` con detalle.

## Testing

- Unit: token sign/verify, cron logic (mock DB + Resend).
- Integration: E2E con Resend mock server.
- Playwright: crear alerta, click en link de verify, ver estado "verified".

## Complexity Tracking

Ninguna.
