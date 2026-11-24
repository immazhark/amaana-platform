import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DonationPaymentMethod, DonationStatus } from "@prisma/client";
import { MIN_REPORTABLE_CELL, summariseDonationFunnel, type FunnelRow, type GroupedDonationCount } from "./donation-funnel";

const g = (paymentMethod: DonationPaymentMethod, status: DonationStatus, count: number): GroupedDonationCount => ({ paymentMethod, status, _count: { _all: count } });
const counts = (row: FunnelRow) => Object.fromEntries(Object.entries(row.cells).map(([stage, cell]) => [stage, cell.suppressed ? "hidden" : cell.count]));

describe("donation funnel aggregate", () => {
  it("maps recorded payment status to stages, counting a refunded gift as confirmed", () => {
    const [row] = summariseDonationFunnel([
      g("RAZORPAY", "CREATED", 10), g("RAZORPAY", "AUTHORIZED", 6), g("RAZORPAY", "PENDING_VERIFICATION", 5),
      g("RAZORPAY", "CAPTURED", 40), g("RAZORPAY", "REFUNDED", 5), g("RAZORPAY", "FAILED", 8), g("RAZORPAY", "REJECTED", 6),
    ]);
    expect(counts(row!)).toEqual({ started: 80, awaiting: 21, confirmed: 45, unsuccessful: 14 });
    expect(row!.confirmedShare).toBe(56.3);
  });

  it("hides a count between one and four, and also the next smallest so it cannot be recovered by subtraction", () => {
    const rows = summariseDonationFunnel([g("DIRECT_UPI", "CAPTURED", 30), g("DIRECT_UPI", "FAILED", 2), g("DIRECT_UPI", "CREATED", 9)]);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.cells.unsuccessful).toEqual({ suppressed: true });
    expect(row.cells.awaiting).toEqual({ suppressed: true });
    const visible = Object.values(row.cells).filter(cell => !cell.suppressed).length;
    expect(visible).toBe(1); // only the safe confirmed count; the derived started total must not expose hidden components
    expect(row.cells.started).toEqual({ suppressed: true });
    expect(row.confirmedShare).toBeNull();
  });

  it("never reveals the combined total when hidden stages can each be inferred as a single gift", () => {
    const rows = summariseDonationFunnel([
      g("RAZORPAY", "CAPTURED", 20),
      g("RAZORPAY", "FAILED", 1),
      g("RAZORPAY", "CREATED", 1),
    ]);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.cells.awaiting).toEqual({ suppressed: true });
    expect(row.cells.unsuccessful).toEqual({ suppressed: true });
    expect(row.cells.started).toEqual({ suppressed: true });
    expect(row.confirmedShare).toBeNull();
  });

  it("does not hide a true zero and does not invent suppression when every cell is large", () => {
    const [row] = summariseDonationFunnel([g("BANK_TRANSFER", "CAPTURED", 20), g("BANK_TRANSFER", "FAILED", 7)]);
    expect(counts(row!)).toEqual({ started: 27, awaiting: 0, confirmed: 20, unsuccessful: 7 });
    expect(row!.confirmedShare).toBe(74.1);
  });

  it("shows an all-methods row only when no cell is hidden anywhere", () => {
    const clean = summariseDonationFunnel([g("RAZORPAY", "CAPTURED", 20), g("DIRECT_UPI", "CAPTURED", 12)]);
    expect(clean.map(row => row.method)).toEqual(["ALL", "DIRECT_UPI", "RAZORPAY"]);
    expect(counts(clean[0]!).confirmed).toBe(32);
    const withSmall = summariseDonationFunnel([g("RAZORPAY", "CAPTURED", 20), g("DIRECT_UPI", "CAPTURED", 12), g("DIRECT_UPI", "FAILED", 1)]);
    expect(withSmall.map(row => row.method)).toEqual(["DIRECT_UPI", "RAZORPAY"]);
  });

  it("returns nothing for no data and ignores malformed counts", () => {
    expect(summariseDonationFunnel([])).toEqual([]);
    expect(summariseDonationFunnel([g("RAZORPAY", "CAPTURED", 0), g("RAZORPAY", "CAPTURED", -3), g("RAZORPAY", "CAPTURED", Number.NaN), g("RAZORPAY", "CAPTURED", 1.5)])).toEqual([]);
  });

  it("uses a minimum cell size of five", () => {
    expect(MIN_REPORTABLE_CELL).toBe(5);
    const [row] = summariseDonationFunnel([g("RAZORPAY", "CAPTURED", 5)]);
    expect(counts(row!).confirmed).toBe(5);
  });

  it("can only see grouped counts: no donor, reference, amount, contact or token field is read", () => {
    const source = readFileSync(new URL("./donation-funnel.ts", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
    for (const field of [/donorName/, /donorEmail/, /donorPhone/, /referenceNumber/, /receiptTokenHash/, /\bamount\b/, /ipAddress/, /userAgent/, /providerPaymentId/]) {
      expect(source).not.toMatch(field);
    }
  });
});
