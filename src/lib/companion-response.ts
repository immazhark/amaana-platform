import { PRAYERS, shiftDate, timeMinutes, type PrayerDay } from "./daily-companion";

export type CompanionMoon = { day: number; month: number; label: string; authority: string; sourceUrl: string };
export type CompanionPrayerData = {
  today: PrayerDay; tomorrow: PrayerDay | null;
  school: string; method: string; asr: string; note: string;
  moon: CompanionMoon | null; eveningMoon: CompanionMoon | null;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function prayerDay(value: unknown, date: string): PrayerDay | null {
  const day = record(value), rawTimings = record(day?.timings);
  if (day?.date !== date || !rawTimings) return null;
  const timings = {} as PrayerDay["timings"];
  for (const prayer of PRAYERS) {
    const value = rawTimings[prayer];
    if (typeof value !== "string" || timeMinutes(value) === null) return null;
    timings[prayer] = value;
  }
  return { date, timings };
}
function moon(value: unknown): CompanionMoon | null {
  const item = record(value);
  if (!item || typeof item.day !== "number" || !Number.isInteger(item.day) || item.day < 1 || item.day > 30 ||
      typeof item.month !== "number" || !Number.isInteger(item.month) || item.month < 1 || item.month > 12 ||
      !text(item.label) || !text(item.authority) || !text(item.sourceUrl)) return null;
  try {
    const source = new URL(item.sourceUrl);
    if (source.protocol !== "https:" || source.username || source.password) return null;
  } catch { return null; }
  return { day: item.day, month: item.month, label: item.label, authority: item.authority, sourceUrl: item.sourceUrl };
}

/** Required current timings/labels fail closed. Unavailable optional data must
 * not discard a valid current timetable or imply a confirmed moon sighting. */
export function parseCompanionPrayerData(value: unknown, date: string, school: string): CompanionPrayerData | null {
  const item = record(value);
  if (!item || item.school !== school || !text(item.method) || !text(item.asr) || !text(item.note)) return null;
  const today = prayerDay(item.today, date);
  if (!today) return null;
  return {
    today, tomorrow: prayerDay(item.tomorrow, shiftDate(date, 1)), school,
    method: item.method, asr: item.asr, note: item.note,
    moon: moon(item.moon), eveningMoon: moon(item.eveningMoon),
  };
}
