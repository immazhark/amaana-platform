import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  pathname: "/our-work",
  setOpen: vi.fn(),
  effectCleanup: undefined as (() => void) | undefined,
  refCount: 0,
  refs: [] as unknown[],
}));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: () => ["/our-work", state.setOpen],
  useRef: () => ({ current: state.refs[state.refCount++] }),
  useEffect: (effect: () => void | (() => void)) => {
    state.effectCleanup = effect() ?? undefined;
  },
}));
import { SiteHeader } from "./site-header";

function keydown(key: string, shiftKey = false) {
  const event = new Event("keydown", { cancelable: true });
  Object.defineProperties(event, { key: { value: key }, shiftKey: { value: shiftKey } });
  window.dispatchEvent(event);
  return event;
}
describe("mobile navigation focus and browser fallback", () => {
  const first = { focus: vi.fn() };
  const last = { focus: vi.fn() };
  const toggle = {
    focus: vi.fn(),
    parentElement: { querySelector: () => ({ focus: vi.fn() }) },
  };
  const nav = {
    getElementsByTagName: () => [first, last],
    contains: (node: unknown) => node === first || node === last,
  };
  const classList = { add: vi.fn(), remove: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks();
    state.refCount = 0;
    state.refs = [toggle, nav];
    state.effectCleanup = undefined;
    vi.stubGlobal("window", Object.assign(new EventTarget(), {}));
    vi.stubGlobal("document", { body: { classList }, activeElement: toggle });
  });
  afterEach(() => {
    state.effectCleanup?.();
    vi.unstubAllGlobals();
  });
  it("keeps a usable mobile menu without matchMedia support", () => {
    SiteHeader();
    expect(first.focus).toHaveBeenCalledOnce();
    expect(classList.add).toHaveBeenCalledWith("af-menu-lock");
    const escape = keydown("Escape");
    expect(escape.defaultPrevented).toBe(true);
    expect(state.setOpen).toHaveBeenCalledWith(null);
    expect(toggle.focus).toHaveBeenCalledOnce();
    state.effectCleanup?.();
    expect(classList.remove).toHaveBeenCalledWith("af-menu-lock");
    state.effectCleanup = undefined;
  });
  it("recovers Tab focus when unrelated scripts move focus outside the mobile menu", () => {
    SiteHeader();
    Object.assign(document, { activeElement: { id: "outside" } });
    expect(keydown("Tab").defaultPrevented).toBe(true);
    expect(first.focus).toHaveBeenCalledTimes(2);
    expect(keydown("Tab", true).defaultPrevented).toBe(true);
    expect(last.focus).toHaveBeenCalledOnce();
  });
  it("releases the menu on desktop breakpoint changes with cleaned-up listeners", () => {
    const listeners: Array<() => void> = [];
    const media = {
      matches: true,
      addEventListener: vi.fn((_name: string, cb: () => void) => listeners.push(cb)),
      removeEventListener: vi.fn(),
    };
    Object.assign(window, { matchMedia: () => media });
    SiteHeader();
    expect(media.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    media.matches = false;
    listeners.forEach(listener => listener());
    expect(state.setOpen).toHaveBeenCalledWith(null);
    state.effectCleanup?.();
    expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    state.effectCleanup = undefined;
  });
});
