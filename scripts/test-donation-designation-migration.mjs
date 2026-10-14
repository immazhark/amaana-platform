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
const approvedFund = {
  version: 1, kind: 'FUND', fundId: 'fund-reviewed', fundRevision: 4,
  label: 'Synthetic approved fund',
  purpose: 'Reviewed synthetic emergency support programme.',
  disclosure: 'Donations support the independently reviewed charitable programme.',
  accountCode: 'TEST-FUND', givingIntent: 'GENERAL',
};

async function insertFundDonation(id, snapshot = approvedFund, destination = { appealId: null, fundId: 'fund-reviewed' }, intent = 'GENERAL', currency = 'INR') {
  const sql = 'INSERT INTO "Donation" ("id", "referenceNumber", "appealId", "fundId", "donorName", "donorEmail",'
    + ' "domesticConfirmedAt", "amount", "givingIntent", "receiptTokenHash", "updatedAt", "designationSnapshot", "currency")'
    + ' VALUES ($1, $2, $3, $4, $5, $6, NOW(), 250, $7::"DonationIntent", $8, NOW(), $9::jsonb, $10)';
  return db.query(sql, [id, 'SYNTHETIC-' + id, destination.appealId, destination.fundId,
    'Synthetic donor', 'donor@example.invalid', intent, 'fund-synthetic-hash',
    snapshot === null ? null : JSON.stringify(snapshot), currency]);
}


async function insertDonation(id, snapshot) {
  return db.query(`INSERT INTO "Donation"
    ("id", "referenceNumber", "appealId", "donorName", "donorEmail", "domesticConfirmedAt", "amount", "receiptTokenHash", "updatedAt", "designationSnapshot")
    VALUES ($1, $2, 'synthetic-appeal', 'Synthetic donor', 'donor@example.invalid', NOW(), 250, 'synthetic-hash', NOW(), $3::jsonb)`,
    [id, `SYNTHETIC-${id}`, JSON.stringify(snapshot)]);
}

// Runs even when the optional PostgreSQL-WASM engine is unavailable.
describe('donation designation migration source guard', () => {
  it('pairs PL/pgSQL delimiters and guards all write-once donor fields', () => {
    const migration = readFileSync('prisma/migrations/20261014160000_donation_designation_snapshot/migration.sql', 'utf8');
    const delimiter = '$donation_designation_guard$';
    assert.equal(migration.split(delimiter).length - 1, 2);
    assert.match(migration, /RETURNS TRIGGER LANGUAGE plpgsql AS \$donation_designation_guard\$/);
    assert.match(migration, /END;\s*\$donation_designation_guard\$;/);
    assert.match(migration, /BEFORE UPDATE OF "designationSnapshot", "appealId", "givingIntent" ON "Donation"/);
    assert.doesNotMatch(migration, /LANGUAGE plpgsql AS \$\s/);
    const extension = readFileSync('prisma/migrations/20261014193000_exclusive_donation_destination/migration.sql', 'utf8');
    assert.equal(extension.split('$fund_donation_insert_guard$').length - 1, 2);
    assert.equal(extension.split('$donation_designation_guard$').length - 1, 2);
    assert.match(extension, /Donation_exclusive_destination_check/);
    assert.match(extension, /Donation_validate_fund_insert/);
  });
});

describe('private donation designation migration on isolated PostgreSQL-WASM', { skip: !runtime }, () => {
  before(async () => {
    const { PGlite } = await import(pathToFileURL(runtime).href);
    db = new PGlite();
    temp = mkdtempSync(join(tmpdir(), 'amaana-designation-sql-'));
    const baseline = join(temp, 'schema.prisma');
    writeFileSync(baseline, execFileSync('git', ['show', 'b62993963b81636daaf32b7813effec60662be4a:prisma/schema.prisma']));
    const sql = execFileSync('node_modules/.bin/prisma', ['migrate', 'diff', '--from-empty', '--to-schema-datamodel', baseline, '--script'], { encoding: 'utf8' });
    await db.exec(sql);
    // Prisma schema diff omits custom CHECKs: include the existing monetary SQL.
    await db.exec(readFileSync("prisma/migrations/20260917090000_financial_integrity_checks/migration.sql", "utf8"));
    await db.exec(`INSERT INTO "User" ("id", "name", "email", "updatedAt")
      VALUES ('creator', 'Synthetic creator', 'creator@example.invalid', NOW()),
             ('editor', 'Synthetic editor', 'editor@example.invalid', NOW()),
             ('approver', 'Synthetic approver', 'approver@example.invalid', NOW());
      INSERT INTO "Appeal" ("id", "slug", "title", "summary", "story", "category", "beneficiaryName", "goalAmount", "amountRaised", "createdById", "updatedAt")
      VALUES ('synthetic-appeal', 'synthetic-appeal', 'Synthetic appeal', 'Synthetic summary', 'Synthetic story', 'OTHER', 'Synthetic beneficiary', 1000, 0, 'creator', NOW());
      INSERT INTO "Donation" ("id", "referenceNumber", "appealId", "donorName", "donorEmail", "domesticConfirmedAt", "amount", "receiptTokenHash", "updatedAt")
      VALUES ('legacy', 'SYNTHETIC-LEGACY', 'synthetic-appeal', 'Synthetic donor', 'donor@example.invalid', NOW(), 250, 'legacy-hash', NOW());`);
    await db.exec(readFileSync('prisma/migrations/20261014103000_private_giving_fund_registry/migration.sql', 'utf8'));
    await db.exec(readFileSync('prisma/migrations/20261014160000_donation_designation_snapshot/migration.sql', 'utf8'));
    await db.exec(`INSERT INTO "GivingFund"
      ("id", "slug", "name", "purpose", "disclosure", "accountCode",
       "acceptedIntents", "status", "revision", "createdById", "lastEditedById",
       "approvedById", "approvedAt", "updatedAt")
      VALUES ('fund-reviewed', 'fund-reviewed', 'Synthetic approved fund',
        'Reviewed synthetic emergency support programme.',
        'Donations support the independently reviewed charitable programme.',
        'TEST-FUND', ARRAY['GENERAL','SADAQAH']::"DonationIntent"[], 'APPROVED', 4,
        'creator', 'editor', 'approver', NOW(), NOW());`);
    await db.exec(readFileSync('prisma/migrations/20261014193000_exclusive_donation_destination/migration.sql', 'utf8'));
    await db.exec(readFileSync('prisma/migrations/20261014203000_fund_donation_currency/migration.sql', 'utf8'));
    await db.exec(readFileSync('prisma/migrations/20261014220000_fund_financial_state_guards/migration.sql', 'utf8'));
    await db.exec(readFileSync('prisma/migrations/20261014230000_fund_disclosure_confirmation/migration.sql', 'utf8'));
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
    ['empty label', { ...good, label: '' }],
    ['blank label', { ...good, label: '   ' }],
    ['oversized label', { ...good, label: 'x'.repeat(4097) }],
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
  it('preserves legacy appeal and inserts a valid approved giving-fund donation', async () => {
    const prior = (await db.query('SELECT "appealId", "designationSnapshot" FROM "Donation" WHERE "id"=$1', ['legacy'])).rows[0];
    await insertFundDonation('valid-fund');
    const row = (await db.query('SELECT "appealId", "fundId", "designationSnapshot" FROM "Donation" WHERE "id"=$1', ['valid-fund'])).rows[0];
    assert.equal(prior.appealId, 'synthetic-appeal');
    assert.equal(prior.designationSnapshot, null);
    assert.equal(row.appealId, null);
    assert.equal(row.fundId, 'fund-reviewed');
    assert.deepEqual(row.designationSnapshot, approvedFund);
  });

  for (const [description, snapshot, destination, intent] of [
    ['both destinations', approvedFund, { appealId: 'synthetic-appeal', fundId: 'fund-reviewed' }, 'GENERAL'],
    ['neither destination', null, { appealId: null, fundId: null }, 'GENERAL'],
    ['mismatched fund ID', { ...approvedFund, fundId: 'another-fund' }, { appealId: null, fundId: 'fund-reviewed' }, 'GENERAL'],
    ['stale review revision', { ...approvedFund, fundRevision: 3 }, { appealId: null, fundId: 'fund-reviewed' }, 'GENERAL'],
    ['unapproved Zakat intention', { ...approvedFund, givingIntent: 'ZAKAT' }, { appealId: null, fundId: 'fund-reviewed' }, 'ZAKAT'],
    ['changed approved purpose', { ...approvedFund, purpose: 'Different purpose after independent approval.' }, { appealId: null, fundId: 'fund-reviewed' }, 'GENERAL'],
    ['missing fund snapshot', null, { appealId: null, fundId: 'fund-reviewed' }, 'GENERAL'],
  ]) it('rejects '+ description + ' for fund-only payments', async () => {
    await assert.rejects(insertFundDonation('invalid-' + description.replaceAll(' ', '-'), snapshot, destination, intent),
      error => error.code === '23514');
  });

  it('rejects foreign currency on insertion and mutation of a domestic fund donation', async () => {
    await assert.rejects(insertFundDonation('foreign-currency', approvedFund,
      { appealId: null, fundId: 'fund-reviewed' }, 'GENERAL', 'USD'),
      error => error.code === '23514');
    await assert.rejects(db.query('UPDATE \"Donation\" SET \"currency\"=$1 WHERE \"id\"=$2', ['USD', 'valid-fund']),
      error => error.code === '23514');
  });

  it('blocks new donations after the approved fund is paused', async () => {
    await db.query('UPDATE "GivingFund" SET "status"=$1 WHERE "id"=$2', ['PAUSED', 'fund-reviewed']);
    try {
      await assert.rejects(insertFundDonation('paused-fund'), error => error.code === '23514');
    } finally {
      await db.query('UPDATE "GivingFund" SET "status"=$1 WHERE "id"=$2', ['APPROVED', 'fund-reviewed']);
    }
  });

  it('rejects changing an original fund designation after a capture', async () => {
    await assert.rejects(db.query('UPDATE "Donation" SET "fundId"=$1 WHERE "id"=$2', [null, 'valid-fund']),
      error => error.code === '23514');
    await db.query('UPDATE "Donation" SET "status"=$1 WHERE "id"=$2', ['CAPTURED', 'valid-fund']);
    const row = (await db.query('SELECT "fundId" FROM "Donation" WHERE "id"=$1', ['valid-fund'])).rows[0];
    assert.equal(row.fundId, 'fund-reviewed');
  });

  it('rejects invalid refund states and changes to original charge amount', async () => {
    for (const [status, refunded] of [['REFUNDED', 25], ['CREATED', 25], ['FAILED', 25]]) {
      await assert.rejects(db.query('UPDATE "Donation" SET "status"=$1, "refundedAmount"=$2 WHERE "id"=$3', [status, refunded, 'valid-fund']), error => error.code === '23514');
    }
    await assert.rejects(db.query('UPDATE "Donation" SET "amount"=300 WHERE "id"=$1', ['valid-fund']), error => error.code === '23514');
  });
  it('supports partial then full refund after fund closure without changing purpose', async () => {
    await db.query('UPDATE "GivingFund" SET "status"=$1 WHERE "id"=$2', ['CLOSED', 'fund-reviewed']);
    await db.query('UPDATE "Donation" SET "status"=$1, "refundedAmount"=$2 WHERE "id"=$3', ['CAPTURED', 25, 'valid-fund']);
    await db.query('UPDATE "Donation" SET "status"=$1, "refundedAmount"=$2 WHERE "id"=$3', ['REFUNDED', 250, 'valid-fund']);
    const row = (await db.query('SELECT "amount", "refundedAmount", "status", "designationSnapshot" FROM "Donation" WHERE "id"=$1', ['valid-fund'])).rows[0];
    assert.equal(Number(row.amount), 250); assert.equal(Number(row.refundedAmount), 250);
    assert.equal(row.status, 'REFUNDED'); assert.deepEqual(row.designationSnapshot, approvedFund);
  });

  it('does not fabricate disclosure acceptance on historical fund records', async () => {
    const row = (await db.query('SELECT "fundDisclosureConfirmedAt" FROM "Donation" WHERE "id"=$1', ['valid-fund'])).rows[0];
    assert.equal(row.fundDisclosureConfirmedAt, null);
    await assert.rejects(db.query('UPDATE "Donation" SET "fundDisclosureConfirmedAt"=NOW() WHERE "id"=$1', ['valid-fund']), error => error.code === '23514');
  });
  it('records and preserves confirmation at creation of a reviewed fund donation', async () => {
    await db.query('UPDATE "GivingFund" SET "status"=$1 WHERE "id"=$2', ['APPROVED', 'fund-reviewed']);
    await db.query('INSERT INTO "Donation" ("id", "referenceNumber", "fundId", "donorName", "donorEmail", "domesticConfirmedAt", "amount", "receiptTokenHash", "updatedAt", "designationSnapshot", "fundDisclosureConfirmedAt") VALUES ($1,$2,$3,$4,$5,NOW(),100,$6,NOW(),$7::jsonb,NOW())', ['confirmed-fund', 'SYNTHETIC-CONFIRMED', 'fund-reviewed', 'Synthetic donor', 'donor@example.invalid', 'synthetic-hash', JSON.stringify(approvedFund)]);
    await assert.rejects(db.query('UPDATE "Donation" SET "fundDisclosureConfirmedAt"=NULL WHERE "id"=$1', ['confirmed-fund']), error => error.code === '23514');
    await db.query('UPDATE "Donation" SET "status"=$1 WHERE "id"=$2', ['CAPTURED', 'confirmed-fund']);
    assert.notEqual((await db.query('SELECT "fundDisclosureConfirmedAt" FROM "Donation" WHERE "id"=$1', ['confirmed-fund'])).rows[0].fundDisclosureConfirmedAt, null);
  });

});
