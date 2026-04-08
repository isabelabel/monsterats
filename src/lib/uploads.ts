import fs from "node:fs/promises";
import path from "node:path";
import { createId } from "@paralleldrive/cuid2";

export const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
/** Wide cover images (JPEG/PNG/WebP). */
const MAX_COVER_BYTES = 10 * 1024 * 1024;

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

export function validateImageFile(
  file: File,
  maxBytes: number = MAX_BYTES,
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Use JPEG, PNG, or WebP." };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `Image must be under ${mb}MB.` };
  }
  return { ok: true };
}

export async function saveCheckinPhoto(file: File): Promise<string> {
  const v = validateImageFile(file);
  if (!v.ok) throw new Error(v.error);
  await ensureUploadDirs();
  const id = createId();
  const ext = extForMime(file.type);
  const name = `${id}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const full = path.join(UPLOAD_ROOT, "checkins", name);
  await fs.writeFile(full, buf);
  return name;
}

export async function saveAvatarFile(userId: string, file: File): Promise<string> {
  const v = validateImageFile(file);
  if (!v.ok) throw new Error(v.error);
  await ensureUploadDirs();
  const id = createId();
  const ext = extForMime(file.type);
  const name = `${userId}-${id}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const full = path.join(UPLOAD_ROOT, "avatars", name);
  await fs.writeFile(full, buf);
  return name;
}

export async function saveChallengeCoverFile(
  challengeId: string,
  file: File,
): Promise<string> {
  const v = validateImageFile(file, MAX_COVER_BYTES);
  if (!v.ok) throw new Error(v.error);
  await ensureUploadDirs();
  const id = createId();
  const ext = extForMime(file.type);
  const name = `${challengeId}-${id}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const full = path.join(UPLOAD_ROOT, "challenges", name);
  await fs.writeFile(full, buf);
  return name;
}

export function checkinPhotoPath(fileName: string): string {
  const base = path.basename(fileName);
  return path.join(UPLOAD_ROOT, "checkins", base);
}

/** Removes proof image from disk; no-op if URL does not match check-in path. */
export async function unlinkCheckinPhotoByUrl(photoUrl: string): Promise<void> {
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
  try {
    await fs.unlink(challengeCoverPath(fileName));
  } catch {
    /* ignore missing */
  }
}
