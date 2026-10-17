import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FeedbackEnquiryBuilder } from "./feedback-enquiry-builder";

describe("private feedback enquiry", () => {
  it("offers the three consent-safe enquiry types without storing a report", () => {
    const markup = renderToStaticMarkup(createElement(FeedbackEnquiryBuilder));
    for (const label of ["Concern or complaint", "Suggestion or improvement", "Private appreciation"]) {
      expect(markup).toContain(label);
    }
    expect(markup.split("mailto:amaanafoundation24@gmail.com?").length - 1).toBe(3);
    expect(markup).toContain("not a tracked complaint ticket");
    expect(markup).toContain("never permission to publish");
    expect((markup.match(/data-feedback-kind=/g) ?? [])).toHaveLength(3);
    expect(markup).toContain("Prepare private message");
    expect(markup).toContain("Raise a service, safety or conduct concern");
    expect(markup).not.toContain("<form");
    expect(markup).not.toContain("<input");
    expect(markup).not.toContain("<textarea");
  });

  it("stays server-rendered without a new client hydration or submission endpoint", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(new URL("./feedback-enquiry-builder.tsx", import.meta.url), "utf8");
    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("useState");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("localStorage");
  });
});
