# Barato.ar — Multi-stage Dockerfile
# ----------------------------------
# Etapa 1: deps con pnpm (cache-friendly, sin scripts)
# Etapa 2: builder (prisma generate + next build)
# Etapa 3: runner minimal con node_modules copiado completo desde builder

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts evita `prepare: prisma generate` en esta etapa (aún no
# copiamos prisma/schema.prisma). El builder corre `prisma generate` explícito.
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---------- builder ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Placeholder envs para que Next 15 pueda evaluar `env.ts` durante build.
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

# En vez de andar copiando `.next/standalone` + partes puntuales, copiamos
# todo el build. Imagen ~500 MB pero es hobby MVP y elimina bugs de rutas
# de Prisma con pnpm.
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./entrypoint.sh"]
CMD ["./node_modules/.bin/next", "start"]
