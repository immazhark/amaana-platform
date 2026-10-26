/**
 * Explicit, local-only AF-R048 synthetic Chromium run:
 *   Local production server at http://127.0.0.1:3000
 *   npm run profile:mobile
 * The report is NOT real-device, field p75, INP, TTI or standard TBT evidence.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  MOBILE_PROFILE, MOBILE_ROUTES, assertLocalProfileTarget,
  calculateClsSessionWindows, isAllowedProfileRequest,
  profileTraceName, reportBuildIdentity, summarizeMobileSamples,
} from "./mobile-profile-core.mjs";

const localOrigin = assertLocalProfileTarget("http://127.0.0.1:3000");

async function profileOne(chromium, route, run, artifactDirectory) {
  const browser = await chromium.launch({ headless: true });
  let context;
  let tracingStarted = false;
  const trace = `traces/${profileTraceName(route, run)}`;
  try {
    context = await browser.newContext({
      viewport: MOBILE_PROFILE.viewport,
      deviceScaleFactor: MOBILE_PROFILE.deviceScaleFactor,
      isMobile: true,
      hasTouch: true,
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: MOBILE_PROFILE.network.latencyMs,
      downloadThroughput: MOBILE_PROFILE.network.downloadBytesPerSecond,
      uploadThroughput: MOBILE_PROFILE.network.uploadBytesPerSecond,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: MOBILE_PROFILE.cpuSlowdown });
    const blockedOrigins = new Set();
    await page.route("**/*", async intercepted => {
      const request = intercepted.request();
      const url = new URL(request.url());
      if (!isAllowedProfileRequest(request.url())) {
        blockedOrigins.add(url.origin);
        await intercepted.abort("blockedbyclient");
        return;
      }
      if (url.origin === localOrigin && url.pathname === "/api/analytics/page-view") {
        await intercepted.fulfill({ status: 204, body: "" });
        return;
      }
      await intercepted.continue();
    });
    await page.addInitScript(() => {
      const captured = { lcpMs: null, layoutShifts: null, observedLongTaskBlockingMs: null };
      Object.defineProperty(window, "__amaanaMobileProfile", { value: captured });
      try {
        new PerformanceObserver(list => {
          const latest = list.getEntries().at(-1);
          if (latest) captured.lcpMs = latest.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch { /* Unsupported performance entry remains explicitly unmeasured. */ }
      try {
        captured.layoutShifts = [];
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              captured.layoutShifts.push({ startTime: entry.startTime, value: entry.value });
            }
          }
        }).observe({ type: "layout-shift", buffered: true });
      } catch { captured.layoutShifts = null; }
      try {
        captured.observedLongTaskBlockingMs = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            captured.observedLongTaskBlockingMs += Math.max(0, entry.duration - 50);
          }
        }).observe({ type: "longtask", buffered: true });
      } catch { captured.observedLongTaskBlockingMs = null; }
    });
    // No screenshots or DOM snapshots: trace references remain private and local.
    await context.tracing.start({ screenshots: false, snapshots: false });
    tracingStarted = true;
    const response = await page.goto(localOrigin + route, { waitUntil: "load", timeout: 60_000 });
    if (!response?.ok() || new URL(page.url()).origin !== localOrigin ||
        new URL(response.url()).origin !== localOrigin ||
        new URL(page.url()).pathname !== route || new URL(response.url()).pathname !== route) {
      throw new Error("Local route navigation failed or left the fixed local origin: " + route);
    }
    await page.waitForTimeout(MOBILE_PROFILE.settleMs);
    if (blockedOrigins.size > 0) {
      throw new Error("Local profile refused intercepted cross-origin HTTP resources; use a reviewed isolated media fixture");
    }
    const metrics = await page.evaluate(() => window.__amaanaMobileProfile);
    const cls = metrics.layoutShifts === null ? null : calculateClsSessionWindows(metrics.layoutShifts);
    return { run, lcpMs: metrics.lcpMs, cls,
      observedLongTaskBlockingMs: metrics.observedLongTaskBlockingMs, trace };
  } finally {
    try {
      if (tracingStarted) {
        await context.tracing.stop({ path: join(artifactDirectory, trace) });
      }
    } finally {
      try {
        if (context) await context.close();
      } finally {
        await browser.close();
      }
    }
  }
}

export async function collectMobileProfile() {
  if (process.env.AMAANA_MOBILE_PROFILE_SYNTHETIC_READY !== "1") {
    throw new Error("Explicit synthetic-data and reviewed-media readiness is required; see docs/MOBILE_PROFILE_RUNBOOK.md");
  }
  const versionResponse = await fetch(localOrigin + "/api/health/version", {
    redirect: "manual", signal: AbortSignal.timeout(5_000),
    headers: { accept: "application/json" },
  });
  if (versionResponse.status !== 200 || versionResponse.url !== localOrigin + "/api/health/version") {
    throw new Error("Local runtime identity endpoint did not return the expected response");
  }
  const runtime = await versionResponse.json();
  if (runtime.status !== "ok" || !["staging", "development", "test"].includes(runtime.environment) ||
      runtime.paymentMode === "live") {
    throw new Error("Local runtime is not a verified non-production synthetic profile target");
  }
  const sourceSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", timeout: 5_000 }).trim();
  const identity = reportBuildIdentity(sourceSha, runtime.commitSha);
  let localBuildId = null;
  try { localBuildId = readFileSync(".next/BUILD_ID", "utf8").trim(); }
  catch { /* The local build identifier is explicitly unverified. */ }
  let chromium;
  try { ({ chromium } = await import("@playwright/test")); }
  catch { throw new Error("Install pinned optional @playwright/test@1.55.0 and Chromium; see docs/MOBILE_PROFILE_RUNBOOK.md"); }
  const root = resolve("test-results");
  mkdirSync(root, { recursive: true });
  const artifactDirectory = mkdtempSync(join(root, "mobile-profile-"));
  mkdirSync(join(artifactDirectory, "traces"));
  const routes = [];
  for (const route of MOBILE_ROUTES) {
    const samples = [];
    for (let run = 1; run <= MOBILE_PROFILE.runs; run++) {
      samples.push(await profileOne(chromium, route, run, artifactDirectory));
    }
    routes.push(summarizeMobileSamples(route, samples));
  }
  const report = {
    methodology: "Isolated synthetic Chromium emulation; intercepts HTTP requests but is not a universal network firewall, CPU flamegraph or real Android/field data",
    localOrigin,
    identity,
    localBuildId,
    privacyCondition: "Operator attests isolated synthetic DB and reviewed/redacted public media; not machine-verified",
    profile: MOBILE_PROFILE,
    generatedAt: new Date().toISOString(),
    noTTIorStandardTBT: true,
    routes,
  };
  writeFileSync(join(artifactDirectory, "report.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  return { artifactDirectory, report };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 2) {
    process.stderr.write("This profile takes no remote target or route arguments.\n");
    process.exitCode = 2;
  } else {
    try {
      const result = await collectMobileProfile();
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } catch (error) {
      process.stderr.write("Local mobile profile failed: " + (error instanceof Error ? error.message : "unknown") + "\n");
      process.exitCode = 1;
    }
  }
}
