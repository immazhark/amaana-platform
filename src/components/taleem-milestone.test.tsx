import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TALEEM_FACTS, TALEEM_HIFDH_COMPLETIONS, TALEEM_HIFDH_COMPLETIONS_SENTENCE } from "@/content/taleem-facts";
import { TaleemMilestone } from "./taleem-milestone";

const html = (slug: string) => renderToStaticMarkup(<TaleemMilestone slug={slug} />);

describe("Taleem Hifdh completions", () => {
  it("states the owner-confirmed figure from the single facts source", () => {
    expect(TALEEM_HIFDH_COMPLETIONS).toMatchObject({ sponsored: 4, year: 2026 });
    expect(TALEEM_HIFDH_COMPLETIONS_SENTENCE).toBe("4 students in Amaana’s sponsored cohort completed Hifdh in 2026.");
    expect(html("taleem")).toContain(TALEEM_HIFDH_COMPLETIONS_SENTENCE);
  });

  it("appears on the overview and the Hifdh programme only", () => {
    expect(html("taleem-hifdh-sponsorship")).toContain("completed Hifdh in 2026");
    for (const slug of ["taleem-nazira-sponsorship", "taleem-school-college-sponsorship", "taleem-initiative-2025", "medical-support", ""]) expect(html(slug), slug).toBe("");
  });

  it("keeps the figure separate from the sponsored-student count and never adds them", () => {
    const markup = html("taleem");
    expect(markup).toContain("separate figure from the number of sponsored students");
    // Whole numbers only: the year 2026 contains the digits 26 without being the head-count.
    const whole = (value: number) => new RegExp(`(?<![0-9])${value}(?![0-9])`);
    expect(whole(26).test("a 26 b")).toBe(true);
    expect(whole(26).test("in 2026.")).toBe(false);
    expect(markup).not.toMatch(whole(TALEEM_FACTS.sponsoredStudents + TALEEM_HIFDH_COMPLETIONS.sponsored));
    expect(markup).not.toMatch(whole(TALEEM_FACTS.sponsoredStudents));
  });

  it("claims nothing the brief withholds: no wider graduating group, gifts, ceremony, names or photographs", () => {
    const markup = html("taleem").toLowerCase();
    for (const word of ["10 ", "ten ", "gift", "ceremony", "event", "royal regency", "honour", "photograph", "award"]) expect(markup, word).not.toContain(word);
  });

  it("labels the section for assistive technology and states its as-of date", () => {
    const markup = html("taleem");
    expect(markup).toContain('aria-labelledby="taleem-hifdh-completions"');
    expect(markup).toContain('id="taleem-hifdh-completions"');
    expect(markup).toContain("As of November 2026");
  });
});
