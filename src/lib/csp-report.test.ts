import { describe, expect, it } from "vitest";
import { configuredCspReportOrigin, createCspReportBudget, summarizeCspReports } from "./csp-report";

const origin = "https://amaanafoundation.org";
const privateUrl = origin + "/donations/private-donor/acknowledgement?token=secret-token";
const legacy = (blocked = "inline", disposition = "report") => ({ "csp-report": {
  "document-uri": privateUrl, "effective-directive": "script-src-elem", "blocked-uri": blocked,
  disposition, "script-sample": "private source", "source-file": privateUrl,
  referrer: "private referrer", "original-policy": "private policy",
} });

describe("privacy-safe CSP report-only summaries", () => {
  it("discards capability URLs, source samples and other private metadata", () => {
    expect(summarizeCspReports(legacy(), origin)).toEqual([{ directive: "script-src-elem", source: "inline" }]);
    const output = JSON.stringify(summarizeCspReports(legacy(), origin));
    for (const text of ["secret-token", "private-donor", "private source", "private referrer", "private policy"]) expect(output).not.toContain(text);
  });
  it.each([
    ["eval", "eval"], [origin + "/private?token=secret", "same-origin"],
    ["https://checkout.razorpay.com/v1/checkout.js?key=secret", "razorpay"],
    ["https://api.razorpay.com/private", "razorpay"], ["https://external.example/private", "other"],
    ["javascript:alert('private')", "other"],
  ])("classifies %s without retaining the resource", (blocked, source) => {
    expect(summarizeCspReports(legacy(blocked), origin)).toEqual([{ directive: "script-src-elem", source }]);
  });
  it("accepts bounded modern envelopes and drops unrelated report types", () => {
    const report = { type: "csp-violation", url: privateUrl, user_agent: "private UA", body: {
      documentURL: privateUrl, effectiveDirective: "script-src-attr", blockedURL: "inline", disposition: "report",
    } };
    expect(summarizeCspReports([report, { ...report, type: "other" }, report], origin)).toHaveLength(2);
    expect(summarizeCspReports(Array(8).fill(report), origin)).toHaveLength(3);
    expect(JSON.stringify(summarizeCspReports([report], origin))).not.toContain("private");
  });
  it.each([null, [], {}, { "csp-report": null }, { "csp-report": [] }, legacy("inline", "enforce"),
    { "csp-report": { "document-uri": "https://attacker.invalid", "effective-directive": "script-src", "blocked-uri": "inline", disposition: "report" } },
    { "csp-report": { "document-uri": privateUrl, "effective-directive": "style-src", "blocked-uri": "inline", disposition: "report" } },
  ])("drops invalid, foreign and non-script report %#", payload => {
    expect(summarizeCspReports(payload, origin)).toEqual([]);
  });
  it("uses explicit valid configuration rather than untrusted request host", () => {
    expect(configuredCspReportOrigin(origin + "/")).toBe(origin);
    for (const input of [undefined, "invalid", "http://amaanafoundation.org", "https://user:secret@amaanafoundation.org"]) expect(configuredCspReportOrigin(input)).toBeNull();
    expect(configuredCspReportOrigin("http://127.0.0.1:3000", true)).toBe("http://127.0.0.1:3000");
    expect(configuredCspReportOrigin("http://attacker.invalid", true)).toBeNull();
  });
  it("caps diagnostic attempts without tracking visitors or allocating a map", () => {
    const claim = createCspReportBudget();
    for (let i = 0; i < 20; i += 1) expect(claim(100_000)).toBe(true);
    expect(claim(159_999)).toBe(false);
    expect(claim(160_000)).toBe(true);
    expect(claim(50_000)).toBe(true);
  });
});
