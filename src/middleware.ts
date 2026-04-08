import { NextRequest, NextResponse } from "next/server";

const buckets = new Map<string, { n: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_AUTH = 40;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.reset) {
    buckets.set(ip, { n: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (b.n >= MAX_AUTH) return false;
  b.n += 1;
  return true;
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (!rateLimit(ip)) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
