import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = {
  stories: readFileSync(new URL("../app/stories.css", import.meta.url), "utf8"),
  governance: readFileSync(new URL("../app/governance.css", import.meta.url), "utf8"),
  header: readFileSync(new URL("../app/site-chrome.css", import.meta.url), "utf8"),
  archive: readFileSync(new URL("../app/iteration-four.css", import.meta.url), "utf8"),
  palette: readFileSync(new URL("../app/globals.css", import.meta.url), "utf8"),
};

function token(name: string): string {
  const found = css.palette.match(new RegExp(`--${name}:\\s*(#[a-fA-F0-9]{6})\\s*;`));
  if (!found?.[1]) throw new Error(`Missing token ${name}`);
  return found[1];
}
function luminance(hex: string): number {
  const samples = [1,3,5].map(i => Number.parseInt(hex.slice(i,i+2),16)/255);
  const v = samples.map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4);
  return v[0]!*0.2126+v[1]!*0.7152+v[2]!*0.0722;
}
function ratio(one: string,two: string): number {
  const a=luminance(one),b=luminance(two);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}

describe("small type contrast on public cards and light surfaces", () => {
  it("uses legible deep-gold story actions on white cards", () => {
    expect(css.stories).toContain(".v2-stories-card-copy b{color:var(--af-color-gold-ink)");
    expect(css.stories).not.toContain(".v2-stories-card-copy b{color:var(--v2-gold)");
    expect(ratio(token("af-color-gold-ink"),token("af-color-surface"))).toBeGreaterThanOrEqual(4.5);
  });
  it("uses shared ink for dynamic reminders, archive labels and governance source notes", () => {
    expect(css.header).toContain("gap:.42rem;margin:0;color:var(--af-color-gold-ink)");
    expect(css.archive).toContain(".v2-light-reminder .v2-reminder-label{color:var(--af-color-gold-ink)}");
    expect(css.governance).toContain(".v2-governance-source-note{max-width:48rem;margin:2rem 0 0;color:var(--af-color-muted)");
    for(const bg of ["#f8f3e8","#f4efe3","#edf2ed","#f3ecdf"]){
      expect(ratio(token("af-color-gold-ink"),bg)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(token("af-color-muted"),bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
