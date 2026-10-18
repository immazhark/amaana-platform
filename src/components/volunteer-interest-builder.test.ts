import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VolunteerInterestBuilder } from "./volunteer-interest-builder";

describe("volunteer interest experience", () => {
  it("renders useful native links without client-only application state or network submission", () => {
    const html = renderToStaticMarkup(createElement(VolunteerInterestBuilder));
    expect(html).toContain("Choose an area of volunteering");
    expect(html).toContain('role="group" aria-label="Volunteer enquiry topics"');
    expect(html).toContain("Technology and website support");
    expect(html).toContain("Distribution and packing");
    expect(html.match(/data-volunteer-skill="/g)).toHaveLength(6);
    expect(html).toContain('aria-labelledby="volunteer-interest-1"');
    expect(html).toContain("Add to my enquiry");
    expect(html).toContain('name="skill"');
    expect(html).toContain('name="availability"');
    expect(html).toContain('name="intent"');
    expect(html).toContain("Review my volunteer enquiry");
    expect(html).toContain('type="checkbox"');
    expect(html.split("mailto:amaanafoundation24@gmail.com?").length - 1).toBe(1);
    expect(html).toContain("Nothing is sent to Amaana until");
    expect(html).toContain("not advertised vacancies");
    expect(html).toContain('method="get"');
    expect(html).not.toContain('type="email"');
    expect(html).toContain("<select");
  });

  it("reviews fixed selected interests and availability without transmitting or storing them", () => {
    const markup = renderToStaticMarkup(createElement(VolunteerInterestBuilder, {
      preferences: { intent: "review", skill: ["Event logistics", "Technology and website support"], availability: "Weekends" },
    }));
    expect(markup).toContain("Review your volunteer enquiry");
    expect(markup).toContain("Event logistics");
    expect(markup).toContain("Technology and website support");
    expect(markup).toContain("Weekends");
    expect(markup).toContain("Open prepared email");
    expect(markup).toContain("mailto:amaanafoundation24@gmail.com?");
    expect(markup).toContain("Nothing has been sent");
  });
  it("fails closed on injected or repeated untrusted parameters", () => {
    const markup = renderToStaticMarkup(createElement(VolunteerInterestBuilder, {
      preferences: { intent: "review", skill: ["Event logistics", "Event logistics"], note: "PRIVATE_INFORMATION" },
    }));
    expect(markup).toContain('role="alert"');
    expect(markup).not.toContain("PRIVATE_INFORMATION");
    expect(markup).not.toContain("Open prepared email");
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
