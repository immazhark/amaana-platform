import { describe, expect, it } from "vitest";
import { canListAppealInSitemap } from "@/lib/sitemap-privacy";

describe("sitemap appeal privacy", () => {
  it("excludes highly sensitive appeals from search discovery", () => {
    expect(canListAppealInSitemap("HIGHLY_SENSITIVE")).toBe(false);
  });

  it("keeps standard, confidential and unlinked appeals eligible", () => {
    expect(canListAppealInSitemap("STANDARD")).toBe(true);
    expect(canListAppealInSitemap("CONFIDENTIAL")).toBe(true);
    expect(canListAppealInSitemap(null)).toBe(true);
    expect(canListAppealInSitemap(undefined)).toBe(true);
  });
});
