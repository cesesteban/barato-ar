# Guía de desarrollo — Barato.ar

## Setup inicial

Ver [README](../README.md#setup-local--5-min).

## Convenciones

- **TS strict**: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
  Consumir el resultado con branch explícito, no con `!`.
- **Sin `any`**: preferir `unknown` + refinamiento con Zod o type guards.
- **Server-first**: componentes por default son RSC. `"use client"` solo cuando hay estado/eventos.
- **Alias**: `@/*` apunta a `src/*`.
- **Sin comentarios narrativos**: los comentarios explican WHY. Los identificadores explican WHAT.
- **CSS tokens**: sin hex hardcoded en componentes. Usar variables definidas en `tokens.css` (F02).

## Flujo típico

```bash
git switch -c 003-ingest-super-flyers
# Leer specs/003-ingest-super-flyers/{spec,plan,tasks}.md
# Ejecutar tasks en orden. Cada checkpoint verifica un user story.

# Al terminar
pnpm typecheck && pnpm lint && pnpm test && pnpm build
git commit -am "feat(003): parser Carrefour"
git push -u origin 003-ingest-super-flyers
# Abrir PR → CI verde → merge a main → Vercel deploy
```

## Comandos DB

```bash
pnpm prisma migrate dev --name descripcion   # nueva migration
pnpm prisma studio                           # GUI de la DB
pnpm prisma format                           # formatea schema.prisma

# Reset local
pnpm prisma migrate reset
```

## Debugging

- `pnpm dev` con logs de queries Prisma activados.
- `NEXT_PUBLIC_DEBUG=1 pnpm dev` para más verbosidad.
- `/health` para chequear DB en cualquier ambiente.

## Testing

```bash
pnpm test                    # unit (Vitest)
pnpm test:watch              # watch mode
pnpm test:e2e                # e2e (Playwright)
pnpm test:e2e:smoke          # solo smoke

# Debug Playwright
pnpm exec playwright test --debug
pnpm exec playwright show-report
```

## Cloudflare R2 (setup manual)

1. Crear cuenta Cloudflare.
2. R2 → Create bucket `barato-ar-products` (público).
3. Custom domain: `img.barato.ar` → CNAME al bucket público.
4. R2 → Create bucket `barato-ar-reports` (privado).
5. Manage R2 API Tokens → crear token con permisos read/write en ambos buckets.
6. Copiar `Account ID`, `Access Key ID`, `Secret Access Key` a `.env.local`.
