import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const harness = vi.hoisted(() => ({
  values: [] as unknown[],
  effects: [] as Array<() => void | (() => void)>,
  setters: [] as ReturnType<typeof vi.fn>[],
  index: 0,
  refIndex: 0,
  refs: [] as Array<{ current: unknown }>,
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.index++;
    const setter = vi.fn();
    harness.setters[index] = setter;
    return [index in harness.values ? harness.values[index] : initial, setter];
  },
  useRef: (current: unknown) => harness.refs[harness.refIndex++] ?? (harness.refs[harness.refIndex - 1] = { current }),
  useEffect: (effect: () => void | (() => void)) => harness.effects.push(effect),
  useCallback: (callback: unknown) => callback,
}));
import { IslamicCompanion } from "./islamic-companion";

const items = ["first", "second"].map(id => ({
  id, kind: "initiative", eyebrow: "Foundation update", title: id,
  subtitle: "", detailsHref: "/our-work", supportHref: "/contact",
  detailsCta: "Explore our work", supportCta: "Contact Amaana",
}));

afterEach(() => { vi.unstubAllGlobals(); });

function fixture({ paused = false, reduced = false, count = 2, rerender = false } = {}) {
  harness.index = 0;
  harness.refIndex = 0;
  if (!rerender) harness.refs = [];
  harness.effects.length = 0;
  harness.setters.length = 0;
  // Preserve component hook order: panel, clock, moon, motion, hover, focus,
  // live items, rail index, explicit visitor pause.
  harness.values = [null, null, null, reduced, false, false, items.slice(0, count), 0, paused];
  const interval = vi.fn(() => 1);
  const clearInterval = vi.fn();
  const documentEvents = { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("window", { setInterval: interval, clearInterval, matchMedia: () => motion });
  vi.stubGlobal("document", documentEvents);
  const tree = IslamicCompanion();
  const rotation = harness.effects[2];
  if (!rotation) throw new Error("Expected live rotation effect");
  const cleanup = rotation();
  type ButtonProps = { children?: unknown; onClick?: (event: { detail: number }) => void; "aria-label"?: string };
  const buttons: ReactElement<ButtonProps>[] = [];
  const elements: ReactElement<Record<string, unknown>>[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node || typeof node !== "object" || !("props" in node)) return;
    const element = node as ReactElement<ButtonProps>;
    elements.push(element as ReactElement<Record<string, unknown>>);
    if (element.type === "button") buttons.push(element);
    visit(element.props.children);
  };
  visit(tree);
  return { interval, clearInterval, buttons, cleanup, elements, documentEvents, clockEffect: harness.effects[0] };
}

describe("visibility-aware site-wide clock", () => {
  it("skips hidden-tab React clock updates, then refreshes on return", () => {
    const live = fixture();
    const stopClock = live.clockEffect?.();
    expect(stopClock).toBeTypeOf("function");
    const setNow = harness.setters[1];
    expect(setNow).toHaveBeenCalledTimes(1);
    const tick = live.interval.mock.calls.find(([, delay]) => delay === 30_000)?.[0] as (() => void) | undefined;
    expect(tick).toBeTypeOf("function");
    live.documentEvents.hidden = true;
    tick?.();
    expect(setNow).toHaveBeenCalledTimes(1);
    live.documentEvents.hidden = false;
    const visibility = live.documentEvents.addEventListener.mock.calls.find(([name]) => name === "visibilitychange")?.[1] as (() => void) | undefined;
    visibility?.();
    expect(setNow).toHaveBeenCalledTimes(2);
    stopClock?.();
    live.cleanup?.();
  });
});

describe("visitor control of live updates", () => {
  it("offers an explicit pause without requiring hover or focus", () => {
    const live = fixture();
    expect(live.interval).toHaveBeenCalledWith(expect.any(Function), 12_000);
    const pause = live.buttons.find(button => button.props["aria-label"] === "AMAANA LIVE: Pause updates");
    expect(pause).toBeDefined();
    pause?.props.onClick?.({ detail: 0 });
    expect(harness.setters[8]).toHaveBeenCalledWith(true);
    live.cleanup?.();
    expect(live.clearInterval).toHaveBeenCalledWith(1);
  });

  it("keeps updates paused after focus and hover leave, and permits resuming", () => {
    const live = fixture({ paused: true });
    expect(live.interval).not.toHaveBeenCalled();
    const resume = live.buttons.find(button => button.props["aria-label"] === "AMAANA LIVE: Resume updates");
    expect(resume).toBeDefined();
    resume?.props.onClick?.({ detail: 0 });
    expect(harness.setters[8]).toHaveBeenCalledWith(false);
  });

  it("keeps reduced motion and a single update static", () => {
    for (const options of [{ reduced: true }, { count: 1 }]) {
      const live = fixture(options);
      expect(live.interval).not.toHaveBeenCalled();
      expect(live.buttons.some(button => button.props["aria-label"] === "AMAANA LIVE: Pause updates")).toBe(false);
    }
  });

  it("remembers a keyboard visit after focus leaves the rail", () => {
    const live = fixture();
    const rail = live.elements.find(element => element.props.className === "amaana-reminders");
    (rail?.props.onFocusCapture as () => void)();
    expect(harness.setters[8]).toHaveBeenCalledWith(true);
  });

  it("keeps automatic updates quiet and paused content polite", () => {
    for (const paused of [false, true]) {
      const live = fixture({ paused });
      const content = live.elements.find(element => element.props.className === "amaana-live-content");
      expect(content?.props["aria-live"]).toBe(paused ? "polite" : "off");
      expect(content?.key).toBeNull();
    }
  });

  it("preserves pointer Pause intent across the focus-triggered rerender", () => {
    const live = fixture();
    const pause = live.elements.find(element => element.props["aria-label"] === "AMAANA LIVE: Pause updates");
    (pause?.props.onPointerDown as (event: object) => void)({ button: 0 });
    const focused = fixture({ paused: true, rerender: true });
    const resume = focused.elements.find(element => element.props["aria-label"] === "AMAANA LIVE: Resume updates");
    (resume?.props.onClick as (event: object) => void)({ detail: 1 });
    expect(harness.setters[8]).toHaveBeenCalledWith(true);
  });
});
