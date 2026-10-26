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
  };
}
