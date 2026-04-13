# Hosting Monsterats for others

The app uses **PostgreSQL** for data. Pick one path:

| Path | Best for | Database | Images |
|------|-----------|----------|--------|
| **Vercel + Neon** | Lowest ops, HTTPS included | Neon (or any hosted Postgres) | **Vercel Blob** (required; Vercel disk is read-only) |
| **Docker on a VPS** | Full control, fixed cost | Postgres in Compose or managed | **Blob** *or* persistent volume → `./data/uploads` |

`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match the URL people use in the browser (including `https`), or sign-in and cookies break.

**Magic links:** the app logs magic-link URLs to the server console. For production email delivery you would wire `sendMagicLink` in `src/lib/auth.ts` to a provider (Resend, Postmark, etc.); until then, rely on **email + password** for shared access.

---

## 1. Create a PostgreSQL database

- **[Neon](https://neon.tech)** (free tier): create a project, copy the connection string (prefer **pooled** / `?sslmode=require`).
- **Docker Compose** (this repo): the `db` service is Postgres on port `5432` (dev only by default, or bundled with `--profile prod`).

Example connection string:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/neondb?sslmode=require
```

---

## 2. Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | PostgreSQL URL |
| `BETTER_AUTH_SECRET` | Yes | Random string, **32+ characters** |
| `BETTER_AUTH_URL` | Yes | Public site URL, no trailing slash |
| `NEXT_PUBLIC_APP_URL` | Yes | Usually same as `BETTER_AUTH_URL` |
| `BLOB_READ_WRITE_TOKEN` | On Vercel | **Required** for check-in photos, avatars, covers |

Local dev: copy `.env.example` → `.env.local` and edit.

---

## 3. Apply the database schema

You do **not** have to run this on your laptop. `npm run db:push` only needs:

- This repo (or a checkout that includes `drizzle.config.ts` and `src/db/`)
- Node + dependencies (`npm ci` or `npm install`)
- `DATABASE_URL` pointing at the **empty** database (same URL the app will use)

Run it **once per new database**, from whichever place can reach Postgres:

| Where | When it makes sense |
|--------|---------------------|
| **Your machine** | Easy if the DB is public (e.g. Neon) — put the hosted `DATABASE_URL` in `.env.local` and run `npm run db:push`. |
| **The server (SSH)** | Clone the repo there, set `DATABASE_URL` in `.env` or `.env.local`, `npm ci`, then `npm run db:push`. |
| **CI** | Same idea: secret `DATABASE_URL`, checkout, `npm ci`, `npm run db:push` before or after deploy. |

The production **Docker image from this repo does not include Drizzle CLI**, so for the bundled Compose Postgres, either run `db:push` from the server with a normal Node checkout, or temporarily expose Postgres and run `db:push` from your laptop with that URL.

```bash
npm run db:push
```

---

## 4a. Deploy on Vercel (recommended)

1. Push the repo to GitHub and **Import** it in [Vercel](https://vercel.com).
2. Under **Settings → Environment Variables**, add **all** variables from §2.  
   **Build** runs `next build` and loads server code, so `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL` must be set for **Production** (and Preview if you use previews).
3. Add **Blob**: Project → **Storage** → Blob → create store → copy **read/write token** as `BLOB_READ_WRITE_TOKEN`.
4. Deploy. Open the production URL and register the first account.

---

## 4b. Deploy with Docker (VPS / home server)

The repo includes a **production** image (`Dockerfile`, Next **standalone** output) and optional **Compose** stack: Postgres + app + upload volume.

### On the server

1. Install [Docker](https://docs.docker.com/engine/install/) and Docker Compose v2.
2. Clone the repo and `cd` into it.
3. Create a **`.env`** file in the project root (Compose reads it for variable substitution; do **not** commit it). Minimum:

   ```bash
   BETTER_AUTH_SECRET=your-long-random-secret-at-least-32-chars
   BETTER_AUTH_URL=https://your-domain.example
   NEXT_PUBLIC_APP_URL=https://your-domain.example
   # Optional — omit to store uploads on the Docker volume under ./data/uploads
   # BLOB_READ_WRITE_TOKEN=
   ```

4. Put the same app behind **HTTPS** (e.g. Caddy or nginx + Let’s Encrypt) on port 443 and reverse-proxy to `localhost:3000`, **or** for a quick LAN test use `http://YOUR_SERVER_IP:3000` and set both URLs to that (cookies may be stricter on plain HTTP).

5. Start Postgres + web:

   ```bash
   docker compose --profile prod up -d --build
   ```

   - Default `docker compose up -d` (no profile) still starts **only Postgres** — same as local dev with `npm run dev`.
   - The `web` service uses the internal URL `postgresql://postgres:postgres@db:5432/monsterats` (bundled DB). Change `docker-compose.yml` if you use an external database instead.

6. **Schema:** from any machine that can reach the server’s Postgres, set `DATABASE_URL` to that database and run `npm run db:push` once. For the bundled Compose DB, expose `5432` (already mapped) and use `postgresql://postgres:postgres@SERVER_IP:5432/monsterats`, or run `docker compose exec db psql` only for inspection — Drizzle is easiest from your laptop with the URL above (open firewall for 5432 briefly, or use an SSH tunnel).

7. Open `BETTER_AUTH_URL` in a browser and sign up.

### Images without Blob

If `BLOB_READ_WRITE_TOKEN` is unset, files go to **`/app/data/uploads`** in the container, backed by the **`monsterats_uploads`** volume in Compose — survives restarts. Use Blob if you scale to multiple app instances.

---

## 5. Local development

```bash
docker compose up -d
cp .env.example .env.local
# edit .env.local
npm run db:push
npm run dev
```

---

## Migrating from SQLite

Older dev DBs used SQLite (`data/monsterats.db`). There is no automatic migration; use a fresh Postgres database and `db:push`, or move data manually.
