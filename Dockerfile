Copy

# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
 
COPY package.json package-lock.json ./
COPY prisma ./prisma/
 
# Install ALL deps (including dev) so prisma generate works
RUN npm ci
 
# Generate Prisma client
RUN npx prisma generate
 
# ─── Stage 2: builder ─────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
 
COPY --from=deps /app/node_modules ./node_modules
COPY . .
 
# Dummy env so Next.js env validation doesn't blow up at build time
ENV DATABASE_URL="mysql://user:pass@localhost:3306/monmatos"
ENV NEXTAUTH_SECRET="build-time-secret"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL="http://app.localhost:3000"
ENV NODE_ENV=production
 
RUN npm run build
 
# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
 
ENV NODE_ENV=production
 
# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
 
# Copy built output
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
 
# Next.js standalone output (if enabled) or full .next
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
 
USER nextjs
 
EXPOSE 3000
 
ENV PORT=3000
 
# Run Prisma migrations then start the app
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
