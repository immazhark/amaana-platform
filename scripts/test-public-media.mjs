import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { validateImage } from './check-public-media.mjs';

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');

test('public media validation accepts real pixels and rejects corruption', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'amaana-media-check-'));
  const jpeg = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#466faa' } }).jpeg().toBuffer();
  const valid = path.join(directory, 'valid.jpg');
  await writeFile(valid, jpeg);
  assert.deepEqual(await validateImage(valid), { width: 32, height: 24, format: 'jpeg' });
  const wrongExtension = path.join(directory, 'wrong.webp');
  await writeFile(wrongExtension, jpeg);
  await assert.rejects(validateImage(wrongExtension), /Expected a valid webp/);
  const corrupt = path.join(directory, 'corrupt.webp');
  await writeFile(corrupt, Buffer.alloc(14999, 0x81));
  await assert.rejects(validateImage(corrupt));
  const truncated = path.join(directory, 'truncated.jpg');
  await writeFile(truncated, jpeg.subarray(0, jpeg.length - 30));
  await assert.rejects(validateImage(truncated));
});

