import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StructuredData } from "./structured-data";
import { BreadcrumbStructuredData } from "./breadcrumb-structured-data";
import { AppealStructuredData } from "./appeal-structured-data";

const sensitiveText = "A > B & C </script><script>synthetic</script>\u2028\u2029";
function scriptPayload(html: string) {
  expect(html.match(/<script\b/g)).toHaveLength(1);
  const payload = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  expect(payload).toBeDefined();
  return payload!;
}
function expectHardened(payload: string) {
  expect(payload).not.toMatch(/[<>&\u2028\u2029]/);
  for (const escaped of ["\\u003e", "\\u0026", "\\u2028", "\\u2029"]) expect(payload).toContain(escaped);
}

afterEach(() => vi.unstubAllEnvs());
describe("actual JSON-LD rendering boundaries", () => {
  it("uses hardened escaping for Organization configuration while preserving graph identity", () => {
    const siteUrl = `https://amaanafoundation.org/?fixture=${sensitiveText}`;
    vi.stubEnv("NEXT_PUBLIC_APP_URL", siteUrl);
    const payload = scriptPayload(renderToStaticMarkup(createElement(StructuredData)));
    expectHardened(payload);
    const data = JSON.parse(payload);
    expect(data["@graph"][0].url).toBe(siteUrl);
    expect(data["@graph"][1].publisher["@id"]).toBe(`${siteUrl}/#organization`);
  });
  it("escapes Breadcrumb names without altering their parsed text or canonical destination", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const payload = scriptPayload(renderToStaticMarkup(createElement(BreadcrumbStructuredData, { items: [{ name: sensitiveText, path: "/our-work" }] })));
    expectHardened(payload);
    const item = JSON.parse(payload).itemListElement[0];
    expect(item).toMatchObject({ name: sensitiveText, item: "https://amaanafoundation.org/our-work", position: 1 });
  });
  it("escapes public Appeal text while preserving the verified donation action", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const payload = scriptPayload(renderToStaticMarkup(createElement(AppealStructuredData, { slug: "synthetic-appeal", title: sensitiveText, summary: sensitiveText, isOpen: true })));
    expectHardened(payload);
    const graph = JSON.parse(payload)["@graph"];
    expect(graph[0]).toMatchObject({ name: sensitiveText, description: sensitiveText });
    expect(graph[1]).toMatchObject({ "@type": "DonateAction", target: { urlTemplate: "https://amaanafoundation.org/donate/synthetic-appeal" } });
  });
  it("retains sensitive-appeal redaction and omits donation actions", () => {
    const payload = scriptPayload(renderToStaticMarkup(createElement(AppealStructuredData, { slug: "synthetic-appeal", title: sensitiveText, summary: sensitiveText, isOpen: true, highlySensitive: true })));
    const graph = JSON.parse(payload)["@graph"];
    expect(graph).toHaveLength(1);
    expect(graph[0].name).toBe("Verified Support Appeal");
    expect(graph[0].description).not.toContain("synthetic");
    expect(payload).not.toContain("DonateAction");
  });
  it("does not advertise a donation action for a closed appeal", () => {
    const payload = scriptPayload(renderToStaticMarkup(createElement(AppealStructuredData, { slug: "synthetic-appeal", title: "Synthetic closed appeal", summary: "Synthetic test only", isOpen: false })));
    expect(JSON.parse(payload)["@graph"]).toHaveLength(1);
    expect(payload).not.toContain("DonateAction");
  });
});


describe("R-008 runtime JSON-LD input boundaries", () => {
  it.each([
    null, {}, [], [{ name: 42, path: "/" }], [{ name: "Home", path: null }],
    [{ name: "   ", path: "/" }], [{ name: "Home", path: "//untrusted.example/path" }],
    [{ name: "Home", path: "https://untrusted.example/path" }],
    [{ name: "Home", path: "/unsafe\\path" }],
    Array.from({ length: 21 }, () => ({ name: "Home", path: "/" })),
  ])("omits malformed Breadcrumb input without throwing: %j", items => {
    const props = { items } as unknown as Parameters<typeof BreadcrumbStructuredData>[0];
    expect(renderToStaticMarkup(createElement(BreadcrumbStructuredData, props))).toBe("");
  });
  it.each([
    { title: { nested: "invalid" } }, { summary: null }, { isOpen: "false" },
    { highlySensitive: "false" }, { slug: "../other-page" }, { slug: "" },
    { title: " " }, { summary: "" }, { title: "x".repeat(301) },
  ])("omits malformed Appeal input instead of publishing invalid schema: %j", invalid => {
    const props = { slug: "synthetic-appeal", title: "Synthetic title", summary: "Synthetic summary", isOpen: false, ...invalid } as unknown as Parameters<typeof AppealStructuredData>[0];
    expect(renderToStaticMarkup(createElement(AppealStructuredData, props))).toBe("");
  });
});
