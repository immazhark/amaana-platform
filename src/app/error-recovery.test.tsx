import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ErrorPage from "./error";

const source = readFileSync(resolve(process.cwd(), "src/app/error.tsx"), "utf8");

describe("route error recovery", () => {
  it("uses native full-document anchors when the client route has failed", () => {
    expect(source).not.toMatch(/from\s+["']next\/link["']/);
    expect(source).toMatch(/<a\s+[^>]*href="\/"[^>]*>/);
    expect(source).toMatch(/<a\s+[^>]*href="\/contact"[^>]*>/);
  });

  it("preserves reset and safe recovery copy without disclosing failures", () => {
    const error = Object.assign(new Error("SYNTHETIC_PRIVATE_FAILURE"), {
      digest: "SYNTHETIC_PRIVATE_DIGEST",
    });
    const html = renderToStaticMarkup(<ErrorPage error={error} reset={() => {}} />);
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/contact"');
    expect(html).not.toContain("SYNTHETIC_PRIVATE_FAILURE");
    expect(html).not.toContain("SYNTHETIC_PRIVATE_DIGEST");
  });
});
