import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("react");
  vi.doUnmock("lenis");
  vi.unstubAllGlobals();
  vi.resetModules();
});

test.each(["Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "])(
  "%s cancels pending wheel enhancement and a later wheel may restart it",
  async key => {
    let cleanup: (() => void) | undefined;
    const created = vi.fn();
    const destroyed = vi.fn();
    let release: (() => void) | undefined;
    const pending = new Promise<void>(resolve => { release = resolve; });
    const importing = vi.fn();
    vi.doMock("react", () => ({
      useEffect: (effect: () => () => void) => { cleanup = effect(); },
    }));
    vi.doMock("lenis", async () => {
      importing();
      await pending;
      return {
        default: class {
          constructor() { created(); }
          on() {}
          destroy() { destroyed(); }
        },
      };
    });
    const windowTarget = Object.assign(new EventTarget(), {
      matchMedia: (query: string) => Object.assign(new EventTarget(), {
        matches: query === "(pointer: fine)",
      }),
    });
    vi.stubGlobal("window", windowTarget);
    vi.stubGlobal("document", Object.assign(new EventTarget(), {
      hidden: false,
      body: { matches: () => false },
    }));
    vi.stubGlobal("Element", class {});
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { useSiteScroll } = await import("./site-scroll");
    useSiteScroll("/about");
    try {
      windowTarget.dispatchEvent(new Event("wheel"));
      await vi.waitFor(() => expect(importing).toHaveBeenCalledOnce());
      windowTarget.dispatchEvent(Object.assign(new Event("keydown"), { key }));
      release?.();
      await vi.dynamicImportSettled();
      expect(created).not.toHaveBeenCalled();

      windowTarget.dispatchEvent(new Event("wheel"));
      await vi.dynamicImportSettled();
      expect(created).toHaveBeenCalledOnce();
      windowTarget.dispatchEvent(Object.assign(new Event("keydown"), { key }));
      expect(destroyed).toHaveBeenCalledOnce();
    } finally {
      release?.();
      cleanup?.();
    }
  },
);
