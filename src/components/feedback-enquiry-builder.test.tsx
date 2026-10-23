import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));

import { FeedbackEnquiryBuilder } from "./feedback-enquiry-builder";

describe("feedback review query boundaries", () => {
  it("does not report an invalid submission for unrelated referral and tracking queries", () => {
    const html = renderToStaticMarkup(<FeedbackEnquiryBuilder preferences={{
      utm_source: "community",
      ref: "our-work",
    }} />);

    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("Open prepared feedback email");
    expect(html).toContain('name="kind"');
    expect(html).toContain('name="intent"');
  });

  it("keeps explicitly submitted malformed or extra fields rejected", () => {
    for (const preferences of [
      { intent: "review", kind: "concern", topic: "privacy", email: "private@example.org" },
      { intent: "review", kind: ["concern", "appreciation"], topic: "privacy" },
      { intent: "review", kind: "concern", topic: "unreviewed" },
      { intent: "", kind: "concern", topic: "privacy" },
    ]) {
      const html = renderToStaticMarkup(<FeedbackEnquiryBuilder preferences={preferences} />);
      expect(html).toContain('role="alert"');
      expect(html).not.toContain("Open prepared feedback email");
      expect(html).not.toContain("private@example.org");
    }
  });

  it("preserves the reviewed native email handoff for a valid explicit submission", () => {
    const html = renderToStaticMarkup(<FeedbackEnquiryBuilder preferences={{
      intent: "review", kind: "concern", topic: "privacy",
    }} />);
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("Open prepared feedback email");
    expect(html).toContain("mailto:amaanafoundation24@gmail.com");
    expect(html).toContain("Nothing has been sent.");
  });

  it("keeps the empty default visit free of submission errors", () => {
    const html = renderToStaticMarkup(<FeedbackEnquiryBuilder />);
    expect(html).not.toContain('role="alert"');
  });
});
