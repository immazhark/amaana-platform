import { describe, expect, it } from "vitest";
import { buildSponsorshipEnquiry, parseSponsorshipEnquiry, INSTITUTIONAL_SPONSORSHIP_PATHS, SPONSORSHIP_PATHS } from "./sponsorship-enquiry";

describe("fixed-category sponsorship enquiries", () => {
  it.each(Object.keys(SPONSORSHIP_PATHS))("prepares a reviewable %s enquiry", path => {
    const selection = parseSponsorshipEnquiry({ path, support: "ongoing", privateName: "yes" });
    expect(selection).not.toBeNull();
    const result = buildSponsorshipEnquiry(selection!);
    const url = new URL(result.href);
    expect(url.pathname).toBe("amaanafoundation24@gmail.com");
    expect(url.searchParams.get("body")).toBe(result.body);
    expect(result.body).toContain("each contribution decided separately");
    expect(result.body).toContain("does not reserve a student placement");
    expect(result.body).toContain("financial and receipt records may still require my details");
  });
  it.each([
    { path: "__proto__", support: "once" }, { path: "constructor", support: "once" },
    { path: "hifdh", support: "automatic" }, { path: ["hifdh", "school"], support: "once" },
    { path: "hifdh", support: ["once", "ongoing"] }, { path: "hifdh", support: "once", privateName: ["yes", "no"] },
    { path: "hifdh", support: "once", email: "private@example.org" },
    { path: "hifdh\r\nBcc:attacker", support: "once" }, { path: "hifdh" },
  ])("rejects unsupported, repeated or personal fields", input => {
    expect(parseSponsorshipEnquiry(input)).toBeNull();
  });
  it("does not imply public recognition by leaving the optional preference unchecked", () => {
    const result = buildSponsorshipEnquiry({ path: "discuss", support: "discuss", privateName: false });
    expect(result.body).not.toContain("consent to");
    expect(result.body).not.toContain("Please keep my name");
  });
});

describe("campaign-attributed sponsorship reviews", () => {
  it("keeps a fixed approved sponsorship choice behind bounded attribution", () => {
    expect(parseSponsorshipEnquiry({
      path: "hifdh", support: "discuss", utm_source: "outreach", gclid: "click-token",
    })).toEqual({ path: "hifdh", support: "discuss", privateName: false });
  });
  it("still rejects duplicate, oversized or private campaign parameters", () => {
    for (const query of [
      { path: "hifdh", support: "discuss", utm_source: ["one", "two"] },
      { path: "hifdh", support: "discuss", utm_source: "x".repeat(257) },
      { path: "hifdh", support: "discuss", beneficiary: "PRIVATE_PERSON" },
    ]) {
      expect(parseSponsorshipEnquiry(query)).toBeNull();
    }
  });
});

describe("institutional support enquiries", () => {
  it.each(["teacher-day", "teacher-evening", "imam", "muadhin", "learning-facilities"] as const)("prepares %s without establishing funding or payment", path => {
    const choice = parseSponsorshipEnquiry({ path, support: "ongoing", privateName: "yes" });
    expect(choice).not.toBeNull();
    const result = buildSponsorshipEnquiry(choice!);
    const url = new URL(result.href);
    expect(url.pathname).toBe("amaanafoundation24@gmail.com");
    expect(url.searchParams.get("subject")).toBe("Amaana Taleem - Institutional support enquiry");
    expect(url.searchParams.get("body")).toBe(result.body);
    expect(result.body).toContain(INSTITUTIONAL_SPONSORSHIP_PATHS[path]);
    expect(result.body).toContain("does not establish an institutional funding commitment");
    expect(result.body).toContain("each contribution decided separately");
    expect(result.body).toContain("does not reserve a student placement or authorize a payment or recurring charge");
    expect(result.body).toContain("Please keep my name out of public recognition");
  });

  it("does not change the learner enquiry subject or imply institutional funding", () => {
    const result = buildSponsorshipEnquiry({ path: "hifdh", support: "once", privateName: false });
    expect(new URL(result.href).searchParams.get("subject")).toBe("Amaana Taleem - Education sponsorship enquiry");
    expect(result.body).not.toContain("institutional funding commitment");
  });

  it.each([
    { path: "teacher-day", support: "ongoing", amount: "10000" },
    { path: ["imam", "muadhin"], support: "once" },
    { path: "teacher-day", support: "automatic" },
    { path: "teacher-evening", support: "once", student: "PRIVATE_SYNTHETIC" },
    { path: "imam\nBcc:x", support: "once" },
  ])("rejects unsupported institutional preferences", input => {
    expect(parseSponsorshipEnquiry(input)).toBeNull();
  });
});
