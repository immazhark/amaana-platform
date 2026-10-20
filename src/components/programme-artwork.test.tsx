import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgrammeArtwork, hasProgrammeArtwork } from "./programme-artwork";

describe("programme artwork selection", () => {
  it.each(["constructor", "toString", "valueOf", "__proto__"])(
    "does not promote inherited Object keys to artwork: %s",
    slug => {
      expect(hasProgrammeArtwork(slug)).toBe(false);
      expect(renderToStaticMarkup(<ProgrammeArtwork slug={slug} />)).toBe("");
    },
  );

  it("keeps documented programme and category artwork available", () => {
    for (const slug of ["eid-gift-kits", "ramadan-eid", "amaana-taleem", "winter-relief"]) {
      expect(hasProgrammeArtwork(slug)).toBe(true);
      expect(renderToStaticMarkup(<ProgrammeArtwork slug={slug} />)).toContain("data-programme-artwork");
    }
    expect(hasProgrammeArtwork("unknown-programme")).toBe(false);
  });
});
