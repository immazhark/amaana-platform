import { describe, expect, it } from "vitest";
import {
  buildPublicStructuredData,
  normalizeStructuredDataImage,
  normalizeStructuredDataPath,
  serializeStructuredData,
} from "./structured-data";

describe("public structured data", () => {
  it("builds canonical Article data from public-safe values", () => {
    const data = buildPublicStructuredData({
      type: "Article",
      title: "  A documented story  ",
      description: " A public-safe account of Amaana's work. ",
      path: "/stories/documented-story",
      publishedAt: "2026-09-20T10:00:00.000Z",
      modifiedAt: "2026-09-21T12:00:00.000Z",
      imageUrl: "/media/2026/story.webp",
      section: "Stories of Amanah",
      keywords: ["Dignity", "Dignity", "Community support"],
    }, "https://amaanafoundation.org");

    expect(data).toMatchObject({
      "@type": "Article",
      url: "https://amaanafoundation.org/stories/documented-story",
      name: "A documented story",
      description: "A public-safe account of Amaana's work.",
      image: "https://amaanafoundation.org/media/2026/story.webp",
      datePublished: "2026-09-20T10:00:00.000Z",
      dateModified: "2026-09-21T12:00:00.000Z",
      articleSection: "Stories of Amanah",
      keywords: ["Dignity", "Community support"],
    });
  });

  it("fails closed for unsafe route paths and image URLs", () => {
    expect(normalizeStructuredDataPath("//evil.example/path")).toBeNull();
    expect(normalizeStructuredDataPath("/stories/line\\break")).toBeNull();
    expect(normalizeStructuredDataPath("https://evil.example/path")).toBeNull();

    expect(normalizeStructuredDataImage("//evil.example/image.jpg", "https://amaanafoundation.org")).toBeNull();
    expect(normalizeStructuredDataImage("http://evil.example/image.jpg", "https://amaanafoundation.org")).toBeNull();
    expect(normalizeStructuredDataImage("https://user:secret@example.org/image.jpg", "https://amaanafoundation.org")).toBeNull();

    expect(buildPublicStructuredData({
      type: "WebPage",
      title: "Unsafe",
      description: "This should not render.",
      path: "//evil.example/path",
    }, "https://amaanafoundation.org")).toBeNull();
  });

  it("escapes script-sensitive characters in serialized JSON-LD", () => {
    const serialized = serializeStructuredData({ value: "</script><script>alert('x')</script>&" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c");
    expect(serialized).toContain("\\u0026");
  });
});
