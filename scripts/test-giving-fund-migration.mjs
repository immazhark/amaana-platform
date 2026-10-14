// Optional isolated PostgreSQL-WASM harness; no network database or real records.
// Set PGLITE_MODULE_PATH to a separately installed @electric-sql/pglite/dist/index.js.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, describe, it } from "node:test";

const runtime = process.env.PGLITE_MODULE_PATH;
let db;
let temp;
let oldDonation;
let oldRefunds;
let count = 0;
const columns = ["id", "slug", "name", "purpose", "disclosure", "accountCode", "acceptedIntents", "createdById", "lastEditedById", "updatedAt"];
async function insertFund(changes = {}) {
  const id = `synthetic-${++count}`;
  const row = { id, slug: id, name: "Synthetic private fund", purpose: "Synthetic reviewed purpose for database verification.", disclosure: "Synthetic donor disclosure for database verification.", accountCode: `TEST-${count}`, acceptedIntents: ["GENERAL"], createdById: "creator", lastEditedById: "editor", updatedAt: new Date(), ...changes };
  const keys = [...columns, ...Object.keys(changes).filter(key => !columns.includes(key))];
  const values = keys.map(key => key === "acceptedIntents" && Array.isArray(row[key])
    ? `{${row[key].map(intent => JSON.stringify(intent)).join(",")}}`
    : row[key]);
  return db.query(`INSERT INTO "GivingFund" (${keys.map(key => `"${key}"`).join(",")}) VALUES (${keys.map((_, index) => `$${index + 1}`).join(",")}) RETURNING *`, values);
}

describe("private fund additive migration on isolated PostgreSQL-WASM", { skip: !runtime }, () => {
  before(async () => {
    const { PGlite } = await import(pathToFileURL(runtime).href);
    db = new PGlite();
    temp = mkdtempSync(join(tmpdir(), "amaana-fund-sql-"));
    const priorSchema = join(temp, "schema.prisma");
    writeFileSync(priorSchema, execFileSync("git", ["show", "b62993963b81636daaf32b7813effec60662be4a:prisma/schema.prisma"]));
    const baseSql = execFileSync("node_modules/.bin/prisma", ["migrate", "diff", "--from-empty", "--to-schema-datamodel", priorSchema, "--script"], { encoding: "utf8" });
    await db.exec(baseSql);
    await db.exec(`
      INSERT INTO "User" ("id", "name", "email", "updatedAt") VALUES
        ('creator', 'Synthetic creator', 'creator@example.invalid', CURRENT_TIMESTAMP),
        ('editor', 'Synthetic editor', 'editor@example.invalid', CURRENT_TIMESTAMP),
        ('approver', 'Synthetic approver', 'approver@example.invalid', CURRENT_TIMESTAMP);
      INSERT INTO "Role" ("id", "name", "updatedAt") VALUES
        ('primary', 'PRIMARY_APPROVER', CURRENT_TIMESTAMP),
        ('backup', 'BACKUP_APPROVER', CURRENT_TIMESTAMP),
        ('reviewer', 'REVIEWER', CURRENT_TIMESTAMP);
      INSERT INTO "Appeal" ("id", "slug", "title", "summary", "story", "category", "beneficiaryName", "goalAmount", "amountRaised", "createdById", "updatedAt")
        VALUES ('synthetic-appeal', 'synthetic-appeal', 'Synthetic title', 'Synthetic summary', 'Synthetic story', 'OTHER', 'Synthetic private fixture', 1000, 248.25, 'creator', CURRENT_TIMESTAMP);
      INSERT INTO "Donation" ("id", "referenceNumber", "appealId", "donorName", "donorEmail", "domesticConfirmedAt", "amount", "refundedAmount", "status", "receiptTokenHash", "updatedAt")
        VALUES ('synthetic-donation', 'SYNTHETIC-REFERENCE', 'synthetic-appeal', 'Synthetic donor', 'donor@example.invalid', CURRENT_TIMESTAMP, 250.50, 2.25, 'CAPTURED', 'synthetic-test-hash', CURRENT_TIMESTAMP);
      INSERT INTO "RefundLedger" ("providerRefundId", "providerPaymentId", "donationId", "amount", "currency")
        VALUES ('rfnd_synthetic', 'pay_synthetic', 'synthetic-donation', 2.25, 'INR');
    `);
    oldDonation = (await db.query('SELECT * FROM "Donation"')).rows;
    oldRefunds = (await db.query('SELECT * FROM "RefundLedger"')).rows;
    await db.exec(readFileSync("prisma/migrations/20261014103000_private_giving_fund_registry/migration.sql", "utf8"));
  });
  after(async () => { if (db) await db.close(); if (temp) rmSync(temp, { recursive: true, force: true }); });

  it("leaves existing capture/refund rows exactly unchanged and seeds no funds", async () => {
    assert.deepEqual((await db.query('SELECT * FROM "Donation"')).rows, oldDonation);
    assert.deepEqual((await db.query('SELECT * FROM "RefundLedger"')).rows, oldRefunds);
    assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM "GivingFund"')).rows[0].count, 0);
  });
  it("creates only a private draft by default", async () => {
    const result = await insertFund();
    assert.equal(result.rows[0].status, "DRAFT");
    assert.equal(result.rows[0].approvedAt, null);
  });
  for (const [name, changes] of [
    ["foreign currency", { currency: "USD" }],
    ["empty intents", { acceptedIntents: [] }],
    ["null intents", { acceptedIntents: null }],
    ["unreviewed Zakat", { acceptedIntents: ["ZAKAT"] }],
    ["duplicate intents", { acceptedIntents: ["GENERAL", "GENERAL"] }],
    ["negative revision", { revision: -1 }],
    ["approval without reviewer", { status: "APPROVED" }],
    ["creator self-approval", { status: "APPROVED", approvedById: "creator", approvedAt: new Date() }],
    ["last editor self-approval", { status: "APPROVED", approvedById: "editor", approvedAt: new Date() }],
    ["stale approval on draft", { approvedById: "approver", approvedAt: new Date() }],
  ]) it(`rejects ${name} at the database boundary`, async () => {
    await assert.rejects(insertFund(changes), error => ["23514", "23502"].includes(error.code));
  });
  it("permits independently approved supported intent definitions and rejects a stale claim", async () => {
    const result = await insertFund({ acceptedIntents: ["GENERAL", "SADAQAH"], status: "APPROVED", approvedById: "approver", approvedAt: new Date() });
    const id = result.rows[0].id;
    const sql = 'UPDATE "GivingFund" SET "status" = \'PAUSED\', "revision" = "revision" + 1 WHERE "id"=$1 AND "revision"=0 AND "status"=\'APPROVED\' RETURNING "id"';
    assert.equal((await db.query(sql, [id])).rows.length, 1);
    assert.equal((await db.query(sql, [id])).rows.length, 0);
  });
  it("grants review staff drafting permission but never approval", async () => {
    const rows = (await db.query('SELECT r."name", p."key" FROM "RolePermission" rp JOIN "Role" r ON r."id"=rp."roleId" JOIN "Permission" p ON p."id"=rp."permissionId" ORDER BY r."name",p."key"')).rows;
    assert.deepEqual(rows.filter(row => row.name === "REVIEWER").map(row => row.key), ["fund.manage", "fund.view"]);
    for (const role of ["PRIMARY_APPROVER", "BACKUP_APPROVER"]) assert.deepEqual(rows.filter(row => row.name === role).map(row => row.key), ["fund.approve", "fund.manage", "fund.view"]);
  });
});
