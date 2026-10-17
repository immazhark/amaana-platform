import { createRequire } from "node:module";
import { act } from "react";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CuratedGalleryImporter } from "./curated-gallery-importer";
import {
  CURATED_GALLERY_BATCH,
  CURATED_GALLERY_EXPECTED_COUNTS,
} from "@/lib/curated-gallery-identity";

const runtime = process.env.AMAANA_DOM_TEST_RUNTIME;
function stageStatus(published = false) {
  return {
    initialized: true, batch: CURATED_GALLERY_BATCH, expected: 154,
    uploaded: 154, published: published ? 154 : 0, missing: 0,
    mismatches: [] as string[], galleryOnly: true, renderingReady: published,
    initiatives: Object.entries(CURATED_GALLERY_EXPECTED_COUNTS).map(([slug, expected]) => ({
      slug, expected, uploaded: expected, published: published ? expected : 0,
      publicRecordFound: published, publicSafeCount: published ? expected : 0,
      galleryVisibleCount: published ? expected : 0,
      curatedHeroSelected: false, curatedHighlightSelected: false, ready: published,
    })),
  };
}

describe.skipIf(!runtime)("curated gallery operator lifecycle", () => {
  let win: Window & typeof globalThis;
  let root: Root;
  let container: HTMLDivElement;
  const fetchMock = vi.fn();
  beforeEach(async () => {
    const { JSDOM } = createRequire(import.meta.url)(runtime!);
    win = new JSDOM("<!doctype html><body></body>", { url: "https://amaana.example" }).window;
    for (const key of ["window", "document", "HTMLElement", "HTMLInputElement"] as const) {
      vi.stubGlobal(key, key === "window" ? win : win[key]);
    }
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    vi.spyOn(win, "confirm").mockReturnValue(true);
    const { createRoot } = await import("react-dom/client");
    container = win.document.createElement("div");
    win.document.body.append(container);
    root = createRoot(container);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    win.close();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  async function render() { await act(async () => root.render(<CuratedGalleryImporter />)); }
  function button(text: string) {
    return [...container.querySelectorAll("button")].find(node => node.textContent?.includes(text));
  }
  function requests(method: string) {
    return fetchMock.mock.calls.filter(([, init]) => (init?.method ?? "GET") === method);
  }

  it("blocks publication until a complete authoritative staging read, then reconfirms server state", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ initialized: false, uploaded: 0, published: 0, missing: 154 }));
    await render();
    expect(button("Publish all")).toBeUndefined();
    fetchMock.mockResolvedValueOnce(Response.json(stageStatus()));
    await act(async () => button("Check import")?.click());
    expect(button("Publish all")).toBeDefined();

    fetchMock.mockResolvedValueOnce(Response.json({ ...stageStatus(), mismatches: ["curated-" + "a".repeat(32)],
      initiatives: stageStatus().initiatives.map((item, index) => index ? item : { ...item, uploaded: item.uploaded - 1 }),
    }));
    await act(async () => button("Publish all")?.click());
    expect(requests("POST")).toHaveLength(0);
    expect(container.textContent).toContain("staging changed");
    expect(button("Publish all")).toBeUndefined();
  });

  it("hides stale publication readiness during a stalled status request and recovers on read", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(stageStatus()));
    await render();
    expect(button("Publish all")).toBeDefined();

    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    await act(async () => button("Check import")?.click());
    expect(button("Publish all")).toBeUndefined();
    await act(async () => vi.advanceTimersByTimeAsync(12_000));
    expect(button("Publish all")).toBeUndefined();
    expect(container.textContent).toContain("status could not");

    fetchMock.mockResolvedValueOnce(Response.json(stageStatus()));
    await act(async () => button("Check import")?.click());
    expect(button("Publish all")).toBeDefined();
    expect(requests("POST")).toHaveLength(0);
  });

  it("ignores an older failed status read after a newer read verified publication", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(stageStatus()));
    await render();
    let rejectOld!: (error: Error) => void;
    fetchMock.mockReturnValueOnce(new Promise((_resolve, reject) => { rejectOld = reject; }));
    await act(async () => button("Check import")?.click());
    fetchMock.mockResolvedValueOnce(Response.json(stageStatus(true)));
    await act(async () => button("Check import")?.click());
    expect(container.textContent).toContain("rendering is verified");
    await act(async () => rejectOld(new Error("Old status failed")));
    expect(container.textContent).toContain("rendering is verified");
    expect(container.textContent).not.toContain("Old status failed");
    expect(requests("POST")).toHaveLength(0);
  });

  it("never blindly repeats an uncertain publish; recovery is read-only", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(stageStatus()));
    await render();
    fetchMock.mockResolvedValueOnce(Response.json(stageStatus()));
    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    await act(async () => button("Publish all")?.click());
    expect(requests("POST")).toHaveLength(1);
    await act(async () => vi.advanceTimersByTimeAsync(45_000));
    expect(container.textContent).toContain("may have completed");
    expect((container.querySelector("#curatedGalleryZip") as HTMLInputElement).disabled).toBe(true);
    expect(button("Publish all")).toBeUndefined();

    fetchMock.mockResolvedValueOnce(Response.json(stageStatus(true)));
    await act(async () => button("Check import")?.click());
    expect(requests("POST")).toHaveLength(1);
    expect(button("Publish all")).toBeUndefined();
    expect(container.textContent).toContain("published");
  });

  it("does not unlock an uncertain publication when the session becomes unavailable", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(stageStatus()));
    await render();

    fetchMock.mockResolvedValueOnce(Response.json(stageStatus()));
    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    await act(async () => button("Publish all")?.click());
    await act(async () => vi.advanceTimersByTimeAsync(45_000));
    expect(container.textContent).toContain("may have completed");

    fetchMock.mockResolvedValueOnce(Response.json({
      initialized: false, uploaded: 0, published: 0, missing: 154,
    }));
    await act(async () => button("Check import")?.click());
    expect((container.querySelector("#curatedGalleryZip") as HTMLInputElement).disabled).toBe(true);
    expect(button("Publish all")).toBeUndefined();
    expect(requests("POST")).toHaveLength(1);
  });

  it("keeps server drift visible while preventing owner approval", async () => {
    const status = stageStatus(true);
    status.mismatches.push("curated-" + "c".repeat(32));
    const first = status.initiatives[0];
    if (!first) throw new Error("Missing initiative fixture.");
    first.uploaded -= 1;
    first.ready = false;
    status.renderingReady = false;
    fetchMock.mockResolvedValueOnce(Response.json(status));
    await render();
    expect(container.textContent).toContain("Mismatches 1");
    expect(container.textContent).toContain("Publication is blocked");
    expect(button("Publish all")).toBeUndefined();
  });
});
