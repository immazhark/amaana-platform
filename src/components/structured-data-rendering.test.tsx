import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppealStructuredData } from "./appeal-structured-data";
import { BreadcrumbStructuredData } from "./breadcrumb-structured-data";
import { StructuredData } from "./structured-data";

afterEach(() => vi.unstubAllEnvs());

const harmfulText = "</script><script>alert('x')</script>&>\u2028\u2029";

function extractJsonLd(markup: string) {
  const match = markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const serialized = match?.[1];
  if (serialized === undefined) throw new Error("Expected JSON-LD script tag");
  expect(markup.match(/<script/g)).toHaveLength(1);
  expect(markup).not.toContain("</script><script>");
  expect(serialized).not.toContain("<");
  expect(serialized).not.toContain(">");
  expect(serialized).not.toContain("&");
  expect(serialized).not.toContain("\u2028");
  expect(serialized).not.toContain("\u2029");
  expect(serialized).toContain("\\u003c");
  expect(serialized).toContain("\\u003e");
  expect(serialized).toContain("\\u0026");
  expect(serialized).toContain("\\u2028");
  expect(serialized).toContain("\\u2029");
  return JSON.parse(serialized) as Record<string, unknown>;
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
    const page = graph.at(0);
    const action = graph.at(1);
    if (!page || !action) throw new Error("Expected page and donation action nodes");
    expect(page.name).toBe(harmfulText);
    expect(page.description).toBe(harmfulText);
    expect(action["@type"]).toBe("DonateAction");
  });

  it("escapes supplied breadcrumb labels and round-trips the original name", () => {
    const markup = renderToStaticMarkup(<BreadcrumbStructuredData items={[
      { name: harmfulText, path: "/our-work/synthetic" },
    ]} />);
    const data = extractJsonLd(markup);
    const elements = data.itemListElement as Array<Record<string, unknown>>;
    const crumb = elements.at(0);
    if (!crumb) throw new Error("Expected breadcrumb node");
    expect(crumb.name).toBe(harmfulText);
    expect(crumb.position).toBe(1);
  });

  it("retains the organization and website schema nodes", () => {
    const markup = renderToStaticMarkup(<StructuredData />);
    const content = markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(content).toBeTruthy();
    const json = JSON.parse(content || "{}");
    expect(json["@graph"].map((node: { "@type": string | string[] }) => node["@type"])).toContain("WebSite");
  });
});

function readSchema(markup: string) {
  const content = markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!content) throw new Error("Expected JSON-LD");
  return JSON.parse(content);
}

describe("canonical JSON-LD entity identity", () => {
  it.each([
    "https://amaanafoundation.org/configured/path?preview=1#settings",
    "https://amaanafoundation.org///",
    "not-a-url",
  ])("uses the same canonical origin for every schema with %s", configured => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", configured);
    const site = readSchema(renderToStaticMarkup(<StructuredData />));
    const appeal = readSchema(renderToStaticMarkup(<AppealStructuredData
      slug="synthetic-appeal" title="Public appeal" summary="Reviewed summary" isOpen
    />));
    const breadcrumbs = readSchema(renderToStaticMarkup(<BreadcrumbStructuredData items={[
      { name: "Home", path: "/" }, { name: "Our Work", path: "/our-work" },
    ]} />));

    expect(site["@graph"][0]["@id"]).toBe("https://amaanafoundation.org/#organization");
    expect(site["@graph"][1]["@id"]).toBe("https://amaanafoundation.org/#website");
    expect(appeal["@graph"][0].about).toEqual({ "@id": site["@graph"][0]["@id"] });
    expect(appeal["@graph"][0].isPartOf).toEqual({ "@id": site["@graph"][1]["@id"] });
    expect(appeal["@graph"][1].target.urlTemplate).toBe("https://amaanafoundation.org/donate/synthetic-appeal");
    expect(breadcrumbs.itemListElement.map((item: { item: string }) => item.item)).toEqual([
      "https://amaanafoundation.org/", "https://amaanafoundation.org/our-work",
    ]);
  });

  it("preserves privacy-sensitive appeal redaction and suppresses its donation action", () => {
    const schema = readSchema(renderToStaticMarkup(<AppealStructuredData
      slug="synthetic-private" title="Private name" summary="Private diagnosis" isOpen highlySensitive
    />));
    expect(schema["@graph"]).toHaveLength(1);
    expect(schema["@graph"][0].name).toBe("Verified Support Appeal");
    expect(JSON.stringify(schema)).not.toContain("Private name");
    expect(JSON.stringify(schema)).not.toContain("Private diagnosis");
  });
});
