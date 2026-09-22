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

export type ImageDimensions = { width: number; height: number };

export function readImageDimensions(bytes: Buffer, mimeType: string): ImageDimensions | null {
  if (mimeType === "image/png") {
    if (bytes.length < 24 || !hasValidSignature(bytes, mimeType)) return null;
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (mimeType === "image/webp") {
    if (bytes.length < 30 || !hasValidSignature(bytes, mimeType)) return null;
    const format = bytes.subarray(12, 16).toString("ascii");
    if (format === "VP8X") {
      const width = 1 + bytes.readUIntLE(24, 3);
      const height = 1 + bytes.readUIntLE(27, 3);
      return { width, height };
    }
    if (format === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
      const bits = bytes.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (format === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      const width = bytes.readUInt16LE(26) & 0x3fff;
      const height = bytes.readUInt16LE(28) & 0x3fff;
      return width > 0 && height > 0 ? { width, height } : null;
    }
    return null;
  }

  if (mimeType === "image/jpeg") {
    if (!hasValidSignature(bytes, mimeType)) return null;
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) return null;
      const length = bytes.readUInt16BE(offset);
      if (length < 2 || offset + length > bytes.length) return null;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        if (length < 7) return null;
        const height = bytes.readUInt16BE(offset + 3);
        const width = bytes.readUInt16BE(offset + 5);
        return width > 0 && height > 0 ? { width, height } : null;
      }
      offset += length;
    }
  }

  return null;
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
  const dimensions = file.type.startsWith("image/") ? readImageDimensions(bytes, file.type) : null;\n  const safeExtension = extensionForMimeType(file.type);
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

export type ImageDimensions = { width: number; height: number };

export function readImageDimensions(bytes: Buffer, mimeType: string): ImageDimensions | null {
  if (mimeType === "image/png" && bytes.length >= 24 && hasValidSignature(bytes, mimeType)) {
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (mimeType === "image/jpeg" && bytes.length >= 4 && hasValidSignature(bytes, mimeType)) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
      if (offset + 4 > bytes.length) break;
      const segmentLength = bytes.readUInt16BE(offset + 2);
      if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) break;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        if (segmentLength < 7) return null;
        const height = bytes.readUInt16BE(offset + 5);
        const width = bytes.readUInt16BE(offset + 7);
        return width > 0 && height > 0 ? { width, height } : null;
      }
      offset += 2 + segmentLength;
    }
    return null;
  }

  if (mimeType === "image/webp" && bytes.length >= 30 && hasValidSignature(bytes, mimeType)) {
    const chunk = bytes.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      const width = 1 + bytes.readUIntLE(24, 3);
      const height = 1 + bytes.readUIntLE(27, 3);
      return { width, height };
    }
    if (chunk === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      const width = bytes.readUInt16LE(26) & 0x3fff;
      const height = bytes.readUInt16LE(28) & 0x3fff;
      return width > 0 && height > 0 ? { width, height } : null;
    }
    if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
      const bits = bytes.readUInt32LE(21);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      return { width, height };
    }
  }

  return null;
}

export async function uploadPublicMediaFile(file: File) {
  validatePublicMediaFile(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type)) throw new Error("The uploaded media does not match its declared file type");

  const dimensions = file.type.startsWith("image/") ? readImageDimensions(bytes, file.type) : null;
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
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  };
}
