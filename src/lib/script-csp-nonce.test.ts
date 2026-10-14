import { describe, expect, it } from "vitest";
import { allowedNonceCspImageSources, buildNoncedScriptCsp, nonceCspEnabled } from "./script-csp-nonce";
const nonce = Buffer.from("b9b2dc75-cb31-488c-b2ec-5ceda0ca92bc").toString("base64");

describe("opt-in nonce-based script policy", () => {
  it("is disabled without an exact explicit enabled flag", () => {
    expect(nonceCspEnabled(undefined)).toBe(false);
    expect(nonceCspEnabled("false")).toBe(false);
    expect(nonceCspEnabled("TRUE")).toBe(false);
    expect(nonceCspEnabled("true")).toBe(true);
  });
  it("allows only nonced inline scripts while retaining Razorpay script/connect/frame origins", () => {
    const result = buildNoncedScriptCsp(nonce, ["'self'", "blob:", "data:"]);
    expect(result).toContain("script-src 'self' 'nonce-" + nonce + "' https://checkout.razorpay.com");
    expect(result).toContain("script-src-attr 'none'");
    expect(result).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(result).toContain("connect-src 'self' https://api.razorpay.com");
    expect(result).toContain("frame-src https://api.razorpay.com https://checkout.razorpay.com");
    expect(result).toContain("frame-ancestors 'none'");
  });
  it("keeps development unsafe-eval out of production policy", () => {
    expect(buildNoncedScriptCsp(nonce, ["'self'"])).not.toContain("unsafe-eval");
    expect(buildNoncedScriptCsp(nonce, ["'self'"], {dev:true})).toContain("'unsafe-eval'");
  });
  it.each(["", "x", "not safe!", "%%%", "<script>"])("refuses an invalid externally supplied nonce", candidate => {
    expect(() => buildNoncedScriptCsp(candidate, ["'self'"])).toThrow(/nonce/);
  });
  it("does not allow non-HTTPS origins or embedded credentials through image CSP", () => {
    expect(allowedNonceCspImageSources([
      "https://cdn.example.org/image.jpg",
      "http://bad.example.com", "https://u:pwd@bad.example.com/",
      "javascript:alert(1)", undefined,
    ])).toEqual(["'self'", "blob:", "data:", "https://cdn.example.org"]);
  });
});
