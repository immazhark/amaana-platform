import { isValidElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ values: [] as unknown[], refs: [] as Array<{ current: unknown }>, valueIndex: 0, refIndex: 0 }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = state.valueIndex++;
    if (!(index in state.values)) state.values[index] = typeof initial === "function" ? initial() : initial;
    return [state.values[index], (value: unknown) => { state.values[index] = typeof value === "function" ? value(state.values[index]) : value; }];
  },
  useRef: (initial: unknown) => {
    const index = state.refIndex++;
    return state.refs[index] ??= { current: initial };
  },
  useEffect: () => undefined,
}));
import { hyderabadClock } from "@/lib/daily-companion";
import { IslamicCompanionPanel } from "./islamic-companion-panel";

afterEach(() => { state.values.length = 0; state.refs.length = 0; vi.unstubAllGlobals(); });

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function copyHandler() {
  let now = new Date("2026-11-07T18:29:00Z");
  function render() {
    state.valueIndex = 0; state.refIndex = 0;
    return IslamicCompanionPanel({ panel: "readings", date: hyderabadClock(now).date,
    now, onClose: vi.fn(), onPanelChange: vi.fn(), onMoonChange: vi.fn(),
    });
  }
  function find(node: ReactNode): (() => Promise<void>) | undefined {
    if (Array.isArray(node)) {
      for (const child of node) { const found = find(child); if (found) return found; }
    } else if (isValidElement<{ children?: ReactNode; onClick?: () => Promise<void> }>(node)) {
      if (node.type === "button" && node.props.children === "Copy reading & references") return node.props.onClick;
      return find(node.props.children);
    }
  }
  const handler = find(render());
  if (!handler) throw new Error("Expected the real reading-copy button handler");
  function status(node: ReactNode): string | undefined {
    if (Array.isArray(node)) {
      for (const child of node) { const found = status(child); if (found !== undefined) return found; }
    } else if (isValidElement<{ children?: ReactNode; role?: string }>(node)) {
      if (node.props.role === "status" && typeof node.props.children === "string") return node.props.children;
      return status(node.props.children);
    }
  }
  return { copy: () => find(render())!(), message: () => status(render()), changeTime: (value: string) => { now = new Date(value); render(); } };
}

const success = "Reading and references copied.";
const unavailable = "Copy is unavailable. You can select the text or open its source link.";

describe("Companion latest clipboard feedback", () => {
  it("keeps a newer successful result when an older copy fails afterward", async () => {
    const first = deferred(); const second = deferred();
    const writeText = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { copy, message } = copyHandler();
    const older = copy(); const latest = copy();
    second.resolve(); await latest;
    expect(message()).toBe(success);
    first.reject(new Error("Synthetic old rejection")); await older;
    expect(message()).toBe(success);
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText.mock.calls[0]?.[0]).toBe(writeText.mock.calls[1]?.[0]);
  });

  it("keeps a newer failure when an older copy succeeds afterward", async () => {
    const first = deferred(); const second = deferred();
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) } });
    const { copy, message } = copyHandler();
    const older = copy(); const latest = copy();
    second.reject(new Error("Synthetic new rejection")); await latest;
    expect(message()).toBe(unavailable);
    first.resolve(); await older;
    expect(message()).toBe(unavailable);
  });

  it("clears the previous result while a new copy is pending", async () => {
    const pending = deferred();
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValueOnce(undefined).mockReturnValueOnce(pending.promise) } });
    const { copy, message } = copyHandler();
    await copy();
    expect(message()).toBe(success);
    const latest = copy();
    expect(message()).toBe("");
    pending.resolve(); await latest;
    expect(message()).toBe(success);
  });

  it("retains manual-copy guidance when the clipboard API is absent", async () => {
    vi.stubGlobal("navigator", {});
    const { copy, message } = copyHandler();
    await copy();
    expect(message()).toBe(unavailable);
  });
  it.each([true, false])("ignores an old-day copy completion after midnight, success=%s", async succeeds => {
    const pending = deferred();
    const writeText = vi.fn().mockReturnValueOnce(pending.promise);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const view = copyHandler();
    const oldCopy = view.copy();
    expect(writeText.mock.calls[0]?.[0]).toContain("2026-11-07");
    view.changeTime("2026-11-07T18:31:00Z");
    if (succeeds) pending.resolve(); else pending.reject(new Error("Synthetic old denial"));
    await oldCopy;
    expect(view.message()).toBe("");
  });

  it("clears completed feedback across reading changes without resurrecting it", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const view = copyHandler();
    await view.copy(); expect(view.message()).toBe(success);
    view.changeTime("2026-11-07T18:31:00Z"); expect(view.message()).toBe("");
    view.changeTime("2026-11-07T18:29:00Z"); expect(view.message()).toBe("");
  });

  it("keeps the new reading success when an old reading copy fails later", async () => {
    const old = deferred();
    const writeText = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const view = copyHandler(); const oldCopy = view.copy();
    view.changeTime("2026-11-07T18:31:00Z"); await view.copy();
    expect(writeText.mock.calls[1]?.[0]).toContain("2026-11-08");
    expect(view.message()).toBe(success);
    old.reject(new Error("Synthetic old denial")); await oldCopy;
    expect(view.message()).toBe(success);
  });

});
