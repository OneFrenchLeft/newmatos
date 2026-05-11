# ─── Stage 1: deps ──────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# ─── Stage 2: builder ───────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy env vars so Next.js build-time validation doesn't fail
ENV DATABASE_URL="mysql://user:pass@localhost:3306/monmatos"
ENV NEXTAUTH_SECRET="build-time-secret"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Stage 3: runner ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/public                      ./public
COPY --from=builder /app/prisma                      ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone  ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static      ./.next/static

# Copy only Prisma runtime libs (not full node_modules)
COPY --from=deps /app/node_modules/.prisma           ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma           ./node_modules/@prisma
COPY --from=deps /app/node_modules/prisma            ./node_modules/prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Push DB schema then start the standalone server
CMD ["sh", "-c", "node_modules/prisma/build/index.js db push --skip-generate && node server.js"]
