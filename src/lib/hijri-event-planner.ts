/** Civil-calendar planning estimates only; never an Indian moon-sighting declaration.
 * The existing Companion applies independently reviewed local announcements to
 * today's Hijri label. Future events are intentionally never "confirmed" here. */
const ISLAMIC_CIVIL = new Intl.DateTimeFormat("en-GB-u-ca-islamic-civil", {
  timeZone: "UTC", day: "numeric", month: "numeric", year: "numeric",
});
const DAY_MS = 86_400_000;
const PLANNING_EVENTS = [
  { key: "ramadan", label: "Beginning of Ramadan", month: 9, day: 1 },
  { key: "eid-fitr", label: "Eid al-Fitr", month: 10, day: 1 },
  { key: "dhul-hijjah", label: "Beginning of Dhul-Hijjah", month: 12, day: 1 },
  { key: "arafah", label: "Day of Arafah", month: 12, day: 9 },
  { key: "eid-adha", label: "Eid al-Adha", month: 12, day: 10 },
] as const;

export type HijriPlanningEvent = {
  key: typeof PLANNING_EVENTS[number]["key"];
  label: string;
  estimatedCivilDate: string;
  daysUntilEstimatedDate: number;
};

/** Search calendar days, not a calculated 29/30-day month duration.
 * This avoids drift at leap-year and month-boundary transitions, and caches
 * the Intl formatter instead of importing a remote calendar or new library. */
export function upcomingHijriPlanningEvents(
  today: string,
  limit = 3,
): HijriPlanningEvent[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || !Number.isInteger(limit) || limit < 1 || limit > 5) return [];
  const start = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(start) || new Date(start).toISOString().slice(0, 10) !== today) return [];
  const events: HijriPlanningEvent[] = [];
  for (let offset = 0; offset <= 425 && events.length < limit; offset++) {
    const date = new Date(start + offset * DAY_MS);
    const parts = Object.fromEntries(ISLAMIC_CIVIL.formatToParts(date).map(part => [part.type, part.value]));
    const day = Number(parts.day);
    const month = Number(parts.month);
    const match = PLANNING_EVENTS.find(event => event.day === day && event.month === month);
    if (!match) continue;
    events.push({
      key: match.key, label: match.label,
      estimatedCivilDate: date.toISOString().slice(0, 10),
      daysUntilEstimatedDate: offset,
    });
  }
  return events;
}
