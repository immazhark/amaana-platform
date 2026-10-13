import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (process.env.AMAANA_DATABASE_TESTS !== "true")
  throw new Error("Only run with the isolated database test flag");
const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
assert(["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname)
  && databaseUrl.pathname === "/amaana",
  "Use only the isolated loopback amaana database");
const migration = readFileSync(new URL("../prisma/migrations/20261013000000_anonymize_historical_public_pageviews/migration.sql", import.meta.url), "utf8");
const schema = "historical_pv_" + randomUUID().replaceAll("-", "");
assert(/^historical_pv_[a-f0-9]{32}$/.test(schema));

const args = ["-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-h", databaseUrl.hostname,
  "-p", databaseUrl.port || "5432", "-U", decodeURIComponent(databaseUrl.username),
  "-d", "amaana"];
function sql(input) {
  return spawnSync("psql", args, {
    input, encoding: "utf8",
    env: { ...process.env, PGPASSWORD: decodeURIComponent(databaseUrl.password) },
  });
}
function succeed(input, purpose) {
  const output = sql(input);
  assert.equal(output.status, 0, purpose + ": " + output.stderr);
  return output.stdout;
}
const scope = `SET search_path TO "${schema}";\n`;
try {
  succeed(`CREATE SCHEMA "${schema}";`, "create isolated probe schema");
  succeed(scope + `
    CREATE TABLE "DailyPageView" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "path" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "views" INTEGER NOT NULL DEFAULT 0,
      UNIQUE ("path", "date")
    );
    INSERT INTO "DailyPageView" ("id", "path", "date", "views") VALUES
      ('1', '/appeals/first-person', '2026-09-30', 2),
      ('2', '/appeals/second-person', '2026-09-30', 3),
      ('3', '/appeals/:slug', '2026-09-30', 5),
      ('4', '/stories/individual-story', '2026-09-30', 7),
      ('5', '/our-work/eid-gift-kits-2026', '2026-09-30', 11),
      ('6', '/appeals/first-person', '2026-10-01', 13),
      ('7', '/about', '2026-09-30', 17),
      ('8', '/stories/nested/detail', '2026-09-30', 19);
  `, "seed synthetic counters");

  const read = () => {
    const output = succeed(scope + `
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.path,t.day), '[]'::json)
      FROM (SELECT "path" AS path, "date"::date AS day, "views" AS views FROM "DailyPageView") t;
    `, "read synthetic aggregates");
    return JSON.parse(output.trim().split("\n").find(line => line.startsWith("[")) ?? "[]");
  };
  const expected = new Map([
    ["/appeals/:slug|2026-09-30", 10],
    ["/appeals/:slug|2026-10-01", 13],
    ["/stories/:slug|2026-09-30", 7],
    ["/our-work/:slug|2026-09-30", 11],
    ["/about|2026-09-30", 17],
    // Nonconforming legacy paths are retained for explicit privacy review.
    ["/stories/nested/detail|2026-09-30", 19],
  ]);
  for (const iteration of [1, 2]) {
    succeed(scope + migration, `execute migration iteration ${iteration}`);
    const rows = read();
    assert.deepEqual(new Map(rows.map(row => [row.path + "|" + row.day, row.views])), expected);
    assert.equal(rows.reduce((sum, row) => sum + row.views, 0), 77);
  }

  // Aggregate overflow must roll back, leaving every original source row.
  succeed(scope + `
    INSERT INTO "DailyPageView" ("id", "path", "date", "views") VALUES
      ('overflow1', '/appeals/new-one', '2026-10-02', 2147483640),
      ('overflow2', '/appeals/new-two', '2026-10-02', 50);
  `, "seed overflow guard");
  const rejected = sql(scope + migration);
  assert.notEqual(rejected.status, 0, "Overflow must abort the transaction");
  const unchanged = read();
  assert.ok(unchanged.some(row => row.path === "/appeals/new-one" && row.views === 2147483640));
  assert.ok(unchanged.some(row => row.path === "/appeals/new-two" && row.views === 50));
  assert.equal(unchanged.filter(row => row.path === "/appeals/:slug" && row.day === "2026-10-02").length, 0);
  console.log("PASS: historical pageview totals, daily grouping, idempotence and overflow rollback");
} finally {
  const removed = sql(`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
  assert.equal(removed.status, 0, "Remove only this isolated test schema");
}
