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

/** A civil Friday recurring reminder, not a forecast of Hijri dates and
 * never a subscription, debit authorization or fund reservation. */
export function buildFridayGivingReminder(today: Date): string {
  const start = nextFridayGivingDate(today);
  const stamp = today.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const description = [
    "Optional Friday reminder only; no automatic debit or subscription.",
    "Review currently approved domestic giving routes before every decision.",
    "https://amaanafoundation.org/donate",
    "You may change or remove this reminder in your own calendar.",
  ].join("\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Amaana Foundation//Manual Giving Reminder//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    "UID:manual-giving-friday@amaanafoundation.org",
    `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${nextCalendarDate(start)}`,
    "RRULE:FREQ=WEEKLY;BYDAY=FR",
    "SUMMARY:Review approved Amaana giving options",
    `DESCRIPTION:${description}`,
    "URL:https://amaanafoundation.org/donate",
    "TRANSP:TRANSPARENT", "END:VEVENT", "END:VCALENDAR",
  ].map(foldLine).join("\r\n") + "\r\n";
}

export function buildMonthlyGivingReminder(day: MonthlyGivingDay, today: Date): string {
  const start = nextMonthlyGivingDate(day, today);
  const stamp = today.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const description = [
    "Optional personal reminder only; no automatic debit or subscription.",
    "Review currently approved domestic giving routes before every decision.",
    "https://amaanafoundation.org/donate",
    "You may change or remove this reminder in your own calendar.",
  ].join("\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Amaana Foundation//Manual Giving Reminder//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:manual-giving-day-${day}@amaanafoundation.org`,
    `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${nextCalendarDate(start)}`,
    `RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}`,
    "SUMMARY:Review approved Amaana giving options",
    `DESCRIPTION:${description}`,
    "URL:https://amaanafoundation.org/donate",
    "TRANSP:TRANSPARENT", "END:VEVENT", "END:VCALENDAR",
  ].map(foldLine).join("\r\n") + "\r\n";
}
