import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ effect: undefined as undefined | (() => void | (() => void)), refs: [] as object[] }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: () => ["/about", vi.fn()],
  useRef: () => mocks.refs.shift(),
  useEffect: (effect: () => void | (() => void)) => { mocks.effect = effect; },
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));
vi.mock("next/link", () => ({ default: () => null }));
vi.mock("next/image", () => ({ default: () => null }));
import { SiteHeader } from "./site-header";

afterEach(() => { vi.unstubAllGlobals(); mocks.effect = undefined; });

function fixture() {
  const toggle = { focus: vi.fn() };
  const first = { focus: vi.fn() };
  const last = { focus: vi.fn() };
  const nav = { getElementsByTagName: () => [first, last], contains: (node: unknown) => node === first || node === last };
  mocks.refs = [{ current: toggle }, { current: nav }];
  const target = new EventTarget();
  const documentStub = { activeElement: null as unknown, body: { classList: { add: vi.fn(), remove: vi.fn() } } };
  vi.stubGlobal("document", documentStub);
  vi.stubGlobal("window", Object.assign(target, {
    matchMedia: () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  }));
  SiteHeader();
  const cleanup = mocks.effect?.();
  expect(first.focus).toHaveBeenCalledOnce();
  first.focus.mockClear();
  return {
    toggle, first, last, cleanup,
    key(key: string, shiftKey = false, active: unknown = null) {
      documentStub.activeElement = active;
      const event = new Event("keydown", { cancelable: true });
      Object.defineProperties(event, { key: { value: key }, shiftKey: { value: shiftKey } });
      target.dispatchEvent(event);
      return event;
    },
  };
}

describe("mobile menu keyboard focus containment", () => {
  it.each([false, true])("recovers external focus, backwards=%s", backwards => {
    const f = fixture();
    expect(f.key("Tab", backwards).defaultPrevented).toBe(true);
    expect(backwards ? f.last.focus : f.toggle.focus).toHaveBeenCalledOnce();
    f.cleanup?.();
  });
  it("retains forward and backward boundary wrapping", () => {
    const f = fixture();
    expect(f.key("Tab", false, f.last).defaultPrevented).toBe(true);
    expect(f.toggle.focus).toHaveBeenCalledOnce();
    expect(f.key("Tab", true, f.toggle).defaultPrevented).toBe(true);
    expect(f.last.focus).toHaveBeenCalledOnce();
    f.cleanup?.();
  });
  it("allows native traversal between menu links", () => {
    const f = fixture();
    expect(f.key("Tab", false, f.first).defaultPrevented).toBe(false);
    expect(f.toggle.focus).not.toHaveBeenCalled();
    expect(f.last.focus).not.toHaveBeenCalled();
    f.cleanup?.();
  });
});
