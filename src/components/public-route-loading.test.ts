import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicRouteLoading } from "./public-route-loading";

describe("public App Router loading boundaries", () => {
  it("provides one route-specific status while keeping all decorative shells hidden", () => {
    const html = renderToStaticMarkup(createElement(PublicRouteLoading, { section: "Our Work" }));
    expect(html).toContain("Loading Our Work.");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    // Busy presentation must not surround and suppress the live announcement.
    expect(html).toContain('aria-busy="true"');
    expect(html.indexOf('role="status"')).toBeLessThan(html.indexOf('aria-busy="true"'));
    expect((html.match(/aria-hidden="true"/g) ?? []).length).toBe(2);
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("beneficiary");
    expect(html).not.toContain("100%");
  });

  it("keeps one accessible status and two geometric cards on a detail route", () => {
    const html = renderToStaticMarkup(createElement(PublicRouteLoading, {
      section: "Initiative details",
      variant: "detail",
    }));
    expect(html).toContain('data-public-route-loading="detail"');
    expect(html).toContain("Loading Initiative details.");
    expect((html.match(/role="status"/g) ?? []).length).toBe(1);
    expect((html.match(/aria-hidden="true"/g) ?? []).length).toBe(2);
    expect((html.match(/class="[^"]*cardVisual[^"]*"/g) ?? []).length).toBe(2);
  });
});
