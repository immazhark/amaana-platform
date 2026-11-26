import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { classifyRetentionSchedule, indiaCalendarDay, loadRetentionScheduleSummary, summarizeRetentionSchedules } from "./retention-review";

const today = "2026-11-26";
const iso = (day: string) => day + "T00:00:00.000Z";

describe("retention review schedule", () => {
  it("uses the Indian calendar day across midnight", () => {
    expect(indiaCalendarDay(new Date("2026-11-25T18:29:59Z"))).toBe("2026-11-25");
    expect(indiaCalendarDay(new Date("2026-11-25T18:30:00Z"))).toBe(today);
  });
  it("separates due, upcoming, unreviewed and unscheduled reminders", () => {
    expect(classifyRetentionSchedule(true, iso(today), today)).toBe("due");
    expect(classifyRetentionSchedule(true, iso("2026-11-25"), today)).toBe("due");
    expect(classifyRetentionSchedule(true, iso("2026-11-27"), today)).toBe("upcoming");
    expect(classifyRetentionSchedule(false, null, today)).toBe("unreviewed");
    expect(classifyRetentionSchedule(true, null, today)).toBe("unscheduled");
  });
  it("does not guess dates from malformed evidence", () => {
    for (const value of ["2026-02-30T00:00:00.000Z", "2026-11-26", "2026-11-26T01:00:00.000Z", {}, "bad"]) {
      expect(classifyRetentionSchedule(true, value, today)).toBe("invalid");
    }
  });
  it("holds overlap reminders and no count implies deletion authority", async () => {
    const groups = [
      { held: true, recorded: true, reviewAfter: iso(today), count: 2n },
      { held: false, recorded: true, reviewAfter: iso("2026-12-01"), count: 1n },
      { held: false, recorded: false, reviewAfter: null, count: 3n },
      { held: true, recorded: true, reviewAfter: null, count: 1n },
      { held: false, recorded: true, reviewAfter: "invalid", count: 1n },
    ];
    const query = vi.fn(async () => groups);
    const client = { $queryRaw: query } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">;
    expect(await loadRetentionScheduleSummary(client, today)).toEqual({ total: 8, held: 3, due: 2, upcoming: 1, unreviewed: 3, unscheduled: 1, invalid: 1 });
    expect(query).toHaveBeenCalledOnce();
  });
  it("refuses invalid or overflowing group totals", () => {
    for (const count of [-1n, 0n, 9007199254740992n]) {
      expect(() => summarizeRetentionSchedules([{ held: true, recorded: true, reviewAfter: null, count }], today)).toThrow();
    }
    expect(() => summarizeRetentionSchedules([{ held: false, recorded: false, reviewAfter: null, count: 9007199254740991n }, { held: true, recorded: true, reviewAfter: null, count: 1n }], today)).toThrow();
  });
});
