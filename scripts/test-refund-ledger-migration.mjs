import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const url = new URL(process.env.DATABASE_URL);
assert(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && url.pathname === "/amaana",
  "Migration tests require isolated loopback amaana DB");
const migration = readFileSync(new URL("../prisma/migrations/20260923010000_refund_entity_ledger/migration.sql", import.meta.url), "utf8");
const args = ["-X", "-v", "ON_ERROR_STOP=1", "-h", url.hostname, "-p", url.port || "5432",
  "-U", decodeURIComponent(url.username), "-d", "amaana"];
function sql(input) {
  return spawnSync("psql", args, {
    input, encoding: "utf8",
    env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) },
  });
}
const entity = { id: "rfnd_legacy1", payment_id: "pay_legacy1", amount: 2500, currency: "INR" };
const cases = [
  { name: "sanitized and original audit envelopes", valid: true, records: [{ refund: entity }, { payload: { refund: { entity } } }] },
  { name: "incomplete identity fails closed", valid: false, records: [{ refund: { ...entity, id: "" } }] },
  { name: "conflicting identity fails closed", valid: false, records: [{ refund: entity }, { refund: { ...entity, amount: 3000 } }] },
];
for (const scenario of cases) {
  const schema = "refund_upgrade_" + randomUUID().replaceAll("-", "");
  assert(/^refund_upgrade_[a-f0-9]{32}$/.test(schema));
  const scope = `SET search_path TO "${schema}";\n`;
  const setup = sql(`CREATE SCHEMA "${schema}";
    ${scope}
    CREATE TABLE "Donation" ("id" TEXT PRIMARY KEY, "refundedAmount" NUMERIC NOT NULL);
    CREATE TABLE "PaymentEvent" ("donationId" TEXT, "eventType" TEXT, "payload" JSONB, "processedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO "Donation" VALUES ('synthetic', 25);
    ${scenario.records.map(payload => `INSERT INTO "PaymentEvent" ("donationId", "eventType", "payload") VALUES ('synthetic', 'refund.processed', '${JSON.stringify(payload)}'::jsonb);`).join("\n")}
  `);
  assert.equal(setup.status, 0, "Synthetic fixture setup failed");
  try {
    const result = sql(scope + migration);
    assert.equal(result.status === 0, scenario.valid, scenario.name + ": " + result.stderr);
    if (scenario.valid) {
      const check = sql(scope + `DO $$ BEGIN
        IF (SELECT COUNT(*) FROM "RefundLedger") <> 1 OR
           (SELECT "amount" FROM "RefundLedger") <> 25 OR
           (SELECT "refundedAmount" FROM "Donation") <> 25
        THEN RAISE EXCEPTION 'Backfill changed accounting or failed to deduplicate'; END IF;
      END $$;`);
      assert.equal(check.status, 0, check.stderr);
    } else {
      const check = sql(scope + `DO $$ BEGIN
        IF to_regclass('"RefundLedger"') IS NOT NULL
        THEN RAISE EXCEPTION 'Failed upgrade did not roll back'; END IF;
      END $$;`);
      assert.equal(check.status, 0, check.stderr);
    }
    console.log("PASS:", scenario.name);
  } finally {
    // Only the UUID-named synthetic schema created above can be removed.
    const cleanup = sql(`DROP SCHEMA "${schema}" CASCADE;`);
    assert.equal(cleanup.status, 0, "Synthetic schema cleanup failed");
  }
}

