import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScrollCarousel } from "./scroll-carousel";

function renderStartingAt(startAt: number) {
  return renderToStaticMarkup(
    <ScrollCarousel label="Synthetic programme slides" startAt={startAt}>
      <p key="first">First reviewed slide</p>
      <p key="second">Second reviewed slide</p>
    </ScrollCarousel>,
  );
}

describe("public carousel initial index boundary", () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "falls back to the first accessible slide for non-finite startAt %s",
    startAt => {
      const html = renderStartingAt(startAt);
      expect(html).toContain('aria-valuenow="1"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("Infinity");
      expect(html).toContain('data-active="true"');
    },
  );

  it("truncates fractional initial positions before choosing an accessible slide", () => {
    const html = renderStartingAt(1.75);
    expect(html).toContain('aria-valuenow="2"');
    expect(html).not.toContain('aria-valuenow="2.75"');
  });

  it.each([
    [-9, 1],
    [0, 1],
    [1, 2],
    [99, 2],
  ])("preserves bounded integer startAt %i as slide %i", (startAt, expected) => {
    expect(renderStartingAt(startAt)).toContain(`aria-valuenow="${expected}"`);
  });
});
