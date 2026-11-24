import { describe, expect, it } from "vitest";
import { TALEEM_CATALOGUE } from "@/content/taleem-catalogue";
import { requestedProgramme, sponsorshipHrefForSlug } from "./taleem-sponsorship-link";

const offered = TALEEM_CATALOGUE.programmes;

describe("sponsorshipHrefForSlug", () => {
  it("preselects the programme a programme page is about", () => {
    expect(sponsorshipHrefForSlug("taleem-nazira-sponsorship")).toBe("/get-involved/sponsor-education?programme=nazira#programme-sponsorship");
    expect(sponsorshipHrefForSlug("taleem-hifdh-sponsorship")).toBe("/get-involved/sponsor-education?programme=hifdh-day-scholar#programme-sponsorship");
  });

  it("routes school and college support to an enquiry rather than an Islamic programme checkout", () => {
    expect(sponsorshipHrefForSlug("taleem-school-college-sponsorship"))
      .toBe("/get-involved/sponsor-education?path=school&support=discuss#sponsorship-enquiry");
  });

  it("does not choose for the donor on the overview or an unmapped page", () => {
    expect(sponsorshipHrefForSlug("taleem")).toBe("/get-involved/sponsor-education#programme-sponsorship");
    expect(sponsorshipHrefForSlug("something-else")).toBe("/get-involved/sponsor-education#programme-sponsorship");
  });

  it("only ever links programmes that exist in the catalogue", () => {
    for (const slug of ["taleem-nazira-sponsorship", "taleem-hifdh-sponsorship"]) {
      const id = new URL(sponsorshipHrefForSlug(slug), "https://example.org").searchParams.get("programme");
      expect(offered.map(item => item.id)).toContain(id);
    }
  });
});

describe("requestedProgramme", () => {
  it("accepts an offered programme", () => {
    expect(requestedProgramme("nazira", offered)).toBe("nazira");
    expect(requestedProgramme(["hifdh-day-scholar", "qaida"], offered)).toBe("hifdh-day-scholar");
  });

  it("ignores anything not in the live offer", () => {
    expect(requestedProgramme(undefined, offered)).toBeUndefined();
    expect(requestedProgramme("", offered)).toBeUndefined();
    expect(requestedProgramme("NAZIRA", offered)).toBeUndefined();
    expect(requestedProgramme("__proto__", offered)).toBeUndefined();
    expect(requestedProgramme("nazira", offered.filter(item => item.id !== "nazira"))).toBeUndefined();
    expect(requestedProgramme([], offered)).toBeUndefined();
  });
});
