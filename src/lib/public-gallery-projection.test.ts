import { afterEach, describe, it, vi } from "vitest";
import assert from "node:assert/strict";
import { toPublicGalleryItems } from "./public-gallery-projection";
import type { PublicMediaCandidate } from "./public-media";

const image = {
  id: "landscape", kind: "IMAGE", publicUrl: "/media/landscape.jpg",
  altText: "Approved drive photograph", caption: "Distribution record",
  width: 1800, height: 1200,
} as const;

describe("public gallery projection", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("preserves landscape and portrait dimensions and reviewed copy", () => {
    const items = toPublicGalleryItems([image, {
      ...image, id: "portrait", publicUrl: "/media/portrait.jpg", width: 900, height: 1600,
    }]);
    assert.deepEqual(items, [
      { id: "landscape", url: "/media/landscape.jpg", alt: image.altText, caption: image.caption, graphicArtwork: false, width: 1800, height: 1200 },
      { id: "portrait", url: "/media/portrait.jpg", alt: image.altText, caption: image.caption, graphicArtwork: false, width: 900, height: 1600 },
    ]);
  });

  it("uses the existing fallback for missing or invalid dimension pairs", () => {
    for (const dimensions of [
      { width: null, height: null }, { width: 900, height: undefined },
      { width: 0, height: 1000 }, { width: 10001, height: 1000 },
      { width: NaN, height: 1000 }, { width: 900.5, height: 1000 },
    ]) {
      const [item] = toPublicGalleryItems([{ ...image, ...dimensions }]);
      assert.equal(item?.width, 1600);
      assert.equal(item?.height, 1200);
    }
  });

  it("rejects non-image records and images without reviewed alternative text", () => {
    const kinds: PublicMediaCandidate["kind"][] = ["VIDEO", "DOCUMENT", "EXTERNAL_VIDEO"];
    for (const kind of kinds) {
      assert.deepEqual(toPublicGalleryItems([{ ...image, kind }]), []);
    }
    assert.deepEqual(toPublicGalleryItems([{ ...image, altText: "  " }]), []);
  });

  it("keeps current image-origin and URL restrictions", () => {
    for (const publicUrl of [
      null, "", "//untrusted.invalid/photo.jpg", "javascript:alert(1)",
      "https://untrusted.invalid/photo.jpg", "/media/bad image.jpg",
    ]) {
      assert.deepEqual(toPublicGalleryItems([{ ...image, publicUrl }]), []);
    }
  });

  it("deduplicates normalized URLs and asset IDs without reordering", () => {
    const items = toPublicGalleryItems([
      image,
      { ...image, id: "same-url", publicUrl: " /media/landscape.jpg " },
      { ...image, publicUrl: "/media/different.jpg" },
      { ...image, id: "second", publicUrl: "/media/second.jpg" },
    ]);
    assert.deepEqual(items.map(item => item.id), ["landscape", "second"]);
  });

  it("normalizes first-party managed image URLs before they reach the client bundle", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://cdn.amaana.example");
    const items = toPublicGalleryItems([
      { ...image, id: "first-party", publicUrl: "https://amaanafoundation.org/media/2026/approved.webp" },
      { ...image, id: "duplicate", publicUrl: "/media/2026/approved.webp" },
      { ...image, id: "external", publicUrl: "https://cdn.amaana.example/2026/approved.webp" },
    ]);
    assert.deepEqual(items.map(item => [item.id, item.url]), [
      ["first-party", "/media/2026/approved.webp"],
      ["external", "https://cdn.amaana.example/2026/approved.webp"],
    ]);
  });

  it("projects artwork presentation without forwarding private media titles or server fields", () => {
    const [item] = toPublicGalleryItems([{
      ...image, title: "Internal media title",
      storageKey: "private/key", sourcePath: "private/source",
    }]);
    assert.deepEqual(Object.keys(item ?? {}).sort(),
      ["alt", "caption", "graphicArtwork", "height", "id", "url", "width"]);
    assert.equal(item?.graphicArtwork, false);
    assert.equal(JSON.stringify(item).includes("Internal media title"), false);
    assert.equal(JSON.stringify(item).includes("private/key"), false);
  });

  it("honours title-only poster labels without exposing the reviewed title", () => {
    const [item] = toPublicGalleryItems([{
      ...image, title: "Thank you poster", altText: "Community annual update",
    }]);
    assert.equal(item?.graphicArtwork, true);
    assert.equal(Object.hasOwn(item ?? {}, "title"), false);
  });
});
