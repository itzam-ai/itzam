import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@itzam/utils";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
  // Add compatibility settings for R2 as recommended by Cloudflare
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export async function uploadFileToBucket(file: File, userId: string) {
  // Generate a safe filename
  const fileExtension = file.name.split(".").pop() || "bin";
  const baseName =
    file.name.split(".").slice(0, -1).join(".").replaceAll(" ", "-") || "file";

  const Key = `${userId}/${baseName}-${Date.now()}.${fileExtension}`;
  const Bucket = env.CLOUDFLARE_BUCKET;

  // Convert file to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const uploadCommand = new PutObjectCommand({
    Bucket,
    Key,
    Body: buffer,
    ContentType: file.type,
    ContentLength: file.size,
  });

  const result = await s3Client.send(uploadCommand);

  return {
    ...result,
    imageUrl: "https://r2.itz.am/" + Key,
  };
}
