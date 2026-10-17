import { describe, expect, it } from "vitest";
import { upcomingHijriPlanningEvents } from "./hijri-event-planner";

const CIVIL = new Intl.DateTimeFormat("en-GB-u-ca-islamic-civil", {
  day: "numeric", month: "numeric", timeZone: "UTC",
});
const expected = { ramadan: [9, 1], "eid-fitr": [10, 1], "dhul-hijjah": [12, 1], arafah: [12, 9], "eid-adha": [12, 10] } as const;

describe("Hijri event planning estimates", () => {
  it("returns three chronologically ordered estimated event dates without a fabricated confirmation", () => {
    const found = upcomingHijriPlanningEvents("2026-10-15");
    expect(found).toHaveLength(3);
    for (let i = 0; i < found.length; i++) {
      const event = found[i]!;
      const parts = Object.fromEntries(CIVIL.formatToParts(new Date(`${event.estimatedCivilDate}T12:00:00Z`)).map(p => [p.type, p.value]));
      expect([Number(parts.month), Number(parts.day)]).toEqual([...expected[event.key]]);
      expect(event.daysUntilEstimatedDate).toBeGreaterThanOrEqual(0);
      if (i) expect(event.daysUntilEstimatedDate).toBeGreaterThan(found[i - 1]!.daysUntilEstimatedDate);
      expect(event).not.toHaveProperty("confirmed");
    }
  });
  it("supports a precise zero-day estimate without asserting observed Eid", () => {
    const first = upcomingHijriPlanningEvents("2026-01-01", 5).find(e => e.key === "ramadan");
    if (!first) throw new Error("Calendar fixture must include Ramadan");
    const onDay = upcomingHijriPlanningEvents(first.estimatedCivilDate, 1);
    expect(onDay[0]?.key).toBe("ramadan");
    expect(onDay[0]?.daysUntilEstimatedDate).toBe(0);
  });
  it("handles December-to-January boundaries and never surfaces past dates", () => {
    const events = upcomingHijriPlanningEvents("2026-12-31", 5);
    expect(events).toHaveLength(5);
    expect(events.every(e => e.estimatedCivilDate >= "2026-12-31")).toBe(true);
  });
  it.each(["", "2026-02-30", "2026-13-01", "2026-1-01", "javascript:alert(1)"])(
    "rejects invalid dates %s", value => expect(upcomingHijriPlanningEvents(value)).toEqual([]),
  );
  it.each([0, -1, 1.5, Infinity, 6])("rejects unbounded or invalid limits %s", value => {
    expect(upcomingHijriPlanningEvents("2026-10-15", value)).toEqual([]);
  });
});
