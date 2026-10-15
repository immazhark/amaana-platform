import { createRequire } from "node:module";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IslamicCompanionPanel } from "./islamic-companion-panel";
const runtime = process.env.AMAANA_DOM_TEST_RUNTIME;
const timings = { Fajr: "05:00", Sunrise: "06:00", Dhuhr: "12:00", Asr: "16:00", Maghrib: "18:00", Isha: "19:00" };
const payload = { today: { date: "2026-10-16", timings }, tomorrow: null, school: "1", method: "Reviewed calculation", asr: "Hanafi", moon: null, eveningMoon: null, note: "Follow your local masjid timetable." };
describe.skipIf(!runtime)("actual companion prayer response lifecycle", () => {
  let window: Window & typeof globalThis;
  let root: Root;
  let container: HTMLDivElement;
  const fetchPrayer = vi.fn();
  const moonChanged = vi.fn();
  const props = { panel: "prayers" as const, date: "2026-10-16", now: new Date("2026-10-16T06:00:00Z"), onClose: vi.fn(), onPanelChange: vi.fn(), onMoonChange: moonChanged };
  beforeEach(async () => {
    const { JSDOM } = createRequire(import.meta.url)(runtime!);
    window = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://amaana.example" }).window;
    vi.stubGlobal("window", window); vi.stubGlobal("document", window.document);
    vi.stubGlobal("HTMLButtonElement", window.HTMLButtonElement);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    fetchPrayer.mockReset(); moonChanged.mockReset(); vi.stubGlobal("fetch", fetchPrayer);
    container = window.document.createElement("div"); window.document.body.append(container);
    const { createRoot } = await import("react-dom/client"); root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); window.close(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  async function render() { await act(async () => root.render(createElement(IslamicCompanionPanel, props))); }
  it("renders current valid timings with a nullable tomorrow projection", async () => {
    fetchPrayer.mockResolvedValue({ ok: true, json: async () => payload });
    await render(); expect(container.textContent).toContain("05:00"); expect(container.textContent).toContain(payload.note);
    expect(moonChanged).toHaveBeenCalledWith({ date: props.date, moon: null });
  });
  it("accepts complete tomorrow timings and a reviewed HTTPS moon announcement", async () => {
    const moon = { day: 1, month: 10, label: "Synthetic reviewed moon", authority: "Synthetic local review", sourceUrl: "https://example.org/announcement" };
    fetchPrayer.mockResolvedValue({ ok: true, json: async () => ({ ...payload, tomorrow: { date: "2026-10-17", timings }, moon }) });
    await render(); expect(container.textContent).toContain("05:00");
    expect(moonChanged).toHaveBeenCalledWith({ date: props.date, moon });
  });
  it("keeps server error text readable and bounded", async () => {
    fetchPrayer.mockResolvedValue({ ok: false, json: async () => ({ error: " ".repeat(600) + "Readable service failure " + "x".repeat(600) }) });
    await render(); const message = container.querySelector('[role="alert"] p')!.textContent!;
    expect(message.startsWith("Readable service failure")).toBe(true); expect(message).toHaveLength(500);
  });
  it.each([
    { note: { unsafe: true } }, { method: [] }, { asr: 42 },
    { tomorrow: { date: "2026-10-17", timings: {} } },
    { moon: { day: 1, month: 10, label: "Reviewed sighting", authority: {}, sourceUrl: "https://example.org/announcement" } },
    { moon: { day: 1, month: 10, label: "Reviewed sighting", authority: "Local announcement", sourceUrl: "javascript:alert(1)" } },
  ])("keeps malformed prayer details out of rendering: %j", async invalid => {
    fetchPrayer.mockResolvedValue({ ok: true, json: async () => ({ ...payload, ...invalid }) });
    await render(); expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(moonChanged).not.toHaveBeenCalled(); expect(container.textContent).not.toContain("05:00");
  });
  it.each(["transport", "JSON body"])("ends a stalled %s request and ignores late results", async stage => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let complete: (value: unknown) => void = () => {};
    const stalled = new Promise(resolve => { complete = resolve; });
    fetchPrayer.mockImplementation(() => stage === "transport" ? stalled : Promise.resolve({ ok: true, json: () => stalled }));
    await render(); expect(container.textContent).toContain("Loading Hyderabad timings");
    await act(async () => { await vi.advanceTimersByTimeAsync(8_000); });
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).not.toContain("Loading Hyderabad timings");
    expect(fetchPrayer.mock.calls[0]![1].signal.aborted).toBe(true);
    await act(async () => complete(stage === "transport" ? { ok: true, json: async () => payload } : payload));
    expect(moonChanged).not.toHaveBeenCalled(); expect(container.textContent).not.toContain("05:00");
    fetchPrayer.mockResolvedValue({ ok: true, json: async () => payload });
    const retry = [...container.querySelectorAll("button")].find(button => button.textContent === "Try again")!;
    await act(async () => retry.click());
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain("05:00");
    expect(fetchPrayer).toHaveBeenCalledTimes(2);
  });
});
