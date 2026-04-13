import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. Locally: add it to .env.local (see .env.example). On Render: Dashboard → your service → Environment → add TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN for remote Turso), then redeploy.",
  );
}

const client = createClient({
  url,
  authToken: authToken || undefined,
});

export const db = drizzle(client, { schema });
