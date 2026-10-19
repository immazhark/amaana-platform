import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { financeMonthBounds, serializeFinanceCsv } from "./finance-monthly-export";

const record = {
  referenceNumber: "AF-2026-001",
  receiptNumber: "RC-2026-001",
  givingIntent: "GENERAL",
  paymentMethod: "RAZORPAY",
  status: "CAPTURED",
  currency: "INR",
  amount: new Prisma.Decimal("1350.25"),
  refundedAmount: new Prisma.Decimal("50.10"),
  capturedAt: new Date("2026-10-01T01:00:00.000Z"),
  refundedAt: null,
};

describe("private finance reconciliation CSV", () => {
  it("uses Asia/Kolkata month boundaries without local server timezone drift", () => {
    expect(financeMonthBounds("2026-10")).toEqual({
      month: "2026-10",
      start: new Date("2026-09-30T18:30:00.000Z"),
      end: new Date("2026-10-31T18:30:00.000Z"),
    });
    expect(financeMonthBounds("2027-02")?.end.toISOString()).toBe("2027-02-28T18:30:00.000Z");
  });

  it.each(["2026-00", "2026-13", "2026-1", "026-10", " 2026-10", "2026-10 ", "2019-12", "2101-01", "2026-10&foo=1"])(
    "rejects invalid month %s", value => {
      expect(financeMonthBounds(value)).toBeNull();
    },
  );

  it("preserves paise-accurate gross, refund and net values without donor identity", () => {
    const csv = serializeFinanceCsv([{
      ...record,
      donorName: "PRIVATE DONOR NAME",
      donorEmail: "private@example.test",
      transferEvidenceKey: "private/statement.jpg",
    }]);
    expect(csv).toContain("1350.25,50.10,1300.15");
    expect(csv).toContain("2026-10-01T01:00:00.000Z");
    expect(csv).not.toContain("PRIVATE DONOR NAME");
    expect(csv).not.toContain("private@example.test");
    expect(csv).not.toContain("private/statement.jpg");
    expect(csv).not.toContain("10BD");
    expect(csv).not.toContain("10BE");
  });

  it("neutralizes spreadsheet formulas and multiline record fields", () => {
    const csv = serializeFinanceCsv([{
      ...record,
      referenceNumber: "=HYPERLINK(\"https://attacker.test\")\nsecond row",
      receiptNumber: "+SUM(1,2)",
    }]);
    expect(csv).toContain("\"'=HYPERLINK(\"\"https://attacker.test\"\") second row\"");
    expect(csv).toContain("\"'+SUM(1,2)\"");
    expect(csv.split("\r\n")).toHaveLength(3);
  });

  it("refuses inconsistent accounting values instead of hiding negative net", () => {
    expect(() => serializeFinanceCsv([{ ...record, refundedAmount: new Prisma.Decimal("1400.00") }]))
      .toThrow("Invalid finance reconciliation amount");
  });
});
