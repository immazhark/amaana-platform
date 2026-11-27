import { describe, expect, it } from "vitest";
import type { DonationIntent, DonationStatus } from "@prisma/client";
import { summariseDonationQueueCounts } from "./donation-queue-counts";

const statuses: DonationStatus[] = ["CREATED", "AUTHORIZED", "PENDING_VERIFICATION", "CAPTURED", "FAILED", "REJECTED", "REFUNDED"];
const intents: DonationIntent[] = ["GENERAL", "SADAQAH", "ZAKAT"];
const group = (status: DonationStatus, givingIntent: DonationIntent, count: number) => ({ status, givingIntent, _count: { _all: count } });
const rows = [group("CAPTURED", "GENERAL", 60), group("CAPTURED", "SADAQAH", 51), group("PENDING_VERIFICATION", "SADAQAH", 101), group("REFUNDED", "ZAKAT", 3)];

describe("donation queue joint counts", () => {
  it("computes unfiltered totals and both marginals", () => {
    const result = summariseDonationQueueCounts(rows);
    expect(result.totalItems).toBe(215);
    expect(result.statusCounts.get("CAPTURED")).toBe(111);
    expect(result.intentCounts.get("SADAQAH")).toBe(152);
  });
  it("intersects both filters but applies only the other filter to each marginal", () => {
    const result = summariseDonationQueueCounts(rows, "CAPTURED", "SADAQAH");
    expect(result.totalItems).toBe(51);
    expect(result.statusCounts.get("PENDING_VERIFICATION")).toBe(101);
    expect(result.intentCounts.get("GENERAL")).toBe(60);
    expect(result.intentCounts.has("ZAKAT")).toBe(false);
  });
  it("returns zero for a missing combination without discarding other options", () => {
    const result = summariseDonationQueueCounts(rows, "REFUNDED", "GENERAL");
    expect(result.totalItems).toBe(0);
    expect(result.statusCounts.get("CAPTURED")).toBe(60);
    expect(result.intentCounts.get("ZAKAT")).toBe(3);
  });
  it("keeps an empty scope empty", () => {
    const result = summariseDonationQueueCounts([], "REFUNDED", "SADAQAH");
    expect(result.totalItems).toBe(0);
    expect(result.statusCounts.size).toBe(0);
    expect(result.intentCounts.size).toBe(0);
  });
  it("agrees with independent filter predicates over 100 deterministic grouped datasets", () => {
    for (let seed = 0; seed < 100; seed++) {
      const data = statuses.flatMap((status, i) => intents.map((intent, j) => group(status, intent, (seed * 17 + i * 11 + j * 7) % 137)).filter(row => row._count._all));
      for (const status of [undefined, ...statuses]) {
        for (const intent of [undefined, ...intents]) {
          const result = summariseDonationQueueCounts(data, status, intent);
          const sum = (selected: typeof data) => selected.reduce((total, row) => total + row._count._all, 0);
          expect(result.totalItems).toBe(sum(data.filter(row => (!status || row.status === status) && (!intent || row.givingIntent === intent))));
          for (const key of statuses) expect(result.statusCounts.get(key) ?? 0).toBe(sum(data.filter(row => row.status === key && (!intent || row.givingIntent === intent))));
          for (const key of intents) expect(result.intentCounts.get(key) ?? 0).toBe(sum(data.filter(row => row.givingIntent === key && (!status || row.status === status))));
        }
      }
    }
  });
});
