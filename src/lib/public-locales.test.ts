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

  it("does not reinterpret an already localized path as an English canonical route", () => {
    for (const path of ["/en/contact", "/ur/contact", "/te/contact", "/hi/contact", "/ur"]) {
      expect(buildPublishedLanguageAlternates(path, [
        { locale: "te", path: `/te${path}`, status: "PUBLISHED", reviewed: true },
      ])).toEqual({});
    }
  });

  it("does not confuse route names beginning with language letters for locale prefixes", () => {
    expect(buildPublishedLanguageAlternates("/urgent", [
      { locale: "te", path: "/te/urgent", status: "PUBLISHED", reviewed: true },
    ])).toEqual({ en: "/urgent", te: "/te/urgent" });
  });

  it("sets RTL only for Urdu", () => {
    expect(publicLocaleDirection("ur")).toBe("rtl");
    expect(publicLocaleDirection("en")).toBe("ltr");
    expect(publicLocaleDirection("te")).toBe("ltr");
    expect(publicLocaleDirection("hi")).toBe("ltr");
  });
});
