import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppealStructuredData } from "./appeal-structured-data";
import { BreadcrumbStructuredData } from "./breadcrumb-structured-data";

const validAppeal = {
  slug: "synthetic-appeal",
  title: "Reviewed public appeal",
  summary: "Reviewed public summary",
  isOpen: true,
  highlySensitive: false,
};

describe("AF-R008 untrusted public JSON-LD props", () => {
  it.each([
    ["missing items", undefined],
    ["null items", null],
    ["non-array items", { name: "Home", path: "/" }],
    ["null breadcrumb entry", [null]],
    ["non-string breadcrumb name", [{ name: 42, path: "/about" }]],
    ["non-string breadcrumb path", [{ name: "About", path: 42 }]],
    ["blank breadcrumb name", [{ name: "   ", path: "/about" }]],
    ["extra unreviewed breadcrumb field", [{ name: "About", path: "/about", receiptToken: "synthetic-private" }]],
  ])("omits malformed breadcrumb schema: %s", (_label, items) => {
    const props = { items } as unknown as Parameters<typeof BreadcrumbStructuredData>[0];
    expect(renderToStaticMarkup(<BreadcrumbStructuredData {...props} />)).toBe("");
  });

  it.each([
    ["path traversal slug", { slug: "../admin" }],
    ["URL scheme slug", { slug: "https://untrusted.invalid" }],
    ["blank slug", { slug: "" }],
    ["non-string title", { title: 42 }],
    ["null summary", { summary: null }],
    ["non-boolean open flag", { isOpen: "true" }],
    ["non-boolean sensitivity flag", { highlySensitive: "false" }],
    ["extra unreviewed field", { receiptToken: "synthetic-private" }],
  ])("omits malformed appeal schema: %s", (_label, override) => {
    const props = { ...validAppeal, ...override } as unknown as Parameters<typeof AppealStructuredData>[0];
    expect(renderToStaticMarkup(<AppealStructuredData {...props} />)).toBe("");
  });

  it("still publishes reviewed public appeal and breadcrumb schema", () => {
    const appeal = renderToStaticMarkup(<AppealStructuredData {...validAppeal} />);
    const breadcrumb = renderToStaticMarkup(<BreadcrumbStructuredData items={[
      { name: "Home", path: "/" },
      { name: "Current appeals", path: "/appeals" },
    ]} />);
    expect(appeal).toContain('type="application/ld+json"');
    expect(appeal).toContain("DonateAction");
    expect(breadcrumb).toContain('type="application/ld+json"');
    expect(breadcrumb).toContain("BreadcrumbList");
  });
});
