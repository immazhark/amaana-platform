import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RouteLoadingSkeleton } from "./route-loading-skeleton";

describe("public route loading skeleton", () => {
  it.each([
    ["donate", "Checking currently approved donation routes"],
    ["appeals", "Loading reviewed appeal information"],
    ["impact", "Loading published impact records"],
    ["work", "Loading published programmes"],
    ["detail", "Loading reviewed programme details"],
  ] as const)("announces %s without claiming real amounts or beneficiary details", (variant, announcement) => {
    const html = renderToStaticMarkup(<RouteLoadingSkeleton variant={variant}/>);
    expect(html).toContain(announcement);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("₹");
    expect(html).not.toContain("test@example.com");
    expect(html).not.toContain('role="progressbar"');
  });
  it("keeps stable semantic layout on repeated rendering", () => {
    const first = renderToStaticMarkup(<RouteLoadingSkeleton variant="donate"/>);
    const second = renderToStaticMarkup(<RouteLoadingSkeleton variant="donate"/>);
    expect(first).toBe(second);
    expect((first.match(/aria-hidden="true"/g) ?? []).length).toBe(1);
  });
});
