import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/canonical-article", () => ({
  CanonicalArticle: ({ children }: { children?: ReactNode }) =>
    <main data-canonical-body="true">{children}</main>,
}));

import HowWeVerifyPage from "./page";

describe("How We Verify page composition", () => {
  it("renders FAQ inside the existing canonical article content slot", () => {
    const html = renderToStaticMarkup(<HowWeVerifyPage />);
    const main = html.indexOf('<main data-canonical-body="true">');
    const faq = html.indexOf('id="verification-faq"');
    const mainClose = html.indexOf("</main>");

    expect(main).toBeGreaterThanOrEqual(0);
    expect(faq).toBeGreaterThan(main);
    expect(faq).toBeLessThan(mainClose);
    expect(html.match(/id="verification-faq"/g)).toHaveLength(1);
  });
});
