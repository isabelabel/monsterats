/**
 * Normalizes user avatar URLs. Older saves incorrectly prefixed `/api/media/avatars/`
 * on top of an already-complete URL from `saveAvatarFile`.
 */
export function resolveAvatarImageUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  let u = url.trim();
  if (/^\/api\/media\/avatars\/https?:\/\//i.test(u)) {
    return u.replace(/^\/api\/media\/avatars\//, "");
  }
  if (u.startsWith("/api/media/avatars//api/media/avatars/")) {
    return u.replace(/^\/api\/media\/avatars\//, "");
  }
  return u;
}

/** Cover value is either a basename (local disk) or a full Blob URL. */
export function resolveChallengeCoverUrl(
  coverImageFile: string | null | undefined,
): string | null {
  if (!coverImageFile?.trim()) return null;
  if (/^https?:\/\//i.test(coverImageFile)) return coverImageFile;
  return `/api/media/challenges/${coverImageFile}`;
}
