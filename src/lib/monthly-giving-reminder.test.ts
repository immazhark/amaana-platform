import { describe, expect, it } from "vitest";
import { buildDatedGivingReminder, buildMonthlyGivingReminder, buildLastDayMonthlyGivingReminder, buildFridayGivingReminder, nextFridayGivingDate, nextLastDayMonthlyGivingDate, MONTHLY_GIVING_DAYS, nextMonthlyGivingDate } from "./monthly-giving-reminder";

describe("non-charging monthly giving calendar", () => {
  it("rolls to the next month or year using the visitor's local date", () => {
    expect(nextMonthlyGivingDate(15, new Date(2026, 9, 15))).toBe("20261015");
    expect(nextMonthlyGivingDate(15, new Date(2026, 9, 16))).toBe("20261115");
    expect(nextMonthlyGivingDate(1, new Date(2026, 11, 31))).toBe("20270101");
    expect(nextMonthlyGivingDate(28, new Date(2028, 1, 29))).toBe("20280328");
  });
  it.each(MONTHLY_GIVING_DAYS)("creates a valid all-day monthly event for day %s", day => {
    const ics = buildMonthlyGivingReminder(day, new Date(2026, 9, 15));
    const unfolded = ics.replace(/\r\n /g, "");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(unfolded).toContain(`RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}`);
    expect(unfolded).toContain("DTSTART;VALUE=DATE:");
    expect(unfolded).toContain("no automatic debit or subscription");
    expect(unfolded).toContain("URL:https://amaanafoundation.org/donate");
    expect(unfolded).not.toContain("razorpay_subscription");
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it("uses an exclusive end date, including February month rollover", () => {
    const result = buildMonthlyGivingReminder(28, new Date(2026, 1, 27));
    expect(result).toContain("DTSTART;VALUE=DATE:20260228\r\n");
    expect(result).toContain("DTEND;VALUE=DATE:20260301\r\n");
  });
  it("schedules on the real last day, including normal and leap-year Februaries", () => {
    expect(nextLastDayMonthlyGivingDate(new Date(2026, 1, 10))).toBe("20260228");
    expect(nextLastDayMonthlyGivingDate(new Date(2028, 1, 1))).toBe("20280229");
    expect(nextLastDayMonthlyGivingDate(new Date(2026, 3, 30))).toBe("20260430");
    expect(nextLastDayMonthlyGivingDate(new Date(2026, 11, 31))).toBe("20261231");
    expect(() => nextLastDayMonthlyGivingDate(new Date(NaN))).toThrow(RangeError);
  });
  it("exports one calendar identity with last-day recurrence and no payment mandate", () => {
    const date = new Date(2028, 1, 29);
    const ics = buildLastDayMonthlyGivingReminder(date, new Date("2028-02-28T20:00:00Z"));
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("DTSTART;VALUE=DATE:20280229");
    expect(unfolded).toContain("DTEND;VALUE=DATE:20280301");
    expect(unfolded).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=-1");
    expect(unfolded).toContain("UID:manual-giving-last-day@amaanafoundation.org");
    expect(unfolded).toContain("no automatic debit or subscription");
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
  it("creates a Friday reminder without a payment mandate or inferred Hijri date", () => {
    expect(nextFridayGivingDate(new Date(2026, 9, 16))).toBe("20261016");
    expect(nextFridayGivingDate(new Date(2026, 9, 17))).toBe("20261023");
    expect(nextFridayGivingDate(new Date(2026, 11, 31))).toBe("20270101");
    const ics = buildFridayGivingReminder(new Date(2026, 9, 17));
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("DTSTART;VALUE=DATE:20261023");
    expect(unfolded).toContain("DTEND;VALUE=DATE:20261024");
    expect(unfolded).toContain("RRULE:FREQ=WEEKLY;BYDAY=FR");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(unfolded).toContain("no automatic debit or subscription");
    expect(unfolded).toContain("URL:https://amaanafoundation.org/donate");
    expect(unfolded).not.toMatch(/RAZORPAY|mandate|Ramadan|Eid/);
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
  it("does not allow invalid days or invalid Date", () => {
    expect(() => buildMonthlyGivingReminder(31 as 28, new Date())).toThrow(RangeError);
    expect(() => nextMonthlyGivingDate(1, new Date(NaN))).toThrow(RangeError);
    expect(() => nextFridayGivingDate(new Date(NaN))).toThrow(RangeError);
    expect(() => buildFridayGivingReminder(new Date(NaN))).toThrow(RangeError);
  });
});

describe("visitor-selected dated reminders", () => {
  it("creates one all-day event without an implicit annual or monthly recurrence", () => {
    const text = buildDatedGivingReminder("2028-02-29", undefined, new Date("2027-10-01T10:00:00Z"));
    expect(text).toContain("DTSTART;VALUE=DATE:20280229\r\n");
    expect(text).toContain("DTEND;VALUE=DATE:20280301\r\n");
    expect(text).not.toContain("RRULE:");
  });
  it("bounds daily recurrence inclusively across months and years", () => {
    const text = buildDatedGivingReminder("2027-12-27", "2028-01-05", new Date());
    expect(text).toContain("RRULE:FREQ=DAILY;COUNT=10\r\n");
    expect(text).toContain("DTEND;VALUE=DATE:20271228\r\n");
    expect(text).not.toMatch(/Ramadan|Dhul|Eid|BYMONTH=/);
    for (const line of text.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it.each(["2027-02-29", "2027-04-31", "2027-13-01", "2027-00-01", "2027-1-1", "0000-01-01", "9999-12-31", "2027-01-01\r\nATTENDEE:attacker"])("rejects impossible or injected date %s", start => {
    expect(() => buildDatedGivingReminder(start, undefined, new Date())).toThrow(RangeError);
  });
  it("rejects reversed, overlong and invalid ranges", () => {
    expect(() => buildDatedGivingReminder("2027-03-10", "2027-03-09", new Date())).toThrow(RangeError);
    expect(() => buildDatedGivingReminder("2027-03-01", "2027-03-11", new Date())).toThrow(RangeError);
    expect(() => buildDatedGivingReminder("2027-03-01", "", new Date())).toThrow(RangeError);
    expect(() => buildDatedGivingReminder("2027-03-01", undefined, new Date(NaN))).toThrow(RangeError);
  });
});


it("escapes calendar TEXT delimiters in every reminder description", () => {
  const now = new Date(2026, 9, 17);
  const calendars = [
    buildMonthlyGivingReminder(15, now), buildLastDayMonthlyGivingReminder(now),
    buildFridayGivingReminder(now), buildDatedGivingReminder("2026-10-20", undefined, now),
  ];
  for (const ics of calendars) {
    const description = ics.replace(/\r\n /g, "").split("\r\n").find(line => line.startsWith("DESCRIPTION:"));
    expect(description).toBeDefined();
    expect(description).not.toMatch(/(?<!\\)[;,]/);
    expect(description).toContain("reminder only\\; no automatic debit");
  }
});
