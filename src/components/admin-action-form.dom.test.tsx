import { createRequire } from "node:module";
import { act } from "react";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminActionButton, AdminActionForm } from "./admin-action-form";

const runtime = process.env.AMAANA_DOM_TEST_RUNTIME;
describe.skipIf(!runtime)("staff action form interactions", () => {
  let window: Window & typeof globalThis;
  let root: Root;
  let container: HTMLDivElement;
  beforeEach(async () => {
    const { JSDOM } = createRequire(import.meta.url)(runtime!);
    window = new JSDOM("<!doctype html><body></body>", { url: "https://amaana.example" }).window;
    for (const key of ["window", "document", "HTMLElement", "HTMLInputElement", "FormData"] as const) vi.stubGlobal(key, key === "window" ? window : window[key]);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const { createRoot } = await import("react-dom/client");
    container = window.document.createElement("div"); window.document.body.append(container); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); window.close(); vi.unstubAllGlobals(); });

  it.each(["state", "status"] as const)("preserves named decisions, pending locks and %s feedback", async discriminator => {
    type Result = { message: string; state: "idle" | "error" | "success" } | { message: string; status: "idle" | "error" | "success" };
    let complete: (result: Result) => void;
    const action = vi.fn((_previous: Result, _form: FormData) => { void _previous; void _form; return new Promise<Result>(resolve => { complete = resolve; }); });
    const initial: Result = discriminator === "state" ? { state: "idle", message: "" } : { status: "idle", message: "" };
    await act(async () => root.render(<AdminActionForm action={action} initial={initial} announce>
      <input name="recordId" defaultValue="synthetic-record" />
      <input name="attestation" required />
      <AdminActionButton type="submit" name="decision" value="VERIFY" pendingLabel="Processing review…">Verify</AdminActionButton>
      <AdminActionButton type="submit" name="decision" value="REJECT" formNoValidate>Reject</AdminActionButton>
    </AdminActionForm>));
    const form = container.querySelector("form")!;
    const verify = container.querySelector<HTMLButtonElement>('[value="VERIFY"]')!;
    const reject = container.querySelector<HTMLButtonElement>('[value="REJECT"]')!;
    expect(form.checkValidity()).toBe(false); expect(reject.formNoValidate).toBe(true);
    await act(async () => form.dispatchEvent(new window.SubmitEvent("submit", { bubbles: true, cancelable: true, submitter: reject })));
    expect(action).toHaveBeenCalledOnce();
    expect(action.mock.calls[0]![1].get("decision")).toBe("REJECT");
    expect(action.mock.calls[0]![1].get("recordId")).toBe("synthetic-record");
    expect(form.getAttribute("aria-busy")).toBe("true"); expect(verify.disabled).toBe(true); expect(reject.disabled).toBe(true);
    expect(verify.textContent).toBe("Processing review…");
    await act(async () => complete({ ...initial, [discriminator]: "error", message: "Synthetic review failed" }));
    expect(form.getAttribute("aria-busy")).toBe("false"); expect(reject.disabled).toBe(false);
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("Synthetic review failed");
    expect(container.querySelector('[role="alert"]')?.getAttribute("aria-live")).toBe("assertive");
    (container.querySelector('[name="attestation"]') as HTMLInputElement).value = "Reviewed";
    await act(async () => form.dispatchEvent(new window.SubmitEvent("submit", { bubbles: true, cancelable: true, submitter: verify })));
    expect(action.mock.calls[1]![1].get("decision")).toBe("VERIFY");
    await act(async () => complete({ ...initial, [discriminator]: "success", message: "Synthetic review saved" }));
    expect(container.querySelector('[role="status"]')?.textContent).toBe("Synthetic review saved");
    expect(verify.disabled).toBe(false);
  });
});
