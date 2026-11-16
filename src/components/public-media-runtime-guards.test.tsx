import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PublicMedia } from "./public-media";

const approved = {
  id: "approved-public",
  kind: "IMAGE",
  title: "Programme documentation",
  publicUrl: "/media/approved.webp",
  externalUrl: null,
  altText: "Reviewed programme materials",
  caption: null,
  sourceYear: 2026,
} as const;

describe("AF-R052 PublicMedia untrusted runtime props", () => {
  it("rejects malformed media metadata without crashing the public SSR renderer", () => {
    const forged = { trim: vi.fn(() => "/media/unapproved.webp") };
    const invalid = [
      { id: 42 },
      { id: " " },
      { kind: "UNREVIEWED" },
      { publicUrl: 12 },
      { externalUrl: { toString: () => "https://example.invalid/a" } },
      { altText: 27 },
      { altText: forged },
      { title: forged },
      { caption: forged },
      { sourceYear: {} },
    ];
    for (const fields of invalid) {
      const asset = { ...approved, ...fields } as unknown as Parameters<typeof PublicMedia>[0]["asset"];
      expect(renderToStaticMarkup(<PublicMedia asset={asset} />)).toBe("");
    }
    expect(forged.trim).not.toHaveBeenCalled();
  });

  it("rejects prototype-inherited media identity, URL and editorial metadata", () => {
    const inheritedAll = Object.create(approved) as Parameters<typeof PublicMedia>[0]["asset"];
    expect(renderToStaticMarkup(<PublicMedia asset={inheritedAll} />)).toBe("");

    const inheritedUrl = Object.assign(
      Object.create({ publicUrl: "/media/inherited-unreviewed.webp" }),
      { ...approved, publicUrl: undefined },
    ) as Parameters<typeof PublicMedia>[0]["asset"];
    expect(renderToStaticMarkup(<PublicMedia asset={inheritedUrl} />)).toBe("");

    const inheritedCaption = Object.assign(
      Object.create({ caption: "PRIVATE_EDITORIAL_NOTE" }),
      { ...approved, caption: undefined },
    ) as Parameters<typeof PublicMedia>[0]["asset"];
    expect(renderToStaticMarkup(<PublicMedia asset={inheritedCaption} />)).toBe("");

    expect(renderToStaticMarkup(<PublicMedia asset={approved} />)).toContain("Reviewed programme materials");
  });

  it("preserves an ordinary reviewed image with valid metadata", () => {
    const html = renderToStaticMarkup(<PublicMedia asset={approved} />);
    expect(html).toContain('alt="Reviewed programme materials"');
    expect(html).toContain("/_next/image?url=%2Fmedia%2Fapproved.webp");
  });
});
