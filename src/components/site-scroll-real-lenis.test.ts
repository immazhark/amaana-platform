import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
  vi.doUnmock("react"); vi.doUnmock("lenis");
  vi.unstubAllGlobals(); vi.resetModules();
});

test.each(["click", "popstate", "hashchange", "keyboard", "hidden", "unmount"])("native Lenis velocity timer cannot resurrect classes after %s teardown", async kind => {
  let cleanup: (() => void) | undefined;
  vi.doMock("react", () => ({ useEffect: (effect: () => () => void) => { cleanup = effect(); } }));
  const ActualLenis = (await vi.importActual<typeof import("lenis")>("lenis")).default;
  vi.doMock("lenis", () => ({ default: ActualLenis }));
  const classes = new Set<string>();
  const root = {
    classList: {
      add: (...tokens: string[]) => tokens.forEach(token => classes.add(token)),
      remove: (...tokens: string[]) => tokens.forEach(token => classes.delete(token)),
      [Symbol.iterator]: () => classes[Symbol.iterator](),
    },
    scrollHeight: 3000, scrollWidth: 1280,
  };
  class BrowserWindow extends EventTarget {
    scrollY = 0; scrollX = 0; innerWidth = 1280; innerHeight = 720;
    location = { origin: "https://amaanafoundation.org" };
    matchMedia(query: string) {
      return Object.assign(new EventTarget(), { matches: query === "(pointer: fine)" });
    }
  }
  const browser = new BrowserWindow();
  vi.stubGlobal("Window", BrowserWindow);
  vi.stubGlobal("window", browser);
  vi.stubGlobal("navigator", { userAgent: "Synthetic desktop" });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("document", Object.assign(new EventTarget(), {
    hidden: false, documentElement: root, body: { matches: () => false },
  }));
  class LinkChild {
    closest(selector: string) {
      return selector === "a[href]" ? {
        origin: "https://amaanafoundation.org", pathname: "/our-work", target: "", hasAttribute: () => false,
      } : null;
    }
  }
  vi.stubGlobal("Element", LinkChild);
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const { useSiteScroll } = await import("./site-scroll");
  useSiteScroll("/about");
  try {
    browser.dispatchEvent(new Event("wheel"));
    await vi.waitFor(() => expect(classes.has("lenis")).toBe(true));
    vi.useFakeTimers();
    browser.scrollY = 200;
    browser.dispatchEvent(new Event("scroll"));
    expect(classes.has("lenis-scrolling")).toBe(true);
    const click = Object.assign(new Event("click"), {
      button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false,
    });
    Object.defineProperty(click, "target", { value: new LinkChild() });
    if (kind === "click") browser.dispatchEvent(click);
    else if (kind === "keyboard") browser.dispatchEvent(Object.assign(new Event("keydown"), { key: "Home", isComposing: false }));
    else if (kind === "hidden") {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    } else if (kind === "unmount") { cleanup?.(); cleanup = undefined; }
    else browser.dispatchEvent(new Event(kind));
    expect([...classes]).toEqual([]);
    await vi.advanceTimersByTimeAsync(400);
    expect([...classes]).toEqual([]);
  } finally { cleanup?.(); }
});
