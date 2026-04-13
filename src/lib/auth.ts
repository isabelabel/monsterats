import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

/** Public origin for Better Auth (no trailing slash). Render sets RENDER_EXTERNAL_URL automatically. */
const baseURL = normalizeOrigin(
  process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    "http://localhost:3000",
);

const trustedOrigins = [
  ...new Set(
    (
      [
        baseURL,
        process.env.BETTER_AUTH_URL?.trim(),
        process.env.NEXT_PUBLIC_APP_URL?.trim(),
        process.env.RENDER_EXTERNAL_URL?.trim(),
      ] as (string | undefined)[]
    )
      .filter((u): u is string => Boolean(u))
      .map(normalizeOrigin),
  ),
];

const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  "local-dev-only-secret-min-32-chars-long!!";

export const auth = betterAuth({
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { ...authSchema },
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL,
  trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : [baseURL],
  plugins: [
    nextCookies(),
    magicLink({
      sendMagicLink: async ({ url, email }) => {
        console.info(`[monsterats] Magic link for ${email}: ${url}`);
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
