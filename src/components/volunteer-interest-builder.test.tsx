import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VolunteerInterestBuilder } from "./volunteer-interest-builder";

describe("volunteer interest experience", () => {
  it("renders useful native links without client-only application state or network submission", () => {
    const html = renderToStaticMarkup(<VolunteerInterestBuilder />);
    expect(html).toContain("Choose an area of volunteering");
    expect(html).toContain('role="group" aria-label="Volunteer enquiry topics"');
    expect(html).toContain("Technology and website support");
    expect(html).toContain("Distribution and packing");
    expect(html.split("mailto:amaanafoundation24@gmail.com?").length - 1).toBeGreaterThanOrEqual(7);
    expect(html).toContain("Nothing is sent to Amaana until");
    expect(html).toContain("not advertised vacancies");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("<select");
  });
  it("keeps React client hydration, storage and on-site submissions out of the source", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(new URL("./volunteer-interest-builder.tsx", import.meta.url), "utf8");
    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("useState");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("fetch(");
  });
});
