import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 5;

function getClient() {
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!region || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Document storage is not configured");
  return { bucket, client: new S3Client({ region, endpoint: process.env.S3_ENDPOINT || undefined, forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", credentials: { accessKeyId, secretAccessKey } }) };
}

export async function uploadPrivateDocument(file: File, requestId: string) {
  if (!allowedTypes.has(file.type)) throw new Error("Only PDF, JPEG, PNG and WebP documents are accepted");
  if (file.size > MAX_FILE_BYTES) throw new Error("Each document must be 5 MB or smaller");
  const safeExtension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const objectKey = `assistance/${requestId}/${randomUUID()}.${safeExtension}`;
  const { bucket, client } = getClient();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type, Metadata: { requestId } }));
  return { objectKey, originalName: file.name.slice(0, 255), mimeType: file.type, sizeBytes: file.size };
}

export async function getPrivateDocumentUrl(objectKey: string) {
  const { bucket, client } = getClient();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: objectKey }), { expiresIn: 60 });
}
