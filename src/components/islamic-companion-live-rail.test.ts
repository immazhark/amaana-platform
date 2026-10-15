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
  let hidden = false;
  let onVisibilityChange: (() => void) | undefined;
  vi.stubGlobal("document", {
    get hidden() { return hidden; },
    addEventListener: (name: string, callback: () => void) => { if (name === "visibilitychange") onVisibilityChange = callback; },
    removeEventListener: (name: string) => { if (name === "visibilitychange") onVisibilityChange = undefined; },
  });
  vi.stubGlobal("window", {
    requestIdleCallback: (callback: () => void) => { idle = callback; return 1; },
    setTimeout, clearTimeout, setInterval, clearInterval,
  });
  const markup = renderToStaticMarkup(createElement(IslamicCompanion));
  const cleanup = h.effects[1]?.();
  idle?.();
  return {
    fetch, cleanup, markup, state: h.setters[8]!, items: h.setters[6]!,
    setHidden: (next: boolean) => { hidden = next; onVisibilityChange?.(); },
  };
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
  it("revalidates withdrawn appeals after five visible minutes and clears stale actions", async () => {
    let calls = 0;
    const m = mount(async () => calls++ === 0 ? { items: [item] } : { items: [] });
    await drain();
    expect(m.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(4 * 60_000);
    expect(m.fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(m.fetch).toHaveBeenCalledTimes(2);
    expect(m.items).toHaveBeenCalledWith([]);
    expect(m.state).toHaveBeenCalledWith("loading");
    await drain();
    expect(m.items).toHaveBeenLastCalledWith([]);
    expect(m.state).toHaveBeenLastCalledWith("ready");
    m.cleanup?.();
  });

  it("does not poll hidden tabs and refreshes once on returning after the freshness window", async () => {
    const m = mount(async () => ({ items: [item] }));
    await drain();
    m.setHidden(true);
    await vi.advanceTimersByTimeAsync(6 * 60_000);
    expect(m.fetch).toHaveBeenCalledTimes(1);
    m.setHidden(false);
    expect(m.fetch).toHaveBeenCalledTimes(2);
    await drain();
    m.setHidden(false);
    expect(m.fetch).toHaveBeenCalledTimes(2);
    m.cleanup?.();
  });

  it("does not let an expired request overwrite a later successful refresh", async () => {
    let resolveOld: (value: unknown) => void = () => {};
    let call = 0;
    const m = mount(() => ++call === 1
      ? new Promise(resolve => { resolveOld = resolve; })
      : Promise.resolve({ items: [] }));
    await drain();
    await vi.advanceTimersByTimeAsync(8000);
    expect(m.state).toHaveBeenLastCalledWith("unavailable");
    // Start the second request at the five-minute boundary, without also
    // advancing to its independent eight-second timeout.
    await vi.advanceTimersByTimeAsync(5 * 60_000 - 8000);
    expect(m.fetch).toHaveBeenCalledTimes(2);
    await drain();
    expect(m.state).toHaveBeenLastCalledWith("ready");
    resolveOld({ items: [item] });
    await drain();
    expect(m.items).toHaveBeenLastCalledWith([]);
    expect(m.state).toHaveBeenLastCalledWith("ready");
    m.cleanup?.();
  });

  it("does not update the rail after unmount even when JSON ignores abort", async () => {
    let resolve: (value: unknown) => void = () => {};
    const m = mount(() => new Promise(done => { resolve = done; })); await drain(); m.cleanup?.();
    resolve({ items: [item] }); await drain();
    expect(m.items).not.toHaveBeenCalled(); expect(m.state).not.toHaveBeenCalled();
  });
});
