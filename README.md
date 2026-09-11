# Barato.ar

Comparador de ofertas de supermercados, delivery y farmacias en Argentina (CABA + GBA).
Nombre productivo confirmado en [C-005](.specify/memory/clarifications.md#c-005--nombre-de-marca-y-dominio).

## Documentación clave

- 📜 **[Constitución](./.specify/memory/constitution.md)** — 8 principios no-negociables.
- 📝 **[Clarifications](./.specify/memory/clarifications.md)** — decisiones vigentes (C-001…C-014).
- 🗺️ **[Specs](./specs/README.md)** — 12 features con spec + plan + tasks.
- 🏛️ **[ADR 0001 — Stack](./docs/adr/0001-stack.md)** — decisiones de arquitectura.

## Setup local (< 5 min)

**Requisitos**: Node ≥ 20, pnpm ≥ 10, Git. Opcional: Docker (recomendado para
levantar Postgres/Redis/MailPit sin instalar nada más — ver [docs/docker.md](./docs/docker.md)).

### Opción A: Docker para infra + `pnpm dev` local (recomendada)

```bash
git clone <repo> && cd barato-ar
pnpm install
cp .env.docker.example .env.local

docker compose up -d db redis mailpit
pnpm prisma generate
pnpm db:migrate
pnpm db:seed

pnpm dev                        # http://localhost:3900
```

Puertos elegidos para no colisionar con otros contenedores: app **3900**,
Postgres **5434**, Redis **6380**, MailPit **1025 (SMTP) / 8025 (UI)**.

### Opción B: Stack completo dockerizado (production-like)

```bash
docker compose up -d --build    # aplica migrate deploy + arranca todo
```

### Opción C: Sin Docker (Neon + servicios externos)

```bash
pnpm install
cp .env.example .env.local     # completá URLs de Neon, Resend, R2, ...
pnpm prisma generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Verificá que anda:
- `/`         → landing
- `/health`   → `{status: "ok", db: "connected", commit, version, timestamp}`
- `/admin`    → redirige a signin (Auth.js EmailProvider)

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Dev server con hot reload |
| `pnpm build` | Build de producción |
| `pnpm start` | Servir el build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` con strict |
| `pnpm test` | Vitest (unit) |
| `pnpm test:e2e` | Playwright (e2e) |
| `pnpm test:e2e:smoke` | Solo el smoke test |
| `pnpm db:generate` | `prisma generate` |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:studio` | UI de Prisma |
| `pnpm db:seed` | Semilla inicial |
| `pnpm format` | Prettier write |

## Servicios externos requeridos

Todos tienen tier free suficiente para MVP:

1. **[Neon](https://neon.tech)** — Postgres con branching por PR. Habilitar extensiones `pg_trgm` y `pgvector`.
2. **[Vercel](https://vercel.com)** — hosting + preview URLs por PR.
3. **[Resend](https://resend.com)** — email para Auth.js y alertas (F09).
4. **[Cloudflare R2](https://developers.cloudflare.com/r2/)** — object storage (F03 fotos, F11 reports).
5. **[Sentry](https://sentry.io)** — errores + performance.
6. **[Upstash Redis](https://upstash.com)** — cache (F06+).
7. **[Plausible](https://plausible.io)** o self-hosted Umami — analytics privacy-first.

## DNS y dominio (C-012)

`barato.ar` debe verificarse en Resend antes de F09. Records requeridos en el registrar:

```
TXT   @              v=spf1 include:_spf.resend.com ~all
TXT   resend._domainkey    <valor de Resend dashboard>
TXT   _dmarc         v=DMARC1; p=quarantine; rua=mailto:dmarc@barato.ar;
```

Detalle completo en [docs/dns.md](./docs/dns.md).

## Estado

Feature 001 (foundation scaffold) — **en desarrollo**.

Próxima: Feature 002 (design system).
