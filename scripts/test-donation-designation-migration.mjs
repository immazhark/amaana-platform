// Optional, isolated PostgreSQL-WASM migration verification. No hosted database.
// Set PGLITE_MODULE_PATH to a separately installed @electric-sql/pglite entry.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, before, describe, it } from 'node:test';

const runtime = process.env.PGLITE_MODULE_PATH;
let db;
let temp;
const good = { version: 1, kind: 'APPEAL', appealId: 'synthetic-appeal', label: 'Synthetic appeal', givingIntent: 'GENERAL' };

async function insertDonation(id, snapshot) {
  return db.query(`INSERT INTO "Donation"
    ("id", "referenceNumber", "appealId", "donorName", "donorEmail", "domesticConfirmedAt", "amount", "receiptTokenHash", "updatedAt", "designationSnapshot")
    VALUES ($1, $2, 'synthetic-appeal', 'Synthetic donor', 'donor@example.invalid', NOW(), 250, 'synthetic-hash', NOW(), $3::jsonb)`,
    [id, `SYNTHETIC-${id}`, JSON.stringify(snapshot)]);
}

describe('private donation designation migration on isolated PostgreSQL-WASM', { skip: !runtime }, () => {
  before(async () => {
    const { PGlite } = await import(pathToFileURL(runtime).href);
    db = new PGlite();
    temp = mkdtempSync(join(tmpdir(), 'amaana-designation-sql-'));
    const baseline = join(temp, 'schema.prisma');
    writeFileSync(baseline, execFileSync('git', ['show', 'b62993963b81636daaf32b7813effec60662be4a:prisma/schema.prisma']));
    const sql = execFileSync('node_modules/.bin/prisma', ['migrate', 'diff', '--from-empty', '--to-schema-datamodel', baseline, '--script'], { encoding: 'utf8' });
    await db.exec(sql);
    await db.exec(`INSERT INTO "User" ("id", "name", "email", "updatedAt")
      VALUES ('creator', 'Synthetic creator', 'creator@example.invalid', NOW());
      INSERT INTO "Appeal" ("id", "slug", "title", "summary", "story", "category", "beneficiaryName", "goalAmount", "amountRaised", "createdById", "updatedAt")
      VALUES ('synthetic-appeal', 'synthetic-appeal', 'Synthetic appeal', 'Synthetic summary', 'Synthetic story', 'OTHER', 'Synthetic beneficiary', 1000, 0, 'creator', NOW());
      INSERT INTO "Donation" ("id", "referenceNumber", "appealId", "donorName", "donorEmail", "domesticConfirmedAt", "amount", "receiptTokenHash", "updatedAt")
      VALUES ('legacy', 'SYNTHETIC-LEGACY', 'synthetic-appeal', 'Synthetic donor', 'donor@example.invalid', NOW(), 250, 'legacy-hash', NOW());`);
    await db.exec(readFileSync('prisma/migrations/20261014103000_private_giving_fund_registry/migration.sql', 'utf8'));
    await db.exec(readFileSync('prisma/migrations/20261014160000_donation_designation_snapshot/migration.sql', 'utf8'));
  });
  after(async () => {
    if (db) await db.close();
    if (temp) rmSync(temp, { recursive: true, force: true });
  });

  it('preserves legacy donations while supporting an original-purpose snapshot', async () => {
    assert.equal((await db.query('SELECT "designationSnapshot" FROM "Donation" WHERE "id" = \'legacy\'')).rows[0].designationSnapshot, null);
    await insertDonation('snapshot', good);
    assert.deepEqual((await db.query('SELECT "designationSnapshot" FROM "Donation" WHERE "id" = \'snapshot\'')).rows[0].designationSnapshot, good);
  });

  for (const [reason, snapshot] of [
    ['wrong designation kind', { ...good, kind: 'FUND' }],
    ['foreign appeal', { ...good, appealId: 'another-appeal' }],
    ['changed intent', { ...good, givingIntent: 'ZAKAT' }],
    ['missing label', { ...good, label: undefined }],
    ['scalar snapshot', 'invalid'],
    ['missing version', { ...good, version: undefined }],
  ]) it(`rejects ${reason} at the database boundary`, async () => {
    await assert.rejects(insertDonation(`invalid-${reason.replaceAll(' ', '-')}`, snapshot), error => error.code === '23514');
  });

  it('never allows retroactive donor-purpose backfills on legacy NULL records', async () => {
    await assert.rejects(db.query(
      'UPDATE "Donation" SET "designationSnapshot"=$1::jsonb WHERE "id"=\'legacy\'',
      [JSON.stringify(good)],
    ), error => error.code === '23514');
  });

  it('prevents changing appeal or giving intention on legacy and snapshotted donations', async () => {
    for (const id of ['legacy', 'snapshot']) {
      await assert.rejects(db.query(
        'UPDATE "Donation" SET "givingIntent"=\'SADAQAH\' WHERE "id"=$1', [id],
      ), error => error.code === '23514');
      await assert.rejects(db.query(
        'UPDATE "Donation" SET "appealId"=\'another-appeal\' WHERE "id"=$1', [id],
      ), error => error.code === '23514');
    }
  });

  it('blocks edits to saved purpose while permitting ordinary financial state changes', async () => {
    await assert.rejects(
      db.query('UPDATE "Donation" SET "designationSnapshot"=$1::jsonb WHERE "id"=\'snapshot\'',
        [JSON.stringify({ ...good, label: 'Changed after payment' })]),
      error => error.code === '23514',
    );
    await db.query('UPDATE "Donation" SET "status"=\'CAPTURED\' WHERE "id"=\'snapshot\'');
    assert.deepEqual((await db.query('SELECT "designationSnapshot" FROM "Donation" WHERE "id"=\'snapshot\'')).rows[0].designationSnapshot, good);
  });
});
