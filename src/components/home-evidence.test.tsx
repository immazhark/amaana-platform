import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeTrust } from "./home-evidence";

describe("public support CTA accuracy", () => {
  it("offers approved giving options when no public appeal is active", () => {
    const html = renderToStaticMarkup(<HomeTrust hasOpenAppeals={false} />);
    expect(html).toContain('href="/donate"');
    expect(html).toContain("Review approved ways to give");
    expect(html).not.toContain("Support a verified need");
    expect(html).toContain('href="/request-assistance"');
  });
  it("routes reviewed appeal interest through the bounded donation destination", () => {
    const html = renderToStaticMarkup(<HomeTrust hasOpenAppeals />);
    expect(html).toContain("Review a verified appeal or approved fund");
    expect(html).toContain('href="/donate"');
    expect(html).toContain('href="/transparency"');
  });
});
