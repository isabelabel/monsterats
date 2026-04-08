import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";

const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

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
  trustedOrigins: [baseURL],
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
