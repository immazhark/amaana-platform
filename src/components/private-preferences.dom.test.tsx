import { createRequire } from "node:module";
import { act } from "react";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DonorDataRights } from "./donor-data-rights";
import { DonorRecognitionPreferences } from "./donor-recognition-preferences";
const runtime = process.env.AMAANA_DOM_TEST_RUNTIME;
const getToken = () => "synthetic-private-receipt-token";
const rightsRow = { kind: "ACCESS", status: "OPEN", requestedAt: "2026-10-15T12:00:00Z" };
const pendingName = { state: "pending", name: "Synthetic donor", revocable: true };

describe.skipIf(!runtime)("private receipt preferences lifecycle", () => {
  let win: Window & typeof globalThis;
  let root: Root;
  let container: HTMLDivElement;
  const fetchMock = vi.fn();
  beforeEach(async () => {
    const { JSDOM } = createRequire(import.meta.url)(runtime!);
    win = new JSDOM("<!doctype html><body></body>", { url: "https://amaana.example" }).window;
    for (const key of ["window", "document", "HTMLElement", "HTMLInputElement"] as const) vi.stubGlobal(key, key === "window" ? win : win[key]);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset();
    const { createRoot } = await import("react-dom/client");
    container = win.document.createElement("div"); win.document.body.append(container); root = createRoot(container);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });
  afterEach(async () => { await act(async () => root.unmount()); win.close(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  function button(text: string) { return [...container.querySelectorAll("button")].find(node => node.textContent?.includes(text))!; }
  async function render(surface: "rights" | "recognition", reference = "AFD-SYNTHETIC-ONE") {
    await act(async () => root.render(surface === "rights" ? <DonorDataRights reference={reference} getToken={getToken}/> : <DonorRecognitionPreferences reference={reference} getToken={getToken}/>));
  }
  for (const surface of ["rights", "recognition"] as const) {
    it.each(["transport", "body"])(`${surface} bounds stalled %s reads, retries once and ignores late data`, async stage => {
      let finish: (value: unknown) => void = () => {};
      const stalled = new Promise(resolve => { finish = resolve; });
      fetchMock.mockImplementationOnce(() => stage === "transport" ? stalled : Promise.resolve({ ok: true, json: () => stalled }));
      await render(surface);
      await act(async () => vi.advanceTimersByTimeAsync(8_000));
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      const retry = button("Check status"); expect(retry).toBeDefined();
      fetchMock.mockResolvedValueOnce(Response.json(surface === "rights" ? { requests: [] } : { state: "inactive", name: "", revocable: false }));
      await act(async () => retry.click()); expect(fetchMock).toHaveBeenCalledTimes(2);
      const old = surface === "rights" ? { requests: [rightsRow] } : pendingName;
      await act(async () => finish(stage === "body" ? old : Response.json(old)));
      expect(container.textContent).not.toContain("Synthetic donor"); expect(container.textContent).not.toContain("Received");
      for (const [, init] of fetchMock.mock.calls) expect(JSON.parse(init.body)).toMatchObject({ action: "status", token: getToken() });
    });
    it(`${surface} removes the previous record while the new reference loads`, async () => {
      fetchMock.mockResolvedValueOnce(Response.json(surface === "rights" ? { requests: [rightsRow] } : pendingName));
      await render(surface); expect(container.textContent).toContain(surface === "rights" ? "Received" : "Synthetic donor");
      fetchMock.mockImplementationOnce(() => new Promise(() => {}));
      await render(surface, "AFD-SYNTHETIC-TWO");
      expect(container.textContent).not.toContain(surface === "rights" ? "Received" : "Synthetic donor");
      expect([...container.querySelectorAll("button")].every(node => node.disabled)).toBe(true);
    });
    it.each(["transport", "body"])(`${surface} locks uncertain %s mutations until a read-only status refresh`, async stage => {
      fetchMock.mockResolvedValueOnce(Response.json(surface === "rights" ? { requests: [] } : pendingName));
      await render(surface);
      let finish: (value: unknown) => void = () => {};
      const stalled = new Promise(resolve => { finish = resolve; });
      fetchMock.mockImplementationOnce(() => stage === "transport" ? stalled : Promise.resolve({ ok: true, json: () => stalled }));
      const submit = button(surface === "rights" ? "Submit private" : "Withdraw");
      await act(async () => { submit.click(); submit.dispatchEvent(new win.MouseEvent("click", { bubbles: true })); });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await act(async () => vi.advanceTimersByTimeAsync(15_000));
      expect(container.textContent).toContain("could not confirm");
      expect(button("Check status")).toBeDefined();
      expect(button(surface === "rights" ? "Submit private" : "Withdraw")?.disabled ?? true).toBe(true);
      fetchMock.mockResolvedValueOnce(Response.json(surface === "rights" ? { requests: [rightsRow] } : { state: "inactive", name: "", revocable: false }));
      await act(async () => button("Check status").click());
      expect(fetchMock).toHaveBeenCalledTimes(3); expect(JSON.parse(fetchMock.mock.calls[2]![1].body).action).toBe("status");
      const late = surface === "rights" ? { ...rightsRow, status: "CLOSED" } : { state: "published", name: "Late donor", revocable: true };
      await act(async () => finish(stage === "body" ? late : Response.json(late)));
      expect(container.textContent).not.toContain("Late donor"); expect(container.textContent).not.toContain("Review closed");
    });
  }
  it("rejects duplicate rights kinds instead of rendering conflicting status rows", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ requests: [rightsRow, rightsRow] }));
    await render("rights"); expect(container.querySelector('[role="alert"]')).not.toBeNull(); expect(container.textContent).not.toContain("Received");
  });
});
