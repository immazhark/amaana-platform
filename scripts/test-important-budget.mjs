import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

// AF-R062 ratchet: `!important` may not grow. Baseline measured 18 Nov 2026
// (29 files, 328 declarations). Lowering a file's count is welcome: reduce its
// entry here in the same change, after the cascade is verified. Never raise one.
const ROOT = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const BASELINE = {
  "src/app/accessibility.css": 14,
  "src/app/admin/(protected)/media/media-workflow.module.css": 1,
  "src/app/appeals/[slug]/appeal-detail-layout.module.css": 2,
  "src/app/appeals/appeals-audit.module.css": 2,
  "src/app/brand.css": 2,
  "src/app/compliance/compliance-audit.module.css": 1,
  "src/app/experience-finish.css": 84,
  "src/app/forms-experience.css": 25,
  "src/app/home-documentary.css": 15,
  "src/app/impact/impact-refinement.module.css": 23,
  "src/app/islamic-backdrops.css": 5,
  "src/app/islamic-companion.css": 2,
  "src/app/iteration-four.css": 15,
  "src/app/our-work/[slug]/campaign.css": 5,
  "src/app/refund-policy/refund-audit.module.css": 4,
  "src/app/request-assistance/assistance-surface.module.css": 4,
  "src/app/site-chrome.css": 7,
  "src/app/state-experience.css": 4,
  "src/app/stories/stories-audit.module.css": 28,
  "src/app/team/team.css": 2,
  "src/app/world-class-polish.css": 6,
  "src/components/appeal-share.module.css": 2,
  "src/components/assistance-form.module.css": 13,
  "src/components/direct-transfer-form.module.css": 18,
  "src/components/donation-form.module.css": 32,
  "src/components/evidence-pathway.module.css": 4,
  "src/components/mobile-support-bar.module.css": 5,
  "src/components/reviewed-medical-appeal.module.css": 1,
  "src/components/scroll-carousel.module.css": 2,
};

function cssFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return name.endsWith(".css") ? [path] : [];
  });
}

export function countImportant(css) {
  return (css.replace(/\/\*[\s\S]*?\*\//g, "").match(/!\s*important/g) ?? []).length;
}

test("the counter ignores comments and spacing variants", () => {
  assert.equal(countImportant("a{color:red !important;margin:0!important}/* x !important */"), 2);
  assert.equal(countImportant("a{color:red ! important}"), 1);
  assert.equal(countImportant("a{color:red}"), 0);
});

test("no stylesheet exceeds its recorded !important baseline and no new file adds any", () => {
  const files = cssFiles(join(ROOT, "src"));
  assert.ok(files.length > 20, "the scan must cover the source tree");
  const over = [];
  for (const file of files) {
    const key = relative(ROOT, file).replaceAll("\\", "/");
    const count = countImportant(readFileSync(file, "utf8"));
    const allowed = BASELINE[key] ?? 0;
    if (count > allowed) over.push(`${key}: ${count} > ${allowed}`);
  }
  assert.deepEqual(over, []);
});

test("every baseline entry still names an existing stylesheet", () => {
  const present = new Set(cssFiles(join(ROOT, "src")).map((file) => relative(ROOT, file).replaceAll("\\", "/")));
  assert.deepEqual(Object.keys(BASELINE).filter((key) => !present.has(key)), []);
});
