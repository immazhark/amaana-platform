import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { donationReviewFilters, loadPendingTransferReview } from "./pending-transfer-review";

describe("pending transfer review", () => {
  it("accepts only the exact application reference and explicit oldest order", () => {
    expect(donationReviewFilters(" afd-2026-12345678 ", "oldest")).toEqual({ reference: "AFD-2026-12345678", invalidReference: false, direction: "asc" });
    expect(donationReviewFilters(undefined, undefined)).toEqual({ reference: null, invalidReference: false, direction: "desc" });
    for (const value of [["AFD-2026-12345678"], "private@example.test", "AFD-2026-12345678#token=secret", "x".repeat(200)]) {
      expect(donationReviewFilters(value, ["oldest"])).toEqual({ reference: null, invalidReference: true, direction: "desc" });
    }
  });
  it("returns both methods without treating absent rows as errors", async () => {
    const query = vi.fn(async () => [{ paymentMethod: "BANK_TRANSFER", underDay: 1n, oneToSevenDays: 2n, overSevenDays: 3n, future: 1n, total: 7n }]);
    const client = { $queryRaw: query } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">;
    expect(await loadPendingTransferReview(client, new Date("2026-11-26T10:00:00Z"))).toEqual([
      { paymentMethod: "DIRECT_UPI", underDay: 0, oneToSevenDays: 0, overSevenDays: 0, future: 0, total: 0 },
      { paymentMethod: "BANK_TRANSFER", underDay: 1, oneToSevenDays: 2, overSevenDays: 3, future: 1, total: 7 },
    ]);
    expect(query).toHaveBeenCalledOnce();
  });
  it("fails closed for inconsistent bucket totals", async () => {
    const client = { $queryRaw: vi.fn(async () => [{ paymentMethod: "DIRECT_UPI", underDay: 1n, oneToSevenDays: 0n, overSevenDays: 0n, future: 0n, total: 2n }]) } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">;
    await expect(loadPendingTransferReview(client)).rejects.toThrow("Inconsistent pending transfer review");
  });
});
