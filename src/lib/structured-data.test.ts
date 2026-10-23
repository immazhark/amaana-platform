import { describe, expect, it } from "vitest";
import {
  buildPublicStructuredData,
  normalizeStructuredDataImage,
  normalizeStructuredDataPath,
  normalizeStructuredDataSiteUrl,
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

  it("omits Article-only section metadata from programme WebPage records", () => {
    const data = buildPublicStructuredData({
      type: "WebPage",
      title: "Education programmes",
      description: "Documented education support.",
      path: "/our-work/education",
      section: "Our Work",
    }, "https://amaanafoundation.org");

    expect(data).toMatchObject({
      "@type": "WebPage",
      name: "Education programmes",
      url: "https://amaanafoundation.org/our-work/education",
    });
    expect(data).not.toHaveProperty("articleSection");
  });

  it("replaces an existing path fragment when assigning the content entity ID", () => {
    const data = buildPublicStructuredData({
      type: "Article", title: "A story", description: "Public summary",
      path: "/stories/example#details",
    }, "https://amaanafoundation.org");
    expect(data).toMatchObject({
      url: "https://amaanafoundation.org/stories/example#details",
      "@id": "https://amaanafoundation.org/stories/example#content",
    });
  });

  it("normalizes allowed HTTPS origins and rejects unsafe configured origins", () => {
    expect(normalizeStructuredDataSiteUrl("https://preview.example.org/path?query=1#fragment"))
      .toBe("https://preview.example.org");
    for (const configured of ["http://example.org", "javascript:alert(1)", "https://user:secret@example.org", "not-a-url", ""]) {
      expect(normalizeStructuredDataSiteUrl(configured)).toBe("https://amaanafoundation.org");
    }
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

  it("never publishes private or encoded-private destinations as public JSON-LD pages", () => {
    for (const path of [
      "/admin/appeals",
      "/api/donations/order",
      "/donate/reviewed-case",
      "/donations/receipt",
      "/request-assistance/status",
      "/%61dmin/appeals",
      "/%2561dmin/appeals",
      "/about/../api/private",
    ]) {
      expect(normalizeStructuredDataPath(path), path).toBeNull();
      expect(buildPublicStructuredData({
        type: "WebPage", title: "Not a public record",
        description: "Must not appear in public JSON-LD",
        path,
      }, "https://amaanafoundation.org"), path).toBeNull();
    }
    expect(normalizeStructuredDataPath("/our-work/eid-gift-kits")).toBe("/our-work/eid-gift-kits");
    expect(normalizeStructuredDataPath("/donate")).toBe("/donate");
  });

  it("blocks private app image routes from structured data, including encoded and absolute aliases", () => {
    for (const imageUrl of [
      "/admin/private-photo.webp",
      "/api/private/media.jpg",
      "/donations/receipt.webp",
      "/%61dmin/secret.webp",
      "/%2561dmin/secret.webp",
      "https://amaanafoundation.org/admin/secret.webp",
      "https://www.amaanafoundation.org/api/private.webp",
    ]) {
      expect(normalizeStructuredDataImage(imageUrl, "https://amaanafoundation.org"), imageUrl).toBeNull();
      const data = buildPublicStructuredData({
        type: "Article",
        title: "Reviewed public narrative",
        description: "Evidence summary",
        path: "/stories/reviewed",
        imageUrl,
      }, "https://amaanafoundation.org");
      expect(data, imageUrl).not.toHaveProperty("image");
    }

    expect(normalizeStructuredDataImage("/media/approved.webp", "https://amaanafoundation.org"))
      .toBe("https://amaanafoundation.org/media/approved.webp");
    expect(normalizeStructuredDataImage("https://cdn.example.org/public-approved.webp", "https://amaanafoundation.org"))
      .toBe("https://cdn.example.org/public-approved.webp");
  });

  it("fails closed when runtime JSON-LD input violates the schema", () => {
    expect(buildPublicStructuredData({
      type: "Article",
      title: 42,
      description: "Invalid runtime input",
      path: "/stories/invalid",
    } as unknown as Parameters<typeof buildPublicStructuredData>[0], "https://amaanafoundation.org")).toBeNull();

    expect(buildPublicStructuredData({
      type: "Article",
      title: "Valid title",
      description: "Invalid runtime input",
      path: "/stories/invalid",
      keywords: new Array(51).fill("keyword"),
    } as unknown as Parameters<typeof buildPublicStructuredData>[0], "https://amaanafoundation.org")).toBeNull();
  });

  it("does not publish invented dates when an ISO calendar day does not exist", () => {
    for (const invalidDate of ["2026-02-29", "2026-02-30", "2026-04-31", "2026-02-30T10:00:00+05:30", "2026-02-30Z", "2026-02-30t10:00:00z"]) {
      const data = buildPublicStructuredData({
        type: "Article",
        title: "Reviewed evidence",
        description: "A public-safe record",
        path: "/stories/reviewed-evidence",
        publishedAt: invalidDate,
        modifiedAt: invalidDate,
      }, "https://amaanafoundation.org");
      expect(data, invalidDate).not.toHaveProperty("datePublished");
      expect(data, invalidDate).not.toHaveProperty("dateModified");
    }

    const leapDay = buildPublicStructuredData({
      type: "Article", title: "Leap-year programme",
      description: "A verified public account", path: "/stories/leap-year",
      publishedAt: "2024-02-29",
    }, "https://amaanafoundation.org");
    expect(leapDay).toHaveProperty("datePublished", "2024-02-29T00:00:00.000Z");
  });

  it("does not claim an Article modification occurred before it was published", () => {
    const data = buildPublicStructuredData({
      type: "Article", title: "Documented programme",
      description: "A verified public account", path: "/stories/documented",
      publishedAt: "2026-09-20T10:00:00+05:30",
      modifiedAt: "2026-09-20T04:00:00.000Z",
    }, "https://amaanafoundation.org");
    expect(data).toHaveProperty("datePublished", "2026-09-20T04:30:00.000Z");
    expect(data).not.toHaveProperty("dateModified");

    const chronological = buildPublicStructuredData({
      type: "Article", title: "Documented programme",
      description: "A verified public account", path: "/stories/documented",
      publishedAt: "2026-09-20T10:00:00+05:30",
      modifiedAt: "2026-09-20T05:00:00.000Z",
    }, "https://amaanafoundation.org");
    expect(chronological).toHaveProperty("dateModified", "2026-09-20T05:00:00.000Z");
  });

  it("escapes script-sensitive characters in serialized JSON-LD", () => {
    const serialized = serializeStructuredData({ value: "</script><script>alert('x')</script>&\u2028\u2029" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("\u2028");
    expect(serialized).not.toContain("\u2029");
    expect(serialized).toContain("\\u003c");
    expect(serialized).toContain("\\u0026");
    expect(serialized).toContain("\\u2028");
    expect(serialized).toContain("\\u2029");
  });
});
