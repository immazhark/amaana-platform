import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requirePermission: vi.fn(), hasPermission: vi.fn(), funds: vi.fn(), groups: vi.fn(), entries: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.requirePermission, hasPermission: mocks.hasPermission }));
vi.mock("@/lib/prisma", () => ({ prisma: { fund: { findMany: mocks.funds }, fundDisbursement: { groupBy: mocks.groups, findMany: mocks.entries } } }));
vi.mock("../actions", () => {
  const noop = async () => undefined;
  return { publishDisbursementAction: noop, recordDisbursementAction: noop, voidDisbursementAction: noop };
});

import FundSpendingPage from "./page";

const money = (amount: number) => ({ toNumber: () => amount });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.requirePermission.mockResolvedValue({ id: "synthetic-viewer" });
  mocks.hasPermission.mockReturnValue(false);
  mocks.funds.mockResolvedValue([{ id: "f1", name: "Synthetic fund" }]);
  mocks.groups.mockImplementation(async args => args.by.includes("financialYear") ? [{ financialYear: "2026-27" }] : [
    { status: "DRAFT", _count: { _all: 50 }, _sum: { amount: money(110.25) } },
    { status: "PUBLISHED", _count: { _all: 80 }, _sum: { amount: money(200.15) } },
    { status: "VOID", _count: { _all: 2 }, _sum: { amount: money(7.01) } },
  ]);
  mocks.entries.mockResolvedValue([]);
});

describe("private spending history", () => {
  it("denies access before any fund or spending query", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("denied"));
    await expect(FundSpendingPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("denied");
    expect(mocks.requirePermission).toHaveBeenCalledWith("donation.view");
    expect(mocks.funds).not.toHaveBeenCalled();
    expect(mocks.groups).not.toHaveBeenCalled();
    expect(mocks.entries).not.toHaveBeenCalled();
  });

  it("shows totals across matching pages and retains filters with stable pagination", async () => {
    const html = renderToStaticMarkup(await FundSpendingPage({ searchParams: Promise.resolve({ fund: "f1", fy: "2026-27", pool: "ZAKAT", page: "2" }) }));
    const where = { fundId: "f1", financialYear: "2026-27", pool: "ZAKAT" };
    expect(mocks.groups).toHaveBeenCalledWith({ by: ["status"], where, _count: { _all: true }, _sum: { amount: true } });
    expect(mocks.entries).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 50, take: 50, orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }, { id: "desc" }] }));
    expect(html).toContain("Page 2 of 3 · 132 records");
    expect(html).toContain('role="group" aria-label="Filtered spending totals"');
    expect(html).toContain("₹310.4");
    expect(html).toContain("₹7.01");
    expect(html).toContain("Void entries (excluded from spending)");
    expect(html).toContain('href="/admin/funds/spending?fund=f1&amp;fy=2026-27&amp;pool=ZAKAT&amp;page=3"');
    expect(html).not.toContain("Save as draft");
  });

  it("filters void entries without counting them as recorded spending", async () => {
    mocks.groups.mockImplementation(async args => args.by.includes("financialYear") ? [{ financialYear: "2026-27" }] : [
      { status: "VOID", _count: { _all: 1 }, _sum: { amount: money(7.01) } },
    ]);
    const html = renderToStaticMarkup(await FundSpendingPage({ searchParams: Promise.resolve({ status: "VOID" }) }));
    expect(mocks.entries).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "VOID" }, skip: 0, take: 50 }));
    expect(html).toContain("<strong>₹0</strong><p>Recorded spending (draft and published)</p>");
    expect(html).toContain("<strong>₹7.01</strong><p>Void entries (excluded from spending)</p>");
  });
});
