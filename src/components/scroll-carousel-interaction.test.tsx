import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";

vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => [typeof initial === "function" ? initial() : initial, vi.fn()],
  useRef: (current: unknown) => ({ current }),
  useCallback: (callback: unknown) => callback,
  useEffect: vi.fn(),
  useId: () => "interaction-test",
}));
import { ScrollCarousel } from "./scroll-carousel";

beforeEach(() => vi.stubGlobal("Element", class {}));
afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const root = ScrollCarousel({ label: "Programmes", children: [createElement("a", { key: "one", href: "/about" }, "Explore")] });
  if (!root) throw new Error("Expected carousel");
  const viewport = (root.props.children as ReactElement[])[1];
  const surface = { scrollLeft: 0, style: { removeProperty: vi.fn() }, setPointerCapture: vi.fn() };
  if (!viewport) throw new Error("Expected carousel viewport");
  const props = viewport.props as {
    onPointerDown: (event: object) => void;
    onPointerMove: (event: object) => void;
    onPointerUp: (event: object) => void;
    onPointerCancel: (event: object) => void;
    onLostPointerCapture: (event: object) => void;
    onClickCapture: (event: object) => void;
    onKeyDown: (event: object) => void;
  };
  return {
    drag(target: object | null = null) {
      props.onPointerDown({ pointerType: "mouse", pointerId: 1, button: 0, target, clientX: 100, currentTarget: surface });
      props.onPointerMove({ buttons: 1, clientX: 70, currentTarget: surface, pointerId: 1, preventDefault: vi.fn() });
      props.onPointerUp({ pointerId: 1, currentTarget: surface });
    },
    start(pointerId = 1) {
      props.onPointerDown({ pointerType: "mouse", pointerId, button: 0, target: null, clientX: 100, currentTarget: surface });
    },
    move(pointerId = 1) {
      const preventDefault = vi.fn();
      props.onPointerMove({ pointerId, buttons: 1, clientX: 70, currentTarget: surface, preventDefault });
      return preventDefault;
    },
    end(type: "up" | "cancel" | "lost", pointerId = 1) {
      const event = { pointerId, currentTarget: surface };
      if (type === "up") props.onPointerUp(event);
      else if (type === "cancel") props.onPointerCancel(event);
      else props.onLostPointerCapture(event);
    },
    click(detail: number) {
      const event = { detail, preventDefault: vi.fn(), stopPropagation: vi.fn() };
      props.onClickCapture(event);
      return event;
    },
    surface,
    key(key: string, modifiers: object = {}) {
      const event = { key, nativeEvent: { isComposing: false }, currentTarget: surface, target: surface, preventDefault: vi.fn(), ...modifiers };
      props.onKeyDown(event);
      return event;
    },
  };
}

describe("carousel drag and activation boundaries", () => {
  it.each([
    ["ArrowLeft", { altKey: true }], ["Home", { ctrlKey: true }],
    ["End", { metaKey: true }], ["ArrowRight", { shiftKey: true }],
    ["ArrowRight", { nativeEvent: { isComposing: true } }], ["Home", { defaultPrevented: true }],
  ])("preserves browser-owned %s with %j", (key, modifiers) => {
    expect(fixture().key(key, modifiers).preventDefault).not.toHaveBeenCalled();
  });

  it("still handles unmodified carousel navigation", () => {
    expect(fixture().key("ArrowRight").preventDefault).toHaveBeenCalledOnce();
  });

  it("suppresses a dragged link click even if pointer capture is lost before pointerup", () => {
    const carousel = fixture();
    carousel.start(7);
    carousel.move(7);
    carousel.end("lost", 7);
    carousel.end("up", 7);
    expect(carousel.click(1).preventDefault).toHaveBeenCalledOnce();
    expect(carousel.click(1).preventDefault).not.toHaveBeenCalled();
  });

  it("ignores movement and cancellation from a different pointer during mouse dragging", () => {
    const carousel = fixture();
    carousel.start(7);
    expect(carousel.move(8)).not.toHaveBeenCalled();
    expect(carousel.surface.setPointerCapture).not.toHaveBeenCalled();
    carousel.end("cancel", 8);
    expect(carousel.move(7)).toHaveBeenCalledOnce();
    carousel.end("up", 7);
    expect(carousel.click(1).preventDefault).toHaveBeenCalledOnce();
  });

  it("requests pointer capture exactly once while a dragged card continues moving", () => {
    const carousel = fixture();
    carousel.start(7);
    expect(carousel.move(7)).toHaveBeenCalledOnce();
    expect(carousel.move(7)).toHaveBeenCalledOnce();
    expect(carousel.move(7)).toHaveBeenCalledOnce();
    expect(carousel.surface.setPointerCapture).toHaveBeenCalledTimes(1);
    expect(carousel.surface.setPointerCapture).toHaveBeenCalledWith(7);
    carousel.end("up", 7);
    expect(carousel.click(1).preventDefault).toHaveBeenCalledOnce();
  });

  it("does not lose suppression when a foreign pointerup arrives after dragging", () => {
    const carousel = fixture();
    carousel.start(7);
    carousel.move(7);
    carousel.end("up", 8);
    carousel.end("up", 7);
    expect(carousel.click(1).preventDefault).toHaveBeenCalledOnce();
  });

  it("preserves keyboard activation after a pointer drag", () => {
    const carousel = fixture();
    carousel.drag();
    expect(carousel.click(0).preventDefault).not.toHaveBeenCalled();
  });
  it("suppresses only the pointer click generated by a drag", () => {
    const carousel = fixture();
    carousel.drag();
    expect(carousel.click(1).preventDefault).toHaveBeenCalledOnce();
    expect(carousel.click(1).preventDefault).not.toHaveBeenCalled();
  });
  it.each(["textarea", "select", "[contenteditable]"])("does not drag from %s", selector => {
    class Control {
      closest(query: string) { return query.split(",").includes(selector) ? this : null; }
    }
    vi.stubGlobal("Element", Control);
    const carousel = fixture();
    carousel.drag(new Control());
    expect(carousel.surface.setPointerCapture).not.toHaveBeenCalled();
    expect(carousel.click(1).preventDefault).not.toHaveBeenCalled();
  });
});
