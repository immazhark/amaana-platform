import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";

const effects = vi.hoisted(() => [] as Array<() => void | (() => void)>);
const state = vi.hoisted(() => ({ index: 0, refIndex: 0, refs: [] as Array<{ current: unknown }>, paused: false, setPaused: vi.fn() }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = state.index++;
    return index === 1 ? [state.paused, state.setPaused] : [typeof initial === "function" ? initial() : initial, vi.fn()];
  },
  useRef: (current: unknown) => state.refs[state.refIndex++] ?? (state.refs[state.refIndex - 1] = { current }),
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void | (() => void)) => { effects.push(effect); },
  useId: () => "rotation-test",
}));
import { ScrollCarousel } from "./scroll-carousel";

afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

function fixture(paused = false, rerender = false) {
  effects.length = 0;
  state.index = 0;
  state.refIndex = 0;
  if (!rerender) state.refs = [];
  state.paused = paused;
  const root = ScrollCarousel({ label: "Programmes", autoAdvanceMs: 3000,
    children: [createElement("p", { key: "one" }, "One"), createElement("p", { key: "two" }, "Two")] });
  if (!root) throw new Error("Expected carousel");
  const elements: ReactElement<Record<string, unknown>>[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node || typeof node !== "object" || !("props" in node)) return;
    const element = node as ReactElement<Record<string, unknown>>;
    elements.push(element);
    visit(element.props.children);
  };
  visit(root);
  const control = elements.find(element => element.props["aria-label"] === (paused ? "Resume automatic slides" : "Pause automatic slides"));
  if (!control) throw new Error("Expected rotation control");
  return { root, control };
}

describe("carousel keyboard rotation control", () => {
  it("remembers focus entry as a persistent pause", () => {
    const { root } = fixture();
    expect(root.props.onFocusCapture).toBeTypeOf("function");
    root.props.onFocusCapture?.({} as never);
    expect(state.setPaused).toHaveBeenCalledWith(true);
  });

  it("keeps a pointer Pause action paused when focusing changes its label", () => {
    const { control } = fixture();
    (control.props.onPointerDown as (event: object) => void)({ button: 0 });
    const focused = fixture(true, true);
    (focused.control.props.onClick as (event: object) => void)({ detail: 1 });
    expect(state.setPaused).toHaveBeenCalledWith(true);
  });

  it("discards a cancelled press before a later keyboard restart", () => {
    const { control } = fixture();
    (control.props.onPointerDown as (event: object) => void)({ button: 0 });
    const focused = fixture(true, true);
    (focused.control.props.onPointerCancel as () => void)();
    (focused.control.props.onClick as (event: object) => void)({ detail: 0 });
    expect(state.setPaused).toHaveBeenCalledWith(false);
  });

  it("resumes on keyboard activation of the paused control", () => {
    const { control } = fixture(true);
    (control.props.onClick as (event: object) => void)({ detail: 0 });
    expect(state.setPaused).toHaveBeenCalledWith(false);
  });
});


function rotationTimer(root: NonNullable<ReturnType<typeof ScrollCarousel>>, {
  hovered = false, focused = true, hidden = false, visible = true,
} = {}) {
  const scrollTo = vi.fn();
  const surface = {
    clientWidth: 300, scrollWidth: 600, scrollTo,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    closest: () => ({ matches: (selector: string) =>
      selector.includes(":hover") && hovered || selector.includes(":focus-within") && focused }),
  };
  const viewport = (root.props.children as ReactElement<{ ref: { current: unknown }; children: ReactElement<{ children: ReactElement<{ ref: (node: object) => void }>[] }> }>[])[1];
  if (!viewport) throw new Error("Expected carousel viewport");
  viewport.props.ref.current = surface;
  viewport.props.children.props.children.forEach((slide, index) => slide.props.ref({ offsetLeft: index * 300 }));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class {
    constructor(private callback: (entries: object[]) => void) {}
    observe() { this.callback([{ isIntersecting: visible }]); }
    disconnect() {}
  });
  let tick: (() => void) | undefined;
  const schedule = vi.fn((callback: () => void) => { tick = callback; return 1; });
  vi.stubGlobal("window", { setInterval: schedule, clearInterval: vi.fn() });
  vi.stubGlobal("document", { hidden });
  const observerCleanup = effects[1]?.();
  const timerCleanup = effects[3]?.();
  return { scrollTo, schedule, tick() { tick?.(); }, cleanup() { timerCleanup?.(); observerCleanup?.(); } };
}

describe("carousel rotation after an explicit keyboard restart", () => {
  it("advances while focus stays on the rotation control after the visitor resumes", () => {
    const paused = fixture(true);
    (paused.control.props.onClick as (event: object) => void)({ detail: 0 });
    expect(state.setPaused).toHaveBeenCalledWith(false);
    const resumed = fixture(false, true);
    const timer = rotationTimer(resumed.root);
    timer.tick();
    expect(timer.scrollTo).toHaveBeenCalledWith({ left: 300, behavior: "smooth" });
    timer.cleanup();
  });

  it("does not schedule rotation while the focus-entry pause remains active", () => {
    const carousel = fixture();
    carousel.root.props.onFocusCapture?.({} as never);
    expect(state.setPaused).toHaveBeenCalledWith(true);
    const paused = fixture(true, true);
    const timer = rotationTimer(paused.root);
    expect(timer.schedule).not.toHaveBeenCalled();
    timer.cleanup();
  });

  it.each([{ hovered: true }, { hidden: true }, { visible: false }])(
    "retains automatic rotation suppression for %j after explicit restart", flags => {
      const resumed = fixture(false);
      const timer = rotationTimer(resumed.root, flags);
      timer.tick();
      expect(timer.scrollTo).not.toHaveBeenCalled();
      timer.cleanup();
    },
  );
});
