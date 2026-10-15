import { afterEach, describe, expect, it, vi } from "vitest";
import { boundedPrivateRequest } from "./bounded-private-request";

afterEach(() => vi.useRealTimers());
describe("bounded private operation", () => {
  it("does not start work for an already abandoned receipt", async () => {
    const lifetime = new AbortController(); lifetime.abort();
    const work = vi.fn();
    await expect(boundedPrivateRequest(work, 1000, lifetime.signal)).rejects.toThrow();
    expect(work).not.toHaveBeenCalled();
  });
  it("cleans the timer after successful decoding", async () => {
    vi.useFakeTimers();
    await expect(boundedPrivateRequest(async () => ({ found: true }), 1000)).resolves.toEqual({ found: true });
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cleans the timer after a decoding failure", async () => {
    vi.useFakeTimers();
    await expect(boundedPrivateRequest(async () => { throw new Error("Invalid reply"); }, 1000)).rejects.toThrow("Invalid reply");
    expect(vi.getTimerCount()).toBe(0);
  });
  it("ends on abandonment even if the underlying work ignores abort", async () => {
    vi.useFakeTimers();
    const lifetime = new AbortController();
    let signal: AbortSignal | undefined;
    const result = boundedPrivateRequest(async current => { signal = current; return new Promise(() => {}); }, 1000, lifetime.signal);
    const rejected = expect(result).rejects.toThrow();
    await Promise.resolve(); lifetime.abort(); await rejected;
    expect(signal?.aborted).toBe(true); expect(vi.getTimerCount()).toBe(0);
  });
});
