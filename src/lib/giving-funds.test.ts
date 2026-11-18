import { describe, expect, it } from "vitest";
import { allowedIntentsForFund, canDisburse, indianFinancialYear, isIntentAllowedForFund, summariseFunds, zakatNoticeForFund } from "./giving-funds";

const d = (fundId: string | null, givingIntent: string, status: string, amountPaise: number, refundedPaise = 0) => ({ fundId, givingIntent, status, amountPaise, refundedPaise });
const s = (fundId: string, pool: "ZAKAT" | "NON_ZAKAT", status: string, amountPaise: number) => ({ fundId, pool, status, amountPaise });

describe("fund Zakat policy", () => {
  it("accepts Zakat only where the fund is ruled ACCEPTED", () => {
    expect(allowedIntentsForFund("ACCEPTED")).toEqual(["GENERAL", "SADAQAH", "ZAKAT"]);
    expect(isIntentAllowedForFund("NOT_ACCEPTED", "ZAKAT")).toBe(false);
    expect(isIntentAllowedForFund("UNDER_REVIEW", "ZAKAT")).toBe(false);
    expect(isIntentAllowedForFund("UNDER_REVIEW", "SADAQAH")).toBe(true);
    expect(isIntentAllowedForFund("ACCEPTED", "zakat")).toBe(false);
    expect(isIntentAllowedForFund("ACCEPTED", "")).toBe(false);
  });
  it("shows a visible notice for every fund that refuses Zakat", () => {
    expect(zakatNoticeForFund("NOT_ACCEPTED")).toMatch(/Zakat is not accepted for this fund/);
    expect(zakatNoticeForFund("UNDER_REVIEW")).toMatch(/under review/);
    expect(zakatNoticeForFund("ACCEPTED")).toBeNull();
  });
});

describe("Indian financial year", () => {
  it.each([
    ["2026-03-31T18:29:00Z", "2025-26"],
    ["2026-03-31T18:30:00Z", "2026-27"],
    ["2026-11-19T00:00:00Z", "2026-27"],
    ["2027-01-15T10:00:00Z", "2026-27"],
    ["2099-04-10T00:00:00Z", "2099-00"],
  ])("%s is %s", (iso, expected) => expect(indianFinancialYear(new Date(iso))).toBe(expected));
});

describe("fund accounting", () => {
  it("accumulates each fund and the whole Zakat account, net of refunds, excluding unverified money", () => {
    const { byFund, zakatAccount } = summariseFunds([
      d("orphan", "SADAQAH", "CAPTURED", 100_000),
      d("orphan", "GENERAL", "CAPTURED", 100_000),
      d("orphan", "GENERAL", "CAPTURED", 50_000, 20_000),
      d("orphan", "GENERAL", "PENDING_VERIFICATION", 70_000),
      d("orphan", "GENERAL", "FAILED", 90_000),
      d("general", "ZAKAT", "CAPTURED", 500_000),
      d(null, "ZAKAT", "CAPTURED", 100_000),
      d("general", "ZAKAT", "PENDING_VERIFICATION", 300_000),
    ], []);
    expect(byFund.orphan?.total).toMatchObject({ receivedPaise: 230_000, pendingPaise: 70_000, refundedPaise: 20_000 });
    expect(byFund.general?.zakat.receivedPaise).toBe(500_000);
    expect(byFund.APPEAL?.zakat.receivedPaise).toBe(100_000);
    expect(zakatAccount).toMatchObject({ receivedPaise: 600_000, pendingPaise: 300_000 });
  });
  it("tracks spending per pool: void ignored, drafts reserve balance, public counts published only", () => {
    const { byFund, zakatAccount } = summariseFunds(
      [d("orphan", "ZAKAT", "CAPTURED", 400_000), d("orphan", "SADAQAH", "CAPTURED", 600_000)],
      [s("orphan", "NON_ZAKAT", "PUBLISHED", 500_000), s("orphan", "ZAKAT", "DRAFT", 100_000), s("orphan", "NON_ZAKAT", "VOID", 999_999)],
    );
    const orphan = byFund.orphan!;
    expect(orphan.nonZakat).toMatchObject({ spentPaise: 500_000, publishedSpentPaise: 500_000, balancePaise: 100_000 });
    expect(orphan.zakat).toMatchObject({ spentPaise: 100_000, publishedSpentPaise: 0, balancePaise: 300_000 });
    expect(orphan.total.balancePaise).toBe(400_000);
    expect(zakatAccount.balancePaise).toBe(300_000);
  });
  it("returns a covered gateway fee first: only a refund beyond the fee reduces the fund", () => {
    const fee = (refundedPaise: number) => summariseFunds([{ fundId: "orphan", givingIntent: "SADAQAH", status: "CAPTURED", amountPaise: 500_000, refundedPaise, feePaise: 12_086 }], []).byFund.orphan!.total;
    expect(fee(0).receivedPaise).toBe(500_000);
    expect(fee(12_086).receivedPaise).toBe(500_000);
    expect(fee(112_086)).toMatchObject({ receivedPaise: 400_000, refundedPaise: 100_000 });
    expect(fee(512_086).receivedPaise).toBe(0);
  });
  it("the 100k Orphan Fund example: 50k stationery + 50k school fees leaves nothing", () => {
    const { byFund } = summariseFunds([d("orphan", "SADAQAH", "CAPTURED", 10_000_000)], [s("orphan", "NON_ZAKAT", "PUBLISHED", 5_000_000), s("orphan", "NON_ZAKAT", "PUBLISHED", 5_000_000)]);
    expect(byFund.orphan?.total.balancePaise).toBe(0);
  });
  it("lets a disbursement draw only on verified money in its own pool", () => {
    const { byFund } = summariseFunds([d("orphan", "SADAQAH", "CAPTURED", 100_000), d("orphan", "ZAKAT", "PENDING_VERIFICATION", 900_000)], []);
    const totals = byFund.orphan!;
    expect(canDisburse(totals, "NON_ZAKAT", 100_000)).toBe(true);
    expect(canDisburse(totals, "NON_ZAKAT", 100_001)).toBe(false);
    expect(canDisburse(totals, "ZAKAT", 1)).toBe(false);
    expect(canDisburse(totals, "NON_ZAKAT", 0)).toBe(false);
    expect(canDisburse(totals, "NON_ZAKAT", 1.5)).toBe(false);
    expect(canDisburse(totals, "NON_ZAKAT", Number.NaN)).toBe(false);
  });
});
