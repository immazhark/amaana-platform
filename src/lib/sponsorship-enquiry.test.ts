import { describe, expect, it } from "vitest";
import { buildSponsorshipEnquiry, parseSponsorshipEnquiry, SPONSORSHIP_PATHS } from "./sponsorship-enquiry";

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
