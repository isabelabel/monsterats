/**
 * Browser-only helpers to normalize photos before Server Action upload.
 * Phones often send HEIC, empty MIME, or huge files; re-encoding to JPEG
 * fixes many server-side validation and body-size issues.
 */

export function shouldReencodeImageForUpload(file: File): boolean {
  const t = (file.type ?? "").trim().toLowerCase();
  if (file.size > 1.8 * 1024 * 1024) return true;
  if (!t || t === "application/octet-stream" || t === "binary/octet-stream") {
    return true;
  }
  if (t === "image/heic" || t === "image/heif") return true;
  if (t === "image/jpeg" || t === "image/png" || t === "image/webp") {
    return false;
  }
  return true;
}

/**
 * Downscale + JPEG encode so uploads stay small and use a well-supported type.
 * Throws if the image cannot be decoded (e.g. unsupported HEIC on older browsers).
 */
export async function reencodeImageForUpload(
  file: File,
  opts?: { maxEdge?: number; quality?: number },
): Promise<File> {
  const maxEdge = opts?.maxEdge ?? 2560;
  const quality = opts?.quality ?? 0.88;

  const bmp = await createImageBitmap(file);
  try {
    let { width, height } = bmp;
    const scale = Math.min(1, maxEdge / Math.max(width, height, 1));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not prepare image.");
    }
    ctx.drawImage(bmp, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    if (!blob) {
      throw new Error("Could not prepare image.");
    }

    const base =
      (file.name && file.name.replace(/\.[^.]+$/, "")) || "checkin-photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    bmp.close();
  }
}
