import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LegacyGivingPage, { metadata } from "./page";

describe("AF-R093 reviewed legacy-giving enquiry", () => {
  it("is an informational non-indexed route, not a donation or bequest checkout", () => {
    expect(metadata.alternates).toMatchObject({ canonical: "/get-involved/legacy-giving" });
    expect(metadata.robots).toMatchObject({ index: false, follow: false, noarchive: true });
    const html = renderToStaticMarkup(<LegacyGivingPage />);
    expect(html).toContain("A legacy begins with care.");
    expect(html).toContain("Seek independent advice");
    expect(html).toContain("Amaana does not draft wills");
    expect(html).toContain("No payment");
    expect(html).toContain("No legal documents collected");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("type=\"file\"");
    expect(html).not.toContain("data-razorpay");
  });

  it("directs enquiries to existing governance, compliance, and contact routes", () => {
    const html = renderToStaticMarkup(<LegacyGivingPage />);
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="/governance"');
    expect(html).toContain('href="/compliance"');
    expect(html).toContain("No religious ruling");
    expect(html).toContain("family obligations");
  });

  it("is discoverable from the public Get Involved route", () => {
    const page = readFileSync(new URL("../page.tsx", import.meta.url), "utf8");
    expect(page).toContain('href="/get-involved/legacy-giving"');
  });
});
