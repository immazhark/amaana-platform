import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const hooks = vi.hoisted(() => ({ stateIndex: 0, refIndex: 0, values: [] as unknown[], refs: [] as Array<{ current: unknown }> }));
const mocks = vi.hoisted(() => ({ write: vi.fn(), fetch: vi.fn(), push: vi.fn(), lock: vi.fn() }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = hooks.stateIndex++;
    if (!(index in hooks.values)) hooks.values[index] = typeof initial === "function" ? initial() : initial;
    return [hooks.values[index], (next: unknown) => { hooks.values[index] = typeof next === "function" ? next(hooks.values[index]) : next; }];
  },
  useRef: (current: unknown) => { const index = hooks.refIndex++; return hooks.refs[index] ?? (hooks.refs[index] = { current }); },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
import { DirectTransferForm } from "./direct-transfer-form";
import { donationFormCopy } from "./donation-form-copy";

beforeEach(() => {
  vi.resetAllMocks(); hooks.values = []; hooks.refs = [];
  vi.stubGlobal("navigator", { clipboard: { writeText: mocks.write } });
  vi.stubGlobal("fetch", mocks.fetch); mocks.write.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllGlobals());

function view() {
  hooks.stateIndex = 0; hooks.refIndex = 0;
  const root = DirectTransferForm({ appealId: "synthetic", maxAmount: 100, method: "BANK_TRANSFER", onLockChange: mocks.lock,
    paymentDetails: { upi: { id: "synthetic@invalid", qrImageUrl: null }, bank: { accountName: "Synthetic", accountNumber: "000000000", ifsc: "TEST0000000", bankName: "Synthetic", branch: "Synthetic" } },
    copy: donationFormCopy(false).direct,
  });
  const elements: ReactElement<Record<string, unknown>>[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node || typeof node !== "object" || !("props" in node)) return;
    const element = node as ReactElement<Record<string, unknown>>; elements.push(element); visit(element.props.children);
  };
  visit(root);
  const status = elements.find(element => element.props.id === "direct-copy-status-BANK_TRANSFER");
  if (!status) throw new Error("Expected clipboard status");
  return { feedback: status.props.children,
    copy: (label: string) => {
      const control = elements.find(element => element.type === "button" && element.props["aria-label"] === label);
      if (!control || typeof control.props.onClick !== "function") throw new Error("Expected copy control");
      return control.props.onClick() as Promise<void>;
    },
  };
}
function deferred() {
  let resolve!: () => void; let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function noTransferSideEffects() {
  expect(mocks.fetch).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled(); expect(mocks.lock).not.toHaveBeenCalled();
  expect(mocks.write.mock.calls.map(call => call[0])).toEqual(["000000000", "TEST0000000"]);
}

it("keeps newer success feedback when the older attempt later fails", async () => {
  const old = deferred(), latest = deferred(); mocks.write.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
  const controls = view(); const first = controls.copy("Copy account number"); const second = controls.copy("Copy IFSC");
  latest.resolve(); await second; expect(view().feedback).toBe("IFSC copied.");
  old.reject(new Error("synthetic denied")); await first; expect(view().feedback).toBe("IFSC copied."); noTransferSideEffects();
});
it("keeps newer failure feedback when an older attempt later succeeds", async () => {
  const old = deferred(), latest = deferred(); mocks.write.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
  const controls = view(); const first = controls.copy("Copy account number"); const second = controls.copy("Copy IFSC");
  latest.reject(new Error("synthetic denied")); await second;
  const expected = "Could not copy IFSC. Select the value above and copy it manually.";
  expect(view().feedback).toBe(expected); old.resolve(); await first; expect(view().feedback).toBe(expected); noTransferSideEffects();
});
it("does not announce an older result while the latest attempt remains pending", async () => {
  const old = deferred(), latest = deferred(); mocks.write.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
  const controls = view(); const first = controls.copy("Copy account number"); const second = controls.copy("Copy IFSC");
  old.resolve(); await first; expect(view().feedback).toBe("");
  latest.resolve(); await second; expect(view().feedback).toBe("IFSC copied."); noTransferSideEffects();
});
it("preserves sequential copied values and actionable failure feedback", async () => {
  await view().copy("Copy account number"); expect(view().feedback).toBe("Account number copied.");
  mocks.write.mockRejectedValueOnce(new Error("synthetic denied")); await view().copy("Copy IFSC");
  expect(view().feedback).toBe("Could not copy IFSC. Select the value above and copy it manually."); noTransferSideEffects();
});


it("clears completed feedback while a newer copy remains pending", async () => {
  await view().copy("Copy account number");
  expect(view().feedback).toBe("Account number copied.");
  const pending = deferred();
  mocks.write.mockReturnValueOnce(pending.promise);
  const latest = view().copy("Copy IFSC");
  expect(view().feedback).toBe("");
  pending.resolve();
  await latest;
  expect(view().feedback).toBe("IFSC copied.");
  noTransferSideEffects();
});
