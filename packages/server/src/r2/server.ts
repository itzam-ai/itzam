import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "@itzam/utils";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

export async function uploadFileToBucket(file: File, userId: string) {
  const Key =
    userId +
    "/" +
    file.name.replaceAll(" ", "-").split(".")[0] +
    "-" +
    Date.now() +
    "." +
    file.name.split(".")[1];

  const Bucket = env.CLOUDFLARE_BUCKET;

  const parallelUploads = new Upload({
    client: s3Client,
    params: {
      Bucket,
      Key,
      Body: file.stream(),
      ContentType: file.type,
    },
    leavePartsOnError: false,
  });

  const res = await parallelUploads.done();

  return {
    ...res,
    imageUrl: "https://r2.itz.am/" + Key,
  };
}
