import { afterEach, expect, it, vi } from "vitest";
const harness = vi.hoisted(() => ({ effects: [] as Array<() => unknown>, setters: [] as ReturnType<typeof vi.fn>[] }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => { const setter = vi.fn(); harness.setters.push(setter); return [initial, setter]; },
  useRef: () => ({ current: null }),
  useEffect: (effect: () => unknown) => harness.effects.push(effect),
}));
import { IslamicCompanionPanel } from "./islamic-companion-panel";
const today = { date: "2026-10-25", timings: { Fajr: "05:00", Sunrise: "06:15", Dhuhr: "12:30", Asr: "16:00", Maghrib: "18:00", Isha: "20:00" } };
const valid = { today, tomorrow: null, school: "1", method: "Reviewed method", asr: "Hanafi", note: "Follow the local timetable.", moon: null, eveningMoon: null };
afterEach(() => vi.unstubAllGlobals());
async function load(payload: unknown) {
  harness.effects.length = 0; harness.setters.length = 0;
  const onMoonChange = vi.fn();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
  IslamicCompanionPanel({ panel: "prayers", date: today.date, now: new Date("2026-10-25T17:30:00Z"), onClose: vi.fn(), onPanelChange: vi.fn(), onMoonChange });
  const cleanup = harness.effects[1]?.() as (() => void) | undefined;
  await vi.waitFor(() => expect(harness.setters[4]).toHaveBeenLastCalledWith(false));
  cleanup?.();
  return { data: harness.setters[0], error: harness.setters[3], onMoonChange };
}
it("rejects non-text calculation metadata before it reaches React", async () => {
  for (const key of ["method", "asr", "note"]) {
    const response = await load({ ...valid, [key]: { malformed: true } });
    expect(response.data).not.toHaveBeenCalled();
    expect(response.error).toHaveBeenLastCalledWith("The timings are not current. Please try again.");
  }
});
it("keeps today's timings when optional tomorrow data is unavailable", async () => {
  const response = await load({ ...valid, tomorrow: { date: "2026-10-26" } });
  expect(response.data).toHaveBeenCalledWith(expect.objectContaining({ today, tomorrow: null }));
});
it("does not publish malformed confirmed-moon data to the parent or panel", async () => {
  const malformedMoon = { day: 3, month: 4, label: {}, authority: "Reviewed source", sourceUrl: "https://example.org/announcement" };
  const response = await load({ ...valid, moon: malformedMoon, eveningMoon: malformedMoon });
  expect(response.data).toHaveBeenCalledWith(expect.objectContaining({ moon: null, eveningMoon: null }));
  expect(response.onMoonChange).toHaveBeenCalledWith({ date: today.date, moon: null });
});
it("preserves complete current-day responses", async () => {
  const response = await load(valid);
  expect(response.data).toHaveBeenCalledWith(valid);
  expect(response.onMoonChange).toHaveBeenCalledWith({ date: today.date, moon: null });
});
