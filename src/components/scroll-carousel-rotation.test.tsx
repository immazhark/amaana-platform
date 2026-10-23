import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";

const state = vi.hoisted(() => ({ index: 0, refIndex: 0, refs: [] as Array<{ current: unknown }>, paused: false, setPaused: vi.fn() }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = state.index++;
    return index === 1 ? [state.paused, state.setPaused] : [typeof initial === "function" ? initial() : initial, vi.fn()];
  },
  useRef: (current: unknown) => state.refs[state.refIndex++] ?? (state.refs[state.refIndex - 1] = { current }),
  useCallback: (callback: unknown) => callback,
  useEffect: vi.fn(),
  useId: () => "rotation-test",
}));
import { ScrollCarousel } from "./scroll-carousel";

afterEach(() => vi.clearAllMocks());

function fixture(paused = false, rerender = false) {
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
