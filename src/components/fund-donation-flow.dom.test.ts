import { createRequire } from "node:module";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/script", () => ({ default: () => null }));
import { FundDonationFlow } from "./fund-donation-flow";
const runtime = process.env.AMAANA_DOM_TEST_RUNTIME;
const fund = { id: "cmf1234567890123456789012", revision: 4, name: "Reviewed first fund", purpose: "A reviewed charitable purpose for the first fund.", disclosure: "Support is restricted to this original reviewed purpose.", acceptedIntents: ["GENERAL"] as const };
const second = { ...fund, id: "cmf1234567890123456789013", name: "Reviewed second fund" };
describe.skipIf(!runtime)("actual fund donor component interactions", () => {
  let window: Window & typeof globalThis;
  let root: Root;
  let container: HTMLDivElement;
  let resolveOrder: (response: Response) => void;
  let checkout: { modal: { ondismiss: () => void } } | undefined;
  const fetchOrder = vi.fn();
  const opened = vi.fn();
  beforeEach(() => {
    const { JSDOM } = createRequire(import.meta.url)(runtime!);
    window = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://amaana.example", pretendToBeVisual: true }).window;
    for (const key of ["window", "document", "HTMLElement", "HTMLInputElement", "HTMLSelectElement", "RadioNodeList", "FormData"] as const) {
      vi.stubGlobal(key, key === "window" ? window : window[key]);
    }
    vi.stubGlobal("requestAnimationFrame", window.requestAnimationFrame.bind(window));
    vi.stubGlobal("cancelAnimationFrame", window.cancelAnimationFrame.bind(window));
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    checkout = undefined; opened.mockReset(); fetchOrder.mockReset();
    fetchOrder.mockImplementation(() => new Promise<Response>(resolve => { resolveOrder = resolve; }));
    vi.stubGlobal("fetch", fetchOrder);
    window.Razorpay = class {
      constructor(options: unknown) { checkout = options as typeof checkout; }
      open() { opened(); }
    } as typeof window.Razorpay;
    container = window.document.createElement("div"); window.document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); window.close(); vi.unstubAllGlobals(); });
  async function render() {
    await act(async () => root.render(createElement(FundDonationFlow, { funds: [fund, second] })));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
    for (const [name, value] of [["amount", "500"], ["donorName", "Synthetic donor"], ["donorEmail", "donor@example.test"]]) {
      (container.querySelector(`[name="${name}"]`) as HTMLInputElement).value = value!;
    }
    for (const name of ["domesticConfirmed", "fundPurposeConfirmed"]) (container.querySelector(`[name="${name}"]`) as HTMLInputElement).checked = true;
  }
  function response(patch = {}) {
    return Response.json({ designationKind: "FUND", fundId: fund.id, fundRevision: 4, givingIntent: "GENERAL",
      fundName: fund.name, fundPurpose: fund.purpose, fundDisclosure: fund.disclosure,
      keyId: "rzp_test_synthetic", amount: 50000, currency: "INR", orderId: "order_synthetic", receiptToken: "synthetic-private-receipt-token",
      donor: { name: "Synthetic donor", email: "donor@example.test", contact: null }, ...patch }, { status: 201 });
  }
  it("binds the request and prevents same-turn destination switching until unpaid dismissal", async () => {
    await render();
    const selector = container.querySelector("select")!;
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
      selector.value = second.id; selector.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    expect(fetchOrder).toHaveBeenCalledOnce();
    const [url, init] = fetchOrder.mock.calls[0]!;
    expect(url).toBe("/api/donations/fund-order");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ fundId: fund.id, fundRevision: 4, fundPurposeConfirmed: true }); expect(body).not.toHaveProperty("appealId");
    expect(selector.disabled).toBe(true);
    await act(async () => resolveOrder(response())); expect(opened).toHaveBeenCalledOnce();
    await act(async () => checkout!.modal.ondismiss());
    expect(selector.disabled).toBe(false);
    await act(async () => { selector.value = second.id; selector.dispatchEvent(new window.Event("change", { bubbles: true })); });
    expect(container.textContent).toContain(second.name);
    expect((container.querySelector('[name="fundPurposeConfirmed"]') as HTMLInputElement).checked).toBe(false);
  });
  it("locks an inconsistent reviewed-purpose response without constructing checkout", async () => {
    await render();
    await act(async () => container.querySelector("form")!.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    await act(async () => resolveOrder(response({ fundRevision: 5 })));
    expect(opened).not.toHaveBeenCalled(); expect(checkout).toBeUndefined();
    expect(container.querySelector("select")!.disabled).toBe(true);
    expect(container.textContent).toContain("response could not be verified");
  });

});
