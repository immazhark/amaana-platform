import { describe, expect, it } from "vitest";
import { buildMonthlyGivingReminder, MONTHLY_GIVING_DAYS, nextMonthlyGivingDate } from "./monthly-giving-reminder";

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
  it("does not allow invalid days or invalid Date", () => {
    expect(() => buildMonthlyGivingReminder(31 as 28, new Date())).toThrow(RangeError);
    expect(() => nextMonthlyGivingDate(1, new Date(NaN))).toThrow(RangeError);
  });
});
