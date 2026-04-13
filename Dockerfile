# Production image (Next.js standalone). Build: docker build -t monsterats .
# Requires DATABASE_URL and auth env at runtime (see DEPLOY.md).

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# `next build` loads server modules that require env; they are not used if no DB calls run during build.
ENV DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/monsterats
ENV BETTER_AUTH_SECRET=build-placeholder-min-32-chars-long-ok
ENV BETTER_AUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN mkdir -p data/uploads/checkins data/uploads/avatars data/uploads/challenges

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
