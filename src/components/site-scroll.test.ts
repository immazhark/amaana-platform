import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("react");
  vi.doUnmock("lenis");
  vi.unstubAllGlobals();
  vi.resetModules();
});

test.each(["af-menu-lock", "af-navigation-lock"])(
  "%s preserves zoom gestures while ordinary wheel scrolling stays locked",
  async lock => {
    let cleanup: (() => void) | undefined;
    const created = vi.fn();
    vi.doMock("react", () => ({
      useEffect: (effect: () => () => void) => { cleanup = effect(); },
    }));
    vi.doMock("lenis", () => ({ default: class { constructor() { created(); } } }));
    const target = Object.assign(new EventTarget(), {
      matchMedia: (query: string) => Object.assign(new EventTarget(), { matches: query === "(pointer: fine)" }),
    });
    vi.stubGlobal("window", target);
    vi.stubGlobal("document", Object.assign(new EventTarget(), {
      hidden: false,
      body: { matches: (selector: string) => selector.split(",").includes(`.${lock}`) },
    }));
    vi.stubGlobal("Element", class {});
    const { useSiteScroll } = await import("./site-scroll");
    useSiteScroll("/about");
    try {
      const zoom = Object.assign(new Event("wheel", { cancelable: true }), { ctrlKey: true });
      target.dispatchEvent(zoom);
      expect(zoom.defaultPrevented).toBe(false);
      const scroll = new Event("wheel", { cancelable: true });
      target.dispatchEvent(scroll);
      expect(scroll.defaultPrevented).toBe(true);
      await vi.dynamicImportSettled();
      expect(created).not.toHaveBeenCalled();
    } finally { cleanup?.(); }
  },
);

test.each([
  { lock: "af-menu-lock", inOpenMenu: true, prevented: false },
  { lock: "af-menu-lock", inOpenMenu: false, prevented: true },
  { lock: "af-navigation-lock", inOpenMenu: true, prevented: true },
])(
  "$lock wheel with inOpenMenu=$inOpenMenu has defaultPrevented=$prevented",
  async ({ lock, inOpenMenu, prevented }) => {
    let cleanup: (() => void) | undefined;
    const created = vi.fn();
    vi.doMock("react", () => ({
      useEffect: (effect: () => () => void) => { cleanup = effect(); },
    }));
    vi.doMock("lenis", () => ({ default: class { constructor() { created(); } } }));
    const windowTarget = Object.assign(new EventTarget(), {
      matchMedia: (query: string) => Object.assign(new EventTarget(), { matches: query === "(pointer: fine)" }),
    });
    vi.stubGlobal("window", windowTarget);
    vi.stubGlobal("document", Object.assign(new EventTarget(), {
      hidden: false,
      body: { matches: (selector: string) => selector.split(",").includes(`.${lock}`) },
    }));
    vi.stubGlobal("Element", class {
      closest(selector: string) {
        return inOpenMenu && (selector === ".mobile-menu.open" || selector.includes(".mobile-menu,")) ? this : null;
      }
    });
    const { useSiteScroll } = await import("./site-scroll");
    useSiteScroll("/about");
    try {
      const wheel = new Event("wheel", { cancelable: true });
      Object.defineProperty(wheel, "target", { value: new Element() });
      windowTarget.dispatchEvent(wheel);
      expect(wheel.defaultPrevented).toBe(prevented);
      await vi.dynamicImportSettled();
      expect(created).not.toHaveBeenCalled();
    } finally { cleanup?.(); }
  },
);

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

test.each(["click", "popstate", "hashchange"])(
  "%s releases active smooth scrolling before native navigation",
  async eventName => {
    let cleanup: (() => void) | undefined;
    const created = vi.fn();
    const destroyed = vi.fn();
    vi.doMock("react", () => ({
      useEffect: (effect: () => () => void) => { cleanup = effect(); },
    }));
    vi.doMock("lenis", () => ({
      default: class {
        constructor() { created(); }
        on() {}
        destroy() { destroyed(); }
      },
    }));
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
    vi.stubGlobal("Element", class {
      closest() { return "a[href]"; }
    });
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { useSiteScroll } = await import("./site-scroll");
    useSiteScroll("/about");
    try {
      windowTarget.dispatchEvent(new Event("wheel"));
      await vi.waitFor(() => expect(created).toHaveBeenCalledOnce());
      const navigation = new Event(eventName);
      if (eventName === "click") {
        Object.defineProperty(navigation, "target", {
          value: new Element(),
        });
      }
      windowTarget.dispatchEvent(navigation);
      expect(destroyed).toHaveBeenCalledOnce();
      windowTarget.dispatchEvent(new Event("wheel"));
      await vi.waitFor(() => expect(created).toHaveBeenCalledTimes(2));
    } finally {
      cleanup?.();
    }
  },
);

test("failed optional Lenis import preserves native scrolling and permits retry", async () => {
  let cleanup: (() => void) | undefined;
  let attempts = 0;
  vi.doMock("react", () => ({
    useEffect: (effect: () => () => void) => { cleanup = effect(); },
  }));
  vi.doMock("lenis", () => {
    attempts += 1;
    throw new Error("optional chunk unavailable");
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
    await vi.waitFor(() => expect(attempts).toBe(1));
    windowTarget.dispatchEvent(new Event("wheel"));
    await vi.waitFor(() => expect(attempts).toBe(2));
  } finally {
    cleanup?.();
  }
});

test.each(["Home", "End"])(
  "%s guarantees the document destination after handing off active wheel smoothing",
  async key => {
    let cleanup: (() => void) | undefined;
    const destroyed = vi.fn();
    const scrollTo = vi.fn();
    vi.doMock("react", () => ({
      useEffect: (effect: () => () => void) => { cleanup = effect(); },
    }));
    vi.doMock("lenis", () => ({
      default: class {
        on() {}
        destroy() { destroyed(); }
      },
    }));
    const target = Object.assign(new EventTarget(), {
      matchMedia: (query: string) => Object.assign(new EventTarget(), {
        matches: query === "(pointer: fine)",
      }),
      scrollTo,
    });
    vi.stubGlobal("window", target);
    vi.stubGlobal("document", Object.assign(new EventTarget(), {
      hidden: false,
      body: { matches: () => false },
      documentElement: { scrollHeight: 1500 },
    }));
    vi.stubGlobal("Element", class {});
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { useSiteScroll } = await import("./site-scroll");
    useSiteScroll("/about");
    try {
      target.dispatchEvent(new Event("wheel"));
      await vi.dynamicImportSettled();
      // IME candidate navigation belongs to the input method, even when a
      // smooth-wheel instance is active elsewhere on the page.
      target.dispatchEvent(Object.assign(new Event("keydown"), { key, isComposing: true }));
      expect(destroyed).not.toHaveBeenCalled();
      expect(scrollTo).not.toHaveBeenCalled();
      target.dispatchEvent(Object.assign(new Event("keydown"), { key }));
      expect(destroyed).toHaveBeenCalledOnce();
      expect(scrollTo).toHaveBeenCalledOnce();
      expect(scrollTo).toHaveBeenCalledWith({
        top: key === "Home" ? 0 : 1500,
        behavior: "instant",
      });
      // Modified Home/End combinations are browser/assistive-tech shortcuts;
      // releasing Lenis must not forcibly redirect their destination.
      for (const modifier of ["ctrlKey", "shiftKey", "altKey", "metaKey"] as const) {
        target.dispatchEvent(new Event("wheel"));
        await vi.dynamicImportSettled();
        scrollTo.mockClear();
        target.dispatchEvent(Object.assign(new Event("keydown"), { key, [modifier]: true }));
        expect(scrollTo).not.toHaveBeenCalled();
      }
    } finally {
      cleanup?.();
    }
  },
);
