import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const revision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  output: "standalone",
  // libSQL loads `@libsql/linux-*` at runtime; standalone tracing often skips these optional natives.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/@libsql/**/*", "./node_modules/libsql/**/*"],
  },
  /** Default 1MB truncates phone camera uploads before they reach the server action. */
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/templates/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
