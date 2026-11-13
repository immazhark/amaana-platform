import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlobalError from "./global-error";

describe("root error boundary recovery", () => {
  it("provides usable internal escape links when the root app cannot recover", () => {
    const markup = renderToStaticMarkup(<GlobalError error={new Error("Synthetic failure")} reset={vi.fn()} />);
    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/contact"');
    expect(markup).toContain(">Return home</a>");
    expect(markup).toContain(">Contact Amaana</a>");
  });

  it("keeps the failure message and digest out of public error markup", () => {
    const error = Object.assign(new Error("SYNTHETIC_PRIVATE_FAILURE"), { digest: "SYNTHETIC_PRIVATE_DIGEST" });
    const markup = renderToStaticMarkup(<GlobalError error={error} reset={vi.fn()} />);
    expect(markup).not.toContain("SYNTHETIC_PRIVATE_FAILURE");
    expect(markup).not.toContain("SYNTHETIC_PRIVATE_DIGEST");
    expect(markup).toContain("Try again");
  });
});
