import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { importCuratedGalleryDrafts } from '../prisma/curated-gallery-import.mjs';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(root, '.curated-media/manifest.json'), 'utf8'));
const apply = process.argv.includes('--apply');
const originals = path.join(root, '.curated-media/originals');
const pending = [];
for (const item of manifest.records) {
  const filename = path.resolve(originals, item.relativePath);
  assert(filename.startsWith(`${originals}${path.sep}`), 'Source escaped the prepared package');
  const bytes = await readFile(filename);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256, 'Source hash changed');
  assert.equal(bytes.length, item.bytes);
  const extension = item.mimeType === 'image/png' ? 'png' : 'jpg';
  // Hash plus attachment identity preserves ordered duplicates without overwriting objects.
  const digest = createHash('sha256').update(`${item.id}/${item.sha256}`).digest('hex').slice(0, 32);
  const keyId = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20)}`;
  item.storageKey = `2026/${keyId}.${extension}`;
  item.publicUrl = `/media/${item.storageKey}`;
  pending.push({ item, bytes });
}

// Validate the entire import and target mapping before any external write.
const validationClient = {
  $transaction: async callback => callback({
    initiative: { findUnique: async ({ where }) => ({ id: where.slug }) },
    mediaAsset: { findUnique: async () => null, create: async () => ({}) },
  }),
};
await importCuratedGalleryDrafts(validationClient, manifest);
if (!apply) {
  console.log(`Dry run passed: ${pending.length} byte-verified images; gallery-only draft records. No external writes.`);
} else {
  assert.equal(process.env.APP_ENVIRONMENT, 'staging', 'Draft import is staging-only');
  assert.equal(process.env.RAILWAY_SERVICE_ID, 'fcb9d167-eba1-40c8-a4e6-ac35af470989', 'Wrong target service');
  const required = name => { assert(process.env[name], `${name} is required`); return process.env[name]; };
  required('DATABASE_URL');
  const bucket = required('PUBLIC_MEDIA_S3_BUCKET');
  assert.notEqual(bucket, required('S3_BUCKET'), 'Media and assistance buckets must be separate');
  assert.equal(process.env.CURATED_MEDIA_PRIVATE_BUCKET_CONFIRMED, 'true', 'Verify that anonymous bucket/object access is disabled');
  const { S3Client, PutObjectCommand, HeadObjectCommand } = await import('@aws-sdk/client-s3');
  const { PrismaClient } = await import('@prisma/client');
  const client = new S3Client({
    region: required('PUBLIC_MEDIA_S3_REGION'), endpoint: required('PUBLIC_MEDIA_S3_ENDPOINT'),
    forcePathStyle: process.env.PUBLIC_MEDIA_S3_FORCE_PATH_STYLE === 'true',
    credentials: { accessKeyId: required('PUBLIC_MEDIA_S3_ACCESS_KEY_ID'), secretAccessKey: required('PUBLIC_MEDIA_S3_SECRET_ACCESS_KEY') },
  });
  const prisma = new PrismaClient();
  try {
    for (const slug of new Set(manifest.records.map(item => item.slug))) {
      assert(await prisma.initiative.findUnique({ where: { slug }, select: { id: true } }), `Missing target ${slug}`);
    }
    for (const { item, bytes } of pending) {
      try {
        await client.send(new PutObjectCommand({
          Bucket: bucket, Key: item.storageKey, Body: bytes, ContentType: item.mimeType,
          IfNoneMatch: '*', CacheControl: 'private, no-store', Metadata: { sha256: item.sha256 },
        }));
      } catch (error) {
        if (error.$metadata?.httpStatusCode !== 412) throw error;
        const existing = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: item.storageKey }));
        assert.equal(existing.Metadata?.sha256, item.sha256, 'Existing object differs');
        assert.equal(existing.ContentLength, item.bytes);
      }
    }
    console.log(await importCuratedGalleryDrafts(prisma, manifest));
    console.log('Imported unpublished drafts. Complete the existing admin review to publish; hero use remains unapproved.');
  } finally { await prisma.$disconnect(); }
}
