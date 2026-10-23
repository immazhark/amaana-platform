import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const effects = vi.hoisted(() => [] as Array<() => unknown>);
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => [initial, vi.fn()],
  useRef: () => ({ current: null }),
  useEffect: (effect: () => unknown) => effects.push(effect),
}));
import { IslamicCompanionPanel } from "./islamic-companion-panel";

afterEach(() => vi.unstubAllGlobals());

function fixture({ now = null as Date | null } = {}) {
  effects.length = 0;
  const focus = vi.fn();
  class Tab { focus = focus; }
  vi.stubGlobal("HTMLButtonElement", Tab);
  const onPanelChange = vi.fn();
  const onClose = vi.fn();
  const documentEvents = Object.assign(new EventTarget(), { querySelector: vi.fn<() => object | null>(() => null) });
  vi.stubGlobal("document", documentEvents);
  const root = IslamicCompanionPanel({ panel: "readings", date: now ? "2026-10-23" : "", now,
    onClose, onPanelChange, onMoonChange: vi.fn() });
  effects[0]?.();
  const tabs = (root.props.children as ReactElement<{ role?: string; onKeyDown: (event: object) => void }>[])
    .find(child => child.props.role === "tablist");
  if (!tabs) throw new Error("Expected Companion tabs");
  return {
    onPanelChange, onClose, focus, activeDialog: documentEvents.querySelector,
    escape(modifiers: object = {}) {
      const event = new Event("keydown", { cancelable: true });
      Object.defineProperties(event, Object.fromEntries(Object.entries({ key: "Escape", ...modifiers }).map(([name, value]) => [name, { value }])));
      documentEvents.dispatchEvent(event);
    },
    key(key: string, modifiers: object = {}) {
      const event = { key, nativeEvent: { isComposing: false }, currentTarget: { children: { item: () => new Tab() } }, preventDefault: vi.fn(), ...modifiers };
      tabs.props.onKeyDown(event);
      return event;
    },
  };
}

describe("Companion panel date formatting", () => {
  it("uses one Hyderabad time snapshot for the panel and daily reading", () => {
    const original = Intl.DateTimeFormat.prototype.formatToParts;
    let gregorianFormats = 0;
    Intl.DateTimeFormat.prototype.formatToParts = function (...args) {
      if (this.resolvedOptions().calendar === "gregory") gregorianFormats++;
      return original.apply(this, args);
    };
    try {
      fixture({ now: new Date("2026-10-23T07:00:00Z") });
      expect(gregorianFormats).toBe(1);
    } finally {
      Intl.DateTimeFormat.prototype.formatToParts = original;
    }
  });
});

describe("Companion tab keyboard boundaries", () => {
  it("leaves Escape to an open dialog above the nonmodal Companion", () => {
    const panel = fixture();
    panel.activeDialog.mockReturnValue({});
    panel.escape();
    expect(panel.onClose).not.toHaveBeenCalled();
    panel.activeDialog.mockReturnValue(null);
    panel.escape();
    expect(panel.onClose).toHaveBeenCalledOnce();
  });

  it.each([{ isComposing: true }, { defaultPrevented: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }])(
    "does not close the panel on browser-owned Escape with %j", modifiers => {
      const panel = fixture();
      panel.escape(modifiers);
      expect(panel.onClose).not.toHaveBeenCalled();
    },
  );

  it("still closes the panel on an ordinary Escape", () => {
    const panel = fixture();
    panel.escape();
    expect(panel.onClose).toHaveBeenCalledOnce();
  });

  it.each([
    ["ArrowLeft", { altKey: true }], ["Home", { ctrlKey: true }],
    ["End", { metaKey: true }], ["ArrowRight", { shiftKey: true }],
    ["ArrowRight", { nativeEvent: { isComposing: true } }], ["Home", { defaultPrevented: true }],
  ])("preserves browser-owned %s with %j", (key, modifiers) => {
    const tabs = fixture();
    expect(tabs.key(key, modifiers).preventDefault).not.toHaveBeenCalled();
    expect(tabs.onPanelChange).not.toHaveBeenCalled();
    expect(tabs.focus).not.toHaveBeenCalled();
  });

  it("still selects and focuses the next tab with an unmodified arrow", () => {
    const tabs = fixture();
    expect(tabs.key("ArrowRight").preventDefault).toHaveBeenCalledOnce();
    expect(tabs.onPanelChange).toHaveBeenCalledWith("prayers");
    expect(tabs.focus).toHaveBeenCalledOnce();
  });
});
