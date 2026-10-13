import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Loading from "./loading";

describe("server-rendered route loading boundaries", () => {
  for (const [context, heading] of [
    ["public", "Preparing this page."],
    ["donation", "Preparing donation options."],
    ["assistance", "Preparing your request form."],
  ] as const) {
    it(`provides accessible, privacy-safe ${context} feedback without client JS`, () => {
      const markup = renderToStaticMarkup(<Loading context={context} />);
      expect(markup).toContain("aria-busy=\"true\"");
      expect(markup).toContain("role=\"status\"");
      expect(markup).toContain("aria-live=\"polite\"");
      expect(markup).toContain(heading);
      expect(markup).toContain("amaana-route-skeleton__visual");
      expect(markup).not.toContain("<script");
      expect(markup).not.toContain("<input");
      expect(markup).not.toContain("beneficiary");
    });
  }
  it("defaults to the neutral public page variant", () => {
    expect(renderToStaticMarkup(<Loading />)).toContain("Preparing this page.");
  });
});
