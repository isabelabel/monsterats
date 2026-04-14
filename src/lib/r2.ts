import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}.`);
  return v;
}

export function r2PublicBaseUrl(): string | null {
  const v = process.env.R2_PUBLIC_BASE_URL?.trim();
  return v ? v.replace(/\/+$/, "") : null;
}

export function createR2Client(): S3Client {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function presignR2Put(opts: {
  key: string;
  contentType: string;
  cacheControl?: string;
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  const bucket = requireEnv("R2_BUCKET");
  const base = r2PublicBaseUrl();
  if (!base) throw new Error("Missing R2_PUBLIC_BASE_URL.");

  const client = createR2Client();
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: opts.key,
      ContentType: opts.contentType,
      ...(opts.cacheControl ? { CacheControl: opts.cacheControl } : {}),
    }),
    { expiresIn: 60 },
  );

  return {
    uploadUrl,
    publicUrl: `${base}/${opts.key}`,
  };
}

export function r2KeyFromPublicUrl(url: string): string | null {
  const base = r2PublicBaseUrl();
  if (!base) return null;
  if (!url.startsWith(base + "/")) return null;
  return url.slice(base.length + 1);
}

export async function deleteR2ObjectByPublicUrl(url: string): Promise<void> {
  const key = r2KeyFromPublicUrl(url);
  if (!key) return;
  const bucket = requireEnv("R2_BUCKET");
  const client = createR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

