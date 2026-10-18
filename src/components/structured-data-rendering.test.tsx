import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppealStructuredData } from "./appeal-structured-data";
import { BreadcrumbStructuredData } from "./breadcrumb-structured-data";
import { StructuredData } from "./structured-data";

const harmfulText = "</script><script>alert('x')</script>&>\u2028\u2029";

function extractJsonLd(markup: string) {
  const match = markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Expected JSON-LD script tag");
  expect(markup.match(/<script/g)).toHaveLength(1);
  expect(markup).not.toContain("</script><script>");
  expect(match[1]).not.toContain("<");
  expect(match[1]).not.toContain(">");
  expect(match[1]).not.toContain("&");
  expect(match[1]).not.toContain("\u2028");
  expect(match[1]).not.toContain("\u2029");
  expect(match[1]).toContain("\\u003c");
  expect(match[1]).toContain("\\u003e");
  expect(match[1]).toContain("\\u0026");
  expect(match[1]).toContain("\\u2028");
  expect(match[1]).toContain("\\u2029");
  return JSON.parse(match[1]) as Record<string, unknown>;
}

describe("all public JSON-LD entry points use the reviewed serializer", () => {
  it("escapes supplied appeal text and round-trips valid Schema.org data", () => {
    const markup = renderToStaticMarkup(<AppealStructuredData
      slug="synthetic-appeal"
      title={harmfulText}
      summary={harmfulText}
      isOpen
    />);
    const data = extractJsonLd(markup);
    const graph = data["@graph"] as Array<Record<string, unknown>>;
    expect(graph[0].name).toBe(harmfulText);
    expect(graph[0].description).toBe(harmfulText);
    expect(graph[1]["@type"]).toBe("DonateAction");
  });

  it("escapes supplied breadcrumb labels and round-trips the original name", () => {
    const markup = renderToStaticMarkup(<BreadcrumbStructuredData items={[
      { name: harmfulText, path: "/our-work/synthetic" },
    ]} />);
    const data = extractJsonLd(markup);
    const elements = data.itemListElement as Array<Record<string, unknown>>;
    expect(elements[0].name).toBe(harmfulText);
    expect(elements[0].position).toBe(1);
  });

  it("retains the organization and website schema nodes", () => {
    const markup = renderToStaticMarkup(<StructuredData />);
    const content = markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(content).toBeTruthy();
    const json = JSON.parse(content || "{}");
    expect(json["@graph"].map((node: { "@type": string | string[] }) => node["@type"])).toContain("WebSite");
  });
});
