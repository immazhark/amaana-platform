import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("public not-found recovery destinations", () => {
  it("offers a real contact destination matching the on-page guidance", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain("contact us");
    expect(html).toContain('href="/contact"');
    expect(html).toContain("Contact Amaana");
  });

  it("preserves home, work and approved appeals navigation", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/our-work"');
    expect(html).toContain('href="/appeals"');
  });
});
