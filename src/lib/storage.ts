import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const publicMediaTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 5;
export const PRIVATE_OBJECT_CACHE_CONTROL = "private, no-store, max-age=0";

type StorageConfig = {
  bucket: string;
  client: S3Client;
};

export type PublicMediaStorageReadiness = {
  uploadReady: boolean;
  deliveryReady: boolean;
  separateBucketConfigured: boolean;
  usingFallbackCredentials: boolean;
  baseUrlConfigured: boolean;
  baseUrlSecure: boolean;
};

function createClient(region: string, endpoint: string | undefined, forcePathStyle: boolean, accessKeyId: string, secretAccessKey: string) {
  return new S3Client({ region, endpoint, forcePathStyle, credentials: { accessKeyId, secretAccessKey } });
}

function getPrivateStorage(): StorageConfig {
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!region || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Private document storage is not configured");
  return {
    bucket,
    client: createClient(region, process.env.S3_ENDPOINT || undefined, process.env.S3_FORCE_PATH_STYLE === "true", accessKeyId, secretAccessKey),
  };
}

function getPublicMediaStorage(): StorageConfig {
  const region = process.env.PUBLIC_MEDIA_S3_REGION || process.env.S3_REGION;
  const bucket = process.env.PUBLIC_MEDIA_S3_BUCKET;
  const accessKeyId = process.env.PUBLIC_MEDIA_S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  if (!region || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Public media storage is not configured");
  return {
    bucket,
    client: createClient(
      region,
      process.env.PUBLIC_MEDIA_S3_ENDPOINT || process.env.S3_ENDPOINT || undefined,
      (process.env.PUBLIC_MEDIA_S3_FORCE_PATH_STYLE || process.env.S3_FORCE_PATH_STYLE) === "true",
      accessKeyId,
      secretAccessKey,
    ),
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

export function isManagedPrivateDocumentKey(objectKey: string, requestId: string) {
  const escapedRequestId = requestId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^assistance/${escapedRequestId}/[0-9a-f-]{36}\\.(?:pdf|jpg|png|webp)$`, "i").test(objectKey);
}

export async function uploadPrivateDocument(file: File, requestId: string) {
  if (!allowedTypes.has(file.type)) throw new Error("Only PDF, JPEG, PNG and WebP documents are accepted");
  if (file.size > MAX_FILE_BYTES) throw new Error("Each document must be 5 MB or smaller");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) throw new Error("The uploaded document does not match its declared file type");
  const safeExtension = extensionForMimeType(file.type);
  const objectKey = `assistance/${requestId}/${randomUUID()}.${safeExtension}`;
  const { bucket, client } = getPrivateStorage();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: bytes,
    ContentType: file.type,
    CacheControl: PRIVATE_OBJECT_CACHE_CONTROL,
    Metadata: { requestId },
  }));
  return { objectKey, originalName: file.name.slice(0, 255), mimeType: file.type, sizeBytes: file.size };
}

export async function deletePrivateDocumentObject(objectKey: string, requestId: string) {
  if (!isManagedPrivateDocumentKey(objectKey, requestId)) throw new Error("Invalid managed private document key");
  const { bucket, client } = getPrivateStorage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
}

export async function getPrivateDocumentUrl(objectKey: string, requestId: string) {
  if (!isManagedPrivateDocumentKey(objectKey, requestId)) throw new Error("Invalid managed private document key");
  const { bucket, client } = getPrivateStorage();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ResponseCacheControl: PRIVATE_OBJECT_CACHE_CONTROL,
  }), { expiresIn: 60 });
}

function normalizePublicBaseUrl() {
  const value = process.env.PUBLIC_MEDIA_BASE_URL?.trim();
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("PUBLIC_MEDIA_BASE_URL must use HTTPS");
  return url.toString().replace(/\/$/, "");
}

export function getPublicMediaStorageReadiness(): PublicMediaStorageReadiness {
  const bucket = process.env.PUBLIC_MEDIA_S3_BUCKET?.trim();
  const privateBucket = process.env.S3_BUCKET?.trim();
  const region = process.env.PUBLIC_MEDIA_S3_REGION || process.env.S3_REGION;
  const accessKeyId = process.env.PUBLIC_MEDIA_S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
  const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL?.trim();

  let baseUrlSecure = false;
  if (baseUrl) {
    try {
      baseUrlSecure = new URL(baseUrl).protocol === "https:";
    } catch {
      baseUrlSecure = false;
    }
  }

  const separateBucketConfigured = Boolean(bucket && (!privateBucket || bucket !== privateBucket));
  const uploadReady = Boolean(region && bucket && accessKeyId && secretAccessKey && separateBucketConfigured);
  const deliveryReady = Boolean(uploadReady && baseUrl && baseUrlSecure);

  return {
    uploadReady,
    deliveryReady,
    separateBucketConfigured,
    usingFallbackCredentials: !process.env.PUBLIC_MEDIA_S3_ACCESS_KEY_ID || !process.env.PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY,
    baseUrlConfigured: Boolean(baseUrl),
    baseUrlSecure,
  };
}

export function validatePublicMediaFile(file: File) {
  if (!publicMediaTypes.has(file.type)) throw new Error("Public media upload accepts PDF, JPEG, PNG and WebP files");
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error("Public media files must be between 1 byte and 5 MB");
}

export function isManagedPublicMediaKey(objectKey: string) {
  return /^\d{4}\/[0-9a-f-]{36}\.(?:pdf|jpg|png|webp)$/i.test(objectKey);
}

export async function getPublicMediaObject(objectKey: string) {
  if (!isManagedPublicMediaKey(objectKey)) throw new Error("Invalid managed public media key");
  const { bucket, client } = getPublicMediaStorage();
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
  if (!object.Body) throw new Error("Public media object has no body");
  const bytes = await object.Body.transformToByteArray();
  return {
    bytes,
    contentType: object.ContentType ?? "application/octet-stream",
    etag: object.ETag ?? null,
    lastModified: object.LastModified ?? null,
  };
}

export async function deletePublicMediaObject(objectKey: string) {
  if (!isManagedPublicMediaKey(objectKey)) throw new Error("Invalid managed public media key");
  const { bucket, client } = getPublicMediaStorage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
}

export async function uploadPublicMediaFile(file: File) {
  validatePublicMediaFile(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) throw new Error("The uploaded media does not match its declared file type");

  const safeExtension = extensionForMimeType(file.type);
  const objectKey = `${new Date().getUTCFullYear()}/${randomUUID()}.${safeExtension}`;
  const { bucket, client } = getPublicMediaStorage();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: bytes,
    ContentType: file.type,
    CacheControl: PRIVATE_OBJECT_CACHE_CONTROL,
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
