import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit runs outside Next.js — it does not load `.env` / `.env.local`.
 * Same order as Next: `.env`, then `.env.local` (overrides).
 */
function loadEnvFile(rel: string, override: boolean) {
  const p = resolve(process.cwd(), rel);
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env", false);
loadEnvFile(".env.local", true);

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. Copy .env.example to .env.local, set TURSO_DATABASE_URL, then run npm run db:push again.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken: authToken ?? "",
  },
});
