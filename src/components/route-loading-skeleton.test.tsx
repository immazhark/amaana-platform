import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RouteLoadingSkeleton } from "./route-loading-skeleton";

describe("public route loading skeleton", () => {
  it.each([
    ["donate", "Checking currently approved donation routes"],
    ["appeals", "Loading reviewed appeal information"],
    ["impact", "Loading published impact records"],
    ["work", "Loading published programmes"],
    ["appeal-detail", "Loading reviewed appeal details"],
    ["programme-detail", "Loading published programme details"],
    ["story-detail", "Loading approved story details"],
  ] as const)("announces %s without inventing funds or beneficiary details", (variant, text) => {
    const html = renderToStaticMarkup(<RouteLoadingSkeleton variant={variant} />);
    expect(html).toContain(text);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("₹");
    expect(html).not.toContain("test@example.com");
    expect(html).not.toContain("donate now");
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<a ");
  });

  it("renders only one accessible announcement and decorative fixed-shape content", () => {
    const html = renderToStaticMarkup(<RouteLoadingSkeleton variant="appeals" />);
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(1);
    expect(html.split('class="').length).toBeGreaterThan(8);
  });

  it("remains deterministic across server renders", () => {
    const once = renderToStaticMarkup(<RouteLoadingSkeleton variant="donate" />);
    const twice = renderToStaticMarkup(<RouteLoadingSkeleton variant="donate" />);
    expect(once).toBe(twice);
  });
});
