/** Cover value is either a basename (local disk) or a full Blob URL. */
export function resolveChallengeCoverUrl(
  coverImageFile: string | null | undefined,
): string | null {
  if (!coverImageFile?.trim()) return null;
  if (/^https?:\/\//i.test(coverImageFile)) return coverImageFile;
  return `/api/media/challenges/${coverImageFile}`;
}
