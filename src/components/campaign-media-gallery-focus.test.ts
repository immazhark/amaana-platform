import { afterEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ refs: [] as unknown[], cleanup: undefined as (() => void) | undefined }));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: () => ["second", vi.fn()],
  useRef: () => ({ current: hooks.refs.shift() }),
  useId: () => "fixture",
  useMemo: (compute: () => unknown) => compute(),
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => (() => void) | undefined) => { hooks.cleanup = effect(); },
}));
import { CampaignMediaGallery } from "./campaign-media-gallery";

afterEach(() => {
  vi.unstubAllGlobals();
  hooks.cleanup = undefined;
});

describe("gallery modal focus return", () => {
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
      CampaignMediaGallery({ items: order.map(id => ({ id, url: `data:image/png,${id}`, alt: id })) });
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
