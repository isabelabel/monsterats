import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { challengeCoverPath } from "@/lib/uploads";
import { r2PublicBaseUrl } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ file: string }> },
) {
  const { file } = await ctx.params;
  const full = challengeCoverPath(file);
  try {
    const buf = await fs.readFile(full);
    const ext = file.split(".").pop()?.toLowerCase();
    const type =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    const base = r2PublicBaseUrl();
    if (base) {
      return NextResponse.redirect(`${base}/challenges/${encodeURIComponent(file)}`, 302);
    }
    return new NextResponse(null, { status: 404 });
  }
}
