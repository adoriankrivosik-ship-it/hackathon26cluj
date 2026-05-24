FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the app
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

RUN npm run build
RUN npm run db:setup

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/.dev.db ./.dev.db

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy native module for better-sqlite3
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# SQLite creates journal/WAL files next to .dev.db, so /app must be writable.
RUN chown nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
