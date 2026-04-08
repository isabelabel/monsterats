import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { avatarPath } from "@/lib/uploads";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ file: string }> },
) {
  const { file } = await ctx.params;
  const full = avatarPath(file);
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
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
