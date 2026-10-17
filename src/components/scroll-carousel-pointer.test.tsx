import { Children, isValidElement, type ReactNode, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => [typeof initial === "function" ? (initial as () => unknown)() : initial, vi.fn()],
  useRef: (initial: unknown) => ({ current: initial }),
  useId: () => "synthetic",
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void | (() => void)) => { effect(); },
}));
import { ScrollCarousel } from "./scroll-carousel";

type Pointer = ReactPointerEvent<HTMLDivElement>;
type ViewportProps = {
  id?: string;
  children?: ReactNode;
  onPointerDown?: (event: Pointer) => void;
  onPointerMove?: (event: Pointer) => void;
  onPointerUp?: (event: Pointer) => void;
  onPointerLeave?: (event: Pointer) => void;
  onLostPointerCapture?: (event: Pointer) => void;
  onClickCapture?: (event: ReactMouseEvent<HTMLDivElement>) => void;
};
class TestElement {
  constructor(private readonly kind: "plain" | "form" | "link" = "plain") {}
  closest(selector: string) {
    if (this.kind === "form" && selector.includes("textarea")) return this;
    if (this.kind === "link" && selector.split(",").includes("a")) return this;
    return null;
  }
}
function handlers(): ViewportProps {
  vi.stubGlobal("window", {});
  vi.stubGlobal("Element", TestElement);
  vi.stubGlobal("ResizeObserver", undefined);
  const tree = ScrollCarousel({
    label: "Documented initiatives",
    children: [<span key="a">First</span>, <span key="b">Second</span>],
  });
  let viewport: ViewportProps | undefined;
  const visit = (node: ReactNode) => {
    Children.forEach(node, child => {
      if (!isValidElement(child)) return;
      const props = child.props as ViewportProps;
      if (props.id === "carousel-synthetic") viewport = props;
      if (props.children) visit(props.children);
    });
  };
  visit(tree);
  if (!viewport) throw new Error("Carousel viewport was not rendered.");
  return viewport;
}
function event(target: TestElement, currentTarget: ReturnType<typeof viewportNode>, x = 100, buttons = 1): Pointer {
  return {
    pointerType: "mouse", button: 0, buttons, pointerId: 5,
    clientX: x, target, currentTarget,
    preventDefault: vi.fn(),
  } as unknown as Pointer;
}
function viewportNode() {
  return {
    scrollLeft: 120,
    style: { scrollSnapType: "", removeProperty: vi.fn() },
    setPointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => false),
  };
}
afterEach(() => vi.unstubAllGlobals());
describe("carousel pointer and browser lifecycle", () => {
  it("renders safely where matchMedia and ResizeObserver are unavailable", () => {
    expect(handlers().id).toBe("carousel-synthetic");
  });
  it("does not hijack textareas, form controls, or interactive descendants", () => {
    const ui = handlers();
    const viewport = viewportNode();
    ui.onPointerDown?.(event(new TestElement("form"), viewport));
    const movement = event(new TestElement(), viewport, 70);
    ui.onPointerMove?.(movement);
    expect(viewport.setPointerCapture).not.toHaveBeenCalled();
    expect(movement.preventDefault).not.toHaveBeenCalled();
    expect(viewport.scrollLeft).toBe(120);
  });
  it("keeps whole-card anchor links draggable without breaking click suppression", () => {
    const ui = handlers();
    const viewport = viewportNode();
    const link = new TestElement("link");
    ui.onPointerDown?.(event(link, viewport));
    const movement = event(link, viewport, 70);
    ui.onPointerMove?.(movement);
    expect(viewport.setPointerCapture).toHaveBeenCalledOnce();
    expect(movement.preventDefault).toHaveBeenCalledOnce();
    ui.onPointerUp?.(event(link, viewport, 70));
    const click = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as ReactMouseEvent<HTMLDivElement>;
    ui.onClickCapture?.(click);
    expect(click.preventDefault).toHaveBeenCalledOnce();
    ui.onPointerDown?.(event(link, viewport));
    const genuineClick = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as ReactMouseEvent<HTMLDivElement>;
    ui.onClickCapture?.(genuineClick);
    expect(genuineClick.preventDefault).not.toHaveBeenCalled();
  });
  it("captures mouse dragging once and restores scroll snapping after lost release", () => {
    const ui = handlers();
    const viewport = viewportNode();
    const blank = new TestElement();
    ui.onPointerDown?.(event(blank, viewport));
    const movement = event(blank, viewport, 80);
    ui.onPointerMove?.(movement);
    ui.onPointerMove?.(event(blank, viewport, 70));
    expect(viewport.setPointerCapture).toHaveBeenCalledTimes(1);
    expect(movement.preventDefault).toHaveBeenCalledOnce();
    expect(viewport.scrollLeft).toBe(150);
    ui.onPointerMove?.(event(blank, viewport, 60, 0));
    expect(viewport.style.removeProperty).toHaveBeenCalledWith("scroll-snap-type");
    const afterRelease = viewport.scrollLeft;
    ui.onPointerMove?.(event(blank, viewport, 50));
    expect(viewport.scrollLeft).toBe(afterRelease);
    const click = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as ReactMouseEvent<HTMLDivElement>;
    ui.onClickCapture?.(click);
    expect(click.preventDefault).toHaveBeenCalledOnce();
    expect(click.stopPropagation).toHaveBeenCalledOnce();
  });
  it("allows a new interactive gesture after a previously interrupted drag", () => {
    const ui = handlers();
    const viewport = viewportNode();
    const blank = new TestElement();
    ui.onPointerDown?.(event(blank, viewport));
    ui.onPointerMove?.(event(blank, viewport, 70));
    expect(viewport.style.scrollSnapType).toBe("none");
    ui.onPointerDown?.(event(new TestElement("form"), viewport));
    expect(viewport.style.removeProperty).toHaveBeenCalledWith("scroll-snap-type");
    const move = event(blank, viewport, 50);
    ui.onPointerMove?.(move);
    expect(move.preventDefault).not.toHaveBeenCalled();
    expect(viewport.setPointerCapture).toHaveBeenCalledTimes(1);
  });
  it("clears uncaptured pointer state when the pointer leaves the carousel", () => {
    const ui = handlers();
    const viewport = viewportNode();
    const blank = new TestElement();
    ui.onPointerDown?.(event(blank, viewport));
    ui.onPointerLeave?.(event(blank, viewport, 98));
    const movement = event(blank, viewport, 70);
    ui.onPointerMove?.(movement);
    expect(movement.preventDefault).not.toHaveBeenCalled();
    expect(viewport.setPointerCapture).not.toHaveBeenCalled();
    expect(viewport.style.removeProperty).toHaveBeenCalledWith("scroll-snap-type");
  });
  it("clears captured drag and suppresses the accidental click on capture loss", () => {
    const ui = handlers();
    const viewport = viewportNode();
    const blank = new TestElement();
    ui.onPointerDown?.(event(blank, viewport));
    ui.onPointerMove?.(event(blank, viewport, 70));
    ui.onLostPointerCapture?.(event(blank, viewport, 70));
    const accidentalClick = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as ReactMouseEvent<HTMLDivElement>;
    ui.onClickCapture?.(accidentalClick);
    expect(accidentalClick.preventDefault).toHaveBeenCalledOnce();
    expect(viewport.style.removeProperty).toHaveBeenCalledWith("scroll-snap-type");
  });
});
