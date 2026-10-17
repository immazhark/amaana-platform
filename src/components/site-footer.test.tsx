import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "./site-footer";

describe("persistent giving navigation", () => {
  it("uses the approved giving route without implying a public appeal is currently open", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain("Review approved giving routes");
    expect(html).toContain('href="/donate"');
    expect(html).not.toContain("Support a verified need");
    expect(html).toContain('href="/appeals"');
    expect(html).toContain('href="/transparency"');
  });
});
