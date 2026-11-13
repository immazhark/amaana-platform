import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  appeal: { findMany: vi.fn() },
  initiative: { findMany: vi.fn() },
  story: { findMany: vi.fn() },
  faithContent: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import robots from "./robots";
import { PRIVATE_ROUTE_PREFIXES } from "@/lib/public-routing";

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.stubEnv("APP_ENVIRONMENT", "production");
  vi.stubEnv("NEXT_PUBLIC_ALLOW_INDEXING", "true");
  db.appeal.findMany.mockResolvedValue([]);
  db.initiative.findMany.mockResolvedValue([{ slug: "synthetic-initiative", updatedAt: new Date("2026-10-20T00:00:00Z") }]);
  db.story.findMany.mockResolvedValue([{ slug: "synthetic-story", updatedAt: new Date("2026-10-20T00:00:00Z") }]);
  db.faithContent.findMany.mockResolvedValue([]);
});
afterEach(() => vi.unstubAllEnvs());

describe("public crawl metadata URLs", () => {
  it.each([
    "https://amaanafoundation.org/configured/path?preview=1#settings",
    "https://amaanafoundation.org///",
    "https://amaanafoundation.org/",
  ])("uses origin-only crawler URLs for %s", async configured => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", configured);
    const directives = robots();
    expect(directives.sitemap).toBe("https://amaanafoundation.org/sitemap.xml");
    expect(directives.host).toBe("https://amaanafoundation.org");
    expect(directives.rules).toEqual({ userAgent: "*", allow: "/", disallow: [...PRIVATE_ROUTE_PREFIXES] });

    const { default: sitemap } = await import("./sitemap");
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      const url = new URL(entry.url);
      expect(url.origin).toBe("https://amaanafoundation.org");
      expect(url.search).toBe("");
      expect(url.hash).toBe("");
      expect(url.pathname).not.toContain("//");
      expect(url.pathname).not.toContain("configured");
    }
    expect(entries.map(entry => entry.url)).toContain("https://amaanafoundation.org/our-work/synthetic-initiative");
    expect(entries.map(entry => entry.url)).toContain("https://amaanafoundation.org/stories/synthetic-story");
    expect(db.initiative.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED", cause: { status: "PUBLISHED" } } }));
    expect(db.story.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED", privacyApprovedAt: { not: null } } }));
  });

  it("refuses malformed published database slugs without suppressing valid sitemap entries", async () => {
    const now = new Date("2026-11-12T00:00:00.000Z");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    db.initiative.findMany.mockResolvedValue([
      { slug: "safe-initiative", updatedAt: now },
      { slug: "bad?token=private", updatedAt: now },
    ]);
    db.story.findMany.mockResolvedValue([
      { slug: "safe-story", updatedAt: now },
      { slug: "../private", updatedAt: now },
    ]);
    db.faithContent.findMany.mockResolvedValue([
      { slug: "safe-reminder", updatedAt: now, status: "PUBLISHED", religiousReviewStatus: "VERIFIED", verifiedAt: now, sourceCitation: "Synthetic source for test" },
      { slug: "bad#fragment", updatedAt: now, status: "PUBLISHED", religiousReviewStatus: "VERIFIED", verifiedAt: now, sourceCitation: "Synthetic source for test" },
    ]);
    db.appeal.findMany.mockResolvedValue([
      { slug: "safe-appeal", title: "Synthetic safe appeal", status: "PUBLISHED", updatedAt: now, assistanceRequest: null },
      { slug: "%2Fprivate", title: "Synthetic invalid appeal", status: "PUBLISHED", updatedAt: now, assistanceRequest: null },
    ]);

    const { default: sitemap } = await import("./sitemap");
    const urls = (await sitemap()).map(entry => entry.url);
    const site = "https://amaanafoundation.org";
    for (const path of [
      "/our-work/safe-initiative", "/stories/safe-story",
      "/faith-and-reflections/safe-reminder", "/appeals/safe-appeal",
    ]) expect(urls).toContain(site + path);

    for (const path of [
      "/our-work/bad?token=private", "/stories/../private",
      "/faith-and-reflections/bad#fragment", "/appeals/%2Fprivate",
    ]) expect(urls, `Untrusted DB slug must not be published: ${path}`).not.toContain(site + path);
    expect(urls.every(url => { const parsed = new URL(url); return !parsed.search && !parsed.hash; })).toBe(true);
  });

  it("never indexes assistance-linked appeals without reviewed confidentiality", async () => {
    const updatedAt = new Date("2026-11-13T00:00:00.000Z");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const appeal = (slug: string, assistanceRequest: unknown) => ({
      slug, title: "Synthetic public appeal", status: "PUBLISHED", updatedAt, assistanceRequest,
    });
    db.appeal.findMany.mockResolvedValue([
      appeal("public-unlinked", null),
      appeal("reviewed-linked", { verification: { confidentialityLevel: "STANDARD" } }),
      appeal("linked-verification-missing", { verification: null }),
      appeal("linked-classification-missing", { verification: { confidentialityLevel: null } }),
    ]);

    const { default: sitemap } = await import("./sitemap");
    const urls = (await sitemap()).map(entry => entry.url);
    expect(urls).toContain("https://amaanafoundation.org/appeals/public-unlinked");
    expect(urls).toContain("https://amaanafoundation.org/appeals/reviewed-linked");
    expect(urls).not.toContain("https://amaanafoundation.org/appeals/linked-verification-missing");
    expect(urls).not.toContain("https://amaanafoundation.org/appeals/linked-classification-missing");
  });

  it.each([
    ["https://amaanafoundation.org", "staging", "true"],
    ["https://preview.example.org", "production", "true"],
    ["https://amaanafoundation.org", "production", "false"],
    ["invalid-url", "production", "true"],
  ])("keeps indexing blocked for %s / %s / %s", async (url, environment, flag) => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", url);
    vi.stubEnv("APP_ENVIRONMENT", environment);
    vi.stubEnv("NEXT_PUBLIC_ALLOW_INDEXING", flag);
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    const { default: sitemap } = await import("./sitemap");
    expect(await sitemap()).toEqual([]);
    for (const model of Object.values(db)) expect(model.findMany).not.toHaveBeenCalled();
  });
});
