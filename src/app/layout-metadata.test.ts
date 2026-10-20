import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./fonts", () => ({
  amaanaBodyFont: { variable: "body-font" },
  amaanaDisplayFont: { variable: "display-font" },
}));
vi.mock("@/components/site-motion", () => ({ SiteMotion: () => null }));
vi.mock("@/components/site-footer", () => ({ SiteFooter: () => null }));
vi.mock("@/components/site-header", () => ({ SiteHeader: () => null }));
vi.mock("@/components/islamic-companion", () => ({ IslamicCompanion: () => null }));
vi.mock("@/components/analytics", () => ({ Analytics: () => null }));
vi.mock("@/components/web-vitals", () => ({ WebVitals: () => null }));
vi.mock("@/components/structured-data", () => ({ StructuredData: () => null }));
vi.mock("@/components/back-to-top", () => ({ BackToTop: () => null }));
vi.mock("@/components/navigation-progress", () => ({ NavigationProgress: () => null }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("root metadata URL identity", () => {
  it.each([
    "https://amaanafoundation.org/configured/path",
    "https://amaanafoundation.org/configured/path?preview=1#settings",
    "https://amaanafoundation.org///",
    "https://preview.example.org/configured/path?preview=1#settings",
  ])("resolves canonical and social paths from the origin of %s", async configured => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", configured);
    const { metadata } = await import("./layout");
    const base = metadata.metadataBase;
    expect(base).toBeInstanceOf(URL);
    expect(base?.href).toBe(new URL(configured).origin + "/");
    expect(new URL("about", base ?? undefined).href).toBe(new URL(configured).origin + "/about");
    expect(new URL("opengraph-image", base ?? undefined).href).toBe(new URL(configured).origin + "/opengraph-image");
    expect(new URL("twitter-image", base ?? undefined).href).toBe(new URL(configured).origin + "/twitter-image");
  });

  it.each([
    ["production", "true", "https://amaanafoundation.org/path?preview=1", true],
    ["staging", "true", "https://amaanafoundation.org/path", false],
    ["production", "false", "https://amaanafoundation.org", false],
    ["production", "true", "https://preview.example.org/path", false],
  ] as const)("preserves indexing policy for %s/%s/%s", async (environment, flag, configured, allowed) => {
    vi.resetModules();
    vi.stubEnv("APP_ENVIRONMENT", environment);
    vi.stubEnv("NEXT_PUBLIC_ALLOW_INDEXING", flag);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", configured);
    const { metadata } = await import("./layout");
    expect(metadata.robots).toEqual(allowed
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true });
  });
});
