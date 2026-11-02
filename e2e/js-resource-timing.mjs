const BUILD_SCRIPT_PATH = /^\/_next\/static\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.js$/;

function addBytes(total, bytes, kind) {
  const result = total + bytes;
  if (!Number.isSafeInteger(result)) throw new TypeError("Invalid browser JavaScript " + kind + " total");
  return result;
}

/**
 * Summarize only Next.js static JavaScript requested by the current browser
 * navigation. Resource Timing is not a measurement of field Web Vitals.
 * Unknown, cached or opaque response sizes remain explicitly unavailable.
 */
export function summarizeNextJsNavigationJsTiming(scriptSrcs, resourceTimings, documentUrl) {
  if (!Array.isArray(scriptSrcs) || !Array.isArray(resourceTimings)) {
    throw new TypeError("Browser JavaScript sources and timings must be arrays");
  }
  let document;
  try {
    document = new URL(documentUrl);
    if (!["https:", "http:"].includes(document.protocol) || document.username || document.password) {
      throw new Error("Invalid scheme or credentials");
    }
  } catch {
    throw new TypeError("Invalid navigation URL");
  }

  function buildScript(value) {
    if (typeof value !== "string" || !value) throw new TypeError("Invalid browser JavaScript URL");
    let url;
    try { url = new URL(value, document); } catch { throw new TypeError("Invalid browser JavaScript URL"); }
    if (url.username || url.password || url.origin !== document.origin || !BUILD_SCRIPT_PATH.test(url.pathname)) return null;
    return url.href;
  }

  const byScript = new Map();
  for (const source of scriptSrcs) {
    const url = buildScript(source);
    if (url && !byScript.has(url)) byScript.set(url, []);
  }
  for (const timing of resourceTimings) {
    if (!timing || typeof timing.name !== "string") throw new TypeError("Invalid browser JavaScript timing entry");
    const url = buildScript(timing.name);
    if (!url) continue;
    if (![timing.decodedBodySize, timing.encodedBodySize, timing.transferSize]
      .every(value => Number.isSafeInteger(value) && value >= 0)) {
      throw new TypeError("Invalid browser JavaScript timing for " + url);
    }
    if (!byScript.has(url)) byScript.set(url, []);
    byScript.get(url).push(timing);
  }

  let decodedBodyBytes = 0;
  let encodedBodyBytes = 0;
  let observedTransferBytes = 0;
  let incompleteBody = false;
  let requestCount = 0;
  const missingTimingScripts = [];
  const unavailableTransferScripts = [];

  for (const [url, entries] of byScript) {
    if (!entries.length) {
      missingTimingScripts.push(url);
      unavailableTransferScripts.push(url);
      incompleteBody = true;
      continue;
    }
    let transferUnavailable = false;
    for (const entry of entries) {
      requestCount += 1;
      if (!Number.isSafeInteger(requestCount)) throw new TypeError("Invalid browser JavaScript request count");
      const { decodedBodySize, encodedBodySize, transferSize } = entry;
      if (decodedBodySize === 0 && encodedBodySize === 0 && transferSize === 0) {
        incompleteBody = true;
      } else {
        decodedBodyBytes = addBytes(decodedBodyBytes, decodedBodySize, "decoded");
        encodedBodyBytes = addBytes(encodedBodyBytes, encodedBodySize, "encoded");
      }
      if (transferSize === 0) transferUnavailable = true;
      else observedTransferBytes = addBytes(observedTransferBytes, transferSize, "transfer");
    }
    if (transferUnavailable) unavailableTransferScripts.push(url);
  }

  return {
    metric: "browser-nextjs-navigation-js-resource-timing",
    scriptCount: byScript.size,
    requestCount,
    decodedBodyBytes: incompleteBody ? null : decodedBodyBytes,
    encodedBodyBytes: incompleteBody ? null : encodedBodyBytes,
    transferBytes: unavailableTransferScripts.length ? null : observedTransferBytes,
    observedTransferBytes,
    missingTimingScripts,
    unavailableTransferScripts,
    disclaimer: "Navigation Resource Timing for first-party Next.js static JavaScript only. Cache, opaque and missing timings are unavailable; partial transfer is not a complete total. Not field Web Vitals, built output size or public production traffic.",
  };
}
