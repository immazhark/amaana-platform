import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import ts from "typescript";

describe("private acknowledgement response lifecycle", () => {
  it.each([["success", true], ["failure", true], ["success", false], ["failure", false]] as const)("handles %s with cleaned-up=%s", async (outcome, cleanedUp) => {
    const source = readFileSync(new URL("./donation-acknowledgement-client.tsx", import.meta.url), "utf8");
    const start = source.indexOf("useEffect(() => {");
    const end = source.indexOf("}, [reference, attempt]);", start);
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
    const body = source.slice(start + "useEffect(() => {".length, end);
    const js = ts.transpile(body, { target: ts.ScriptTarget.ES2022 });
    let frame: (() => void) | undefined;
    let resolve: (value: unknown) => void = () => { throw new Error("Not initialized"); };
    let reject: (error: Error) => void = () => { throw new Error("Not initialized"); };
    const pending = new Promise((yes, no) => { resolve = yes; reject = no; });
    const state = vi.fn();
    const windowMock = { requestAnimationFrame: (fn: () => void) => { frame = fn; return 1; }, cancelAnimationFrame: vi.fn(), location: { search: "", hash: "", pathname: "/synthetic" }, history: { replaceState: vi.fn() } };
    const run = new Function("window", "setRecord", "reference", "credential", "parsePrivateDonationAcknowledgementLocation", "fetch", "isAcknowledgementResponse", "AbortController", js);
    const cleanup = run(windowMock, state, "AF-SYNTHETIC", { current: ["AF-SYNTHETIC", "synthetic-token"] }, () => null, () => pending, () => true, AbortController) as () => void;
    frame?.();
    expect(state).toHaveBeenCalledWith(undefined);
    state.mockClear();
    if (cleanedUp) cleanup();
    if (outcome === "success") resolve({ status: 200, ok: true, json: async () => ({ found: true, synthetic: true }) });
    else reject(new Error("synthetic delayed network failure"));
    await new Promise(done => setTimeout(done, 0));
    if (cleanedUp) expect(state).not.toHaveBeenCalled();
    else expect(state).toHaveBeenCalledWith(outcome === "success" ? { found: true, synthetic: true } : "error");
    cleanup();
  });
});
