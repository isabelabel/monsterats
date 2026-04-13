# Production image (Next.js standalone). Build: docker build -t monsterats .
# Debian (glibc): libSQL uses @libsql/linux-x64-gnu. Alpine (musl) needs @libsql/linux-x64-musl,
# which Next standalone often omitted — see next.config.ts outputFileTracingIncludes + COPY below.
#
# Runtime: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, auth URLs, etc. (see DEPLOY.md).

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURSO_DATABASE_URL=file:/tmp/monsterats-build.db
ENV TURSO_AUTH_TOKEN=
ENV BETTER_AUTH_SECRET=build-placeholder-min-32-chars-long-ok
ENV BETTER_AUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN mkdir -p data/uploads/checkins data/uploads/avatars data/uploads/challenges

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Ensure libSQL native bindings exist even if file tracing misses them.
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
