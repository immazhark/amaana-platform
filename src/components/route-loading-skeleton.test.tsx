import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RouteLoadingSkeleton } from "./route-loading-skeleton";

describe("AF-R071 route-loading experience", () => {
  it.each(["cards", "form", "editorial"] as const)(
    "announces %s loading without inventing content or exposing records",
    layout => {
      const markup = renderToStaticMarkup(
        <RouteLoadingSkeleton layout={layout} label="Loading reviewed public content" />,
      );
      expect(markup).toContain('role="status"');
      expect(markup).toContain('aria-live="polite"');
      expect(markup).toContain('aria-busy="true"');
      expect(markup).toContain('data-loading-view="' + layout + '"');
      expect(markup).toContain("Loading reviewed public content");
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).not.toMatch(/₹|raised|beneficiar|test@example|spinner|animate-pulse/);
      expect(markup).not.toContain("<img");
    },
  );

  it("keeps the loading heading readable and does not impersonate published evidence", () => {
    const markup = renderToStaticMarkup(
      <RouteLoadingSkeleton layout="cards" label="Loading published initiatives" />,
    );
    expect(markup).toContain("Loading published initiatives");
    expect(markup).not.toContain("710");
    expect(markup).not.toContain("234");
    expect(markup).not.toContain("Donation received");
  });
});
