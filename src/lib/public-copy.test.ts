
import { describe, expect, it } from "vitest";
import { programmes } from "./master-copy";
import { buildPublicRecordFallback, distinctStoryParagraphs, heroTeaser, programmeStoryParagraphs } from "./public-copy";

describe("distinctStoryParagraphs", () => {
  it("removes a body paragraph that repeats the hero summary", () => {
    expect(distinctStoryParagraphs(
      "Amaana distributed 90 kg of dates in 2024.",
      "Amaana distributed 90 kg of dates in 2024."
    )).toEqual([]);
  });

  it("keeps distinct implementation and outcome paragraphs", () => {
    expect(distinctStoryParagraphs(
      "Amaana distributed 90 kg of dates in 2024.",
      "Boxes were prepared before distribution.\n\nThe initiative continued the annual programme."
    )).toHaveLength(2);
  });

  it("removes near-verbatim body copy that only expands the hero summary slightly", () => {
    expect(distinctStoryParagraphs(
      "Amaana supported families through a documented Eid distribution.",
      "Amaana supported families through a documented Eid distribution across Hyderabad."
    )).toEqual([]);
  });

  it("keeps materially expanded body copy even when it shares the same opening", () => {
    expect(distinctStoryParagraphs(
      "Amaana supported families through a documented Eid distribution.",
      "Amaana supported families through a documented Eid distribution. Volunteers verified lists, prepared kits and coordinated delivery across several neighbourhoods before Eid."
    )).toHaveLength(1);
  });

  it("normalizes punctuation and whitespace before comparison", () => {
    expect(distinctStoryParagraphs(
      "A documented outcome — shared responsibly.",
      "  A documented outcome - shared responsibly.  "
    )).toEqual([]);
  });
});

describe("programmeStoryParagraphs", () => {
  it("retains the full narrative even when summary and story match", () => {
    const record = "A family needed neonatal hospital care. Donors raised ₹107,520. The baby improved and was discharged.";
    expect(programmeStoryParagraphs(record, record)).toEqual([record]);
  });
  it("keeps every distinct body paragraph and falls back to substantive summary", () => {
    expect(programmeStoryParagraphs("Summary", "Need.\n\nResponse.\n\nOutcome.\n\nNeed.")).toEqual(["Need.", "Response.", "Outcome."]);
    expect(programmeStoryParagraphs("The documented programme narrative.", " ")).toEqual(["The documented programme narrative."]);
  });
});

it("keeps the full public narrative for every canonical initiative", () => {
  for (const programme of programmes) {
    const text = programme.story?.trim() || programme.summary.trim();
    const paragraphs = programmeStoryParagraphs(programme.summary, programme.story);
    expect(paragraphs.length, programme.slug).toBeGreaterThan(0);
    for (const paragraph of text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean)) {
      expect(paragraphs, programme.slug).toContain(paragraph);
    }
  }
});


describe("heroTeaser factual sentence boundaries", () => {
  it("retains decimal quantities in the first public sentence", () => {
    expect(heroTeaser("A synthetic 2.5 km route was documented. A second sentence follows."))
      .toBe("A synthetic 2.5 km route was documented.");
    expect(heroTeaser("A synthetic ₹1.25 lakh amount was referenced. A later note follows."))
      .toBe("A synthetic ₹1.25 lakh amount was referenced.");
  });

  it("retains decimal metrics without a final full stop", () => {
    expect(heroTeaser("Synthetic metric 1.5 and another value 3.75"))
      .toBe("Synthetic metric 1.5 and another value 3.75");
  });
});

describe("public record fallback rejects unreviewed metric metadata", () => {
  it("omits malformed and whitespace-only metric claims while retaining the privacy notice", () => {
    for (const metric of [null, undefined, "", "   ", { amount: "999" }, 999]) {
      const result = buildPublicRecordFallback({
        metric: metric as string | null | undefined,
        metricLabel: "kits",
      });
      expect(result).not.toContain("The documented outcome");
      expect(result).not.toContain("999");
      expect(result).toContain("personal documents and sensitive details remain private");
    }
  });

  it("retains reviewed metric text but never renders malformed labels", () => {
    const valid = buildPublicRecordFallback({ metric: "42", metricLabel: " kits " });
    expect(valid).toContain("The documented outcome for this work is 42 kits.");
    const malformed = buildPublicRecordFallback({
      metric: "42",
      metricLabel: { private: "PRIVATE_LABEL" } as unknown as string,
    });
    expect(malformed).toContain("The documented outcome for this work is 42.");
    expect(JSON.stringify(malformed)).not.toContain("PRIVATE_LABEL");
    expect(malformed).not.toContain("[object Object]");
  });
});
