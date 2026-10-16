import { afterEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ cleanup: undefined as (() => void) | undefined, pathname: "/about" as string | null }));
vi.mock("react", () => ({ useEffect: (effect: () => () => void) => { hooks.cleanup = effect(); } }));
vi.mock("next/navigation", () => ({ usePathname: () => hooks.pathname }));
vi.mock("./site-scroll", () => ({ useSiteScroll: vi.fn() }));
import { SiteMotion } from "./site-motion";

class Control {
  isConnected = true;
  style = { translate: "", scale: "", opacity: "" };
  frames: { scale: string[] }[] = [];
  closest() { return this; }
  matches(selector: string) { return selector === ":hover, :focus-visible"; }
  contains(node: unknown) { return node === this; }
  animate(frames: { scale: string[] }) {
    this.frames.push(frames);
    return { cancel: vi.fn(), finished: new Promise(() => {}) };
  }
}
class Pointer {
  pointerType = "mouse";
  isPrimary = true;
  constructor(public type: string, public target: unknown, public button = 0) {}
}
class Key {
  repeat = false;
  constructor(public type: string, public target: unknown, public key: string) {}
}

function setup(options: { observer?: boolean; matchMedia?: boolean } = {}) {
  const listeners = new Map<string, (event: unknown) => void>();
  const preference = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("Element", Control);
  vi.stubGlobal("Node", Control);
  vi.stubGlobal("HTMLElement", Control);
  vi.stubGlobal("PointerEvent", Pointer);
  vi.stubGlobal("KeyboardEvent", Key);
  vi.stubGlobal("getComputedStyle", () => ({ translate: "none", scale: "none" }));
  vi.stubGlobal("window", {
    ...(options.matchMedia !== false ? { matchMedia: () => preference } : {}),
    addEventListener: (name: string, listener: (event: unknown) => void) => listeners.set(name, listener),
    removeEventListener: (name: string) => listeners.delete(name),
  });
  vi.stubGlobal("document", {
    getElementById: () => null,
    addEventListener: (name: string, listener: (event: unknown) => void) => listeners.set(name, listener),
    removeEventListener: (name: string) => listeners.delete(name),
  });
  vi.stubGlobal("IntersectionObserver", options.observer === false ? undefined : class { disconnect() {} });
  SiteMotion();
  return { fire: (event: { type: string }) => listeners.get(event.type)?.(event), preference, listeners };
}

afterEach(() => {
  hooks.cleanup?.();
  hooks.cleanup = undefined;
  hooks.pathname = "/about";
  vi.unstubAllGlobals();
});

describe("delegated motion press ownership", () => {
  it("preserves a pointer press through focus and hover events", () => {
    const { fire } = setup();
    const control = new Control();
    fire(new Pointer("pointerdown", control));
    fire({ type: "focusin", target: control } as Pointer);
    fire(new Pointer("pointerout", control));
    expect(control.frames.map(frame => frame.scale.at(-1))).toEqual(["0.98", "0.98", "0.98"]);
  });
  it("releases the original control when pointer-up or cancel targets elsewhere", () => {
    const { fire } = setup();
    for (const type of ["pointerup", "pointercancel"]) {
      const control = new Control();
      fire(new Pointer("pointerdown", control));
      fire(new Pointer(type, null, -1));
      expect(control.frames.at(-1)?.scale.at(-1)).toBe("1");
    }
  });
  it("releases a keyboard press after focus moves", () => {
    const { fire } = setup();
    const control = new Control();
    fire(new Key("keydown", control, " "));
    fire({ type: "focusout", target: control } as Key);
    expect(control.frames.at(-1)?.scale.at(-1)).toBe("0.98");
    fire(new Key("keyup", null, " "));
    expect(control.frames.at(-1)?.scale.at(-1)).toBe("1");
  });
  it("clears press ownership when reduced motion becomes active", () => {
    const { fire, preference } = setup();
    const control = new Control();
    fire(new Pointer("pointerdown", control));
    preference.matches = true;
    preference.addEventListener.mock.calls[0]?.[1]?.();
    preference.matches = false;
    fire({ type: "focusin", target: control } as Pointer);
    expect(control.frames.at(-1)?.scale.at(-1)).toBe("1");
  });
  it("restores the element's authored inline properties after motion cleanup", () => {
    const { fire } = setup();
    const control = new Control();
    control.style.translate = "3px 0";
    control.style.scale = "1.12";
    control.style.opacity = "0.7";
    fire(new Pointer("pointerdown", control));
    expect(control.frames).toHaveLength(1);
    hooks.cleanup?.();
    hooks.cleanup = undefined;
    expect(control.style).toEqual({ translate: "3px 0", scale: "1.12", opacity: "0.7" });
  });
  it("allows hover feedback when IntersectionObserver is absent", () => {
    const { fire } = setup({ observer: false });
    const control = new Control();
    fire(new Pointer("pointerover", control));
    expect(control.frames).toHaveLength(1);
  });
  it("retains native interaction if Web Animations is unavailable", () => {
    const { fire } = setup();
    const control = new Control();
    Object.defineProperty(control, "animate", { value: undefined });
    expect(() => fire(new Pointer("pointerover", control))).not.toThrow();
    expect(control.style.translate).toBe("");
  });
  it("releases held controls when the window loses focus", () => {
    const { fire } = setup();
    const control = new Control();
    fire(new Pointer("pointerdown", control));
    fire(new Key("keydown", control, "Enter"));
    fire({ type: "blur" });
    expect(control.frames.at(-1)?.scale.at(-1)).toBe("1");
  });
});

it("skips motion without matchMedia and on staff-only routes", () => {
  const { fire } = setup({ matchMedia: false });
  expect(() => fire(new Pointer("pointerover", new Control()))).not.toThrow();
  hooks.cleanup?.();
  hooks.cleanup = undefined;
  hooks.pathname = "/admin/requests";
  expect(() => SiteMotion()).not.toThrow();
  expect(hooks.cleanup).toBeUndefined();
});

it("leaves native interaction untouched while the pathname is unavailable", () => {
  hooks.pathname = null;
  // No window/document is installed: the pending router state must not touch DOM APIs.
  expect(() => SiteMotion()).not.toThrow();
  expect(hooks.cleanup).toBeUndefined();
});
