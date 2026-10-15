import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
const h = vi.hoisted(() => ({ setters: [] as ReturnType<typeof vi.fn>[], effects: [] as (() => (() => void) | undefined)[] }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => { const setter = vi.fn(); h.setters.push(setter); return [initial, setter]; },
  useEffect: (effect: () => (() => void) | undefined) => h.effects.push(effect),
  useRef: (initial: unknown) => ({ current: initial }), useCallback: (callback: unknown) => callback,
}));
vi.mock("@/components/navigation-link", () => ({ default: "a" }));
import { IslamicCompanion } from "./islamic-companion";
const item = { id: "appeal-reviewed", kind: "appeal", title: "Reviewed need", detailsHref: "/appeals/reviewed", supportHref: "/donate/reviewed" };
afterEach(() => { h.setters = []; h.effects = []; vi.unstubAllGlobals(); vi.useRealTimers(); });
function mount(reply: () => Promise<unknown>, ok = true) {
  vi.useFakeTimers();
  const fetch = vi.fn().mockImplementation(async () => ({ ok, json: reply }));
  let idle: (() => void) | undefined;
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("window", { requestIdleCallback: (callback: () => void) => { idle = callback; return 1; }, setTimeout, clearTimeout });
  const markup = renderToStaticMarkup(createElement(IslamicCompanion));
  const cleanup = h.effects[1]?.();
  idle?.();
  return { fetch, cleanup, markup, state: h.setters[8]!, items: h.setters[6]! };
}
const drain = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
describe("actual companion live-rail lifecycle", () => {
  it("shows checking rather than claiming an empty appeal list during initial load", async () => {
    const m = mount(async () => ({ items: [] }));
    expect(m.markup).toContain("Checking public appeal updates"); expect(m.markup).not.toContain("No public appeal is open");
    await drain(); expect(m.items).toHaveBeenCalledWith([]); expect(m.state).toHaveBeenLastCalledWith("ready");
    expect(m.fetch).toHaveBeenCalledWith("/api/public/live-rail", expect.objectContaining({ cache: "no-store" }));
    m.cleanup?.();
  });
  it.each([null, { items: [{ ...item, title: {} }] }, { items: [{ ...item, supportHref: "javascript:alert(1)" }] }])("keeps malformed payloads unavailable: %j", async payload => {
    const m = mount(async () => payload); await drain();
    expect(m.items).not.toHaveBeenCalled(); expect(m.state).toHaveBeenLastCalledWith("unavailable"); m.cleanup?.();
  });
  it("distinguishes HTTP failure from confirmed empty data", async () => {
    const m = mount(async () => ({ items: [] }), false); await drain();
    expect(m.state).toHaveBeenLastCalledWith("unavailable"); expect(m.items).not.toHaveBeenCalled(); m.cleanup?.();
  });
  it("bounds a stalled request and ignores its late completion", async () => {
    let resolve: (value: unknown) => void = () => {};
    const m = mount(() => new Promise(done => { resolve = done; })); await drain();
    await vi.advanceTimersByTimeAsync(8000);
    expect(m.state).toHaveBeenLastCalledWith("unavailable");
    resolve({ items: [item] }); await drain(); expect(m.items).not.toHaveBeenCalled(); m.cleanup?.();
  });
  it("does not update the rail after unmount even when JSON ignores abort", async () => {
    let resolve: (value: unknown) => void = () => {};
    const m = mount(() => new Promise(done => { resolve = done; })); await drain(); m.cleanup?.();
    resolve({ items: [item] }); await drain();
    expect(m.items).not.toHaveBeenCalled(); expect(m.state).not.toHaveBeenCalled();
  });
});
