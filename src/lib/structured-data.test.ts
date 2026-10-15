import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPublicStructuredData,
  normalizeStructuredDataImage,
  normalizeStructuredDataPath,
  validateBreadcrumbStructuredDataInput,
  serializeStructuredData,
} from "./structured-data";

describe("public structured data", () => {
  afterEach(() => vi.unstubAllEnvs());
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

  it("does not advertise transactional or private app routes through public schemas", () => {
    const privatePaths = [
      "/admin/donors", "/api/donations/data-rights", "/donations/AF-PRIVATE/acknowledgement",
      "/donate/example-appeal", "/request-assistance/status", "/_next/image",
      "/%61dmin/assistance", "/%2561pi/private",
    ];
    for (const path of privatePaths) {
      expect(normalizeStructuredDataPath(path), path).toBeNull();
      const data = buildPublicStructuredData({
        type: "WebPage", title: "Private", description: "Not for search", path,
      }, "https://amaanafoundation.org");
      expect(data, path).toBeNull();
      expect(validateBreadcrumbStructuredDataInput([{ name: "Home", path: "/" }, { name: "Private", path }]), path).toBeNull();
    }
    expect(normalizeStructuredDataPath("/donate")).toBe("/donate");
    expect(normalizeStructuredDataPath("/stories/approved")).toBe("/stories/approved");
  });

  it("never emits private or unconfigured image destinations into crawlable JSON-LD", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://media.amaana.example/reviewed");
    const site = "https://amaanafoundation.org";
    const excluded = [
      "/api/donations/private.jpg",
      "/%61dmin/assistance/private.webp",
      "/media/%252e%252e/admin/private.jpg",
      "https://www.amaanafoundation.org/admin/private.jpg",
      "https://amaanafoundation.org./donations/private.jpg",
      "https://unknown.example/picture.jpg",
      "https://media.amaana.example.evil.test/picture.jpg",
    ];
    for (const url of excluded) {
      expect(normalizeStructuredDataImage(url, site), url).toBeNull();
      const data = buildPublicStructuredData({ type: "Article", title: "Reviewed programme",
        description: "Verified public work", path: "/stories/reviewed", imageUrl: url }, site);
      expect(data, url).not.toHaveProperty("image");
    }
    expect(normalizeStructuredDataImage("https://amaanafoundation.org/media/approved.webp", site))
      .toBe("https://amaanafoundation.org/media/approved.webp");
    expect(normalizeStructuredDataImage("https://media.amaana.example/reviewed/photo.webp", site))
      .toBe("https://media.amaana.example/reviewed/photo.webp");
    expect(normalizeStructuredDataImage("/brand/amaana-mark.svg", site))
      .toBe("https://amaanafoundation.org/brand/amaana-mark.svg");
  });

  it("does not let malformed or insecure site origins produce image URLs", () => {
    expect(normalizeStructuredDataImage("/media/approved.jpg", "http://amaanafoundation.org")).toBeNull();
    expect(normalizeStructuredDataImage("/media/approved.jpg", "https://user:pass@amaanafoundation.org")).toBeNull();
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
