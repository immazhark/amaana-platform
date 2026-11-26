import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { loadAssistanceDecisionReport } from "./assistance-decision-report";

const sample = { received: 8n, recorded: 4n, withinDay: 1n, withinWeek: 2n, overWeek: 1n, openWithoutDecision: 2n, otherWithoutDecision: 2n, verificationRecorded: 5n, verificationWithinDay: 2n, verificationWithinWeek: 2n, verificationOverWeek: 1n, verificationMissing: 3n };
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
