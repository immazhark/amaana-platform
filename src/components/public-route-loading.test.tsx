import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicRouteLoading } from "./public-route-loading";

describe("branded public route streaming fallbacks", () => {
  it("exposes a meaningful accessible loading status without fabricated imagery", () => {
    const html = renderToStaticMarkup(<PublicRouteLoading context="verified appeals" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Loading verified appeals"');
    expect(html).toContain("Loading verified appeals. Content is being prepared.");
    expect(html).not.toMatch(/<img\b|<iframe\b|src="https?:/);
    expect((html.match(/data-loading-card="true"/g) ?? [])).toHaveLength(3);
  });
  it("uses the standardized four-card geometry on the work index", () => {
    const html = renderToStaticMarkup(<PublicRouteLoading context="our work" cards={4} />);
    expect((html.match(/data-loading-card="true"/g) ?? [])).toHaveLength(4);
    expect(html).toContain('data-grid-columns="4"');
  });
  it("escapes status text", () => {
    const html = renderToStaticMarkup(<PublicRouteLoading context={'<script>alert("x")</script>'} />);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
