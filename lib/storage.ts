/**
 * File storage abstraction layer.
 *
 * In production, this uploads to Cloudflare R2.
 * In development without R2 credentials, files are stored as Base64
 * in memory or served directly from the generation endpoint.
 */

export interface UploadResult {
  url: string;
  key: string;
}

function getR2Config() {
  return {
    endpoint:
      process.env.R2_ENDPOINT ?? process.env.CLOUDFLARE_R2_ENDPOINT,
    accessKeyId:
      process.env.R2_ACCESS_KEY_ID ??
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY ??
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucketName:
      process.env.R2_BUCKET_NAME ?? process.env.CLOUDFLARE_R2_BUCKET_NAME,
    publicUrl:
      process.env.R2_PUBLIC_URL ??
      process.env.CLOUDFLARE_R2_PUBLIC_DEV_URL,
  };
}

/**
 * Upload a file buffer to storage.
 * Falls back to a data URL when R2 is not configured.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<UploadResult> {
  const config = getR2Config();

  if (
    config.endpoint &&
    config.accessKeyId &&
    config.secretAccessKey &&
    config.bucketName
  ) {
    return uploadToR2(buffer, filename, contentType, config);
  }

  if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production") {
    throw new Error(
      "FusionZone storage is not configured. Refusing to persist a file outside local development.",
    );
  }

  // Fallback: return a data URL for development
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${contentType};base64,${base64}`;
  return { url: dataUrl, key: filename };
}

/**
 * Delete a file from storage by its key.
 * No-op in dev/fallback mode since files aren't persisted to a remote store.
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getR2Config();

  if (
    config.endpoint &&
    config.accessKeyId &&
    config.secretAccessKey &&
    config.bucketName
  ) {
    const { S3Client, DeleteObjectCommand } = await import(
      "@aws-sdk/client-s3"
    );

    const client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId!,
        secretAccessKey: config.secretAccessKey!,
      },
    });

    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName!,
          Key: key,
        }),
      );
      console.log(`[Storage] Deleted file: ${key}`);
    } catch (error) {
      console.error(`[Storage] Failed to delete file ${key}:`, error);
      // Don't throw — deletion is best-effort
    }
  }
  // In fallback mode (data URLs), files are ephemeral so nothing to delete
}

async function uploadToR2(
  buffer: Buffer,
  filename: string,
  contentType: string,
  config: ReturnType<typeof getR2Config>,
): Promise<UploadResult> {
  // R2 upload uses the S3-compatible API
  const { S3Client, PutObjectCommand } = await import(
    "@aws-sdk/client-s3"
  );

  const client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
  });

  const key = filename.includes("/") ? filename : `receipts/${filename}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  const publicUrl = config.publicUrl
    ? `${config.publicUrl.replace(/\/$/, "")}/${key}`
    : `${config.endpoint}/${config.bucketName}/${key}`;

  return { url: publicUrl, key };
}
