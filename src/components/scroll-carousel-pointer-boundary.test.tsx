import { afterEach, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";

vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => [typeof initial === "function" ? initial() : initial, vi.fn()],
  useRef: (current: unknown) => ({ current }),
  useCallback: (callback: unknown) => callback,
  useEffect: vi.fn(),
  useId: () => "pointer-boundary",
}));
import { ScrollCarousel } from "./scroll-carousel";

afterEach(() => vi.unstubAllGlobals());

it.each([true, false])("respects descendant pointer ownership: defaultPrevented=%s", defaultPrevented => {
  vi.stubGlobal("Element", class {});
  const root = ScrollCarousel({ label: "Programmes", children: createElement("a", { href: "/about" }, "Explore") });
  if (!root) throw new Error("Expected carousel");
  const viewport = (root.props.children as ReactElement[])[1];
  if (!viewport) throw new Error("Expected viewport");
  const handlers = viewport.props as {
    onPointerDown: (event: object) => void;
    onPointerMove: (event: object) => void;
    onPointerUp: (event: object) => void;
    onClickCapture: (event: object) => void;
  };
  const surface = {
    scrollLeft: 0,
    style: { removeProperty: vi.fn(), scrollSnapType: "" },
    setPointerCapture: vi.fn(),
  };
  handlers.onPointerDown({ defaultPrevented, pointerType: "mouse", pointerId: 1, button: 0,
    target: null, clientX: 100, currentTarget: surface });
  const move = { buttons: 1, clientX: 70, currentTarget: surface, pointerId: 1, preventDefault: vi.fn() };
  handlers.onPointerMove(move);
  handlers.onPointerUp({ pointerId: 1, currentTarget: surface });
  const click = { detail: 1, preventDefault: vi.fn(), stopPropagation: vi.fn() };
  handlers.onClickCapture(click);

  if (defaultPrevented) {
    expect(surface.setPointerCapture).not.toHaveBeenCalled();
    expect(surface.scrollLeft).toBe(0);
    expect(move.preventDefault).not.toHaveBeenCalled();
    expect(click.preventDefault).not.toHaveBeenCalled();
  } else {
    expect(surface.setPointerCapture).toHaveBeenCalledWith(1);
    expect(surface.scrollLeft).toBe(30);
    expect(move.preventDefault).toHaveBeenCalledOnce();
    expect(click.preventDefault).toHaveBeenCalledOnce();
  }
});
