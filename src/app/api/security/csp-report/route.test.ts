import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestBodyReadTimeoutError } from "@/lib/bounded-request-body";

const origin = "https://amaanafoundation.org";
const payload = { "csp-report": { "document-uri": origin + "/private?token=secret", "effective-directive": "script-src-elem", "blocked-uri": "inline", disposition: "report", "script-sample": "private source" } };
let POST: typeof import("./route").POST;
let log: ReturnType<typeof vi.spyOn>;

function request(body = JSON.stringify(payload), headers: Record<string, string> = {}) {
  return new Request(origin + "/api/security/csp-report", { method: "POST", headers: { "Content-Type": "application/csp-report", ...headers }, body });
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("AMAANA_CSP_REPORT_ONLY", "true");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
  vi.stubEnv("AMAANA_BROWSER_ACCEPTANCE", "false");
  log = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  POST = (await import("./route")).POST;
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("first-party CSP collector", () => {
  it("is disabled before reading a body or emitting logs", async () => {
    vi.stubEnv("AMAANA_CSP_REPORT_ONLY", "false");
    const input = request();
    expect((await POST(input)).status).toBe(204);
    expect(input.bodyUsed).toBe(false);
    expect(log).not.toHaveBeenCalled();
  });
  it.each([undefined, "invalid", "https://user:secret@amaanafoundation.org", "http://amaanafoundation.org"])("rejects invalid configuration %s before reading", async config => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", config);
    const input = request();
    expect((await POST(input)).status).toBe(204);
    expect(input.bodyUsed).toBe(false);
    expect(log).not.toHaveBeenCalled();
  });
  it.each([{}, { Origin: origin }, { Origin: "null" }] as Record<string, string>[])("accepts browser transport origin form %# without copying private fields", async headers => {
    const response = await POST(request(undefined, headers));
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect(log).toHaveBeenCalledExactlyOnceWith('{"event":"csp.report-only","directive":"script-src-elem","source":"inline"}\n');
  });
  it.each([{ Origin: "https://attacker.invalid" }, { "Sec-Fetch-Site": "cross-site" }, { "Content-Type": "application/json" }] as Record<string, string>[])("rejects foreign or wrong-media transport %#", async headers => {
    const input = request(undefined, headers);
    expect((await POST(input)).status).toBe(204);
    expect(input.bodyUsed).toBe(false);
    expect(log).not.toHaveBeenCalled();
  });
  it("accepts modern reporting batches and never exposes their envelope", async () => {
    const body = JSON.stringify([{ type: "csp-violation", url: origin + "/private", user_agent: "private UA", body: { documentURL: origin + "/private", effectiveDirective: "script-src-elem", blockedURL: "eval", disposition: "report" } }]);
    expect((await POST(request(body, { "Content-Type": "application/reports+json" }))).status).toBe(204);
    expect(log).toHaveBeenCalledExactlyOnceWith('{"event":"csp.report-only","directive":"script-src-elem","source":"eval"}\n');
  });
  it.each(["not json", "null", JSON.stringify({ padding: "x".repeat(4096) })])("drops malformed/oversized body %# without diagnostic output", async body => {
    expect((await POST(request(body))).status).toBe(204);
    expect(log).not.toHaveBeenCalled();
  });
  it("bounds collector reads even if cancellation stalls", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const input = new Request(origin + "/api/security/csp-report", { method: "POST", headers: { "Content-Type": "application/csp-report" }, body: new ReadableStream({ cancel }), duplex: "half" } as RequestInit & { duplex: "half" });
    const result = POST(input);
    await vi.advanceTimersByTimeAsync(2001);
    expect((await result).status).toBe(204);
    expect(cancel).toHaveBeenCalledOnce();
    expect(log).not.toHaveBeenCalled();
  });
  it("does not let private diagnostic log failures affect the response", async () => {
    log.mockImplementation(() => { throw new RequestBodyReadTimeoutError(); });
    expect((await POST(request())).status).toBe(204);
  });
  it("stops reading after the per-instance diagnostic budget", async () => {
    for (let i = 0; i < 20; i += 1) await POST(request());
    const extra = request();
    expect((await POST(extra)).status).toBe(204);
    expect(extra.bodyUsed).toBe(false);
    expect(log).toHaveBeenCalledTimes(20);
  });
});
