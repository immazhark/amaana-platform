import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
afterEach(() => vi.useRealTimers());
const request = (query: string) => new Request(`https://amaanafoundation.org/api/giving-reminder?${query}`);

describe("manual calendar download boundary", () => {
  it.each(["frequency=monthly&day=15", "frequency=friday", "frequency=date&start=2027-03-01", "frequency=daily&start=2027-03-01&end=2027-03-10"])("downloads only the requested bounded schedule: %s", async query => {
    const result = GET(request(query));
    expect(result.status).toBe(200);
    expect(result.headers.get("Content-Type")).toContain("text/calendar");
    expect(result.headers.get("Content-Disposition")).toMatch(/^attachment; filename="amaana-[a-z-]+\.ics"$/);
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(result.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(result.headers.get("X-Robots-Tag")).toContain("noindex");
    const text = await result.text();
    expect(text).toContain("BEGIN:VCALENDAR\r\n");
    expect(text.replace(/\r\n /g, "")).toContain("no automatic debit or subscription");
    expect(text).not.toContain("ATTENDEE:");
  });
  it.each([
    "", "frequency=unknown", "frequency=monthly&day=31", "frequency=monthly&day=015",
    "frequency=monthly&day=15&day=28", "frequency=friday&frequency=monthly",
    "frequency=friday&donor=PRIVATE_NAME", "frequency=date&start=2027-02-29",
    "frequency=date&start=2027-01-01%0D%0ABEGIN:VEVENT", "frequency=daily&start=2027-03-01&end=2027-03-11",
    "frequency=daily&start=2027-03-10&end=2027-03-01", "frequency=daily&start=2027-03-01",
  ])("rejects unsupported, duplicate and malformed parameters without reflecting them", query => {
    const result = GET(request(query));
    expect(result.status).toBe(303);
    expect(result.headers.get("Location")).toBe("/get-involved/monthly-giving?reminder=invalid#giving-reminder");
    expect(result.headers.get("Cache-Control")).toContain("no-store");
  });
  it("downloads a last-day-of-month recurring reminder with one stable calendar identity", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-02-28T20:00:00.000Z")); // 29 February in India
    const response = GET(request("frequency=monthly&day=last"));
    expect(response.status).toBe(200);
    const calendar = (await response.text()).replace(/\\r\\n /g, "");
    expect(calendar).toContain("DTSTART;VALUE=DATE:20280229");
    expect(calendar).toContain("DTEND;VALUE=DATE:20280301");
    expect(calendar).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=-1");
    expect(calendar).toContain("UID:manual-giving-last-day@amaanafoundation.org");
    expect(calendar).toContain("no automatic debit or subscription");
  });

  it("uses India civil date for next occurrence but records the actual UTC creation stamp", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-16T20:00:00.000Z"));
    const friday = await GET(request("frequency=friday")).text();
    expect(friday).toContain("DTSTART;VALUE=DATE:20261023");
    expect(friday).toContain("DTSTAMP:20261016T200000Z");
    const monthly = await GET(request("frequency=monthly&day=15")).text();
    expect(monthly).toContain("DTSTART;VALUE=DATE:20261115");
  });
});
