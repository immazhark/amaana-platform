import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ next: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { next: mocks.next },
}));
import { proxy, config } from "./proxy";

function fakeRequest(headers: Record<string, string> = {}) {
  return { headers: new Headers(headers) } as Parameters<typeof proxy>[0];
}
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
describe("controlled nonce CSP Next.js Proxy rollout", () => {
  it("performs no policy/header mutation when the feature is disabled", () => {
    vi.stubEnv("AMAANA_NONCE_CSP_ENABLED", "false");
    const response = { headers: new Headers() };
    mocks.next.mockReturnValue(response);
    const result = proxy(fakeRequest({"x-nonce": "attacker"}));
    expect(result).toBe(response);
    expect(mocks.next).toHaveBeenCalledWith();
    expect(response.headers.has("Content-Security-Policy")).toBe(false);
  });
  it("replaces incoming nonce/policy rather than trusting attacker-supplied headers", () => {
    vi.stubEnv("AMAANA_NONCE_CSP_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const response = { headers: new Headers() };
    mocks.next.mockReturnValue(response);
    proxy(fakeRequest({
      "x-nonce": "ATTACKER-NONCE", "Content-Security-Policy": "script-src 'unsafe-inline'",
    }));
    const forwarded = mocks.next.mock.calls[0]?.[0]?.request?.headers as Headers;
    const nonce = forwarded.get("x-nonce");
    const policy = response.headers.get("Content-Security-Policy");
    expect(nonce).toBeTruthy();
    expect(nonce).not.toBe("ATTACKER-NONCE");
    expect(policy).toContain("'nonce-" + nonce + "'");
    expect(policy).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(forwarded.get("Content-Security-Policy")).toBe(policy);
    expect(policy).toContain("https://amaanafoundation.org");
  });
  it("generates a fresh nonce for each separately rendered HTML request", () => {
    vi.stubEnv("AMAANA_NONCE_CSP_ENABLED", "true");
    mocks.next.mockImplementation(() => ({ headers: new Headers() }));
    proxy(fakeRequest());
    proxy(fakeRequest());
    const first = (mocks.next.mock.calls[0]?.[0]?.request?.headers as Headers).get("x-nonce");
    const second = (mocks.next.mock.calls[1]?.[0]?.request?.headers as Headers).get("x-nonce");
    expect(first).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(second).not.toBe(first);
  });
  it("excludes API, next/image and prefetch requests from the interception matcher", () => {
    const source = config.matcher[0]?.source ?? "";
    expect(source).toContain("api/");
    expect(source).toContain("_next/static");
    expect(source).toContain("_next/image");
    expect(config.matcher[0]?.missing ?? []).toContainEqual({
      type: "header", key: "next-router-prefetch",
    });
  });
});
