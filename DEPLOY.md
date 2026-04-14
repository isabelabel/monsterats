# Hosting Monsterats (Render + Turso)

The app is a **Next.js** service with a **Turso (libSQL)** database. You can host the app on **[Render](https://render.com)** (or any Node host) and point it at a Turso database URL.

| Piece | Role |
|--------|------|
| **Turso** | Primary database (SQLite-compatible, remote libSQL). |
| **Render** | Builds and runs `next build` / `next start`. |
| **Images** | Recommended **Cloudflare R2** (direct-to-R2 uploads), or legacy **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`), or **`./data/uploads`** on a persistent disk / local dev. |

`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match the URL people use in the browser (including `https`), or sign-in and cookies break.

**Magic links:** URLs are logged to the server console unless you wire email in [`src/lib/auth.ts`](src/lib/auth.ts). Use **email + password** for production sharing unless you add a mail provider.

---

## 1. Create a Turso database

1. Install the [Turso CLI](https://docs.turso.tech/cli/overview) and sign in.
2. Create a database: `turso db create monsterats`
3. Get the URL: `turso db show monsterats --url`
4. Create a token: `turso db tokens create monsterats`

Set:

- `TURSO_DATABASE_URL` — the `libsql://…` URL (or `file:./path.db` for local file DBs).
- `TURSO_AUTH_TOKEN` — the token (omit or leave empty only for `file:` URLs).

---

## 2. Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `TURSO_DATABASE_URL` | Yes | Turso URL or `file:…` for local |
| `TURSO_AUTH_TOKEN` | For remote Turso | Empty for `file:` URLs |
| `BETTER_AUTH_SECRET` | Yes | Random string, **32+ characters** |
| `BETTER_AUTH_URL` | Yes | Public origin, no trailing slash |
| `NEXT_PUBLIC_APP_URL` | Yes | Usually same as `BETTER_AUTH_URL` |
| `R2_ACCOUNT_ID` | Recommended | Cloudflare account id (R2) |
| `R2_ACCESS_KEY_ID` | Recommended | R2 access key id |
| `R2_SECRET_ACCESS_KEY` | Recommended | R2 secret |
| `R2_BUCKET` | Recommended | R2 bucket name |
| `R2_PUBLIC_BASE_URL` | Recommended | Public base URL serving `/${key}` (e.g. `https://cdn.example.com`) |
| `BLOB_READ_WRITE_TOKEN` | Optional | Legacy: Vercel Blob token (fallback for older URLs) |

Copy [`.env.example`](.env.example) → `.env.local` for local development.

---

## 3. Apply the database schema

With `TURSO_DATABASE_URL` (and token if needed) in `.env` / `.env.local`:

```bash
npm run db:push
```

Run **once per empty database**. You can run this from your laptop (against Turso) or from CI.

---

## 4. Deploy on Render

1. Create a **Web Service**, connect this Git repository.
2. **Build command:** `npm ci && npm run build`
3. **Start command:** `npm start`
4. **Environment:** add every variable from §2 for **Production** (and **Preview** if you use previews).  
   **Build** loads server code that reads `TURSO_*` and auth config, so those must be present at build time.  
   **Required names (exact):** `TURSO_DATABASE_URL` (e.g. `libsql://…`) and `TURSO_AUTH_TOKEN` (from `turso db tokens create`). If either is missing at runtime, `/api/auth` will error.
5. **Node:** use **20.x** (see `Dockerfile`).
6. Open the Render URL (or your custom domain), register, and test a check-in with a photo.

**“Internal Server Error” in the browser:** open the service → **Logs** (runtime), reload the page, and read the stack trace. Typical causes:

- **`TURSO_DATABASE_URL` missing or wrong** — server throws when loading [`src/db/index.ts`](src/db/index.ts).
- **Turso token invalid** — DB queries fail (check `TURSO_AUTH_TOKEN`).
- **Tables missing** — run **`npm run db:push`** locally with the **same** Turso URL + token as production.
- **Auth URL mismatch** — set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your public `https://…` URL. The app also falls back to Render’s auto **`RENDER_EXTERNAL_URL`** when those are unset ([`src/lib/auth.ts`](src/lib/auth.ts)).

**Build fails with only “A complete log of this run can be found in …”:** scroll up in the log for the first `npm ERR!` block. Common cases:

- **`npm ci` / lockfile:** run `npm install` locally, commit **`package-lock.json`**, redeploy. Or temporarily use **`npm install && npm run build`** as the build command (less strict than `npm ci`).
- **`ERESOLVE` / peer dependencies:** try **`npm ci --legacy-peer-deps && npm run build`**.
- **`EBADENGINE`:** set Render’s **Node** to **20** (this repo includes [`.node-version`](.node-version) for that) or add env `NODE_VERSION=20.18.1`.

**Uploads on Render:** the default filesystem is **ephemeral**.\n+\n+- **Recommended:** configure **Cloudflare R2** and `R2_*` env vars (uploads go directly from the browser to R2).\n+- **Legacy fallback:** set `BLOB_READ_WRITE_TOKEN` (Vercel Blob).\n+- **Filesystem:** attach a [Render disk](https://render.com/docs/disks) and ensure `./data/uploads` lives on that volume.

---

## 5. Docker (optional)

For a container on your own VM:

```bash
# Root .env with TURSO_* , BETTER_AUTH_* , NEXT_PUBLIC_APP_URL , optional BLOB_*
docker compose --profile prod up -d --build
```

See [`docker-compose.yml`](docker-compose.yml). There is **no** database container; Turso is always external (or use a `file:` URL on a mounted volume).

---

## 6. Local development

```bash
cp .env.example .env.local
# Set TURSO_DATABASE_URL (e.g. file:./data/local.db or libsql://… from `turso dev`)
npm install
npm run db:push
npm run dev
```

For a quick local file DB:

```bash
mkdir -p data
# .env.local:
# TURSO_DATABASE_URL=file:./data/local.db
# TURSO_AUTH_TOKEN=
```

---

## 7. Migrating from PostgreSQL / Neon

This codebase **no longer uses PostgreSQL**. There is no automatic migration.

- **Greenfield:** create a new Turso DB and run `npm run db:push`.
- **Keep old data:** export from Postgres (CSV/SQL) and write a one-off import script, or use a tool you trust; table/column layout matches [`src/db/schema.ts`](src/db/schema.ts) (SQLite types).

---

## Legacy (Vercel + Neon)

Older docs referred to Vercel + Neon + `DATABASE_URL`. That stack is **not** what the current code expects; use **Turso** and **`TURSO_DATABASE_URL`** instead.
