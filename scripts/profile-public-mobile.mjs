/**
 * Explicit, local-only AF-R048 synthetic Chromium run:
 *   Local production server at http://127.0.0.1:3000
 *   npm run profile:mobile
 * The report is NOT real-device, field p75, INP, TTI or standard TBT evidence.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  MOBILE_PROFILE, MOBILE_ROUTES, assertLocalProfileTarget,
  profileTraceName, summarizeMobileSamples,
} from "./mobile-profile-core.mjs";

const localOrigin = assertLocalProfileTarget("http://127.0.0.1:3000");

async function profileOne(chromium, route, run, artifactDirectory) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: MOBILE_PROFILE.viewport,
    deviceScaleFactor: MOBILE_PROFILE.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
  });
  let tracingStarted = false;
  const trace = `traces/${profileTraceName(route, run)}`;
  try {
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
    await page.route("**/*", async intercepted => {
      const request = intercepted.request();
      const url = new URL(request.url());
      if (request.isNavigationRequest() && url.origin !== localOrigin) {
        await intercepted.abort("blockedbyclient");
        return;
      }
      if (url.origin !== localOrigin && !["GET", "HEAD"].includes(request.method())) {
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
      const captured = { lcpMs: null, cls: null, observedLongTaskBlockingMs: null };
      Object.defineProperty(window, "__amaanaMobileProfile", { value: captured });
      try {
        new PerformanceObserver(list => {
          const latest = list.getEntries().at(-1);
          if (latest) captured.lcpMs = latest.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch { /* Unsupported performance entry remains explicitly unmeasured. */ }
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) captured.cls += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        captured.cls = 0;
      } catch { /* CLS unsupported in this browser profile. */ }
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            captured.observedLongTaskBlockingMs += Math.max(0, entry.duration - 50);
          }
        }).observe({ type: "longtask", buffered: true });
        captured.observedLongTaskBlockingMs = 0;
      } catch { /* Browser support is verified from the separate trace. */ }
    });
    await context.tracing.start({ screenshots: true, snapshots: true });
    tracingStarted = true;
    const response = await page.goto(localOrigin + route, { waitUntil: "load", timeout: 60_000 });
    if (!response?.ok() || new URL(page.url()).origin !== localOrigin ||
        new URL(response.url()).origin !== localOrigin ||
        new URL(page.url()).pathname !== route || new URL(response.url()).pathname !== route) {
      throw new Error("Local route navigation failed or left the fixed local origin: " + route);
    }
    await page.waitForTimeout(MOBILE_PROFILE.settleMs);
    const metrics = await page.evaluate(() => window.__amaanaMobileProfile);
    return { run, ...metrics, trace };
  } finally {
    try {
      if (tracingStarted) {
        await context.tracing.stop({ path: join(artifactDirectory, trace) });
      }
    } finally {
      await context.close();
      await browser.close();
    }
  }
}

export async function collectMobileProfile() {
  const { chromium } = await import("@playwright/test");
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
    methodology: "Local-only synthetic Chromium mobile emulation; not real Android or field data",
    localOrigin,
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
