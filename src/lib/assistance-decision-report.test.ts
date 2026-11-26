import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { loadAssistanceDecisionBreakdown, loadAssistanceDecisionReport } from "./assistance-decision-report";

const sample = { category: "MEDICAL", received: 8n, recorded: 4n, withinDay: 1n, withinWeek: 2n, overWeek: 1n, openWithoutDecision: 2n, otherWithoutDecision: 2n, verificationRecorded: 5n, verificationWithinDay: 2n, verificationWithinWeek: 2n, verificationOverWeek: 1n, verificationMissing: 3n };
const now = new Date("2026-11-26T10:00:00Z");
describe("assistance decision report", () => {
  it("queries one bounded snapshot with the existing historical fixture reference and returns counts only", async () => {
    const query = vi.fn(async () => [sample]);
    const client = { $queryRaw: query } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">;
    expect(await loadAssistanceDecisionReport(client, "live", now)).toEqual({ received: 8, recorded: 4, withinDay: 1, withinWeek: 2, overWeek: 1, openWithoutDecision: 2, otherWithoutDecision: 2, verificationRecorded: 5, verificationWithinDay: 2, verificationWithinWeek: 2, verificationOverWeek: 1, verificationMissing: 3 });
    expect(query).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledWith(expect.anything(), new Date(now.getTime() - 90 * 86_400_000), now, false, "AF-STAGING-ACCEPTANCE", false, "AF-STAGING-ACCEPTANCE", now, now);
  });
  it.each([{ ...sample, recorded: 5n }, { ...sample, received: 9n }, { ...sample, withinDay: -1n }, { ...sample, verificationRecorded: 6n }, { ...sample, verificationMissing: 4n }, { ...sample, verificationWithinWeek: -1n }, { ...sample, verificationMissing: undefined }, { ...sample, verificationMissing: BigInt(Number.MAX_SAFE_INTEGER) + 1n }, { ...sample, received: BigInt(Number.MAX_SAFE_INTEGER) + 1n }])("refuses inconsistent or unsafe aggregates", async row => {
    const client = { $queryRaw: vi.fn(async () => [row]) } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">;
    await expect(loadAssistanceDecisionReport(client, "live", now)).rejects.toThrow("Inconsistent assistance decision report");
  });
});

describe("assistance category breakdown", () => {
  it("combines the category totals without adding another query", async () => {
    const query = vi.fn(async () => [sample, { ...sample, category: "EDUCATION" }]);
    const client = { $queryRaw: query } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">;
    const result = await loadAssistanceDecisionBreakdown(client, "live", now);
    expect(result.totals).toMatchObject({ received: 16, recorded: 8, verificationMissing: 6 });
    expect(result.categories.map(row => row.category)).toEqual(["MEDICAL", "EDUCATION"]);
    expect(query).toHaveBeenCalledOnce();
  });
  it("represents an empty cohort without inventing categories", async () => {
    const client = { $queryRaw: vi.fn(async () => []) } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">;
    const report = await loadAssistanceDecisionBreakdown(client, "tests", now);
    expect(report.categories).toEqual([]);
    expect(Object.values(report.totals)).toEqual(Array(12).fill(0));
  });
  it.each([{ rows: [sample, sample] }, { rows: [{ ...sample, category: "unknown" }] }, { rows: [{ ...sample, received: 8 }] }])("rejects duplicate, unknown or invalid category data", async ({ rows }) => {
    const client = { $queryRaw: vi.fn(async () => rows) } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">;
    await expect(loadAssistanceDecisionBreakdown(client, "live", now)).rejects.toThrow("Inconsistent assistance decision report");
  });
});
