import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("react");
  vi.unstubAllGlobals();
  vi.resetModules();
});

const validRecord = {
  found: true,
  presentation: {
    tone: "captured",
    heading: "Donation received",
    summary: "Synthetic acknowledgement",
    statusLabel: "Payment verified",
  },
  donation: {
    referenceNumber: "AFD-SYNTHETIC-LATE",
    receiptNumber: "ACK-SYNTHETIC-LATE",
    donorName: "Synthetic Donor",
    givingIntent: "GENERAL",
    amount: 500,
    refundedAmount: 0,
    recordDate: "2026-11-15T12:00:00.000Z",
    providerPaymentId: "pay_synthetic_late",
    appeal: { title: "Synthetic appeal", slug: "synthetic-appeal" },
  },
};

it.each([
  ["valid completion", validRecord],
  ["malformed completion", { found: true, donation: { private: "SYNTHETIC_PRIVATE" } }],
])("AF-N24 ignores %s after the acknowledgement effect is disposed", async (_name, payload) => {
  const updates: unknown[] = [];
  let startEffect: (() => (() => void)) | undefined;
  let fireFrame: FrameRequestCallback | undefined;
  let finishResponse: ((body: unknown) => void) | undefined;

  const bodyReady = new Promise<unknown>(resolve => { finishResponse = resolve; });
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => bodyReady,
  });
  const cancelFrame = vi.fn();
  const replaceState = vi.fn();

  vi.stubGlobal("window", {
    requestAnimationFrame(callback: FrameRequestCallback) {
      fireFrame = callback;
      return 1;
    },
    cancelAnimationFrame: cancelFrame,
    location: {
      search: "",
      hash: "#token=" + "synthetic-private-token-123456789",
      pathname: "/donations/AFD-SYNTHETIC-LATE/acknowledgement",
    },
    history: { replaceState },
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.doMock("react", async importOriginal => ({
    ...await importOriginal<typeof import("react")>(),
    useEffect(effect: () => () => void) {
      startEffect = effect;
    },
    useRef<T>(value: T) {
      return { current: value };
    },
    useState<T>(value: T) {
      return [value, (next: unknown) => { updates.push(next); }] as const;
    },
  }));

  const { DonationAcknowledgementClient } = await import("./donation-acknowledgement-client");
  DonationAcknowledgementClient({ reference: validRecord.donation.referenceNumber });
  expect(startEffect).toBeTypeOf("function");
  const dispose = startEffect!();
  expect(fireFrame).toBeTypeOf("function");
  fireFrame!(0);

  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  const options = fetchMock.mock.calls.at(0)?.[1] as RequestInit | undefined;
  if (!options) throw new Error("Synthetic acknowledgement POST not captured");
  expect(options.signal?.aborted).toBe(false);
  expect(replaceState).toHaveBeenCalledOnce();

  dispose();
  expect(options.signal?.aborted).toBe(true);
  expect(cancelFrame).toHaveBeenCalledWith(1);

  finishResponse!(payload);
  await new Promise<void>(resolve => setImmediate(resolve));
  expect(updates).toEqual([undefined]);
});
