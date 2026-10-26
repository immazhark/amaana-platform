import assert from "node:assert/strict";
import test from "node:test";
import {
  MOBILE_PROFILE,
  MOBILE_ROUTES,
  assertLocalProfileTarget,
  calculateClsSessionWindows,
  isAllowedProfileRequest,
  profileTraceName,
  reportBuildIdentity,
  summarizeMobileSamples,
} from "./mobile-profile-core.mjs";

const sample = (run, lcpMs, cls, blockingMs, route = "/impact") => ({
  run, lcpMs, cls, observedLongTaskBlockingMs: blockingMs,
  trace: `traces/${profileTraceName(route, run)}`,
});

test("local-only collector profile has four exact public paths and five Android-like runs", () => {
  assert.deepEqual(MOBILE_ROUTES, ["/", "/our-work", "/impact", "/donate"]);
  assert.equal(MOBILE_PROFILE.runs, 5);
  assert.equal(MOBILE_PROFILE.viewport.width, 390);
  assert.equal(MOBILE_PROFILE.cpuSlowdown, 4);
  assert.ok(MOBILE_PROFILE.network.downloadBytesPerSecond > 0);
  assert.ok(MOBILE_PROFILE.network.latencyMs > 0);
});

test("collector refuses remote, credentialed, redirected-base, or wrong-port targets", () => {
  assert.equal(assertLocalProfileTarget("http://127.0.0.1:3000"), "http://127.0.0.1:3000");
  for (const base of [
    "https://amaanafoundation.org", "http://localhost:3000", "http://127.0.0.1:3001",
    "http://127.0.0.1:3000@evil.test", "http://user:secret@127.0.0.1:3000",
    "http://127.0.0.1:3000/our-work", "http://127.0.0.1:3000/?token=1",
  ]) assert.throws(() => assertLocalProfileTarget(base), /local profile origin/);
});

test("cross-origin GET assets, scripts, redirects and posts are blocked before network use", () => {
  assert.equal(isAllowedProfileRequest("http://127.0.0.1:3000/_next/static/a.js"), true);
  for (const uri of [
    "https://cdn.example.invalid/image.jpg", "https://amaanafoundation.org/",
    "http://127.0.0.1:3001/", "http://evil.invalid/", "file:///etc/passwd",
  ]) assert.equal(isAllowedProfileRequest(uri), false);
});

test("CLS uses the largest session window, never an unwindowed sum", () => {
  const shifts = [
    { startTime: 100, value: .02 }, { startTime: 500, value: .03 },
    { startTime: 2_000, value: .08 }, { startTime: 2_200, value: .06 },
    { startTime: 8_000, value: .01 },
  ];
  expectApprox(calculateClsSessionWindows(shifts), .14);
  expectApprox(calculateClsSessionWindows([]), 0);
  expectApprox(calculateClsSessionWindows([
    { startTime: 100, value: .1 }, { startTime: 900, value: .1 },
    { startTime: 1_700, value: .1 }, { startTime: 2_500, value: .1 },
    { startTime: 3_300, value: .1 }, { startTime: 4_100, value: .1 },
    { startTime: 4_900, value: .1 }, { startTime: 5_200, value: .3 },
  ]), .7);
  for (const bad of [[{ startTime: -1, value: .1 }], [
    { startTime: 20, value: .1 }, { startTime: 10, value: .2 },
  ]]) assert.throws(() => calculateClsSessionWindows(bad));
});

function expectApprox(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `Expected ${actual} to equal ${expected}`);
}

test("source/runtime identity stays distinct and absent runtime SHA is unverified", () => {
  const sha = "a".repeat(40);
  assert.deepEqual(reportBuildIdentity(sha, null), { sourceSha: sha, runtimeSha: null, status: "RUNTIME_UNVERIFIED" });
  assert.deepEqual(reportBuildIdentity(sha, sha), { sourceSha: sha, runtimeSha: sha, status: "EXACT_SHA_MATCH" });
  assert.throws(() => reportBuildIdentity(sha, "b".repeat(40)), /mismatch/);
  assert.throws(() => reportBuildIdentity("wrong", null));
});

test("five-run median is deterministic and carries trace provenance without field-CWV claims", () => {
  const result = summarizeMobileSamples("/impact", [
    sample(3, 3000, .03, 60), sample(1, 2000, .01, 20),
    sample(5, 5000, .05, 100), sample(2, 1000, .02, 40), sample(4, 4000, .04, 80),
  ]);
  assert.equal(result.median.lcpMs, 3000);
  assert.equal(result.median.cls, .03);
  assert.equal(result.median.observedLongTaskBlockingMs, 60);
  assert.deepEqual(result.traces, [
    "traces/impact-run-1.zip", "traces/impact-run-2.zip", "traces/impact-run-3.zip",
    "traces/impact-run-4.zip", "traces/impact-run-5.zip",
  ]);
  assert.equal(result.ttiMs, null);
  assert.equal(result.fieldWebVitals, false);
  assert.equal(result.profileKind, "synthetic-chromium-emulation");
  assert.deepEqual(result.samples.map(item => item.lcpMs), [2000, 1000, 3000, 4000, 5000]);
  assert.equal(result.samples.length, MOBILE_PROFILE.runs);
});

test("missing LCP is reported unmeasured, not transformed to zero", () => {
  const result = summarizeMobileSamples("/", [
    sample(1, null, null, null, "/"), ...[2,3,4,5].map(i => sample(i, 2100, 0, 10, "/")),
  ]);
  assert.equal(result.median.lcpMs, null);
  assert.equal(result.median.cls, null);
  assert.equal(result.median.observedLongTaskBlockingMs, null);
  assert.deepEqual(result.unmeasured, ["lcpMs", "cls", "observedLongTaskBlockingMs"]);
});

test("invalid values, missing/duplicate runs, private paths and trace traversal fail closed", () => {
  const good = [1,2,3,4,5].map(i => sample(i, 2100, 0, 10, "/"));
  for (const bad of [
    good.slice(0, 4),
    [...good.slice(0, 4), sample(4, 2100, 0, 10)],
    good.map((s, i) => i === 0 ? { ...s, lcpMs: -1 } : s),
    good.map((s, i) => i === 0 ? { ...s, cls: Number.NaN } : s),
    good.map((s, i) => i === 0 ? { ...s, trace: "../../private.zip" } : s),
    good.map((s, i) => i === 0 ? { ...s, trace: "traces/home-run-2.zip" } : s),
  ]) assert.throws(() => summarizeMobileSamples("/", bad));
  assert.throws(() => summarizeMobileSamples("/admin", good));
  assert.throws(() => profileTraceName("/admin", 1));
  assert.throws(() => profileTraceName("/", 6));
  assert.equal(profileTraceName("/our-work", 2), "our-work-run-2.zip");
});
