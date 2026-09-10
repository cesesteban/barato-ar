/**
 * Cloudflare R2 storage wrapper (C-009).
 * API compatible con S3 vía @aws-sdk/client-s3.
 * Buckets:
 *   - products (público, servido vía img.barato.ar)
 *   - reports  (privado, presigned URLs)
 */

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 no está configurado — revisá R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY.");
  }
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  return cachedClient;
}

export type UploadImageParams = {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
};

export type UploadImageResult = { key: string; publicUrl?: string };

export async function uploadImage(params: UploadImageParams): Promise<UploadImageResult> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: params.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );
  if (params.bucket === env.R2_BUCKET_PRODUCTS && env.NEXT_PUBLIC_R2_PUBLIC_URL) {
    return { key: params.key, publicUrl: `${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${params.key}` };
  }
  return { key: params.key };
}

export async function deleteImage(bucket: string, key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getPresignedUrl(
  bucket: string,
  key: string,
  ttlSeconds = 3600,
): Promise<string> {
  const client = getClient();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: ttlSeconds,
  });
}
