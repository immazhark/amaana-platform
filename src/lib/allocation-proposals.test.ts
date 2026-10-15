import { describe, expect, it } from "vitest";
import { AllocationError, allocationAvailablePaise, assertAllocationReview, parseAllocationNote, parseAllocationPaise } from "./allocation-proposals";

const decimal = (value: number) => ({ mul: (n: number) => ({ toNumber: () => value * n }) });
const eligible = {
  appealId: null, fundId: "fund-1", currency: "INR", status: "CAPTURED",
  amount: decimal(500), refundedAmount: decimal(0), givingIntent: "SADAQAH",
  domesticConfirmedAt: new Date("2026-10-12T09:00:00Z"),
  fundDisclosureConfirmedAt: new Date("2026-10-12T09:00:00Z"),
  designationSnapshot: {
    version: 1, kind: "FUND", fundId: "fund-1", fundRevision: 2,
    label: "Approved giving fund", purpose: "Reviewed purpose description for the donation",
    disclosure: "Reviewed original donor restrictions for the donation",
    accountCode: "FUND-1", givingIntent: "SADAQAH",
  },
};
describe("restricted non-disbursing allocation proposals", () => {
  it("parses exact paise without floating point rounding", () => {
    expect(parseAllocationPaise("1")).toBe(100);
    expect(parseAllocationPaise("125.05")).toBe(12505);
    expect(parseAllocationPaise("0.01")).toBe(1);
    expect(parseAllocationPaise("2000000")).toBe(200000000);
    for (const invalid of ["0", "-1", "0.001", "1e3", "1,000", " 100 ", "2000001", "0.00"]) {
      expect(() => parseAllocationPaise(invalid)).toThrow(AllocationError);
    }
  });
  it("enforces retained captured amount minus approved allocations", () => {
    expect(allocationAvailablePaise(eligible, [12000, 10000])).toBe(28000);
    expect(allocationAvailablePaise(eligible, [50000])).toBe(0);
    expect(() => allocationAvailablePaise(eligible, [50001])).toThrow();
  });
  it("blocks refunds, pending transfers, appeal-to-fund redirection and corrupted purpose", () => {
    expect(() => allocationAvailablePaise({ ...eligible, status: "PENDING_VERIFICATION" }, [])).toThrow();
    expect(() => allocationAvailablePaise({ ...eligible, refundedAmount: decimal(.01) }, [])).toThrow();
    expect(() => allocationAvailablePaise({ ...eligible, appealId: "appeal-1", fundId: null }, [])).toThrow();
    expect(() => allocationAvailablePaise({ ...eligible, givingIntent: "ZAKAT" }, [])).toThrow();
    expect(() => allocationAvailablePaise({ ...eligible, designationSnapshot: null }, [])).toThrow();
    expect(() => allocationAvailablePaise({ ...eligible, fundDisclosureConfirmedAt: null }, [])).toThrow();
    expect(() => allocationAvailablePaise({ ...eligible, domesticConfirmedAt: new Date(NaN) }, [])).toThrow();
  });
  it("requires a separate maker and checker and forbids reused terminal proposals", () => {
    expect(() => assertAllocationReview("creator", "creator", "PENDING")).toThrow(AllocationError);
    expect(() => assertAllocationReview("reviewer", "creator", "APPROVED")).toThrow(AllocationError);
    expect(() => assertAllocationReview("reviewer", "creator", "PENDING")).not.toThrow();
  });
  it("bounds purpose notes without collecting private beneficiary documents", () => {
    expect(parseAllocationNote("  Education supplies for approved programme  ")).toBe("Education supplies for approved programme");
    expect(() => parseAllocationNote("short")).toThrow();
    expect(() => parseAllocationNote("A".repeat(241))).toThrow();
    for (const privateValue of [
      "For beneficiary amina@example.org private welfare",
      "Call beneficiary 9876543210 before planning aid",
      "See https://example.org/private/beneficiary",
      "Case detail <medical-private-document> should not appear",
    ]) expect(() => parseAllocationNote(privateValue)).toThrow();
  });
});
