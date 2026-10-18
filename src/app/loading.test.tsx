import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RootLoading from "./loading";

describe("AF-R071 App Router fallback coverage", () => {
  it("provides a root-level loading boundary for uncached public routes", () => {
    const html = renderToStaticMarkup(<RootLoading />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Loading the Amaana Foundation page");
    expect(html).not.toContain("Donation received");
    expect(html).not.toContain("<img");
  });
});
