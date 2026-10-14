import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  states: [] as unknown[], setters: [] as ReturnType<typeof vi.fn>[],
  effects: [] as (() => (() => void) | undefined)[],
  credentials: { reference: "AMAANA-RECORD-TEST", token: "synthetic-private-token-only" },
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: () => {
    const setter = vi.fn();
    hooks.setters.push(setter);
    return [hooks.states.shift(), setter];
  },
  useEffect: (effect: () => (() => void) | undefined) => hooks.effects.push(effect),
  useRef: (value: unknown) => ({ current: value }),
}));
vi.mock("@/lib/use-private-tracking-credentials", () => ({ usePrivateTrackingCredentials: () => hooks.credentials }));
vi.mock("@/components/navigation-link", () => ({ default: "a" }));
vi.mock("@/components/print-button", () => ({ PrintButton: () => null }));

import { DonationAcknowledgementClient } from "./donation-acknowledgement-client";
import { AssistanceStatusClient } from "./assistance-status-client";

afterEach(() => {
  hooks.states = [];
  hooks.setters = [];
  hooks.effects = [];
  vi.unstubAllGlobals();
});

function mount(kind: "donation" | "assistance", json: () => Promise<unknown>) {
  const frames: (() => void)[] = [];
  vi.stubGlobal("window", {
    location: { search: "", hash: "#token=synthetic-private-token-only", pathname: "/private-record" },
    history: { replaceState: vi.fn() },
    requestAnimationFrame: (callback: () => void) => { frames.push(callback); return 1; },
    cancelAnimationFrame: vi.fn(),
  });
  const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
  vi.stubGlobal("fetch", fetch);
  hooks.states = [undefined, 0];
  if (kind === "donation") DonationAcknowledgementClient({ reference: hooks.credentials.reference });
  else AssistanceStatusClient();
  const effect = hooks.effects[0];
  const setter = hooks.setters[0];
  if (!effect || !setter) throw new Error("Private-record effect did not mount");
  const cleanup = effect();
  frames.forEach(callback => callback());
  return { setter, cleanup, fetch };
}

describe("private record clients at the JSON/effect boundary", () => {
  for (const kind of ["donation", "assistance"] as const) {
    for (const payload of [null, { found: true }, { found: "true", status: {} }]) {
      it(`${kind} keeps malformed JSON in the read-retry state: ${JSON.stringify(payload)}`, async () => {
        const { setter, fetch } = mount(kind, async () => payload);
        await vi.waitFor(() => {
          expect(setter).toHaveBeenLastCalledWith(kind === "donation" ? "error" : {
            credentials: hooks.credentials, record: null, failed: true,
          });
        });
        expect(fetch).toHaveBeenCalledOnce();
        expect(fetch.mock.calls[0]?.[0]).toBe(kind === "donation" ? "/api/donations/acknowledgement" : "/api/assistance/status");
      });
    }
    it(`${kind} ignores a JSON completion after effect cleanup`, async () => {
      let resolve: (value: unknown) => void = () => {};
      const pending = new Promise<unknown>(done => { resolve = done; });
      const { setter, cleanup, fetch } = mount(kind, () => pending);
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
      cleanup?.();
      setter.mockClear();
      resolve({ found: false });
      // Drain response parsing and the following state/catch continuations.
      await new Promise(done => setTimeout(done, 0));
      expect(setter).not.toHaveBeenCalled();
    });
    it(`${kind} preserves a genuine unavailable record`, async () => {
      const { setter } = mount(kind, async () => ({ found: false }));
      await vi.waitFor(() => expect(setter).toHaveBeenLastCalledWith(kind === "donation" ? null : {
        credentials: hooks.credentials, record: null, failed: false,
      }));
    });
  }

  it("shows confidential donation purpose without constructing a case-specific link", () => {
    hooks.states = [{
      found: true,
      presentation: { tone: "captured", heading: "Contribution recorded", summary: "Private record", statusLabel: "Verified" },
      donation: {
        referenceNumber: "AMAANA-RECORD-TEST", receiptNumber: "ACK-SYNTHETIC",
        donorName: "Synthetic donor", givingIntent: "GENERAL", amount: 100,
        refundedAmount: 0, recordDate: "2026-10-13T00:00:00.000Z", providerPaymentId: null,
        appeal: { title: "Confidential assistance appeal", slug: null },
      },
    }, 0];
    const html = renderToStaticMarkup(createElement(DonationAcknowledgementClient, { reference: "AMAANA-RECORD-TEST" }));
    expect(html).toContain("Confidential assistance appeal");
    expect(html).not.toContain("/appeals/null");
    expect(html).not.toContain("Return to this appeal");
  });

  it("tracking status names cannot render inherited object properties", () => {
    hooks.states = [{ credentials: hooks.credentials, record: {
      found: true, status: "toString", createdAt: "2026-10-13T00:00:00Z", updatedAt: "2026-10-14T00:00:00Z",
    }, failed: false }, 0];
    const html = renderToStaticMarkup(createElement(AssistanceStatusClient));
    expect(html).toContain(">toString</h1>");
    expect(html).toContain("Your request status has been updated.");
  });
});
