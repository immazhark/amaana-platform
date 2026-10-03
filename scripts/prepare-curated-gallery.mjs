import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');

// Local preparation only: never uploads, publishes, modifies or re-encodes originals.
const root = path.resolve(import.meta.dirname, '..');
const intake = path.resolve(process.argv[2] || path.join(root, '../intake'));
const output = path.join(root, '.curated-media');
const master = JSON.parse(await readFile(path.join(root, 'src/content/master-copy.json'), 'utf8'));
const canonical = new Map(master.initiatives.map(item => [item.slug, item]));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const records = [];
const seenIds = new Set();
const duplicateHashes = new Map();

for (const directory of (await readdir(intake, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!directory.isDirectory()) continue;
  const folder = path.join(intake, directory.name);
  for (const name of (await readdir(folder)).filter(name => /^batch-.*-general-01\.json$/.test(name)).sort()) {
    const batch = JSON.parse(await readFile(path.join(folder, name), 'utf8'));
    assert.equal(batch.role, 'general-gallery');
    assert.equal(batch.banner, null);
    assert.equal(batch.thumbnail, null);
    const slug = batch.initiative.replace(/^eid-kits-/, 'eid-gift-kits-');
    assert(canonical.has(slug), `Unknown initiative: ${slug}`);
    const orders = new Set();
    for (const file of batch.files) {
      assert(Number.isInteger(file.order) && file.order > 0 && !orders.has(file.order), `Invalid order in ${slug}`);
      orders.add(file.order);
      const bytes = await readFile(file.sourcePath);
      const sha256 = hash(bytes);
      const metadata = await sharp(bytes, { failOn: 'warning', limitInputPixels: 40_000_000 }).metadata();
      assert(['jpeg', 'png'].includes(metadata.format), 'Expected JPEG or PNG');
      // Decode the complete image to reject corrupt/truncated input, without writing a derivative.
      await sharp(bytes, { failOn: 'warning', limitInputPixels: 40_000_000 }).raw().toBuffer();
      const rotated = [5, 6, 7, 8].includes(metadata.orientation);
      const width = rotated ? metadata.height : metadata.width;
      const height = rotated ? metadata.width : metadata.height;
      const originalName = path.basename(file.sourcePath);
      const relativePath = `${slug}/${String(file.order).padStart(3, '0')}/${originalName}`;
      const destination = path.join(output, 'originals', relativePath);
      await mkdir(path.dirname(destination), { recursive: true });
      try { await copyFile(file.sourcePath, destination, constants.COPYFILE_EXCL); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
      assert.equal(hash(await readFile(destination)), sha256, `Existing copy differs: ${relativePath}`);
      const id = `curated-${hash(`${slug}/${batch.batch}/${file.order}`).slice(0, 32)}`;
      assert(!seenIds.has(id), `Duplicate identity: ${id}`);
      seenIds.add(id);
      const context = file.userProvidedContext || (batch.files.length === 1 ? batch.userProvidedContext : null);
      const label = batch.userLabel || slug.replaceAll('-', ' ');
      const altText = context || `${label} — selected programme photograph ${file.order}`;
      const record = {
        id, slug, batch: batch.batch, role: 'general-gallery', sortOrder: file.order - 1,
        originalName, relativePath, sha256, bytes: bytes.length,
        mimeType: `image/${metadata.format}`, width, height,
        sourceYear: Number(slug.match(/-(20\d{2})$/)?.[1]) || null,
        altText, caption: context || null,
        isPublic: false, privacyApprovedAt: null, heroEligible: false,
      };
      records.push(record);
      duplicateHashes.set(sha256, [...(duplicateHashes.get(sha256) || []), id]);
    }
  }
}
assert.equal(records.length, 154, 'Selection changed: reconcile the 154-attachment intake before proceeding');
assert.equal(new Set(records.map(record => record.slug)).size, 22);
const manifest = { version: 1, batch: 'owner-curated-2026-09-30', status: 'prepared-unpublished', records };
await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
const report = {
  attachments: records.length,
  initiatives: [...new Set(records.map(record => record.slug))].map(slug => ({ slug, count: records.filter(record => record.slug === slug).length })),
  totalBytes: records.reduce((total, record) => total + record.bytes, 0),
  exactDuplicateGroups: [...duplicateHashes.values()].filter(ids => ids.length > 1),
  allOriginalHashesVerified: true,
  published: false,
  next: 'Review alt text and website/consent approval; import through dedicated storage and draft MediaAsset workflow.',
};
await writeFile(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
