import { describe, expect, it, vi } from "vitest";
import { sendBestEffortTelemetry } from "./client-telemetry";

describe("nonblocking, same-origin telemetry transport", () => {
  it("uses a successful Beacon exactly once without invoking fetch", async () => {
    const beacon = vi.fn((_endpoint: string, _body: Blob) => true);
    const post = vi.fn();
    sendBestEffortTelemetry("/api/analytics/page-view", { path: "/about" }, { beacon, post });
    expect(post).not.toHaveBeenCalled();
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0]?.[0]).toBe("/api/analytics/page-view");
    const body = beacon.mock.calls[0]?.[1];
    expect(body).toBeInstanceOf(Blob);
    expect(await body?.text()).toBe('{"path":"/about"}');
    expect(body?.type).toBe("application/json");
  });

  it("falls back to a same-origin POST when Beacon returns false", () => {
    const post = vi.fn(() => Promise.resolve());
    sendBestEffortTelemetry("/api/analytics/web-vitals",
      { path: "/appeals/:slug", name: "LCP", value: 900 }, { beacon: () => false, post });
    expect(post).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith("/api/analytics/web-vitals", {
      method: "POST",
      body: '{"path":"/appeals/:slug","name":"LCP","value":900}',
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      credentials: "same-origin",
    });
  });

  it("recovers from a throwing Beacon without exposing the failure", () => {
    const post = vi.fn(() => Promise.resolve());
    expect(() => sendBestEffortTelemetry("/api/analytics/page-view",
      { path: "/" }, { beacon: () => { throw new Error("blocked"); }, post })).not.toThrow();
    expect(post).toHaveBeenCalledOnce();
  });

  it("never throws on a synchronous failure or an asynchronously rejected fetch", async () => {
    expect(() => sendBestEffortTelemetry("/api/analytics/page-view", { path: "/" },
      { post: () => { throw new Error("blocked"); } })).not.toThrow();
    expect(() => sendBestEffortTelemetry("/api/analytics/page-view", { path: "/" },
      { post: () => Promise.reject(new Error("network unavailable")) })).not.toThrow();
    await Promise.resolve();
  });
});
