import { NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { requireSession } from "@/lib/session";
import { presignR2Put } from "@/lib/r2";

type Kind = "checkin" | "avatar" | "challengeCover";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

const ALLOWED_CT = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const session = await requireSession();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON.");
  }

  const kind = (body as any)?.kind as Kind | undefined;
  const contentType = String((body as any)?.contentType ?? "").trim().toLowerCase();
  const ext = String((body as any)?.ext ?? "").trim().toLowerCase();
  const challengeId = String((body as any)?.challengeId ?? "").trim();

  if (kind !== "checkin" && kind !== "avatar" && kind !== "challengeCover") {
    return jsonError("Invalid kind.");
  }
  if (!ALLOWED_CT.has(contentType)) {
    return jsonError("Use JPEG, PNG, or WebP.");
  }
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return jsonError("Invalid extension.");
  }

  const id = createId();
  const normalizedExt = ext === "jpeg" ? "jpg" : ext;

  const key =
    kind === "checkin"
      ? `checkins/${id}.${normalizedExt}`
      : kind === "avatar"
        ? `avatars/${session.user.id}-${id}.${normalizedExt}`
        : (() => {
            // For creation flows, `challengeId` may be unknown; allow a stable prefix.
            const prefix = challengeId || "new";
            return `challenges/${prefix}-${id}.${normalizedExt}`;
          })();

  if (!key) return jsonError("Missing upload key.");

  try {
    const { uploadUrl, publicUrl } = await presignR2Put({
      key,
      contentType,
      cacheControl:
        kind === "avatar"
          ? "public, max-age=86400"
          : "public, max-age=31536000, immutable",
    });
    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not presign upload.", 500);
  }
}

