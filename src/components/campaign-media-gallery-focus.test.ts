import { afterEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  refs: [] as unknown[],
  createdRefs: [] as Array<{ current: unknown }>,
  cleanup: undefined as (() => void) | undefined,
}));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: () => ["second", vi.fn()],
  useRef: (initial: unknown) => {
    const ref = { current: hooks.refs.length ? hooks.refs.shift() : initial };
    hooks.createdRefs.push(ref);
    return ref;
  },
  useId: () => "fixture",
  useMemo: (compute: () => unknown) => compute(),
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => (() => void) | undefined) => { hooks.cleanup = effect(); },
}));
import { CampaignMediaGallery } from "./campaign-media-gallery";

afterEach(() => {
  vi.unstubAllGlobals();
  hooks.cleanup = undefined;
  hooks.createdRefs = [];
});

describe("gallery modal focus return", () => {
  it("does not override deliberate focus on another connected element", () => {
    const opener = { isConnected: true, focus: vi.fn() };
    const dialog = { isConnected: true };
    const nextTarget = { isConnected: true };
    const body = { style: { overflow: "" } };
    const frames: Array<() => void> = [];
    vi.stubGlobal("document", { body, activeElement: nextTarget });
    vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal("requestAnimationFrame", (fn: () => void) => frames.push(fn));
    hooks.refs = [dialog, { focus: vi.fn() }, [opener], "second"];
    CampaignMediaGallery({ items: [{ id: "second", url: "/media/2026/second.webp", alt: "Second" }] });
    dialog.isConnected = false;
    hooks.cleanup?.();
    frames.forEach(frame => frame());
    expect(opener.focus).not.toHaveBeenCalled();
  });

  it("does not steal focus from a replacement dialog during deferred restoration", () => {
    const opener = { isConnected: true, focus: vi.fn() };
    const dialog = { isConnected: true };
    const close = { focus: vi.fn() };
    const frames: Array<() => void> = [];
    const body = { style: { overflow: "" } };
    vi.stubGlobal("document", { body });
    vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal("requestAnimationFrame", (fn: () => void) => frames.push(fn));
    hooks.refs = [dialog, close, [opener], "second"];
    CampaignMediaGallery({ items: [{ id: "second", url: "/media/2026/second.webp", alt: "Second" }] });
    dialog.isConnected = false;
    hooks.cleanup?.();
    // React committed a newly opened lightbox before the old restore frame.
    const newDialog = { isConnected: true };
    hooks.createdRefs[0]!.current = newDialog;
    frames.forEach(frame => frame());
    expect(opener.focus).not.toHaveBeenCalled();
    expect(body.style.overflow).toBe("");
  });

  for (const [name, order, opener, expected] of [
    ["returns to the opener after navigation", ["first", "second"], "first", "first"],
    ["follows the opener after reorder", ["second", "first"], "first", "first"],
    ["falls back when the opener was removed", ["second"], "first", "second"],
  ] as const) {
    it(name, () => {
      const triggers = order.map(id => ({ id, isConnected: true, focus: vi.fn() }));
      const dialog = { isConnected: true };
      const close = { focus: vi.fn() };
      const body = { style: { overflow: "auto" } };
      const listeners = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      const frames: (() => void)[] = [];
      vi.stubGlobal("document", { body });
      vi.stubGlobal("window", listeners);
      vi.stubGlobal("requestAnimationFrame", (callback: () => void) => frames.push(callback));
      hooks.refs = [dialog, close, triggers, opener];
      CampaignMediaGallery({ items: order.map(id => ({ id, url: `/media/2026/${id}.webp`, alt: id })) });
      expect(body.style.overflow).toBe("hidden");
      expect(close.focus).toHaveBeenCalledOnce();
      dialog.isConnected = false;
      hooks.cleanup?.();
      expect(body.style.overflow).toBe("auto");
      expect(listeners.removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
      frames.forEach(callback => callback());
      for (const trigger of triggers) expect(trigger.focus).toHaveBeenCalledTimes(trigger.id === expected ? 1 : 0);
    });
  }
});
