import { describe, expect, it } from "vitest";
import { programmeCardMediaSlugs } from "./master-copy";

describe("programme card media ancestry", () => {
  it("pairs recurring umbrella programmes with their newest documented edition", () => {
    expect(programmeCardMediaSlugs("eid-gift-kits")).toEqual([
      "eid-gift-kits",
      "eid-gift-kits-2026",
    ]);
    expect(programmeCardMediaSlugs("qurbani-meat-distribution")).toEqual([
      "qurbani-meat-distribution",
      "qurbani-meat-distribution-2026",
    ]);
    expect(programmeCardMediaSlugs("dates-distribution")).toEqual([
      "dates-distribution",
      "dates-distribution-2026",
    ]);
  });

  it("keeps single-record programmes bounded to their own media", () => {
    expect(programmeCardMediaSlugs("winter-relief")).toEqual(["winter-relief"]);
  });
});
