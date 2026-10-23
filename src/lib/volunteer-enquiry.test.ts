import { describe, expect, it } from "vitest";
import { buildVolunteerEnquiryHref, parseVolunteerPreferences, VOLUNTEER_SKILLS } from "./volunteer-enquiry";

describe("private-first volunteer contact builder", () => {
  it("creates a useful opt-in email without sending or persisting any personal data", () => {
    const href = buildVolunteerEnquiryHref(
      ["Technology and website support", "Distribution and packing"], "Weekends",
    );
    const url = new URL(href);
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe("amaanafoundation24@gmail.com");
    const body = url.searchParams.get("body") ?? "";
    expect(body).toContain("Technology and website support");
    expect(body).toContain("Weekends");
    expect(body).toContain("not a confirmed placement");
    expect(body).not.toContain("password");
    expect(body).not.toContain("PAN");
  });
  it("keeps a useful general enquiry without any skill or availability selection", () => {
    const href = buildVolunteerEnquiryHref([], "");
    const body = new URL(href).searchParams.get("body") ?? "";
    expect(body).toContain("Open to discussing available needs");
    expect(body).toContain("Not specified");
  });
  it("whitelists categories and does not include untrusted input in mailto URLs", () => {
    const injected = "Sensitive personal details\nBCC: example@example.com";
    const href = buildVolunteerEnquiryHref(
      [injected as (typeof VOLUNTEER_SKILLS)[number]],
      injected as "Weekends",
    );
    expect(decodeURIComponent(href)).not.toContain(injected);
    expect(new URL(href).searchParams.get("body")).toContain("Not specified");
  });
  it("cannot duplicate skill names supplied repeatedly", () => {
    const href = buildVolunteerEnquiryHref(
      ["Event logistics", "Event logistics"], "Occasionally",
    );
    expect((new URL(href).searchParams.get("body") ?? "").match(/Event logistics/g)).toHaveLength(1);
  });
});

describe("fixed-choice volunteer preference review", () => {
  it("accepts two distinct approved skills and a selected availability", () => {
    expect(parseVolunteerPreferences({
      intent: "review",
      skill: ["Distribution and packing", "Technology and website support"],
      availability: "Weekends",
    })).toEqual({ skills: ["Distribution and packing", "Technology and website support"], availability: "Weekends" });
  });
  it("supports an optional skill and availability to prepare a general enquiry", () => {
    expect(parseVolunteerPreferences({ intent: "review" })).toEqual({ skills: [], availability: "" });
    expect(parseVolunteerPreferences({ intent: "review", skill: "Event logistics" }))
      .toEqual({ skills: ["Event logistics"], availability: "" });
  });
  it.each([
    { intent: "review", skill: ["Event logistics", "Event logistics"] },
    { intent: "review", skill: "Unknown skill" },
    { intent: "review", availability: ["Weekends", "Occasionally"] },
    { intent: "review", availability: "Whenever", skill: "Event logistics" },
    { intent: "review", skill: "Event logistics", email: "applicant@example.test" },
    { intent: "review", skill: "Event logistics\r\nBcc:attacker" },
    { intent: ["review", "review"], skill: "Event logistics" },
    { intent: "submit", skill: "Event logistics" },
  ])("rejects ambiguous, unsupported or personal query parameters", query => {
    expect(parseVolunteerPreferences(query)).toBeNull();
  });
});

describe("campaign-attributed volunteer choices", () => {
  it("preserves a reviewed explicit enquiry with bounded marketing attribution", () => {
    expect(parseVolunteerPreferences({ intent: "review", skill: "Event logistics",
      availability: "Weekends", utm_medium: "email", fbclid: "click-token" }))
      .toEqual({ skills: ["Event logistics"], availability: "Weekends" });
  });
  it("rejects duplicate or oversized tracking values without weakening the consent boundary", () => {
    for (const query of [
      { intent: "review", skill: "Event logistics", utm_source: ["x", "y"] },
      { intent: "review", skill: "Event logistics", utm_source: "x".repeat(257) },
      { intent: "review", skill: "Event logistics", email: "private@example.org" },
    ]) expect(parseVolunteerPreferences(query)).toBeNull();
  });
});
