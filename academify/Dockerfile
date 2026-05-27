FROM node:22-bookworm-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time-only placeholders (not ENV layers); runtime secrets come from .env.production / compose.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?sslmode=disable \
  npx prisma generate

# Values come from compose `build.args` — single source: .env.production + compose defaults.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_DOCS_ENABLED
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ARG NEXT_PUBLIC_SOCKET_URL

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_DOCS_ENABLED=${NEXT_PUBLIC_API_DOCS_ENABLED}
ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}

RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?sslmode=disable \
  BETTER_AUTH_SECRET=ci-docker-build-placeholder-not-used-at-runtime \
  npm run build

# One-off migrations against Neon (or any Postgres). Run on the VPS with:
#   docker compose --profile migrate run --rm db-schema-sync
# Uses DATABASE_URL from `.env.production` (or compose environment).
FROM base AS migrator
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://migrate:migrate@127.0.0.1:5432/migrate?sslmode=disable \
  npx prisma generate
CMD ["npx", "prisma", "migrate", "deploy"]

# Socket.IO relay (separate process; exposed on host port 3100 in compose)
FROM base AS socket
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.server.json ./
COPY socket-server ./socket-server
# package.json has "type":"module" so compiled CommonJS must use .cjs extension
RUN npx tsc -p tsconfig.server.json \
  && mv socket-server/index.js socket-server/index.cjs

ENV NODE_ENV=production
ENV SOCKET_PORT=3100
EXPOSE 3100
CMD ["node", "socket-server/index.cjs"]

# Final image for the Next.js app (must be last stage OR build with --target runner)
FROM base AS runner

LABEL org.opencontainers.image.title="academify"
LABEL org.opencontainers.image.url="e2526-wads-b4ac-02.csbihub.id"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3011
ENV NODE_ENV=production
ENV PORT=3011
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]