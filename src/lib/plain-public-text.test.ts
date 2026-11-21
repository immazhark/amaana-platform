import { describe, expect, it } from "vitest";
import { cleanCopy } from "@/lib/master-copy";
import { plainPublicText } from "@/lib/plain-public-text";

describe("plainPublicText", () => {
  it("drops bold markers and keeps the words", () => {
    expect(plainPublicText("Treatment for **oral cancer** needs **₹8 lakh** in total."))
      .toBe("Treatment for oral cancer needs ₹8 lakh in total.");
  });

  it("drops single-asterisk emphasis, including next to a dash or punctuation", () => {
    expect(plainPublicText("Every gift is an *amaana*—a trust."))
      .toBe("Every gift is an amaana—a trust.");
    expect(plainPublicText("*amanah* is the Arabic word, (*trust*), said *twice*."))
      .toBe("amanah is the Arabic word, (trust), said twice.");
  });

  it("leaves arithmetic, bullets, footnote stars and in-word asterisks alone", () => {
    expect(plainPublicText("5 * 3 * 2 = 30")).toBe("5 * 3 * 2 = 30");
    expect(plainPublicText("* a bullet that starts with a star")).toBe("* a bullet that starts with a star");
    expect(plainPublicText("Fee*")).toBe("Fee*");
    expect(plainPublicText("a*b*c")).toBe("a*b*c");
  });

  it("removes a stray unbalanced double marker without touching other text", () => {
    expect(plainPublicText("Open **today")).toBe("Open today");
  });

  it("preserves paragraph breaks and is idempotent", () => {
    const once = plainPublicText("First **line**.\n\nSecond *line*.");
    expect(once).toBe("First line.\n\nSecond line.");
    expect(plainPublicText(once)).toBe(once);
  });

  it("is what the canonical master-copy cleaner uses, so About no longer shows asterisks", () => {
    expect(cleanCopy("What *amanah* means\n\n**Trust**")).toBe("What amanah means\n\nTrust");
  });
});
