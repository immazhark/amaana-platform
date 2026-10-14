import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VerifiedImpactStrip } from "./verified-impact-strip";

describe("published-only donation trust evidence", () => {
  it("never fabricates totals when the published projection has no metrics", () => {
    const output = renderToStaticMarkup(<VerifiedImpactStrip items={[]} />);
    expect(output).toBe("");
  });

  it("preserves each published initiative's own metric and evidence link", () => {
    const markup = renderToStaticMarkup(<VerifiedImpactStrip items={[
      { slug: "eid-gift-kits-2026", title: "Eid kits 2026", value: "710", label: "kits distributed in 2026" },
      { slug: "winter-relief-2025", title: "Winter relief", value: "234", label: "kits in 2025–26" },
    ]}/>);
    expect(markup).toContain("710");
    expect(markup).toContain("234");
    expect(markup).toContain("/our-work/eid-gift-kits-2026");
    expect(markup).toContain("/our-work/winter-relief-2025");
    expect(markup).toContain("not live donation balances");
    expect(markup).not.toContain("of target");
    expect(markup).not.toContain("raised to date");
  });

  it("limits the strip to three separate documented outcomes", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      slug: `published-${i}`, title: `Published ${i}`,
      value: String(i + 1), label: "documented individual result",
    }));
    const markup = renderToStaticMarkup(<VerifiedImpactStrip items={items}/>);
    expect(markup).not.toContain("/our-work/published-3");
    expect(markup).not.toContain("/our-work/published-4");
    expect(markup).toContain("/impact");
  });

  it("refuses unsafe or missing public initiative links and deduplicates publication rows", () => {
    const markup = renderToStaticMarkup(<VerifiedImpactStrip headingId="safe-evidence" items={[
      { slug: "../admin", title: "Unsafe", value: "999", label: "unsafe" },
      { slug: "valid-edition", title: "Approved drive", value: "123", label: "kits" },
      { slug: "valid-edition", title: "Stale duplicate", value: "456", label: "duplicated" },
      { slug: "blank-metric", title: "Unverified", value: " ", label: "kits" },
      { slug: "https-bad", title: "", value: "0", label: "nothing" },
    ]} />);
    expect(markup).toContain('id="safe-evidence"');
    expect(markup).toContain("/our-work/valid-edition");
    expect(markup).toContain("123");
    expect(markup).not.toContain("999");
    expect(markup).not.toContain("456");
    expect(markup).not.toContain("/admin");
    expect(markup).not.toContain("/our-work/blank-metric");
  });

  it("omits the entire strip when no trustworthy linkable metric survives validation", () => {
    const markup = renderToStaticMarkup(<VerifiedImpactStrip items={[
      { slug: "../../sensitive", title: "Unapproved", value: "2", label: "claims" },
    ]}/>);
    expect(markup).toBe("");
  });

  it("escapes untrusted published strings instead of turning them into HTML", () => {
    const markup = renderToStaticMarkup(<VerifiedImpactStrip items={[
      { slug: "safe-slug", title: "<script>alert(1)</script>", value: "1",
        label: "case <img src=x onerror=alert(1)>" },
    ]}/>);
    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain("<img src=x");
    expect(markup).toContain("&lt;script&gt;");
  });
});
