import fs from "node:fs/promises";
import path from "node:path";
import { createId } from "@paralleldrive/cuid2";
import { del, put } from "@vercel/blob";
import { deleteR2ObjectByPublicUrl } from "@/lib/r2";

export const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
/** Wide cover images (JPEG/PNG/WebP). */
const MAX_COVER_BYTES = 10 * 1024 * 1024;

/** iOS/Android often omit `file.type` for gallery picks; infer from filename. */
function inferMimeFromFileName(fileName: string): string | null {
  const n = (fileName ?? "").toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".heic") || n.endsWith(".heif")) return "image/heic";
  return null;
}

/**
 * Normalizes MIME (e.g. image/jpg → jpeg), infers when missing, rejects HEIC (poor web support).
 * Many mobile browsers send `application/octet-stream` — treat as unknown so we can sniff bytes.
 */
export function resolveImageMime(file: File): string {
  let t = file.type?.trim().toLowerCase() || "";
  if (t === "image/jpg" || t === "image/pjpeg") t = "image/jpeg";
  if (t === "application/octet-stream" || t === "binary/octet-stream") {
    t = "";
  }
  if (!t) t = inferMimeFromFileName(file.name) ?? "";
  return t;
}

/** First bytes when `type` / filename are useless (common on phones). */
function sniffImageMimeFromBytes(b: Uint8Array): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return "image/png";
  }
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return "image/webp";
  }
  // ISO BMFF (`ftyp`); HEIC/HEIF family
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]).toLowerCase();
    if (
      brand === "heic" ||
      brand === "heix" ||
      brand === "hevc" ||
      brand === "heim" ||
      brand === "heis" ||
      brand === "hevm" ||
      brand === "mif1" ||
      brand === "msf1"
    ) {
      return "image/heic";
    }
  }
  return null;
}

function blobStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function ensureUploadDirs() {
  await fs.mkdir(path.join(UPLOAD_ROOT, "checkins"), { recursive: true });
  await fs.mkdir(path.join(UPLOAD_ROOT, "avatars"), { recursive: true });
  await fs.mkdir(path.join(UPLOAD_ROOT, "challenges"), { recursive: true });
}

export function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function validateImageFile(
  file: File,
  maxBytes: number = MAX_BYTES,
): Promise<{ ok: true; mime: string } | { ok: false; error: string }> {
  const t = resolveImageMime(file);
  if (t === "image/heic" || t === "image/heif") {
    return {
      ok: false,
      error:
        "HEIC/HEIF isn’t supported in the browser. On iPhone: Settings → Camera → Formats → Most Compatible, or pick a photo exported as JPEG/PNG.",
    };
  }
  let mime = t;
  if (!ALLOWED.has(mime)) {
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    const sniffed = sniffImageMimeFromBytes(head);
    if (sniffed === "image/heic" || sniffed === "image/heif") {
      return {
        ok: false,
        error:
          "HEIC/HEIF isn’t supported in the browser. On iPhone: Settings → Camera → Formats → Most Compatible, or pick a photo exported as JPEG/PNG.",
      };
    }
    if (sniffed && ALLOWED.has(sniffed)) mime = sniffed;
  }
  if (!ALLOWED.has(mime)) {
    if (!mime) {
      return {
        ok: false,
        error:
          "Could not detect the image type (common on some phones). Try another photo, or save/export as JPEG or PNG first.",
      };
    }
    return { ok: false, error: "Use JPEG, PNG, or WebP." };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `Image must be under ${mb}MB.` };
  }
  return { ok: true, mime };
}

/** Public URL for <img src> — either Blob https URL or `/api/media/...`. */
export async function saveCheckinPhoto(file: File): Promise<string> {
  const v = await validateImageFile(file);
  if (!v.ok) throw new Error(v.error);
  const id = createId();
  const ext = extForMime(v.mime);
  const name = `${id}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (blobStorageEnabled()) {
    const blob = await put(`checkins/${name}`, buf, {
      access: "public",
      addRandomSuffix: true,
      contentType: v.mime,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  await ensureUploadDirs();
  const full = path.join(UPLOAD_ROOT, "checkins", name);
  await fs.writeFile(full, buf);
  return `/api/media/checkins/${name}`;
}

export async function saveAvatarFile(userId: string, file: File): Promise<string> {
  const v = await validateImageFile(file);
  if (!v.ok) throw new Error(v.error);
  const id = createId();
  const ext = extForMime(v.mime);
  const name = `${userId}-${id}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (blobStorageEnabled()) {
    const blob = await put(`avatars/${name}`, buf, {
      access: "public",
      addRandomSuffix: true,
      contentType: v.mime,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  await ensureUploadDirs();
  const full = path.join(UPLOAD_ROOT, "avatars", name);
  await fs.writeFile(full, buf);
  return `/api/media/avatars/${name}`;
}

/** Returns basename (local) or full https URL (Blob) — use `resolveChallengeCoverUrl` when rendering. */
export async function saveChallengeCoverFile(
  challengeId: string,
  file: File,
): Promise<string> {
  const v = await validateImageFile(file, MAX_COVER_BYTES);
  if (!v.ok) throw new Error(v.error);
  const id = createId();
  const ext = extForMime(v.mime);
  const name = `${challengeId}-${id}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (blobStorageEnabled()) {
    const blob = await put(`challenges/${name}`, buf, {
      access: "public",
      addRandomSuffix: true,
      contentType: v.mime,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  await ensureUploadDirs();
  const full = path.join(UPLOAD_ROOT, "challenges", name);
  await fs.writeFile(full, buf);
  return name;
}

export function checkinPhotoPath(fileName: string): string {
  const base = path.basename(fileName);
  return path.join(UPLOAD_ROOT, "checkins", base);
}

/** Removes proof image; supports local `/api/media/checkins/...` and Blob URLs. */
export async function unlinkCheckinPhotoByUrl(photoUrl: string): Promise<void> {
  if (/^https?:\/\//i.test(photoUrl)) {
    // Prefer R2 deletion when configured.
    try {
      await deleteR2ObjectByPublicUrl(photoUrl);
      return;
    } catch {
      // Fall back to Vercel Blob delete for legacy URLs.
    }
    try {
      await del(photoUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      /* ignore */
    }
    return;
  }
  const m = photoUrl.match(/\/api\/media\/checkins\/([^/?#]+)$/);
  if (!m?.[1]) return;
  try {
    await fs.unlink(checkinPhotoPath(m[1]));
  } catch {
    /* missing file ok */
  }
}

export function avatarPath(fileName: string): string {
  const base = path.basename(fileName);
  return path.join(UPLOAD_ROOT, "avatars", base);
}

export function challengeCoverPath(fileName: string): string {
  const base = path.basename(fileName);
  return path.join(UPLOAD_ROOT, "challenges", base);
}

export async function unlinkChallengeCoverFile(
  fileName: string | null | undefined,
): Promise<void> {
  if (!fileName?.trim()) return;
  if (/^https?:\/\//i.test(fileName)) {
    try {
      await deleteR2ObjectByPublicUrl(fileName);
      return;
    } catch {
      // ignore; may be legacy Blob
    }
    try {
      await del(fileName, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await fs.unlink(challengeCoverPath(fileName));
  } catch {
    /* ignore missing */
  }
}
