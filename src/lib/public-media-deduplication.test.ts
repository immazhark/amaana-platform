import { describe, expect, it } from "vitest";
import { dedupeRenderablePublicMediaByUrl } from "./public-media";

describe("public media O(n) URL deduplication", () => {
  it("keeps the first reviewed media asset for each normalized URL in stable order", () => {
    const first = { id: "hero", kind: "IMAGE" as const, publicUrl: " /media/2026/approved.webp ", altText: "Reviewed image" };
    const sameUrl = { id: "alternate", kind: "IMAGE" as const, publicUrl: "/media/2026/approved.webp", altText: "Reviewed alternate" };
    const document = { id: "report", kind: "DOCUMENT" as const, publicUrl: "/reports/approved.pdf", title: "Reviewed report" };
    expect(dedupeRenderablePublicMediaByUrl([first, sameUrl, document])).toEqual([first, document]);
  });

  it("rejects unsafe and malformed media without hiding later reviewed records", () => {
    const approved = { id: "approved", kind: "IMAGE" as const, publicUrl: "/media/approved.webp", altText: "Approved image" };
    const data = [
      { id: "unsafe", kind: "DOCUMENT", publicUrl: "javascript:alert(1)" },
      { id: "private", kind: "IMAGE", publicUrl: "/admin/private.webp", altText: "Private" },
      { id: "unlabelled", kind: "IMAGE", publicUrl: "/media/approved.webp", altText: "" },
      null,
      approved,
    ] as unknown as typeof approved[];
    expect(dedupeRenderablePublicMediaByUrl(data)).toEqual([approved]);
  });

  it("does not conflate distinct query variants and keeps valid external sources", () => {
    const items = [
      { kind: "DOCUMENT" as const, publicUrl: "/reports/approved.pdf?v=1" },
      { kind: "DOCUMENT" as const, publicUrl: "/reports/approved.pdf?v=2" },
      { kind: "EXTERNAL_VIDEO" as const, externalUrl: "https://www.youtube.com/watch?v=reviewed" },
    ];
    expect(dedupeRenderablePublicMediaByUrl(items)).toEqual(items);
  });

  it("fails closed on malformed collections", () => {
    expect(dedupeRenderablePublicMediaByUrl(null as unknown as never[])).toEqual([]);
    expect(dedupeRenderablePublicMediaByUrl({ length: 3 } as unknown as never[])).toEqual([]);
  });

  it("uses at most linear URL-field reads across distinct records", () => {
    let reads = 0;
    const items = Array.from({ length: 100 }, (_, index) => ({
      id: String(index),
      kind: "DOCUMENT" as const,
      get publicUrl() {
        reads += 1;
        return `/reports/reviewed-${index}.pdf`;
      },
    }));
    expect(dedupeRenderablePublicMediaByUrl(items)).toHaveLength(100);
    expect(reads).toBeLessThan(1_000);
  });
});
