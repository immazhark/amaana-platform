import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlobalError from "./global-error";

function render() {
  return renderToStaticMarkup(createElement(GlobalError, {
    error: new Error("PRIVATE-DIAGNOSTIC-NOT-FOR-PUBLIC-OUTPUT"),
    reset: () => undefined,
  }));
}

describe("standalone global-error fallback", () => {
  it("keeps its label readable without depending on root stylesheets", () => {
    const labelStyle = render().match(/<p style="([^"]+)">Amaana Foundation/)?.[1];
    expect(labelStyle).toBeDefined();
    const size = labelStyle?.match(/font-size:([\d.]+)rem/)?.[1];
    expect(Number(size)).toBeGreaterThanOrEqual(.75);
  });
  it("reserves readable multiline heading spacing without the normal layout", () => {
    const headingStyle = render().match(/<h1 style="([^"]+)"/)?.[1];
    expect(headingStyle).toBeDefined();
    const leading = headingStyle?.match(/line-height:([\d.]+)/)?.[1];
    expect(Number(leading)).toBeGreaterThanOrEqual(1.12);
  });
  it("retains a complete document, one heading and safe public recovery guidance", () => {
    const html = render();
    expect(html).toContain('<html lang="en-IN">');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('type="button"');
    expect(html).toContain("Try again");
    expect(html).toContain("UPI PIN");
    expect(html).not.toContain("PRIVATE-DIAGNOSTIC-NOT-FOR-PUBLIC-OUTPUT");
  });
});
