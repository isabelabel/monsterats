import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. Copy .env.example to .env.local and add your Turso URL (see DEPLOY.md).",
  );
}

const client = createClient({
  url,
  authToken: authToken || undefined,
});

export const db = drizzle(client, { schema });
