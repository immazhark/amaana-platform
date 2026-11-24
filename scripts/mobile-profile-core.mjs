/** Synthetic Chromium profiling contract. These are not Android or field Web Vitals. */
export const MOBILE_ROUTES = Object.freeze(["/", "/our-work", "/impact", "/donate"]);
export const MOBILE_PROFILE = Object.freeze({
  runs: 5,
  viewport: Object.freeze({ width: 390, height: 844 }),
  deviceScaleFactor: 2,
  cpuSlowdown: 4,
  network: Object.freeze({
    latencyMs: 150,
    downloadBytesPerSecond: 200_000,
    uploadBytesPerSecond: 93_750,
  }),
  settleMs: 1_500,
});

const localOrigin = "http://127.0.0.1:3000";

export function assertLocalProfileTarget(value) {
  if (value !== localOrigin) {
    throw new Error("Only the fixed local profile origin is permitted");
  }
  return localOrigin;
}

export function isAllowedProfileRequest(rawUrl, method = "GET") {
  try {
    const url = new URL(rawUrl);
    // Read-only tracing is limited to public local paths. Decode once and
    // reject ambiguous/double-encoded paths rather than recording private data.
    const pathname = decodeURIComponent(url.pathname);
    const privatePath = /^(?:\/admin|\/documents|\/donations|\/api\/(?:admin|ops|cron|webhooks|donations|assistance|giving-reminder|jobs)|\/request-assistance\/(?:status|received))(?:\/|$)/i.test(pathname);
    if (privatePath || pathname.includes("\\") || pathname.includes("//") ||
        /%[0-9a-f]{2}/i.test(pathname)) return false;
    // A localhost URL is not proof that an API is safe to read: prevent
    // tracing private records or token-bearing requests to unknown endpoints.
    if (/^\/api(?:\/|$)/i.test(pathname) &&
        (!new Set(["/api/health/ready", "/api/health/version", "/api/analytics/page-view", "/api/public/live-rail"]).has(pathname) ||
          url.search || url.hash)) return false;
    // Next's image optimizer is a same-origin proxy. Keep its source local
    // and public rather than fetching a third-party/private URL via localhost.
    if (pathname === "/_next/image") {
      const keys = [...url.searchParams.keys()];
      const source = url.searchParams.get("url");
      const width = url.searchParams.get("w") ?? "";
      const quality = url.searchParams.get("q") ?? "";
      if (keys.length !== 3 || ["url", "w", "q"].some(key => url.searchParams.getAll(key).length !== 1) ||
          !source || !/^\/(?!\/)[A-Za-z0-9_./-]+\.(?:avif|gif|jpe?g|png|webp)$/i.test(source) ||
          source.split("/").some(segment => segment === "." || segment === "..") ||
          /^\/(?:admin|api|documents|donations|request-assistance\/(?:status|received))(?:\/|$)/i.test(source) ||
          !/^\d{1,4}$/.test(width) || !/^(?:[1-9]|[1-9]\d|100)$/.test(quality) || url.hash) return false;
    }
    // Profiling may fetch local content but must never forward a write method,
    // even if the target is the approved synthetic localhost origin.
    return (method === "GET" || method === "HEAD") &&
      url.protocol === "http:" && url.origin === localOrigin &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

export function assertSyntheticProfileRuntime(runtime) {
  if (!runtime || typeof runtime !== "object" || Array.isArray(runtime) ||
      runtime.status !== "ok" ||
      !["staging", "development", "test"].includes(runtime.environment) ||
      !["test", "unconfigured"].includes(runtime.paymentMode)) {
    throw new Error("Local runtime is not a verified non-production synthetic profile target");
  }
}

export function reportBuildIdentity(sourceSha, runtimeSha) {
  if (typeof sourceSha !== "string" || !/^[a-f0-9]{40}$/.test(sourceSha)) {
    throw new Error("A full source commit SHA is required");
  }
  if (runtimeSha === null) {
    return { sourceSha, runtimeSha: null, status: "RUNTIME_UNVERIFIED" };
  }
  if (typeof runtimeSha !== "string" || !/^[a-f0-9]{40}$/.test(runtimeSha) || runtimeSha !== sourceSha) {
    throw new Error("Local runtime/source SHA mismatch");
  }
  return { sourceSha, runtimeSha, status: "EXACT_SHA_MATCH" };
}

/** Chromium LayoutShift entries excluding recent-input shifts; maximum session-window CLS. */
export function calculateClsSessionWindows(shifts) {
  if (!Array.isArray(shifts) || shifts.length > 10_000) throw new Error("Invalid layout-shift entries");
  let max = 0;
  let value = 0;
  let sessionStart = -1;
  let previousTime = -1;
  for (const shift of shifts) {
    if (!shift || typeof shift !== "object" || Array.isArray(shift) ||
        Object.keys(shift).length !== 2 || !Object.hasOwn(shift, "startTime") ||
        !Object.hasOwn(shift, "value") ||
        typeof shift.startTime !== "number" || !Number.isFinite(shift.startTime) ||
        shift.startTime < 0 || shift.startTime < previousTime ||
        typeof shift.value !== "number" || !Number.isFinite(shift.value) ||
        shift.value < 0) {
      throw new Error("Invalid or unsorted layout-shift entry");
    }
    if (sessionStart < 0 || shift.startTime - previousTime >= 1_000 || shift.startTime - sessionStart >= 5_000) {
      value = shift.value;
      sessionStart = shift.startTime;
    } else {
      value += shift.value;
    }
    if (!Number.isFinite(value)) throw new Error("Invalid CLS session score");
    previousTime = shift.startTime;
    max = Math.max(max, value);
  }
  return max;
}

function assertRoute(route) {
  if (!MOBILE_ROUTES.includes(route)) throw new Error("An approved public profile route is required");
}

export function profileTraceName(route, run) {
  assertRoute(route);
  if (!Number.isInteger(run) || run < 1 || run > MOBILE_PROFILE.runs) {
    throw new Error("Invalid trace run number");
  }
  const slug = route === "/" ? "home" : route.slice(1);
  return `${slug}-run-${run}.zip`;
}

function strictMetric(name, value, allowNull, positive = false) {
  if (allowNull && value === null) return;
  if (typeof value !== "number" || !Number.isFinite(value) || (positive ? value <= 0 : value < 0)) {
    throw new Error("Invalid synthetic metric: " + name);
  }
}

function median(values) {
  if (values.includes(null)) return null;
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

export function summarizeMobileSamples(route, samples) {
  assertRoute(route);
  if (!Array.isArray(samples) || samples.length !== MOBILE_PROFILE.runs) {
    throw new Error("Every route requires five independent samples");
  }
  const runs = new Set();
  const allowed = ["run", "lcpMs", "cls", "observedLongTaskBlockingMs", "trace"];
  for (const sample of samples) {
    if (!sample || typeof sample !== "object" || Array.isArray(sample) ||
        Object.keys(sample).some(key => !allowed.includes(key)) ||
        allowed.some(key => !Object.hasOwn(sample, key))) {
      throw new Error("Invalid or unexpected synthetic sample fields");
    }
    if (!Number.isInteger(sample.run) || sample.run < 1 || sample.run > MOBILE_PROFILE.runs || runs.has(sample.run)) {
      throw new Error("Invalid or duplicate mobile profile run");
    }
    runs.add(sample.run);
    strictMetric("lcpMs", sample.lcpMs, true, true);
    strictMetric("cls", sample.cls, true);
    strictMetric("observedLongTaskBlockingMs", sample.observedLongTaskBlockingMs, true);
    if (sample.trace !== `traces/${profileTraceName(route, sample.run)}`) {
      throw new Error("Invalid trace path");
    }
  }
  const ordered = [...samples].sort((a, b) => a.run - b.run);
  const metrics = ["lcpMs", "cls", "observedLongTaskBlockingMs"];
  const medians = Object.fromEntries(metrics.map(key => [key, median(ordered.map(sample => sample[key]))]));
  return {
    route,
    profileKind: "synthetic-chromium-emulation",
    fieldWebVitals: false,
    ttiMs: null,
    sampleCount: ordered.length,
    median: medians,
    unmeasured: metrics.filter(key => medians[key] === null),
    traces: ordered.map(sample => sample.trace),
    samples: ordered.map(sample => ({
      run: sample.run,
      lcpMs: sample.lcpMs,
      cls: sample.cls,
      observedLongTaskBlockingMs: sample.observedLongTaskBlockingMs,
      trace: sample.trace,
    })),
  };
}

export const RESOURCE_TIMING_LIMIT = 4096;

/** Aggregate observed browser resource entries only; no URLs or identifiers. */
export function summarizeResourceTimings(entries) {
  if (entries === null) return null;
  const invalid = () => { throw new Error("Invalid resource timing sample"); };
  if (!Array.isArray(entries) || entries.length >= RESOURCE_TIMING_LIMIT) invalid();
  const totals = {
    entryCount: entries.length, transferBytes: 0, encodedBodyBytes: 0,
    zeroTransferEntries: 0, imageInitiatorCount: 0,
    imageInitiatorTransferBytes: 0, imageInitiatorEncodedBodyBytes: 0,
  };
  const add = (key, value) => {
    totals[key] += value;
    if (!Number.isSafeInteger(totals[key])) invalid();
  };
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        Object.keys(entry).length !== 3 ||
        !["initiatorType", "transferSize", "encodedBodySize"].every(key => Object.hasOwn(entry, key)) ||
        typeof entry.initiatorType !== "string" ||
        !Number.isSafeInteger(entry.transferSize) || entry.transferSize < 0 ||
        !Number.isSafeInteger(entry.encodedBodySize) || entry.encodedBodySize < 0) invalid();
    add("transferBytes", entry.transferSize);
    add("encodedBodyBytes", entry.encodedBodySize);
    if (entry.transferSize === 0) totals.zeroTransferEntries++;
    if (entry.initiatorType === "img") {
      totals.imageInitiatorCount++;
      add("imageInitiatorTransferBytes", entry.transferSize);
      add("imageInitiatorEncodedBodyBytes", entry.encodedBodySize);
    }
  }
  return totals;
}
