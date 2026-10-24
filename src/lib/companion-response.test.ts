import { expect, it } from "vitest";
import { parseCompanionPrayerData } from "./companion-response";
const timings = { Fajr: "05:00", Sunrise: "06:15", Dhuhr: "12:30", Asr: "16:00", Maghrib: "18:00", Isha: "20:00" };
const date = "2026-10-25";
const moon = { day: 14, month: 4, label: "Reviewed announcement", authority: "Reviewed authority", sourceUrl: "https://example.org/announcement" };
const payload = { today: { date, timings }, tomorrow: { date: "2026-10-26", timings }, school: "1", method: "Reviewed method", asr: "Hanafi", note: "Follow local timetable.", moon, eveningMoon: moon };
it("retains complete dated timings and reviewed announcement fields", () => {
  expect(parseCompanionPrayerData(payload, date, "1")).toEqual(payload);
});
it("rejects stale days, mismatched school and incomplete current timings", () => {
  expect(parseCompanionPrayerData(payload, "2026-10-26", "1")).toBeNull();
  expect(parseCompanionPrayerData(payload, date, "0")).toBeNull();
  expect(parseCompanionPrayerData({ ...payload, today: { date, timings: { ...timings, Fajr: "24:00" } } }, date, "1")).toBeNull();
});
it("treats invalid optional announcement fields as unconfirmed", () => {
  for (const change of [{ day: 0 }, { day: 31 }, { day: 1.5 }, { month: 13 }, { authority: {} }, { sourceUrl: "javascript:alert(1)" }, { sourceUrl: "https://name:password@example.org" }]) {
    const parsed = parseCompanionPrayerData({ ...payload, moon: { ...moon, ...change } }, date, "1");
    expect(parsed?.moon).toBeNull();
    expect(parsed?.today).toEqual(payload.today);
    expect(parsed?.eveningMoon).toEqual(moon);
  }
});
it("discards a tomorrow response for the wrong civil date", () => {
  expect(parseCompanionPrayerData({ ...payload, tomorrow: payload.today }, date, "1")?.tomorrow).toBeNull();
});
