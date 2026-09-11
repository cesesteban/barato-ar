# Barato.ar — Multi-stage Dockerfile
# ----------------------------------
# Etapa 1: install deps con pnpm (cache-friendly)
# Etapa 2: build (prisma generate + next build → standalone)
# Etapa 3: runtime minimal (node:20-alpine + standalone)

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Placeholder envs para que Next 15 pueda evaluar `env.ts` durante build.
# Los valores reales llegan por docker-compose en runtime.
ENV NEXT_PUBLIC_APP_URL=http://localhost:3900
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL_UNPOOLED=postgresql://build:build@localhost:5432/build
ENV AUTH_SECRET=build-secret-32bytes-placeholder
ENV AUTH_URL=http://localhost:3900
ENV REVALIDATE_SECRET=build-revalidate-secret-16b
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm prisma generate
RUN pnpm build

# ---------- runner ----------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# next/standalone incluye sólo lo necesario.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma runtime + schema para migrate deploy en start
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
