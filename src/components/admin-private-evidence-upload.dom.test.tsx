import { createRequire } from "node:module";
import { act } from "react";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPrivateEvidenceUpload } from "./admin-private-evidence-upload";

const m = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: m.refresh }) }));
const runtime = process.env.AMAANA_DOM_TEST_RUNTIME;
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};

describe.skipIf(!runtime)("private evidence upload lifecycle", () => {
  let win: Window & typeof globalThis;
  let root: Root;
  let container: HTMLDivElement;
  let file: File;
  let unmounted: boolean;
  const fetchMock = vi.fn();
  beforeEach(async () => {
    const { JSDOM } = createRequire(import.meta.url)(runtime!);
    win = new JSDOM("<!doctype html><body></body>", { url: "https://amaana.example/admin/requests/case-a" }).window;
    for (const key of ["window", "document", "HTMLElement", "HTMLInputElement", "File"] as const) vi.stubGlobal(key, key === "window" ? win : win[key]);
    file = new win.File(["synthetic private proof"], "proof.pdf", { type: "application/pdf" });
    // jsdom has no browser file-picker interaction. Keep its native form
    // serialization, then supply the one selected test file at that boundary.
    vi.stubGlobal("FormData", class extends win.FormData {
      constructor(form?: HTMLFormElement) { super(form); if (form) this.set("document", file); }
    });
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset(); m.refresh.mockReset();
    const { createRoot } = await import("react-dom/client");
    container = win.document.createElement("div"); win.document.body.append(container);
    root = createRoot(container); unmounted = false;
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });
  afterEach(async () => {
    if (!unmounted) await act(async () => root.unmount());
    win.close(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  });
  async function render(caseId = "case-a", purpose: "delivery" | "financial" | "consent" = "delivery") {
    await act(async () => root.render(<AdminPrivateEvidenceUpload caseId={caseId} purpose={purpose}/>));
  }
  const button = () => container.querySelector("button")!;
  const submit = () => container.querySelector("form")!.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
  async function upload() { await act(async () => { submit(); }); }
  const receipt = () => Response.json({ documentId: "document-123" }, { status: 201 });

  it("rejects empty files before sending private data", async () => {
    file = new win.File([], "empty.pdf"); await render(); await upload();
    expect(fetchMock).not.toHaveBeenCalled(); expect(container.textContent).toContain("non-empty");
  });
  it("locks synchronously before React can render the disabled button", async () => {
    fetchMock.mockReturnValue(new Promise(() => {})); await render();
    await act(async () => { submit(); submit(); });
    expect(fetchMock).toHaveBeenCalledTimes(1); expect(button().disabled).toBe(true);
    expect(fetchMock.mock.calls[0]![1].body.get("purpose")).toBe("delivery");
  });
  it.each(["transport", "body"])("bounds stalled %s and blocks another write until document review", async boundary => {
    fetchMock.mockReturnValue(boundary === "transport" ? new Promise(() => {}) : Promise.resolve({ ok: true, status: 201, json: () => new Promise(() => {}) }));
    await render(); await upload();
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(fetchMock.mock.calls[0]![1].signal.aborted).toBe(true);
    expect(button().disabled).toBe(true); expect(container.textContent).toContain("file may already be stored");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/admin/requests/case-a");
    await upload(); expect(fetchMock).toHaveBeenCalledTimes(1); expect(m.refresh).not.toHaveBeenCalled();
  });
  it("ignores a successful response arriving after the timeout", async () => {
    const pending = deferred<Response>(); fetchMock.mockReturnValue(pending.promise);
    await render(); await upload(); await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    await act(async () => pending.resolve(receipt()));
    expect(container.textContent).toContain("file may already be stored"); expect(m.refresh).not.toHaveBeenCalled();
  });
  it.each([["case-b", "financial"], ["case-a", "consent"]] as const)("isolates case/purpose changes to %s/%s from old results", async (caseId, purpose) => {
    const pending = deferred<Response>(); fetchMock.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(receipt());
    await render(); await upload(); const signal = fetchMock.mock.calls[0]![1].signal;
    await render(caseId, purpose); expect(signal.aborted).toBe(true); expect(button().disabled).toBe(false);
    await act(async () => pending.resolve(receipt())); expect(m.refresh).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("Private evidence uploaded.");
    await upload(); expect(fetchMock.mock.calls[1]![0]).toBe(`/api/admin/assistance/${caseId}/documents`);
    expect(fetchMock.mock.calls[1]![1].body.get("purpose")).toBe(purpose); expect(m.refresh).toHaveBeenCalledTimes(1);
  });
  it("keeps definite validation rejection retryable without automatically resubmitting", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: "Unsupported private file." }, { status: 400 })).mockResolvedValueOnce(receipt());
    await render(); await upload(); expect(container.textContent).toContain("Unsupported private file.");
    expect(button().disabled).toBe(false); expect(fetchMock).toHaveBeenCalledTimes(1);
    await upload(); expect(fetchMock).toHaveBeenCalledTimes(2); expect(m.refresh).toHaveBeenCalledTimes(1);
  });
  it.each(["server-failure", "missing-receipt", "unreadable-body"])("treats %s as uncertain rather than authorizing another upload", async kind => {
    fetchMock.mockResolvedValue(kind === "server-failure" ? Response.json({ error: "Commit outcome uncertain" }, { status: 503 })
      : kind === "missing-receipt" ? Response.json({ ok: true }, { status: 201 }) : new Response("not JSON", { status: 201 }));
    await render(); await upload(); expect(button().disabled).toBe(true); expect(m.refresh).not.toHaveBeenCalled();
    await upload(); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each(["delivery", "financial", "consent"] as const)("reports a verified %s receipt even if refreshing the case fails", async purpose => {
    fetchMock.mockResolvedValue(receipt()); m.refresh.mockImplementation(() => { throw new Error("Refresh failed"); });
    await render("case-a", purpose); await upload();
    expect(container.textContent).toContain("uploaded."); expect(container.textContent).toContain("view refresh failed");
    expect(container.textContent).not.toContain("file may already be stored"); expect(button().disabled).toBe(false);
  });
  it("aborts on unmount and discards the abandoned receipt", async () => {
    const pending = deferred<Response>(); fetchMock.mockReturnValue(pending.promise);
    await render(); await upload(); const signal = fetchMock.mock.calls[0]![1].signal;
    await act(async () => root.unmount()); unmounted = true; expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve(receipt())); expect(m.refresh).not.toHaveBeenCalled();
  });
});
