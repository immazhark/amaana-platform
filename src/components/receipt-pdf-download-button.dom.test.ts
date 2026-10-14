import { createRequire } from "node:module";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReceiptPdfDownloadButton from "./receipt-pdf-download-button";

const runtime = process.env.AMAANA_DOM_TEST_RUNTIME;
const reference = "AFD-2026-12345678";
const token = "synthetic-private-token-012345678901234";
const grant = "rd1." + "a".repeat(16) + "." + "b".repeat(120) + "." + "c".repeat(22);
const bytes = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n");

describe.skipIf(!runtime)("actual private PDF download client interactions", () => {
  let win: Window & typeof globalThis;
  let root: Root;
  let container: HTMLDivElement;
  let fetchMock: ReturnType<typeof vi.fn>;
  let clicked: ReturnType<typeof vi.fn>;
  let createObjectUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { JSDOM } = createRequire(import.meta.url)(runtime!);
    win = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "https://amaana.example", pretendToBeVisual: true,
    }).window;
    for (const key of ["window", "document", "HTMLElement", "HTMLButtonElement",
      "HTMLAnchorElement", "URL"] as const) {
      vi.stubGlobal(key, key === "window" ? win : win[key]);
    }
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    clicked = vi.fn();
    win.HTMLAnchorElement.prototype.click = clicked;
    createObjectUrl = vi.fn(() => "blob:synthetic-pdf");
    Object.defineProperty(win.URL, "createObjectURL", { value: createObjectUrl, configurable: true });
    Object.defineProperty(win.URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
    const { createRoot } = await import("react-dom/client");
    container = win.document.createElement("div");
    win.document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    win.close();
    vi.unstubAllGlobals();
  });

  async function render(getToken: () => string | null) {
    await act(async () => {
      root.render(createElement(ReceiptPdfDownloadButton, { reference, getToken }));
    });
    return container.querySelector<HTMLButtonElement>("button")!;
  }

  it("never sends a request if the private receipt credential is missing", async () => {
    const button = await render(() => null);
    await act(async () => { button.click(); });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain("do not need to make another payment");
  });

  it("authorizes and redeems via private POST bodies without URL credentials", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith("/authorize")) {
        return Promise.resolve(Response.json({ available: true, grant, expiresInSeconds: 300 }));
      }
      return Promise.resolve(new Response(bytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=synthetic.pdf",
          "Content-Length": String(bytes.byteLength),
        },
      }));
    });
    const button = await render(() => token);
    await act(async () => { button.click(); });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [authUrl, authInit] = fetchMock.mock.calls[0]!;
    const [redeemUrl, redeemInit] = fetchMock.mock.calls[1]!;
    expect(authUrl).toBe("/api/donations/receipt-download/authorize");
    expect(redeemUrl).toBe("/api/donations/receipt-download/redeem");
    expect(authInit.method).toBe("POST");
    expect(redeemInit.method).toBe("POST");
    expect(JSON.parse(authInit.body)).toEqual({ reference, token });
    expect(JSON.parse(redeemInit.body)).toEqual({ grant });
    expect(String(authUrl) + String(redeemUrl)).not.toContain(token);
    await vi.waitFor(() => expect(clicked).toHaveBeenCalledOnce());
    expect(createObjectUrl).toHaveBeenCalledOnce();
  });

  it("treats PDF failures as download-only and never retries payment", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    const button = await render(() => token);
    await act(async () => { button.click(); });
    await vi.waitFor(() => expect(container.textContent).toContain("do not need to make another payment"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(clicked).not.toHaveBeenCalled();
  });
});
