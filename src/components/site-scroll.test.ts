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

test("keeps native scrolling when media-query support is absent", async () => {
  let cleanup: (() => void) | undefined;
  vi.doMock("react", () => ({ useEffect: (effect: () => (() => void) | undefined) => { cleanup = effect(); } }));
  vi.stubGlobal("window", Object.assign(new EventTarget(), {}));
  const { useSiteScroll } = await import("./site-scroll");
  expect(() => useSiteScroll("/about")).not.toThrow();
  expect(cleanup).toBeUndefined();
});

test("supports legacy media-query change listeners and releases them on unmount", async () => {
  let cleanup: (() => void) | undefined;
  const listeners: Array<() => void> = [];
  const removed: Array<() => void> = [];
  const media = (matches: boolean) => ({
    matches,
    addListener: (callback: () => void) => listeners.push(callback),
    removeListener: (callback: () => void) => removed.push(callback),
  });
  const reduced = media(false);
  const pointer = media(true);
  const destroyed = vi.fn();
  vi.doMock("react", () => ({ useEffect: (effect: () => (() => void) | undefined) => { cleanup = effect(); } }));
  vi.doMock("lenis", () => ({
    default: class {
      on() {}
      destroy() { destroyed(); }
    },
  }));
  const windowTarget = Object.assign(new EventTarget(), {
    matchMedia: (query: string) => query.includes("pointer") ? pointer : reduced,
  });
  vi.stubGlobal("window", windowTarget);
  vi.stubGlobal("document", Object.assign(new EventTarget(), {
    hidden: false, body: { matches: () => false },
  }));
  vi.stubGlobal("Element", class {});
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const { useSiteScroll } = await import("./site-scroll");
  useSiteScroll("/about");
  try {
    expect(listeners).toHaveLength(2);
    windowTarget.dispatchEvent(new Event("wheel"));
    await vi.dynamicImportSettled();
    reduced.matches = true;
    listeners[0]?.();
    expect(destroyed).toHaveBeenCalledOnce();
  } finally {
    cleanup?.();
  }
  expect(removed).toHaveLength(2);
  expect(removed).toEqual(listeners);
});

test.each([null, "", "/admin/donations"])("does not initialize wheel enhancement for unavailable/private path %s", async pathname => {
  vi.doMock("react", () => ({ useEffect: (effect: () => unknown) => effect() }));
  const { useSiteScroll } = await import("./site-scroll");
  // A guarded path must not require matchMedia, DOM access or Lenis.
  expect(() => useSiteScroll(pathname)).not.toThrow();
});
