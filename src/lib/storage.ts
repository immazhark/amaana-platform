import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const publicMediaTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 5;

function getClient() {
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!region || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Document storage is not configured");
  return {
    bucket,
    client: new S3Client({
      region,
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

function hasValidSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return bytes.length >= pngSignature.length && bytes.subarray(0, pngSignature.length).equals(pngSignature);
  }
  if (mimeType === "image/webp") {
    return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  throw new Error("Unsupported document type");
}

export async function uploadPrivateDocument(file: File, requestId: string) {
  if (!allowedTypes.has(file.type)) throw new Error("Only PDF, JPEG, PNG and WebP documents are accepted");
  if (file.size > MAX_FILE_BYTES) throw new Error("Each document must be 5 MB or smaller");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) throw new Error("The uploaded document does not match its declared file type");
  const safeExtension = extensionForMimeType(file.type);
  const objectKey = `assistance/${requestId}/${randomUUID()}.${safeExtension}`;
  const { bucket, client } = getClient();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: bytes, ContentType: file.type, Metadata: { requestId } }));
  return { objectKey, originalName: file.name.slice(0, 255), mimeType: file.type, sizeBytes: file.size };
}

export async function getPrivateDocumentUrl(objectKey: string) {
  if (!objectKey.startsWith("assistance/") || objectKey.includes("..")) throw new Error("Invalid private document key");
  const { bucket, client } = getClient();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: objectKey }), { expiresIn: 60 });
}

function normalizePublicBaseUrl() {
  const value = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("S3_PUBLIC_BASE_URL must use HTTPS");
  return url.toString().replace(/\/$/, "");
}

export async function uploadPublicMediaFile(file: File) {
  if (!publicMediaTypes.has(file.type)) throw new Error("Public media upload accepts PDF, JPEG, PNG and WebP files");
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error("Public media files must be between 1 byte and 5 MB");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) throw new Error("The uploaded media does not match its declared file type");

  const safeExtension = extensionForMimeType(file.type);
  const objectKey = `public-media/${new Date().getUTCFullYear()}/${randomUUID()}.${safeExtension}`;
  const { bucket, client } = getClient();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: bytes,
    ContentType: file.type,
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: { originalName: file.name.slice(0, 255) },
  }));

  const baseUrl = normalizePublicBaseUrl();
  return {
    objectKey,
    publicUrl: baseUrl ? `${baseUrl}/${objectKey.split("/").map(encodeURIComponent).join("/")}` : null,
    originalName: file.name.slice(0, 255),
    mimeType: file.type,
    sizeBytes: file.size,
  };
}
