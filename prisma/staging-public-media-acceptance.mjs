import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const productionHosts = new Set(["amaanafoundation.org", "www.amaanafoundation.org"]);
const syntheticPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=",
  "base64",
);

let mediaAssetId = null;
let objectKey = null;
let s3 = null;
let bucket = null;

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function pass(message) {
  console.log(`✓ ${message}`);
}

async function requestMedia(publicUrl, phase) {
  const url = new URL(publicUrl);
  url.searchParams.set("acceptance", `${phase}-${randomUUID()}`);
  return fetch(url, {
    redirect: "manual",
    cache: "no-store",
    headers: { "user-agent": "Amaana-Public-Media-Acceptance/1.0" },
  });
}

async function run() {
  if (process.env.APP_ENVIRONMENT !== "staging") {
    throw new Error("Refusing public-media acceptance outside APP_ENVIRONMENT=staging");
  }

  const publicMediaBaseUrl = new URL(required("PUBLIC_MEDIA_BASE_URL"));
  const stagingBaseUrl = new URL(process.env.STAGING_BASE_URL?.trim() || publicMediaBaseUrl.origin);
  if (productionHosts.has(stagingBaseUrl.hostname) || productionHosts.has(publicMediaBaseUrl.hostname)) {
    throw new Error("Refusing public-media acceptance against the production Amaana domain");
  }
  assert.equal(stagingBaseUrl.protocol, "https:", "STAGING_BASE_URL must use HTTPS");
  assert.equal(publicMediaBaseUrl.protocol, "https:", "PUBLIC_MEDIA_BASE_URL must use HTTPS");
  assert.equal(
    publicMediaBaseUrl.origin,
    stagingBaseUrl.origin,
    "PUBLIC_MEDIA_BASE_URL must use the same staging origin as STAGING_BASE_URL",
  );
  assert.equal(publicMediaBaseUrl.pathname.replace(/\/$/, ""), "/media", "PUBLIC_MEDIA_BASE_URL must end in /media");

  bucket = required("PUBLIC_MEDIA_S3_BUCKET");
  const privateBucket = process.env.S3_BUCKET?.trim();
  assert.notEqual(bucket, privateBucket, "Public media bucket must be physically separate from the assistance bucket");

  const region = required("PUBLIC_MEDIA_S3_REGION");
  const endpoint = required("PUBLIC_MEDIA_S3_ENDPOINT");
  const accessKeyId = required("PUBLIC_MEDIA_S3_ACCESS_KEY_ID");
  const secretAccessKey = required("PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY");
  const forcePathStyle = process.env.PUBLIC_MEDIA_S3_FORCE_PATH_STYLE === "true";

  s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });

  const expectedCommitSha = process.env.EXPECTED_COMMIT_SHA?.trim() || process.env.RAILWAY_GIT_COMMIT_SHA?.trim();
  if (!expectedCommitSha) throw new Error("EXPECTED_COMMIT_SHA or RAILWAY_GIT_COMMIT_SHA is required");
  {
    const versionResponse = await fetch(new URL("/api/health/version", stagingBaseUrl), {
      cache: "no-store",
      headers: { "user-agent": "Amaana-Public-Media-Acceptance/1.0" },
    });
    assert.equal(versionResponse.status, 200, "Staging version endpoint is unavailable");
    const version = await versionResponse.json();
    assert.equal(version.commitSha, expectedCommitSha, "Staging is not serving the expected integration commit");
    pass(`exact staging commit ${expectedCommitSha}`);
  }

  const now = new Date();
  objectKey = `${now.getUTCFullYear()}/${randomUUID()}.png`;
  const publicUrl = `${publicMediaBaseUrl.toString().replace(/\/$/, "")}/${objectKey}`;

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: syntheticPng,
    ContentType: "image/png",
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: { originalName: "amaana-staging-public-media-acceptance.png", synthetic: "true" },
  }));
  pass("synthetic image uploaded to the dedicated private public-media bucket");

  const asset = await prisma.mediaAsset.create({
    data: {
      kind: "IMAGE",
      title: "STAGING TEST — public media delivery acceptance",
      publicUrl,
      storageKey: objectKey,
      altText: "Synthetic one-pixel staging image used to verify public media delivery",
      caption: "Synthetic staging-only infrastructure acceptance asset. Not beneficiary media.",
      sourcePath: "synthetic://staging-public-media-acceptance",
      sourceYear: now.getUTCFullYear(),
      isPublic: false,
      privacyApprovedAt: null,
    },
    select: { id: true },
  });
  mediaAssetId = asset.id;
  pass("synthetic MediaAsset created unpublished");

  const unpublished = await requestMedia(publicUrl, "unpublished");
  assert.equal(unpublished.status, 404, "Unpublished media was publicly accessible");
  assert.match(unpublished.headers.get("cache-control") ?? "", /no-store/i, "Unpublished response must not be cached");
  pass("unpublished media is inaccessible through /media");

  await prisma.mediaAsset.update({
    where: { id: mediaAssetId },
    data: { isPublic: true, privacyApprovedAt: new Date() },
  });
  pass("synthetic publication gate enabled");

  const published = await requestMedia(publicUrl, "published");
  assert.equal(published.status, 200, "Published synthetic media did not load through /media");
  assert.match(published.headers.get("content-type") ?? "", /^image\/png/i, "Published media content type is incorrect");
  assert.match(published.headers.get("x-content-type-options") ?? "", /^nosniff$/i, "Published media must send nosniff");
  const cacheControl = published.headers.get("cache-control") ?? "";
  assert.match(cacheControl, /max-age=60/i, "Published media browser cache must remain bounded");
  assert.match(cacheControl, /s-maxage=300/i, "Published media shared cache must remain bounded");
  assert.doesNotMatch(cacheControl, /immutable/i, "Published proxy response must not be immutable");
  const servedBytes = Buffer.from(await published.arrayBuffer());
  assert.deepEqual(servedBytes, syntheticPng, "Published proxy response bytes differ from the uploaded object");
  pass("published media is served from private storage through the gated proxy with bounded caching");

  await prisma.mediaAsset.update({
    where: { id: mediaAssetId },
    data: { isPublic: false },
  });
  pass("synthetic media unpublished");

  const revoked = await requestMedia(publicUrl, "revoked");
  assert.equal(revoked.status, 404, "Unpublished media remained publicly accessible");
  assert.match(revoked.headers.get("cache-control") ?? "", /no-store/i, "Revoked response must not be cached");
  pass("unpublishing immediately revokes origin access through /media");
}

async function cleanup() {
  if (mediaAssetId) {
    await prisma.mediaAsset.updateMany({
      where: { id: mediaAssetId },
      data: { isPublic: false },
    });
    await prisma.mediaAsset.deleteMany({ where: { id: mediaAssetId } });
    pass("synthetic MediaAsset removed");
  }

  if (s3 && bucket && objectKey) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
    pass("synthetic storage object removed");
  }
}

let failure;
try {
  await run();
} catch (error) {
  failure = error;
} finally {
  try {
    await cleanup();
  } catch (cleanupError) {
    if (!failure) failure = cleanupError;
    else console.error("Cleanup also failed", cleanupError);
  }
  await prisma.$disconnect();
}

if (failure) throw failure;
console.log("\nAmaana public-media staging acceptance passed.");
