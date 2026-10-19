import { describe, expect, it } from "vitest";
import { buildPublishedLanguageAlternates, publicLocaleDirection } from "./public-locales";

describe("public locale publication", () => {
  it("excludes draft and unreviewed translations", () => {
    expect(buildPublishedLanguageAlternates("/contact", [
      { locale: "ur", path: "/ur/contact", status: "DRAFT", reviewed: true },
      { locale: "te", path: "/te/contact", status: "PUBLISHED", reviewed: false },
    ])).toEqual({ en: "/contact" });
  });

  it("includes exact reviewed published counterparts", () => {
    expect(buildPublishedLanguageAlternates("/contact", [
      { locale: "ur", path: "/ur/contact", status: "PUBLISHED", reviewed: true },
      { locale: "te", path: "/te/contact", status: "PUBLISHED", reviewed: true },
    ])).toEqual({ en: "/contact", ur: "/ur/contact", te: "/te/contact" });
  });

  it("blocks external, private and query-bearing alternate paths", () => {
    expect(buildPublishedLanguageAlternates("/contact", [
      { locale: "ur", path: "//host.invalid/ur/contact", status: "PUBLISHED", reviewed: true },
      { locale: "te", path: "/te/admin", status: "PUBLISHED", reviewed: true },
      { locale: "hi", path: "/hi/contact?token=1", status: "PUBLISHED", reviewed: true },
    ])).toEqual({ en: "/contact" });
  });

  it("never advertises translated private application routes", () => {
    expect(buildPublishedLanguageAlternates("/admin", [
      { locale: "ur", path: "/ur/admin", status: "PUBLISHED", reviewed: true },
    ])).toEqual({});
  });

  it("sets RTL only for Urdu", () => {
    expect(publicLocaleDirection("ur")).toBe("rtl");
    expect(publicLocaleDirection("en")).toBe("ltr");
    expect(publicLocaleDirection("te")).toBe("ltr");
    expect(publicLocaleDirection("hi")).toBe("ltr");
  });
});
