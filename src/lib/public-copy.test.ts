
import { describe, expect, it } from "vitest";
import { programmes } from "./master-copy";
import { distinctStoryParagraphs, programmeStoryParagraphs } from "./public-copy";

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
