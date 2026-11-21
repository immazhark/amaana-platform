import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fundFind: vi.fn(), donationGroupBy: vi.fn(), donationFindMany: vi.fn(), disbursementGroupBy: vi.fn(), create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), audit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: async (fn: (tx: unknown) => unknown) => fn({
    fund: { findUnique: mocks.fundFind },
    donation: { groupBy: mocks.donationGroupBy, findMany: mocks.donationFindMany },
    fundDisbursement: { groupBy: mocks.disbursementGroupBy, create: mocks.create, findUnique: mocks.findUnique, updateMany: mocks.updateMany },
    auditEvent: { create: mocks.audit },
  }),
}));

import { DisbursementError, publishDisbursement, TWO_PERSON_MESSAGE, recordDisbursement, voidDisbursement } from "./fund-disbursement-service";

const dec = (rupees: number) => ({ mul: (n: number) => ({ toNumber: () => rupees * n }) });
const input = { fundId: "fund_orphan", pool: "NON_ZAKAT" as const, amountPaise: 5_000_000, spentOn: "2026-11-18", financialYear: "2026-27", title: "Stationery kits", publicSummary: "Kits for 25 children", zakatEligibilityBasis: null };

function funded(sadaqah: number, zakat = 0, spent = 0) {
  mocks.fundFind.mockResolvedValue({ id: "fund_orphan" });
  mocks.donationGroupBy.mockResolvedValue([
    { fundId: "fund_orphan", givingIntent: "SADAQAH", status: "CAPTURED", _sum: { amount: dec(sadaqah) } },
    ...(zakat ? [{ fundId: "fund_orphan", givingIntent: "ZAKAT", status: "CAPTURED", _sum: { amount: dec(zakat) } }] : []),
  ]);
  mocks.donationFindMany.mockResolvedValue([]);
  mocks.disbursementGroupBy.mockResolvedValue(spent ? [{ fundId: "fund_orphan", pool: "NON_ZAKAT", status: "DRAFT", _sum: { amount: dec(spent) } }] : []);
  mocks.create.mockResolvedValue({ id: "disb_1" });
}

describe("recordDisbursement", () => {
  beforeEach(() => vi.clearAllMocks());
  it("records a draft within the verified balance and audits it", async () => {
    funded(100_000);
    await expect(recordDisbursement(input, "admin_1")).resolves.toEqual({ id: "disb_1" });
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ fundId: "fund_orphan", pool: "NON_ZAKAT", amount: 50_000, financialYear: "2026-27", createdById: "admin_1" });
    expect(mocks.create.mock.calls[0]?.[0].data).not.toHaveProperty("zakatEligibilityConfirmedAt");
    expect(mocks.audit.mock.calls[0]?.[0].data).toMatchObject({ actorId: "admin_1", action: "fund.disbursement.record", entityId: "disb_1" });
  });
  it("refuses to overspend, counting earlier drafts against the balance", async () => {
    funded(100_000, 0, 60_000);
    await expect(recordDisbursement(input, "admin_1")).rejects.toBeInstanceOf(DisbursementError);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("cannot spend Zakat money that was never received, even with non-Zakat balance available", async () => {
    funded(100_000);
    await expect(recordDisbursement({ ...input, pool: "ZAKAT", zakatEligibilityBasis: "All recipients verified" }, "admin_1")).rejects.toThrow(/Zakat balance/);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("stores the eligibility confirmation with a Zakat spend", async () => {
    funded(0, 100_000);
    await recordDisbursement({ ...input, pool: "ZAKAT", zakatEligibilityBasis: "All recipients verified" }, "admin_1");
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ pool: "ZAKAT", zakatEligibilityBasis: "All recipients verified", zakatEligibilityConfirmedAt: expect.any(Date) });
  });
  it("rejects an unknown fund", async () => {
    mocks.fundFind.mockResolvedValue(null);
    await expect(recordDisbursement(input, "admin_1")).rejects.toThrow(/does not exist/);
  });
});

describe("publishDisbursement and voidDisbursement", () => {
  beforeEach(() => vi.clearAllMocks());
  it("publishes only a draft that has a clean public summary", async () => {
    mocks.findUnique.mockResolvedValueOnce({ status: "DRAFT", publicSummary: "School fees for 12 children", createdById: "maker_1" });
    mocks.updateMany.mockResolvedValueOnce({ count: 1 });
    await publishDisbursement("disb_1", "admin_1");
    expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id: "disb_1", status: "DRAFT" }, data: expect.objectContaining({ status: "PUBLISHED" }) });
    expect(mocks.audit.mock.calls[0]?.[0].data.action).toBe("fund.disbursement.publish");
  });
  it.each([[{ status: "PUBLISHED", publicSummary: "School fees for 12 children" }], [{ status: "VOID", publicSummary: "School fees for 12 children" }], [{ status: "DRAFT", publicSummary: null }], [{ status: "DRAFT", publicSummary: "email a@b.co" }], [null]])("refuses to publish %j", async row => {
    mocks.findUnique.mockResolvedValueOnce(row);
    await expect(publishDisbursement("disb_1", "admin_1")).rejects.toBeInstanceOf(DisbursementError);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
  it("refuses to let the person who recorded an entry publish it, and changes nothing", async () => {
    mocks.findUnique.mockResolvedValueOnce({ status: "DRAFT", publicSummary: "School fees for 12 children", createdById: "admin_1" });
    await expect(publishDisbursement("disb_1", "admin_1", {})).rejects.toThrow(TWO_PERSON_MESSAGE);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("lets a different staff member publish, with no self-publication mark in the audit event", async () => {
    mocks.findUnique.mockResolvedValueOnce({ status: "DRAFT", publicSummary: "School fees for 12 children", createdById: "maker_1" });
    mocks.updateMany.mockResolvedValueOnce({ count: 1 });
    await publishDisbursement("disb_1", "checker_1", {});
    expect(mocks.audit.mock.calls[0]?.[0].data.metadata).toEqual({});
  });
  it("allows a declared sole operator to self-publish, and marks it in the audit event", async () => {
    mocks.findUnique.mockResolvedValueOnce({ status: "DRAFT", publicSummary: "School fees for 12 children", createdById: "admin_1" });
    mocks.updateMany.mockResolvedValueOnce({ count: 1 });
    await publishDisbursement("disb_1", "admin_1", { FUND_SPENDING_SOLE_OPERATOR: "true" });
    expect(mocks.audit.mock.calls[0]?.[0].data.metadata).toEqual({ selfPublished: true });
  });
  it.each(["True", "1", "yes", "false", ""])("treats FUND_SPENDING_SOLE_OPERATOR=%j as off (exact true only)", async value => {
    mocks.findUnique.mockResolvedValueOnce({ status: "DRAFT", publicSummary: "School fees for 12 children", createdById: "admin_1" });
    await expect(publishDisbursement("disb_1", "admin_1", { FUND_SPENDING_SOLE_OPERATOR: value })).rejects.toThrow(TWO_PERSON_MESSAGE);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
  it("fails safely when a concurrent change wins the publish", async () => {
    mocks.findUnique.mockResolvedValueOnce({ status: "DRAFT", publicSummary: "School fees for 12 children", createdById: "maker_1" });
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(publishDisbursement("disb_1", "admin_1")).rejects.toThrow(/changed/);
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("voids with a reason, keeps the row, and audits without storing the reason text", async () => {
    mocks.updateMany.mockResolvedValueOnce({ count: 1 });
    await voidDisbursement("disb_1", "Entered twice", "admin_1");
    expect(mocks.updateMany.mock.calls[0]?.[0].data).toMatchObject({ status: "VOID", voidReason: "Entered twice" });
    expect(mocks.audit.mock.calls[0]?.[0].data.metadata).toEqual({ reasonLength: 13 });
  });
  it("will not void without a reason or when already void", async () => {
    await expect(voidDisbursement("disb_1", "no", "admin_1")).rejects.toBeInstanceOf(DisbursementError);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(voidDisbursement("disb_1", "Entered twice", "admin_1")).rejects.toThrow(/already void/);
  });
});
