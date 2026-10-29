import { setImmediate } from "node:timers/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  states: [] as unknown[], refs: [] as Array<{ current: unknown }>,
  stateIndex: 0, refIndex: 0, writes: vi.fn(), effect: undefined as (() => (() => void)) | undefined,
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.stateIndex++;
    if (!(index in harness.states)) harness.states[index] = initial;
    return [harness.states[index], (value: unknown) => {
      harness.states[index] = typeof value === "function" ? value(harness.states[index]) : value;
      harness.writes();
    }];
  },
  useRef: (initial: unknown) => {
    const index = harness.refIndex++;
    return harness.refs[index] ??= { current: initial };
  },
  useEffect: (effect: () => (() => void)) => { harness.effect = effect; },
}));
vi.mock("next/link", () => ({ default: "a" }));
vi.mock("@/components/print-button", () => ({ PrintButton: () => null }));
import { DonationAcknowledgementClient } from "./donation-acknowledgement-client";

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function render(reference = "AF-SYNTHETIC-A") {
  harness.stateIndex = 0; harness.refIndex = 0;
  return renderToStaticMarkup(DonationAcknowledgementClient({ reference }));
}
function start() {
  if (!harness.effect) throw new Error("Expected acknowledgement effect");
  const cleanup = harness.effect();
  frame();
  return cleanup;
}
let frame: () => void;
const fetchMock = vi.fn();
beforeEach(() => {
  harness.states = []; harness.refs = []; harness.writes.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", {
    requestAnimationFrame: (callback: () => void) => { frame = callback; return 1; },
    cancelAnimationFrame: vi.fn(),
    location: { search: "", hash: "#token=synthetic-private-token-123456", pathname: "/donations/synthetic/acknowledgement" },
    history: { replaceState: vi.fn() },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("private acknowledgement lookup lifecycle", () => {
  it.each(["success", "rejection", "malformed"])("ignores late JSON %s after cleanup", async outcome => {
    const body = deferred();
    const json = vi.fn(() => body.promise);
    fetchMock.mockResolvedValue({ ok: true, status: 200, json });
    render();
    const cleanup = start();
    await vi.waitFor(() => expect(json).toHaveBeenCalledOnce());
    cleanup();
    expect(fetchMock.mock.calls[0]?.[1].signal.aborted).toBe(true);
    harness.writes.mockClear();
    if (outcome === "rejection") body.reject(new Error("Synthetic parse failure"));
    else body.resolve(outcome === "success" ? { found: false } : { found: true });
    await setImmediate();
    expect(harness.writes).not.toHaveBeenCalled();
  });

  it("keeps active unavailable and service-error outcomes", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ found: false }) });
    render(); start(); await setImmediate();
    expect(render()).toContain("Private acknowledgement unavailable.");
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    start(); await setImmediate();
    expect(render()).toContain("Unable to open your acknowledgement.");
  });

  it("hides the previous reference's private record before the next animation frame", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({
      found: true,
      presentation: { tone: "captured", heading: "Synthetic acknowledgement", summary: "Synthetic record", statusLabel: "Captured" },
      donation: { referenceNumber: "AF-SYNTHETIC-A", receiptNumber: null, donorName: "Synthetic donor A", givingIntent: "GENERAL",
        amount: 10, refundedAmount: 0, recordDate: "2026-10-28T00:00:00.000Z", providerPaymentId: null,
        appeal: { title: "Synthetic appeal", slug: "synthetic-appeal" } },
    }) });
    render(); start(); await setImmediate();
    expect(render()).toContain("Synthetic donor A");
    const changed = render("AF-SYNTHETIC-B");
    expect(changed).not.toContain("Synthetic donor A");
    expect(changed).toContain("Checking your private record.");
  });
});
