import test from "node:test";
import assert from "node:assert/strict";
import { AYAHS, HADITHS, hyderabadClock, dailyReading, remindersFor, nextSalah, observedHijri, shiftDate, timeMinutes } from "../src/lib/daily-companion.ts";

const at = (date, time) => new Date(`${date}T${time}:00+05:30`);
test("daily readings roll over at Hyderabad midnight, not UTC midnight", () => {
  assert.equal(hyderabadClock(new Date("2026-09-13T18:29:59Z")).date, "2026-09-13");
  assert.equal(hyderabadClock(new Date("2026-09-13T18:30:00Z")).date, "2026-09-14");
  assert.notEqual(dailyReading(at("2026-09-13", "23:59")).ayah.key, dailyReading(at("2026-09-14", "00:00")).ayah.key);
  assert.equal(dailyReading(at("2026-09-13", "00:01")).ayah.key, dailyReading(at("2026-09-13", "23:59")).ayah.key);
});
test("Monday and Thursday fasting, Friday readings and general dhikr", () => {
  for (const date of ["2026-09-14", "2026-09-17"]) assert.ok(remindersFor(at(date, "08:00")).some(r => r.id === "fasting"));
  const friday = remindersFor(at("2026-09-18", "12:00"));
  assert.ok(friday.some(r => r.id === "kahf"));
  assert.ok(friday.some(r => r.id === "durood"));
  assert.ok(friday.some(r => r.id === "dhikr"));
  assert.ok(!friday.some(r => r.id === "fasting"));
});
test("known Eid, Tashreeq and Ramadan suppress voluntary fasting prompts", () => {
  for (const hijri of [{ day: 1, month: 10 }, { day: 10, month: 12 }, { day: 13, month: 12 }, { day: 12, month: 9 }]) {
    assert.ok(!remindersFor(at("2026-09-14", "08:00"), hijri).some(r => r.id === "fasting"));
  }
});
test("estimated Ramadan also suppresses optional-fast reminders without an announcement", () => {
  assert.ok(!remindersFor(at("2026-02-23", "08:00")).some(r => r.id === "fasting"));
});
test("night and morning/evening windows include the correct boundaries", () => {
  const ids = time => remindersFor(at("2026-09-15", time)).map(r => r.id);
  assert.ok(!ids("19:59").includes("baqarah"));
  assert.ok(ids("20:00").includes("baqarah"));
  assert.ok(ids("03:59").includes("mulk"));
  assert.ok(!ids("04:00").includes("mulk"));
  for (const time of ["04:00", "09:59", "16:00", "19:59"]) assert.ok(ids(time).includes("adhkar"));
  for (const time of ["10:00", "15:59", "20:00"]) assert.ok(!ids(time).includes("adhkar"));
});
const today = { date: "2026-09-13", timings: { Fajr: "05:00", Sunrise: "06:00", Dhuhr: "12:15", Asr: "16:00", Maghrib: "18:20", Isha: "19:30" } };
const tomorrow = { date: "2026-09-14", timings: { ...today.timings, Fajr: "05:01" } };
test("next salah skips sunrise and uses tomorrow's actual Fajr", () => {
  assert.deepEqual(nextSalah(today, tomorrow, at(today.date, "05:30")), { prayer: "Dhuhr", time: "12:15", tomorrow: false });
  assert.deepEqual(nextSalah(today, tomorrow, at(today.date, "21:00")), { prayer: "Fajr", time: "05:01", tomorrow: true });
  assert.equal(nextSalah(today, null, at(today.date, "21:00")), null);
  assert.equal(nextSalah(today, tomorrow, at("2026-09-14", "00:01")), null);
});
test("prayer time parser rejects incomplete and impossible values", () => {
  for (const value of [null, undefined, "24:00", "12:60", "5:00", "05:00foo"]) assert.equal(timeMinutes(value), null);
  assert.equal(timeMinutes("00:00"), 0);
  assert.equal(timeMinutes("23:59"), 1439);
});
test("local moon announcements expire and never invent the next month", () => {
  const announcement = { firstCivilDate: "2026-09-13", month: 4, year: 1448, confirmedDays: 29, authority: "TEST ONLY", sourceUrl: "https://example.com/test-announcement" };
  assert.equal(observedHijri("2026-09-12", [announcement]), null);
  assert.equal(observedHijri("2026-09-13", [announcement]).day, 1);
  assert.equal(observedHijri("2026-10-11", [announcement]).day, 29);
  assert.equal(observedHijri("2026-10-12", [announcement]), null);
  assert.equal(observedHijri("2026-09-13", [{ ...announcement, sourceUrl: "javascript:alert(1)" }]), null);
  assert.equal(observedHijri("2026-09-13", [{ ...announcement, firstCivilDate: "2026-02-30" }]), null);
  assert.equal(observedHijri("2026-09-13", []), null);
});
test("date arithmetic crosses month and year boundaries", () => {
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDate("2028-02-28", 1), "2028-02-29");
});
test("reading collection has unique keys, Arabic and safe primary source links", () => {
  assert.equal(new Set(AYAHS.map(a => a.key)).size, AYAHS.length);
  for (const ayah of AYAHS) { assert.match(ayah.arabic, /[\u0600-\u06ff]/); assert.match(ayah.key, /^\d+:\d+$/); }
  for (const hadith of HADITHS) { assert.ok(hadith.url.startsWith("https://sunnah.com/")); assert.ok(hadith.summary.length > 20); }
});
