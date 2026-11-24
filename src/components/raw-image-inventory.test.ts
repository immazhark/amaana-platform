import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// AF-R052: every raw <img> bypasses next/image optimisation, so each one must be a
// reviewed, justified case that is still behind the publication/URL gates.
const root = join(__dirname, "..");

// Reviewed inventory. Adding a raw <img> elsewhere must fail until it is classified here.
const reviewed: Record<string, { count: number; gates: RegExp[]; optimizedFirst: RegExp }> = {
  "components/public-media.tsx": {
    count: 1,
    gates: [/canRenderPublicMedia\(asset\)/, /resolvePublicMediaUrl\(asset\)/],
    optimizedFirst: /getPublicImageOptimizationUrl\(url\)/,
  },
  // Grid thumbnail and enlarged-dialog image; both read the gated safeItems list.
  "components/campaign-media-gallery.tsx": {
    count: 2,
    gates: [/isCspCompatiblePublicImageUrl/, /normalizeSafePublicMediaUrl/, /isPrivateAppMediaUrl/, /serverApprovedExternal/],
    optimizedFirst: /getPublicImageOptimizationUrl\(item\.url\)/,
  },
};

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(?:tsx|jsx|ts|js|mjs)$/.test(entry.name) && !/\.test\.|\.spec\./.test(entry.name) ? [path] : [];
  });
}

const rawImg = /<img[\s/>]|createElement\(\s*["']img["']/g;

describe("AF-R052 raw image inventory", () => {
  const found = new Map<string, string>();
  for (const file of sources(root)) {
    const text = readFileSync(file, "utf8");
    if (rawImg.test(text)) found.set(relative(root, file).split(sep).join("/"), text);
    rawImg.lastIndex = 0;
  }

  it("contains only reviewed raw image sites", () => {
    expect([...found.keys()].sort()).toEqual(Object.keys(reviewed).sort());
  });

  it.each(Object.entries(reviewed))("%s keeps its raw <img> behind publication gates and as the optimiser fallback", (file, rule) => {
    const text = found.get(file) ?? "";
    expect(text.match(rawImg)?.length).toBe(rule.count);
    for (const gate of rule.gates) expect(text).toMatch(gate);
    // The optimised path is chosen first; the raw element is only the unoptimised fallback.
    const optimizer = text.search(rule.optimizedFirst);
    expect(optimizer).toBeGreaterThanOrEqual(0);
    expect(text.search(/<img[\s/>]/)).toBeGreaterThan(optimizer);
    // Raw images must never be decorative-by-omission: alt is always supplied.
    expect(text).toMatch(/<img[^>]*\balt=/s);
  });
});
