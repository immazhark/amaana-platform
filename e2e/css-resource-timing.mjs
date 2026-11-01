/** Browser-linked CSS response sizes. Zero transfer can mean cache or opaque timing. */
export function summarizeLinkedCssResourceTiming(hrefs, resourceTimings) {
  if (!Array.isArray(hrefs) || !Array.isArray(resourceTimings)) {
    throw new TypeError("Browser CSS links and timings must be arrays");
  }
  const uniqueHrefs = [...new Set(hrefs)];
  if (uniqueHrefs.some(href => typeof href !== "string" || !href)) {
    throw new TypeError("Browser CSS links must be nonempty URLs");
  }
  const byHref = new Map();
  for (const entry of resourceTimings) {
    if (!entry || typeof entry.name !== "string") throw new TypeError("Invalid browser CSS timing entry");
    if (!byHref.has(entry.name)) byHref.set(entry.name, entry);
  }

  let decodedBodyBytes = 0;
  let encodedBodyBytes = 0;
  let observedTransferBytes = 0;
  let incompleteBody = false;
  const missingTimingStylesheets = [];
  const unavailableTransferStylesheets = [];

  for (const href of uniqueHrefs) {
    const timing = byHref.get(href);
    if (!timing) {
      missingTimingStylesheets.push(href);
      unavailableTransferStylesheets.push(href);
      incompleteBody = true;
      continue;
    }
    const { decodedBodySize, encodedBodySize, transferSize } = timing;
    if (![decodedBodySize, encodedBodySize, transferSize].every(value => Number.isSafeInteger(value) && value >= 0)) {
      throw new TypeError("Invalid browser CSS timing for " + href);
    }
    // All-zero timing cannot prove an empty response: cache and opaque resources also return zero.
    if (decodedBodySize === 0 && encodedBodySize === 0 && transferSize === 0) {
      incompleteBody = true;
    } else {
      decodedBodyBytes += decodedBodySize;
      encodedBodyBytes += encodedBodySize;
    }
    if (transferSize === 0) unavailableTransferStylesheets.push(href);
    else observedTransferBytes += transferSize;
  }

  return {
    metric: "browser-linked-css-resource-timing",
    stylesheetCount: uniqueHrefs.length,
    decodedBodyBytes: incompleteBody ? null : decodedBodyBytes,
    encodedBodyBytes: incompleteBody ? null : encodedBodyBytes,
    transferBytes: unavailableTransferStylesheets.length ? null : observedTransferBytes,
    observedTransferBytes,
    missingTimingStylesheets,
    unavailableTransferStylesheets,
    disclaimer: "Browser navigation Resource Timing for linked CSS only. Cache/opaque/missing transfers are unavailable; partial observed bytes are not complete transfer. Not field Web Vitals or public production traffic.",
  };
}
