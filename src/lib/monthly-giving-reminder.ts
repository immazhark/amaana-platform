/** Personal calendar planning only. No donor identity, Razorpay subscription,
 * payment mandate or site-side persistence is part of this workflow. */
export const MONTHLY_GIVING_DAYS = [1, 5, 10, 15, 20, 25, 28] as const;
export type MonthlyGivingDay = typeof MONTHLY_GIVING_DAYS[number];
export const MONTHLY_REMINDER_FILE = "amaana-manual-giving-reminder.ics";
export const FRIDAY_REMINDER_FILE = "amaana-friday-giving-reminder.ics";

export function nextMonthlyGivingDate(day: MonthlyGivingDay, today: Date): string {
  if (!MONTHLY_GIVING_DAYS.includes(day) || !Number.isFinite(today.getTime())) {
    throw new RangeError("Invalid monthly reminder day or date");
  }
  let year = today.getFullYear(), month = today.getMonth();
  if (today.getDate() > day) {
    month += 1;
    if (month === 12) { month = 0; year += 1; }
  }
  return [year.toString().padStart(4, "0"), (month + 1).toString().padStart(2, "0"), day.toString().padStart(2, "0")].join("");
}

/** Month-end means the actual last civil day (28, 29, 30 or 31), not
 * a fixed 31st that would silently skip shorter months. */
export function nextLastDayMonthlyGivingDate(today: Date): string {
  if (!Number.isFinite(today.getTime())) throw new RangeError("Invalid monthly reminder date");
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return [
    last.getFullYear().toString().padStart(4, "0"),
    (last.getMonth() + 1).toString().padStart(2, "0"),
    last.getDate().toString().padStart(2, "0"),
  ].join("");
}

function nextCalendarDate(date: string): string {
  const start = new Date(Date.UTC(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8) + 1));
  return [start.getUTCFullYear().toString().padStart(4, "0"), (start.getUTCMonth() + 1).toString().padStart(2, "0"), start.getUTCDate().toString().padStart(2, "0")].join("");
}

/** RFC 5545 line folding counts UTF-8 bytes, not JavaScript code units. */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let current = "", count = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (count + size > 75) {
      lines.push(current);
      current = " ";
      count = 1;
    }
    current += char;
    count += size;
  }
  lines.push(current);
  return lines.join("\r\n");
}

/** Next Friday as a local-calendar day. An all-day reminder does not need
 * or transmit a timezone, IP address or location to the foundation. */
export function nextFridayGivingDate(today: Date): string {
  if (!Number.isFinite(today.getTime())) throw new RangeError("Invalid weekly reminder date");
  const untilFriday = (5 - today.getDay() + 7) % 7;
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + untilFriday);
  return [
    date.getFullYear().toString().padStart(4, "0"),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("");
}

/** A civil-date reminder never forecasts Hijri dates or authorizes payment. */
function calendar(start: string, recurrence: string | null, uid: string, stamp: Date): string {
  if (!Number.isFinite(stamp.getTime())) throw new RangeError("Invalid reminder creation date");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Amaana Foundation//Manual Giving Reminder//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${uid}@amaanafoundation.org`,
    `DTSTAMP:${stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
    `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${nextCalendarDate(start)}`,
    ...(recurrence ? [`RRULE:${recurrence}`] : []),
    "SUMMARY:Review approved Amaana giving options",
    "DESCRIPTION:Optional personal reminder only; no automatic debit or subscription.\\nReview currently approved domestic giving routes before every decision.\\nYou may change or remove this reminder in your own calendar.",
    "URL:https://amaanafoundation.org/donate",
    "TRANSP:TRANSPARENT", "END:VEVENT", "END:VCALENDAR",
  ].map(foldLine).join("\r\n") + "\r\n";
}

/** One stable calendar identity; recurrence moves naturally with month length. */
export function buildLastDayMonthlyGivingReminder(today: Date, stamp = today): string {
  return calendar(nextLastDayMonthlyGivingDate(today), "FREQ=MONTHLY;BYMONTHDAY=-1", "manual-giving-last-day", stamp);
}

export function buildFridayGivingReminder(today: Date, stamp = today): string {
  return calendar(nextFridayGivingDate(today), "FREQ=WEEKLY;BYDAY=FR", "manual-giving-friday", stamp);
}

export function buildMonthlyGivingReminder(day: MonthlyGivingDay, today: Date, stamp = today): string {
  return calendar(nextMonthlyGivingDate(day, today), `FREQ=MONTHLY;BYMONTHDAY=${day}`, `manual-giving-day-${day}`, stamp);
}

function civilDate(value: string): { compact: string; time: number } {
  if (!/^[2-9]\d{3}-\d{2}-\d{2}$/.test(value) || value.startsWith("9999")) throw new RangeError("Choose a supported calendar date");
  const time = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) throw new RangeError("Choose a real calendar date");
  return { compact: value.replaceAll("-", ""), time };
}

/** A single date or at most ten explicitly selected days. No assumed moon
 * sighting, named religious event, subscription or donor information. */
export function buildDatedGivingReminder(startDate: string, endDate: string | undefined, stamp: Date): string {
  const start = civilDate(startDate);
  const end = endDate === undefined ? start : civilDate(endDate);
  const count = (end.time - start.time) / 86_400_000 + 1;
  if (count < 1 || count > 10) throw new RangeError("Choose one to ten consecutive days");
  return calendar(start.compact, endDate === undefined ? null : `FREQ=DAILY;COUNT=${count}`,
    `manual-giving-${start.compact}-${end.compact}`, stamp);
}

/** India civil date for the domestic giving page. The actual creation stamp
 * stays UTC; all-day events deliberately contain no time-zone conversion. */
export function givingCalendarDateInIndia(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return new Date(value("year"), value("month") - 1, value("day"));
}
