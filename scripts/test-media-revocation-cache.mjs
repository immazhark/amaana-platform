import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// AF-N22: withdrawn public media must stop being served within a bounded time. The managed media
// route sets the source cache policy; the Next image optimizer caches optimized output for
// max(upstream max-age, images.minimumCacheTTL). The optimizer floor therefore must never exceed
// the edge window, or an optimizer entry could outlive the approval it was created under.
const ROOT = new URL("../", import.meta.url).pathname.replace(/^[/]([A-Za-z]:)/, "$1");
const read = (file) => readFileSync(`${ROOT}${file}`, "utf8");

export function optimizerFloorSeconds(config) {
  const match = config.match(/minimumCacheTTL\s*:\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

export function routeCachePolicy(source) {
  const match = source.match(/"Cache-Control":\s*"public,\s*max-age=(\d+),\s*s-maxage=(\d+)[^"]*"/);
  return match ? { maxAge: Number(match[1]), sMaxAge: Number(match[2]) } : null;
}

test("the helpers read the optimizer floor and the route cache policy", () => {
  assert.equal(optimizerFloorSeconds("images: { minimumCacheTTL: 60 }"), 60);
  assert.equal(optimizerFloorSeconds("images: {}"), null);
  assert.deepEqual(routeCachePolicy('"Cache-Control": "public, max-age=60, s-maxage=300, must-revalidate"'), { maxAge: 60, sMaxAge: 300 });
  assert.equal(routeCachePolicy('"Cache-Control": "no-store"'), null);
});

test("the optimizer floor cannot outlive the managed media edge window", () => {
  const floor = optimizerFloorSeconds(read("next.config.ts"));
  const policy = routeCachePolicy(read("src/app/media/[year]/[filename]/route.ts"));
  assert.notEqual(floor, null, "next.config.ts must set images.minimumCacheTTL explicitly");
  assert.ok(policy, "the managed media route must declare a bounded public cache policy");
  assert.ok(policy.maxAge <= 300 && policy.sMaxAge <= 300, `managed media cache must stay within five minutes, got ${JSON.stringify(policy)}`);
  assert.ok(floor <= policy.sMaxAge, `optimizer floor ${floor}s must not exceed the ${policy.sMaxAge}s edge window`);
});

test("the managed media route only serves assets that are both public and privacy-approved", () => {
  const source = read("src/app/media/[year]/[filename]/route.ts");
  assert.match(source, /isPublic:\s*true/);
  assert.match(source, /privacyApprovedAt:\s*\{\s*not:\s*null\s*\}/);
});
