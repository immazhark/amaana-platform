import { afterEach, expect, it, vi } from "vitest";

const setState = vi.hoisted(() => vi.fn());
const effects = vi.hoisted(() => [] as Array<() => void | (() => void)>);
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (value: unknown) => [value, setState],
  useEffect: (effect: () => void | (() => void)) => effects.push(effect),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));
import { NavigationProgress } from "./navigation-progress";

afterEach(() => { effects.length = 0; setState.mockClear(); vi.unstubAllGlobals(); });

it("ignores document-target clicks without throwing from the global capture listener", () => {
  const listeners = new Map<string, (event: object) => void>();
  vi.stubGlobal("Element", class {});
  vi.stubGlobal("document", { addEventListener: (name: string, handler: (event: object) => void) => listeners.set(name, handler) });
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  NavigationProgress();
  for (const effect of effects) effect();
  expect(() => listeners.get("click")?.({ button: 0, target: document })).not.toThrow();
});

it("ignores null targets without arming a pending navigation", () => {
  const listeners = new Map<string, (event: object) => void>();
  vi.stubGlobal("Element", class {});
  vi.stubGlobal("document", { addEventListener: (name: string, handler: (event: object) => void) => listeners.set(name, handler) });
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  NavigationProgress();
  for (const effect of effects) effect();
  listeners.get("click")?.({ button: 0, target: null });
  expect(setState).not.toHaveBeenCalled();
});

it("still resolves an element target and arms a same-origin route transition", () => {
  const listeners = new Map<string, (event: object) => void>();
  const anchor = {
    target: "", origin: "https://amaanafoundation.org", pathname: "/contact",
    hasAttribute: () => false, getAttribute: () => null, getClientRects: () => [{}],
  };
  const closest = vi.fn(() => anchor);
  class Target { closest = closest; }
  vi.stubGlobal("Element", Target);
  vi.stubGlobal("location", { origin: anchor.origin, pathname: "/about" });
  vi.stubGlobal("document", { addEventListener: (name: string, handler: (event: object) => void) => listeners.set(name, handler) });
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  NavigationProgress();
  for (const effect of effects) effect();
  listeners.get("click")?.({ button: 0, target: new Target() });
  expect(closest).toHaveBeenCalledWith("a[href]");
  expect(setState).toHaveBeenCalledWith({ fromPath: "/about" });
});
