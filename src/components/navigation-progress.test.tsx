import { afterEach, expect, it, vi } from "vitest";

const effects = vi.hoisted(() => [] as Array<() => void | (() => void)>);
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (value: unknown) => [value, vi.fn()],
  useEffect: (effect: () => void | (() => void)) => effects.push(effect),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));
import { NavigationProgress } from "./navigation-progress";

afterEach(() => { effects.length = 0; vi.unstubAllGlobals(); });

it("ignores document-target clicks without throwing from the global capture listener", () => {
  const listeners = new Map<string, (event: object) => void>();
  vi.stubGlobal("Element", class {});
  vi.stubGlobal("document", { addEventListener: (name: string, handler: (event: object) => void) => listeners.set(name, handler) });
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  NavigationProgress();
  for (const effect of effects) effect();
  expect(() => listeners.get("click")?.({ button: 0, target: document })).not.toThrow();
});
