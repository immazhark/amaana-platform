import { createElement } from "react";
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
    expect(markup).toContain('name="kind"');
    expect(markup).toContain('name="topic"');
    expect(markup).toContain("Review feedback");
    expect((markup.match(/data-feedback-kind=/g) ?? [])).toHaveLength(3);
    expect(markup).not.toContain("mailto:amaanafoundation24@gmail.com?");
    expect(markup).toContain("not a tracked complaint ticket");
    expect(markup).toContain("never permission to publish");
    expect((markup.match(/data-feedback-kind=/g) ?? [])).toHaveLength(3);
    expect(markup).toContain("Prepare private message");
    expect(markup).toContain("Raise a service, safety or conduct concern");
    expect(markup).toContain('method="get"');
    expect(markup).not.toContain('type="email"');
    expect(markup).not.toContain("<textarea");
  });

  it("reviews a privacy concern before letting the visitor open their own email", () => {
    const markup = renderToStaticMarkup(createElement(FeedbackEnquiryBuilder, {
      preferences: { intent: "review", kind: "concern", topic: "privacy" },
    }));
    expect(markup).toContain("Review your feedback");
    expect(markup).toContain("Privacy or public content");
    expect(markup).toContain("Open prepared feedback email");
    expect(markup).toContain("mailto:amaanafoundation24@gmail.com?");
    expect(markup).toContain("Nothing has been sent");
  });

  it("rejects unexpected or repeated fields without leaking them into a reply", () => {
    const markup = renderToStaticMarkup(createElement(FeedbackEnquiryBuilder, {
      preferences: { intent: "review", kind: ["concern", "concern"], topic: "website", email: "PRIVATE_CONTACT" },
    }));
    expect(markup).toContain('role="alert"');
    expect(markup).not.toContain("PRIVATE_CONTACT");
    expect(markup).not.toContain("Open prepared feedback email");
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
