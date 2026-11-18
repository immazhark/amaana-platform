import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// RFC 9116 security.txt. Expires must stay in the future: when this fails, renew the date.
const text = readFileSync(new URL("../public/.well-known/security.txt", import.meta.url), "utf8");
const field = (name) => text.split(/\r?\n/).filter((line) => line.toLowerCase().startsWith(`${name.toLowerCase()}:`)).map((line) => line.slice(name.length + 1).trim());

test("security.txt names a mailto contact and the canonical URL", () => {
  assert.deepEqual(field("Contact"), ["mailto:amaanafoundation24@gmail.com"]);
  assert.deepEqual(field("Canonical"), ["https://amaanafoundation.org/.well-known/security.txt"]);
});

test("security.txt has exactly one Expires that is in the future and within a year", () => {
  const [expires, ...rest] = field("Expires");
  assert.equal(rest.length, 0);
  const at = Date.parse(expires ?? "");
  assert.ok(Number.isFinite(at), "Expires must be an ISO 8601 date");
  assert.ok(at > Date.now(), "security.txt has expired; renew Expires");
  assert.ok(at - Date.now() <= 366 * 24 * 3600 * 1000, "Expires must be at most one year ahead");
});
