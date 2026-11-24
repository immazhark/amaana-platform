import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { TALEEM_FACTS, TALEEM_HERO_SENTENCE, TALEEM_INITIATIVE_SLUG, TALEEM_METRIC } from "./taleem-facts";

// Brief v1.1: the corrected Taleem head-count is 26. This guard makes the canonical source the only place a current
// count is decided, and fails when a surface drifts back, when the two mirrored JSON files diverge, or when someone adds
// a database read that returns the metric without the read-time projection.

const root = join(__dirname, "..", "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

type Initiative = { slug: string; summary?: string; story?: string; description?: string; primaryMetric?: string; primaryMetricLabel?: string };
const masterCopy = JSON.parse(read("src/content/master-copy.json")) as { initiatives: Initiative[] };
const masterProgrammes = JSON.parse(read("prisma/master-programmes.json")) as { initiatives: Initiative[] };
const taleemSlugs = ["taleem", "taleem-hifdh-sponsorship", "taleem-nazira-sponsorship"];

describe("canonical Taleem facts", () => {
  it("states 26 students as of November 2026, with the correction recorded as provenance and not rendered", () => {
    expect(TALEEM_FACTS.sponsoredStudents).toBe(26);
    expect(TALEEM_FACTS.asOf.label).toBe("November 2026");
    expect(TALEEM_FACTS.provenance).toMatch(/omitted one student/);
    expect(TALEEM_HERO_SENTENCE).toBe("As of November 2026, 26 students across Qur’an Nazira and Hifdh are being sponsored through Amaana by multiple donors.");
    expect(TALEEM_METRIC).toEqual({ value: "26", label: "Nazira / Hifdh students combined · November 2026" });
  });

  it("keeps the Taleem programme copy and metric in both JSON files on the canonical figure", () => {
    for (const [name, file] of [["master-copy.json", masterCopy], ["master-programmes.json", masterProgrammes]] as const) {
      const main = file.initiatives.find(item => item.slug === TALEEM_INITIATIVE_SLUG);
      expect(main?.primaryMetric, name).toBe(TALEEM_METRIC.value);
      expect(main?.primaryMetricLabel, name).toBe(TALEEM_METRIC.label);
      for (const slug of taleemSlugs) {
        const item = file.initiatives.find(row => row.slug === slug)!;
        const text = [item.summary, item.story, item.description].filter(Boolean).join("\n");
        const claims = [...text.matchAll(/As of ([A-Z][a-z]+ 20\d\d), (\d+) students/g)];
        expect(claims.length, `${name} ${slug} states the count`).toBeGreaterThan(0);
        for (const [, date, count] of claims) {
          expect(Number(count), `${name} ${slug}`).toBe(TALEEM_FACTS.sponsoredStudents);
          expect(date, `${name} ${slug}`).toBe(TALEEM_FACTS.asOf.label);
        }
      }
    }
  });

  it("keeps the two JSON files identical for every Taleem initiative (no drift between runtime copy and seed)", () => {
    for (const slug of [...taleemSlugs, "taleem-school-college-sponsorship", "taleem-initiative-2025"]) {
      expect(masterProgrammes.initiatives.find(row => row.slug === slug), slug).toEqual(masterCopy.initiatives.find(row => row.slug === slug));
    }
  });

  it("has no stale current-count claim of 25 students left in source or seed content", () => {
    const stale = /\b25 students\b|25 Nazira \/ Hifdh|September 2026, 25|"primaryMetric": "25"/;
    const files = [...walk(join(root, "src")).filter(file => /\.(ts|tsx|json)$/.test(file) && !/\.test\./.test(file)), join(root, "prisma", "master-programmes.json")];
    const offenders = files.filter(file => stale.test(readFileSync(file, "utf8"))).map(file => relative(root, file).split(sep).join("/"));
    expect(offenders).toEqual([]);
  });

  it("carries factual-lock entries so the live database rows can be synced to the same figure", () => {
    const locks = JSON.parse(read("prisma/canonical-factual-locks.json")) as { initiatives: { slug: string; primaryMetric?: string; primaryMetricLabel?: string; textReplacements?: { from: string; to: string }[] }[] };
    const main = locks.initiatives.find(item => item.slug === TALEEM_INITIATIVE_SLUG);
    expect(main?.primaryMetric).toBe(TALEEM_METRIC.value);
    expect(main?.primaryMetricLabel).toBe(TALEEM_METRIC.label);
    for (const slug of taleemSlugs) {
      const entry = locks.initiatives.find(item => item.slug === slug);
      expect(entry?.textReplacements?.length, slug).toBeGreaterThan(0);
      for (const { from, to } of entry!.textReplacements!) {
        expect(from).toMatch(/September 2026, 25 students/);
        expect(to).toMatch(/November 2026, 26 students/);
      }
    }
  });
});

describe("read-time projection is applied to every initiative read that returns the metric", () => {
  // Finds each prisma.initiative.find* call by bracket matching and checks that any call returning the metric (or all
  // columns through include) is wrapped. A new read added later without the projection fails here.
  function calls(source: string) {
    const found: { text: string; after: string }[] = [];
    for (const match of source.matchAll(/prisma\.initiative\.find(?:Many|First)\(/g)) {
      let depth = 1;
      let index = match.index! + match[0].length;
      while (depth > 0) {
        const char = source[index++]!;
        if (char === "(" || char === "[" || char === "{") depth++;
        else if (char === ")" || char === "]" || char === "}") depth--;
      }
      found.push({ text: source.slice(match.index!, index), after: source.slice(index, index + 70) });
    }
    return found;
  }

  it.each(["src/lib/public-page-data.ts", "src/lib/public-content.ts"])("%s: a metric selected through ANY prisma read (including initiatives nested in another model) is projected", path => {
    const source = read(path);
    const nested: { text: string; index: number }[] = [];
    for (const match of source.matchAll(/prisma\.(?!initiative\b)[a-zA-Z]+\.find(?:Many|First)\(/g)) {
      let depth = 1;
      let index = match.index! + match[0].length;
      while (depth > 0) {
        const char = source[index++]!;
        if (char === "(" || char === "[" || char === "{") depth++;
        else if (char === ")" || char === "]" || char === "}") depth--;
      }
      const text = source.slice(match.index!, index);
      if (/primaryMetric: true/.test(text)) nested.push({ text, index });
    }
    // Each such read must pass its result through the projection before returning it.
    const unprojected = nested.filter(item => !/withCanonicalInitiativeFactsList\(/.test(source.slice(item.index, item.index + 3500)));
    expect(unprojected.map(item => item.text.slice(0, 60))).toEqual([]);
  });

  it.each(["src/lib/public-page-data.ts", "src/lib/public-content.ts"])("%s", path => {
    const source = read(path);
    const all = calls(source);
    expect(all.length).toBeGreaterThan(0);
    const returnsMetric = (text: string) => /primaryMetric|homepageInitiativeSelect/.test(text) || (path.endsWith("public-content.ts") && /include:/.test(text));
    const unwrapped = all.filter(call => returnsMetric(call.text) && !/^\s*\.then\(withCanonicalInitiativeFacts(List)?\)/.test(call.after));
    expect(unwrapped.map(call => call.text.slice(0, 80))).toEqual([]);
    // The reads that return no metric (slug-only, media-only) are correctly left alone.
    expect(all.some(call => !returnsMetric(call.text))).toBe(path.endsWith("public-page-data.ts"));
  });
});
