/** Merge browser CSS rule ranges using UTF-16 source offsets. */
export function mergeCssRanges(ranges, textLength) {
  if (!Array.isArray(ranges) || !Number.isSafeInteger(textLength) || textLength < 0) {
    throw new Error("Invalid CSS range collection or source length");
  }
  const sorted = ranges.map(range => {
    const { start, end } = range ?? {};
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end > textLength) {
      throw new Error("Invalid CSS usage range");
    }
    return { start, end };
  }).sort((a, b) => a.start - b.start || a.end - b.end);

  const merged = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

/**
 * Sampled Chromium-used CSS bytes for same-origin Next build sheets only.
 * Browser range offsets are string offsets, so convert each used slice to UTF-8 bytes.
 */
export function summarizeCssRuleUsage(entries, origin) {
  if (!Array.isArray(entries)) throw new TypeError("CSS coverage entries must be an array");
  let site;
  try { site = new URL(origin); }
  catch { throw new Error("Invalid CSS coverage origin URL"); }
  if (!/^https?:$/.test(site.protocol) || site.username || site.password) throw new Error("Invalid CSS coverage origin URL");

  const excluded = { inline: 0, crossOrigin: 0, nonBuild: 0 };
  const grouped = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry.url !== "string" || !Array.isArray(entry.ranges)) throw new Error("Invalid CSS coverage entry");
    if (!entry.url) { excluded.inline++; continue; }
    let url;
    try { url = new URL(entry.url); }
    catch { throw new Error("Invalid CSS coverage stylesheet URL"); }
    if (url.origin !== site.origin || url.username || url.password) { excluded.crossOrigin++; continue; }
    if (!/^\/_next\/static\/[A-Za-z0-9_./-]+\.css$/.test(url.pathname) || url.pathname.split("/").includes("..")) {
      excluded.nonBuild++;
      continue;
    }

    const hasText = typeof entry.text === "string";
    if (entry.text !== undefined && !hasText) throw new Error("Invalid CSS coverage source text");
    const current = grouped.get(url.href);
    if (current && (current.text !== entry.text)) throw new Error("Conflicting CSS source text for stylesheet URL");
    const size = hasText ? entry.text.length : Number.MAX_SAFE_INTEGER;
    mergeCssRanges(entry.ranges, size);
    if (current) current.ranges.push(...entry.ranges);
    else grouped.set(url.href, { text: entry.text, ranges: [...entry.ranges] });
  }

  let measuredTotalDecodedBytes = 0;
  let measuredUsedDecodedBytes = 0;
  let unmeasuredStylesheets = 0;
  const stylesheets = [...grouped].sort(([a], [b]) => a.localeCompare(b)).map(([url, entry]) => {
    if (entry.text === undefined) {
      unmeasuredStylesheets++;
      return { url, totalDecodedBytes: null, usedDecodedBytes: null };
    }
    const ranges = mergeCssRanges(entry.ranges, entry.text.length);
    const totalDecodedBytes = Buffer.byteLength(entry.text, "utf8");
    const usedDecodedBytes = ranges.reduce((sum, { start, end }) => sum + Buffer.byteLength(entry.text.slice(start, end), "utf8"), 0);
    measuredTotalDecodedBytes += totalDecodedBytes;
    measuredUsedDecodedBytes += usedDecodedBytes;
    return { url, totalDecodedBytes, usedDecodedBytes };
  });

  return {
    metric: "sampled-chromium-css-usage-decoded-bytes",
    stylesheets,
    measuredTotalDecodedBytes,
    measuredUsedDecodedBytes,
    unmeasuredStylesheets,
    excluded,
    disclaimer: "Used ranges in sampled Chromium route states only. Not network transfer bytes, complete unused-selector coverage, or field Web Vitals.",
  };
}
