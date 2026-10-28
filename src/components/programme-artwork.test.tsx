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

  it("preloads opted-in hero artwork without changing its responsive size", () => {
    const html = renderToStaticMarkup(
      <ProgrammeArtwork slug="ramadan-eid" sizes="(max-width: 900px) 90vw, 45vw" priority />,
    );
    expect(html).toContain('rel="preload"');
    expect(html).toContain('as="image"');
    expect(html).toContain('sizes="(max-width: 900px) 90vw, 45vw"');
    expect(html).not.toContain('loading="lazy"');
  });

  it("leaves programme cards lazy and without a preload hint", () => {
    const html = renderToStaticMarkup(<ProgrammeArtwork slug="winter-relief" />);
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain('rel="preload"');
  });
});
