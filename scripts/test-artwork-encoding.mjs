import assert from "node:assert/strict";
import { test } from "node:test";
import { encodeArtworkWithinBudget } from "./artwork-encoding.mjs";
import { MAX_ARTWORK_BYTES } from "./check-public-image-weight.mjs";

test("preserves the preferred bytes without extra encodes when already within budget", async () => {
  const bytes = Buffer.from("synthetic image bytes");
  const calls = [];
  const result = await encodeArtworkWithinBudget(async quality => { calls.push(quality); return bytes; });
  assert.equal(result.encoded, bytes);
  assert.equal(result.quality, 88);
  assert.deepEqual(calls, [88]);
});

test("accepts the exact existing byte cap", async () => {
  const bytes = Buffer.alloc(MAX_ARTWORK_BYTES);
  assert.equal((await encodeArtworkWithinBudget(async () => bytes)).encoded, bytes);
});

test("rejects one byte above the cap and selects the first fitting fallback", async () => {
  const calls = [];
  const result = await encodeArtworkWithinBudget(async quality => {
    calls.push(quality);
    return Buffer.alloc(quality === 88 ? MAX_ARTWORK_BYTES + 1 : MAX_ARTWORK_BYTES);
  });
  assert.deepEqual(calls, [88, 86]);
  assert.equal(result.quality, 86);
  assert.equal(result.encoded.length, MAX_ARTWORK_BYTES);
});

test("keeps searching when an encoder's sizes are not monotonic", async () => {
  const calls = [];
  const result = await encodeArtworkWithinBudget(async quality => {
    calls.push(quality);
    return Buffer.alloc(quality === 84 ? MAX_ARTWORK_BYTES - 1 : MAX_ARTWORK_BYTES + calls.length);
  });
  assert.deepEqual(calls, [88, 86, 84]);
  assert.equal(result.quality, 84);
});

test("fails after bounded attempts rather than writing an oversized or arbitrarily degraded image", async () => {
  const calls = [];
  await assert.rejects(encodeArtworkWithinBudget(async quality => {
    calls.push(quality);
    return Buffer.alloc(MAX_ARTWORK_BYTES + 1);
  }), /exceeds the 409600-byte cap/);
  assert.equal(calls.length, 7);
  assert.equal(calls.at(-1), 76);
});

for (const invalid of [Buffer.alloc(0), new Uint8Array(1), null, "not image bytes"]) {
  test("fails immediately for an invalid encoder result " + String(invalid), async () => {
    let calls = 0;
    await assert.rejects(encodeArtworkWithinBudget(async () => { calls += 1; return invalid; }), /empty or invalid/);
    assert.equal(calls, 1);
  });
}

test("preserves encoder failures without retrying a broken operation", async () => {
  const error = new Error("Synthetic encoder failure");
  let calls = 0;
  await assert.rejects(encodeArtworkWithinBudget(async () => { calls += 1; throw error; }), failure => failure === error);
  assert.equal(calls, 1);
});

test("rejects a missing encoder", async () => {
  await assert.rejects(encodeArtworkWithinBudget(null), /encoder is required/);
});
