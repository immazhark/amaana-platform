import { isValidElement, type ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ pathname: "/about", index: 0, values: [] as unknown[] }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = state.index++;
    if (!(index in state.values)) state.values[index] = typeof initial === "function" ? initial() : initial;
    return [state.values[index], (next: unknown) => {
      state.values[index] = typeof next === "function" ? next(state.values[index]) : next;
    }];
  },
  useRef: () => ({ current: null }),
  useEffect: () => undefined,
}));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("next/link", () => ({ default: () => null }));
vi.mock("next/image", () => ({ default: () => null }));
import { SiteHeader } from "./site-header";

afterEach(() => { state.pathname = "/about"; state.values.length = 0; });
function view(pathname = state.pathname) {
  state.pathname = pathname; state.index = 0;
  function find(node: ReactNode): { open: boolean; toggle: () => void } | undefined {
    if (Array.isArray(node)) {
      for (const child of node) { const found = find(child); if (found) return found; }
    } else if (isValidElement<{ children?: ReactNode; "aria-controls"?: string; "aria-expanded"?: boolean; onClick?: () => void }>(node)) {
      if (node.type === "button" && node.props["aria-controls"] === "mobile-navigation") {
        if (!node.props.onClick) throw new Error("Missing menu toggle");
        return { open: Boolean(node.props["aria-expanded"]), toggle: node.props.onClick };
      }
      return find(node.props.children);
    }
  }
  const menu = find(SiteHeader());
  if (!menu) throw new Error("Expected real mobile navigation toggle");
  return menu;
}

it("does not reopen a retained menu after history returns to its original route", () => {
  view().toggle(); expect(view().open).toBe(true);
  expect(view("/impact").open).toBe(false);
  expect(view("/about").open).toBe(false);
});

it("preserves an explicit new-route toggle and closes it on the next route change", () => {
  view().toggle(); view("/impact");
  view().toggle(); expect(view().open).toBe(true);
  expect(view("/about").open).toBe(false);
  expect(view("/impact").open).toBe(false);
});

it("keeps a menu open through same-route renders and honors an explicit close", () => {
  view().toggle(); expect(view().open).toBe(true);
  expect(view("/about").open).toBe(true);
  view().toggle(); expect(view().open).toBe(false);
});
