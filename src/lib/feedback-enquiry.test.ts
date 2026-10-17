import { describe, expect, it } from "vitest";
import {
  buildFeedbackEnquiryHref, parseFeedbackPreferences, sanitizeFeedbackNote, FEEDBACK_CONTACT_EMAIL,
  FEEDBACK_KINDS, FEEDBACK_TOPICS, MAX_FEEDBACK_NOTE_LENGTH,
} from "./feedback-enquiry";

describe("voluntary feedback and complaint contact", () => {
  it.each(FEEDBACK_KINDS)("keeps %s private and explicitly disallows implied testimonial consent", ({ id, label }) => {
    const href = new URL(buildFeedbackEnquiryHref(id, "privacy", "Please call me about this."));
    expect(href.protocol).toBe("mailto:");
    expect(href.pathname).toBe(FEEDBACK_CONTACT_EMAIL);
    expect(href.searchParams.get("subject")).toContain(label);
    const body = href.searchParams.get("body") ?? "";
    expect(body).toContain(label);
    expect(body).toContain("Privacy or public content");
    expect(body).toContain("Please call me about this.");
    expect(body).toContain("not consent to publish");
    expect(body).toContain("does not create a tracked complaint ticket");
  });

  it("whitelists complaint kind and subject without allowing header injection", () => {
    const malicious = "private\r\nBcc: secret@example.org";
    const url = new URL(buildFeedbackEnquiryHref(malicious as "concern", malicious as "privacy", ""));
    expect(url.searchParams.get("subject")).toBe("Amaana Foundation - Concern or complaint");
    expect(url.searchParams.get("body")).toContain("General work or service");
    expect(decodeURIComponent(url.toString())).not.toContain("Bcc:");
  });

  it("normalizes untrusted free text into a bounded email body", () => {
    const text = `First line\r\nSecond line\u0000${"🏡".repeat(1000)}`;
    const cleaned = sanitizeFeedbackNote(text);
    expect(cleaned).toContain("First line\nSecond line");
    expect(cleaned).not.toContain("\u0000");
    expect([...cleaned]).toHaveLength(MAX_FEEDBACK_NOTE_LENGTH);
    expect(new URL(buildFeedbackEnquiryHref("suggestion", "website", text)).searchParams.get("body"))
      .toContain(cleaned);
    expect(sanitizeFeedbackNote({ note: "unsafe" })).toBe("");
  });

  it("exposes a fixed set of distinct topics and kinds", () => {
    expect(new Set(FEEDBACK_KINDS.map(item => item.id)).size).toBe(FEEDBACK_KINDS.length);
    expect(new Set(FEEDBACK_TOPICS.map(item => item.id)).size).toBe(FEEDBACK_TOPICS.length);
  });
});

describe("reviewed private feedback topics", () => {
  it("accepts only reviewed fixed complaint type and subject", () => {
    expect(parseFeedbackPreferences({ intent: "review", kind: "concern", topic: "privacy" }))
      .toEqual({ kind: "concern", topic: "privacy" });
    expect(parseFeedbackPreferences({ intent: "review", kind: "suggestion", topic: "website" }))
      .toEqual({ kind: "suggestion", topic: "website" });
  });
  it.each([
    { intent: "review", kind: "concern", topic: "privacy", email: "PRIVATE_CONTACT" },
    { intent: "review", kind: ["concern", "appreciation"], topic: "website" },
    { intent: "review", kind: "concern", topic: ["privacy", "donations"] },
    { intent: "review", kind: "concern", topic: "staff personnel" },
    { intent: "review", kind: "Bcc: injection", topic: "website" },
    { intent: "review", kind: "concern" },
    { intent: "review", topic: "website" },
    { intent: "not-review", kind: "concern", topic: "website" },
  ])("rejects unknown, repeated and personal URL fields", query => {
    expect(parseFeedbackPreferences(query)).toBeNull();
  });
});
