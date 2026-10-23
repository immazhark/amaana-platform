import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const harness = vi.hoisted(() => ({
  values: [] as unknown[],
  effects: [] as Array<() => void | (() => void)>,
  setters: [] as ReturnType<typeof vi.fn>[],
  index: 0,
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.index++;
    const setter = vi.fn();
    harness.setters[index] = setter;
    return [index in harness.values ? harness.values[index] : initial, setter];
  },
  useRef: () => ({ current: null }),
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

function fixture({ paused = false, reduced = false, count = 2 } = {}) {
  harness.index = 0;
  harness.effects.length = 0;
  harness.setters.length = 0;
  // Preserve component hook order: panel, clock, moon, motion, hover, focus,
  // live items, rail index, explicit visitor pause.
  harness.values = [null, null, null, reduced, false, false, items.slice(0, count), 0, paused];
  const interval = vi.fn(() => 1);
  const clearInterval = vi.fn();
  vi.stubGlobal("window", { setInterval: interval, clearInterval });
  vi.stubGlobal("document", { hidden: false });
  const tree = IslamicCompanion();
  const rotation = harness.effects[2];
  if (!rotation) throw new Error("Expected live rotation effect");
  const cleanup = rotation();
  type ButtonProps = { children?: unknown; onClick?: () => void; "aria-label"?: string };
  const buttons: ReactElement<ButtonProps>[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node || typeof node !== "object" || !("props" in node)) return;
    const element = node as ReactElement<ButtonProps>;
    if (element.type === "button") buttons.push(element);
    visit(element.props.children);
  };
  visit(tree);
  return { interval, clearInterval, buttons, cleanup };
}

describe("visitor control of live updates", () => {
  it("offers an explicit pause without requiring hover or focus", () => {
    const live = fixture();
    expect(live.interval).toHaveBeenCalledWith(expect.any(Function), 12_000);
    const pause = live.buttons.find(button => button.props["aria-label"] === "AMAANA LIVE: Pause updates");
    expect(pause).toBeDefined();
    pause?.props.onClick?.();
    expect(harness.setters[8]).toHaveBeenCalledWith(true);
    live.cleanup?.();
    expect(live.clearInterval).toHaveBeenCalledWith(1);
  });

  it("keeps updates paused after focus and hover leave, and permits resuming", () => {
    const live = fixture({ paused: true });
    expect(live.interval).not.toHaveBeenCalled();
    const resume = live.buttons.find(button => button.props["aria-label"] === "AMAANA LIVE: Resume updates");
    expect(resume).toBeDefined();
    resume?.props.onClick?.();
    expect(harness.setters[8]).toHaveBeenCalledWith(false);
  });

  it("keeps reduced motion and a single update static", () => {
    for (const options of [{ reduced: true }, { count: 1 }]) {
      const live = fixture(options);
      expect(live.interval).not.toHaveBeenCalled();
      expect(live.buttons.some(button => button.props["aria-label"] === "AMAANA LIVE: Pause updates")).toBe(false);
    }
  });
});
