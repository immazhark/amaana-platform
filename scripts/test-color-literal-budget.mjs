import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

// AF-R061 ratchet: hard-coded colour literals (hex, rgb[a], hsl[a]) in CSS may not grow.
// Baseline measured 18 Nov 2026 (73 files, 1351 literals). Lower an entry in the same change
// that migrates a family to tokens, after confirming the brand appearance is unchanged. Never raise one.
const ROOT = new URL("../", import.meta.url).pathname.replace(/^[/]([A-Za-z]:)/, "$1");
const BASELINE = {
  "src/app/admin/(protected)/home-carousel/editor.module.css": 10,
  "src/app/admin/(protected)/media/media-workflow.module.css": 4,
  "src/app/appeal-card.css": 16,
  "src/app/appeals-wow.css": 19,
  "src/app/appeals.css": 50,
  "src/app/appeals/[slug]/appeal-detail-layout.module.css": 15,
  "src/app/appeals/appeals-audit.module.css": 13,
  "src/app/assistance-wow.css": 10,
  "src/app/brand-expression.css": 5,
  "src/app/brand.css": 11,
  "src/app/canonical-content.css": 33,
  "src/app/compliance/compliance-audit.module.css": 7,
  "src/app/contact/contact-audit.module.css": 1,
  "src/app/donate-wow.css": 27,
  "src/app/donate/donate-audit.module.css": 2,
  "src/app/error-experience.css": 9,
  "src/app/experience-finish.css": 90,
  "src/app/faith-and-reflections/faith-audit.module.css": 1,
  "src/app/faith-detail.css": 6,
  "src/app/faith-wow.css": 21,
  "src/app/faith.css": 28,
  "src/app/forms-experience.css": 59,
  "src/app/get-involved/get-involved-audit.module.css": 3,
  "src/app/get-involved/sponsor-education/sponsor-education.css": 13,
  "src/app/globals.css": 68,
  "src/app/home-documentary.css": 34,
  "src/app/home-experience.css": 5,
  "src/app/home-showcase.css": 67,
  "src/app/impact-wow.css": 10,
  "src/app/impact.css": 5,
  "src/app/impact/impact-refinement.module.css": 22,
  "src/app/initiative-experience.css": 14,
  "src/app/islamic-backdrops.css": 11,
  "src/app/islamic-companion.css": 77,
  "src/app/iteration-four.css": 22,
  "src/app/loading-experience.css": 5,
  "src/app/media.css": 8,
  "src/app/our-work.css": 8,
  "src/app/our-work/[slug]/campaign.css": 47,
  "src/app/our-work/work-filter-audit.module.css": 7,
  "src/app/our-work/work-filters.css": 8,
  "src/app/page-hero.css": 73,
  "src/app/partner/partner-audit.module.css": 4,
  "src/app/policy-experience.css": 20,
  "src/app/privacy/privacy-audit.module.css": 4,
  "src/app/recognition/recognition-audit.module.css": 14,
  "src/app/refinement.css": 8,
  "src/app/refund-policy/refund-audit.module.css": 7,
  "src/app/request-assistance/assistance-surface.module.css": 4,
  "src/app/site-chrome.css": 46,
  "src/app/state-experience.css": 22,
  "src/app/stories-wow.css": 18,
  "src/app/stories.css": 55,
  "src/app/stories/stories-audit.module.css": 10,
  "src/app/transparency/transparency-wow.css": 14,
  "src/app/trust-experience.css": 45,
  "src/app/v2.css": 13,
  "src/app/world-class-polish.css": 17,
  "src/components/appeal-share.module.css": 8,
  "src/components/assistance-form.module.css": 16,
  "src/components/campaign-media-gallery.module.css": 17,
  "src/components/donation-form.module.css": 9,
  "src/components/evidence-pathway.module.css": 5,
  "src/components/initiative-banner.module.css": 6,
  "src/components/mobile-support-bar.module.css": 4,
  "src/components/participation-card.module.css": 2,
  "src/components/policy-toc.module.css": 2,
  "src/components/published-edition-index.module.css": 1,
  "src/components/reviewed-medical-appeal.module.css": 1,
  "src/components/scroll-carousel.module.css": 24,
  "src/components/trust-evidence-boundary.module.css": 2,
  "src/components/verification-faq.module.css": 1,
  "src/components/work-visual-placeholder.module.css": 8,
};

function cssFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return name.endsWith(".css") ? [path] : [];
  });
}

export function countColors(css) {
  const stripped = css.replace(/[/][*][^]*?[*][/]/g, "");
  return (stripped.match(/#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])|rgba?[(]|hsla?[(]/g) ?? []).length;
}

test("the counter ignores comments and counts each literal form", () => {
  assert.equal(countColors("a{color:#fff;background:rgb(0 0 0);border-color:rgba(1,2,3,.5)}/* #000 */"), 3);
  assert.equal(countColors("a{color:var(--brand-blue);background:hsl(10 20% 30%)}"), 1);
  assert.equal(countColors("a{color:var(--x)}"), 0);
});

test("no stylesheet exceeds its recorded colour-literal baseline and no new file adds any", () => {
  const files = cssFiles(join(ROOT, "src"));
  assert.ok(files.length > 20, "the scan must cover the source tree");
  const over = [];
  for (const file of files) {
    const key = relative(ROOT, file).replaceAll("\\", "/");
    const count = countColors(readFileSync(file, "utf8"));
    const allowed = BASELINE[key] ?? 0;
    if (count > allowed) over.push(`${key}: ${count} > ${allowed}`);
  }
  assert.deepEqual(over, []);
});

test("every baseline entry still names an existing stylesheet", () => {
  const present = new Set(cssFiles(join(ROOT, "src")).map((file) => relative(ROOT, file).replaceAll("\\", "/")));
  assert.deepEqual(Object.keys(BASELINE).filter((key) => !present.has(key)), []);
});
