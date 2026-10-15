import { createRequire } from "node:module";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
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
  beforeEach(async () => {
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
    const { createRoot } = await import("react-dom/client");
    container = window.document.createElement("div"); window.document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); window.close(); vi.unstubAllGlobals(); });
  async function render() {
    await act(async () => root.render(createElement(FundDonationFlow, { funds: [fund, second] })));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
    await vi.waitFor(async () => {
      await act(async () => { await new Promise(resolve => window.requestAnimationFrame(resolve)); });
      const submit = container.querySelector<HTMLButtonElement>('button[type="submit"]');
      expect(submit).not.toBeNull(); expect(submit!.disabled).toBe(false);
    });
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

  it.each([4, 5])("retains the reviewed purpose until explicit re-review clears consent (revision %s)", async revision => {
    await render();
    const revised = { ...fund, revision, purpose: "An updated independently reviewed purpose for future contributions." };
    await act(async () => root.render(createElement(FundDonationFlow, { funds: [revised, second] })));
    expect(container.textContent).toContain(fund.purpose);
    expect(container.textContent).not.toContain(revised.purpose);
    expect((container.querySelector('[name="fundPurposeConfirmed"]') as HTMLInputElement).checked).toBe(true);
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    await act(async () => container.querySelector("form")!.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    expect(fetchOrder).not.toHaveBeenCalled();
    const review = [...container.querySelectorAll("button")].find(button => button.textContent === "Review updated fund details")!;
    await act(async () => review.click());
    expect(container.textContent).toContain(revised.purpose);
    expect((container.querySelector('[name="fundPurposeConfirmed"]') as HTMLInputElement).checked).toBe(false);
    expect((container.querySelector('[name="donorName"]') as HTMLInputElement).value).toBe("");
    expect(fetchOrder).not.toHaveBeenCalled();
  });
  it("cannot replace the original reviewed purpose during an uncertain checkout", async () => {
    await render();
    await act(async () => container.querySelector("form")!.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    const revised = { ...fund, revision: 5, purpose: "A newly reviewed purpose that must not replace an in-flight order." };
    await act(async () => root.render(createElement(FundDonationFlow, { funds: [revised, second] })));
    const review = [...container.querySelectorAll("button")].find(button => button.textContent === "Review updated fund details")!;
    expect(review.disabled).toBe(true);
    await act(async () => { review.dispatchEvent(new window.Event("click", { bubbles: true })); resolveOrder(response({ fundRevision: 5 })); });
    expect(container.textContent).toContain(fund.purpose);
    expect(container.textContent).not.toContain(revised.purpose);
    expect(opened).not.toHaveBeenCalled();
    expect(container.querySelector("select")!.disabled).toBe(true);
  });

  it("keeps an admitted original-purpose order connected through a fund refresh", async () => {
    await render();
    await act(async () => container.querySelector("form")!.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    const revised = { ...fund, revision: 5, purpose: "A changed purpose for future contributions only." };
    await act(async () => root.render(createElement(FundDonationFlow, { funds: [revised, second] })));
    await act(async () => resolveOrder(response()));
    expect(opened).toHaveBeenCalledOnce();
    expect(container.textContent).toContain(fund.purpose);
    expect(container.textContent).not.toContain(revised.purpose);
    expect(container.querySelector("select")!.disabled).toBe(true);
    await act(async () => checkout!.modal.ondismiss());
    expect(container.querySelector("select")!.disabled).toBe(false);
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  });

  it("retains entered details but blocks a withdrawn fund from new submission", async () => {
    await render();
    await act(async () => root.render(createElement(FundDonationFlow, { funds: [second] })));
    expect(container.textContent).toContain(fund.purpose);
    expect(container.querySelector<HTMLInputElement>('[name="donorName"]')!.value).toBe("Synthetic donor");
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    await act(async () => container.querySelector("form")!.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    expect(fetchOrder).not.toHaveBeenCalled();
    expect(container.textContent).toContain("no longer available for a new contribution");
  });

  it("sets a suggested amount, clears invalidity, and rejects a same-turn change after submit", async () => {
    await render();
    const amount = container.querySelector<HTMLInputElement>('[name="amount"]')!;
    amount.value = "invalid"; amount.setCustomValidity("Enter a valid amount");
    const presets = [...container.querySelectorAll<HTMLButtonElement>('[aria-label="Suggested donation amounts"] button')];
    const thousand = presets.find(button => button.textContent === "₹1,000")!;
    await act(async () => thousand.click());
    expect(amount.value).toBe("1000"); expect(amount.validity.valid).toBe(true);
    expect(window.document.activeElement).toBe(amount);
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
      presets[3]!.click();
    });
    expect(amount.value).toBe("1000");
    expect(JSON.parse(fetchOrder.mock.calls[0]![1].body).amount).toBe("1000");
    expect(presets.every(button => button.disabled)).toBe(true);
  });

});
