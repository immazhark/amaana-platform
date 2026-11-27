import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requirePermission: vi.fn(), hasPermission: vi.fn(), funds: vi.fn(), groups: vi.fn(), entries: vi.fn(), transaction: vi.fn(), directRead: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.requirePermission, hasPermission: mocks.hasPermission }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction, fund: { findMany: mocks.directRead }, fundDisbursement: { groupBy: mocks.directRead, findMany: mocks.directRead } } }));
vi.mock("../actions", () => {
  const noop = async () => undefined;
  return { publishDisbursementAction: noop, recordDisbursementAction: noop, voidDisbursementAction: noop };
});

import FundSpendingPage from "./page";

const money = (amount: number) => ({ toNumber: () => amount });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("FUND_SPENDING_SOLE_OPERATOR", "false");
  mocks.requirePermission.mockResolvedValue({ id: "synthetic-viewer" });
  mocks.hasPermission.mockReturnValue(false);
  mocks.funds.mockResolvedValue([{ id: "f1", name: "Synthetic fund" }]);
  mocks.groups.mockImplementation(async args => args.by.includes("financialYear") ? [{ financialYear: "2026-27" }] : [
    { status: "DRAFT", _count: { _all: 50 }, _sum: { amount: money(110.25) } },
    { status: "PUBLISHED", _count: { _all: 80 }, _sum: { amount: money(200.15) } },
    { status: "VOID", _count: { _all: 2 }, _sum: { amount: money(7.01) } },
  ]);
  mocks.entries.mockResolvedValue([]);
  mocks.directRead.mockRejectedValue(new Error("Read outside the spending snapshot"));
  mocks.transaction.mockImplementation(async callback => callback({ fund: { findMany: mocks.funds }, fundDisbursement: { groupBy: mocks.groups, findMany: mocks.entries } }));
});

afterEach(() => vi.unstubAllEnvs());

describe("private spending history", () => {
  it("denies access before any fund or spending query", async () => {
    mocks.requirePermission.mockRejectedValue(new Error("denied"));
    await expect(FundSpendingPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("denied");
    expect(mocks.requirePermission).toHaveBeenCalledWith("donation.view");
    expect(mocks.funds).not.toHaveBeenCalled();
    expect(mocks.groups).not.toHaveBeenCalled();
    expect(mocks.entries).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.directRead).not.toHaveBeenCalled();
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

describe("private draft publication review", () => {
  const entry = (overrides: Record<string, unknown> = {}) => ({
    id: "synthetic-entry", pool: "ZAKAT", amount: money(100), spentOn: new Date("2026-11-01T00:00:00.000Z"),
    financialYear: "2026-27", title: "Synthetic food support", status: "DRAFT", voidReason: null,
    publicSummary: "Distributed essential food supplies.", createdById: "synthetic-maker-private-id",
    zakatEligibilityConfirmedAt: new Date("2026-11-01T00:00:00.000Z"), fund: { name: "Synthetic fund" }, ...overrides,
  });
  const render = async () => renderToStaticMarkup(await FundSpendingPage({ searchParams: Promise.resolve({}) }));
  it("shows the actual proposed public summary and reviewer evidence without disclosing the recorder id", async () => {
    mocks.hasPermission.mockReturnValue(true);
    mocks.entries.mockResolvedValue([entry()]);
    const html = await render();
    expect(html).toContain("Draft publication review");
    expect(html).toContain("Distributed essential food supplies.");
    expect(html).toContain("Recorded by another staff member");
    expect(html).toContain("Zakat eligibility confirmation recorded");
    expect(html).toContain("not a new eligibility decision");
    expect(html).not.toContain("synthetic-maker-private-id");
    expect(mocks.entries).toHaveBeenCalledWith(expect.objectContaining({ select: expect.objectContaining({ publicSummary: true, createdById: true, zakatEligibilityConfirmedAt: true }) }));
  });
  it("withholds suspect summary and distinguishes default maker-checker from configured exception", async () => {
    mocks.hasPermission.mockReturnValue(true);
    mocks.entries.mockResolvedValue([entry({ createdById: "synthetic-viewer", publicSummary: "Email private@example.invalid", zakatEligibilityConfirmedAt: null })]);
    const html = await render();
    expect(html).toContain("Another staff member must publish");
    expect(html).toContain("Public summary not ready");
    expect(html).toContain("Zakat eligibility confirmation not recorded");
    expect(html).not.toContain("private@example.invalid");
    expect(html).not.toContain("configured sole-operator exception applies");
    vi.stubEnv("FUND_SPENDING_SOLE_OPERATOR", "true");
    expect(await render()).toContain("configured sole-operator exception applies");
  });
  it("keeps review fields out of the view-only projection and does not render the preview or actions", async () => {
    mocks.entries.mockResolvedValue([entry()]);
    const html = await render();
    expect(mocks.entries).toHaveBeenCalledWith(expect.objectContaining({ select: expect.objectContaining({ publicSummary: false, createdById: false, zakatEligibilityConfirmedAt: false }) }));
    expect(html).not.toContain("Draft publication review");
    expect(html).not.toContain("Distributed essential food supplies.");
    expect(html).not.toContain("synthetic-maker-private-id");
    expect(html).not.toContain(">Publish</button>");
  });
});


it("uses a single repeatable-read snapshot for filters, totals and the bounded records", async () => {
  const before = { id: "synthetic-draft", pool: "NON_ZAKAT", amount: money(100), spentOn: new Date("2026-11-01T00:00:00Z"), financialYear: "2026-27", title: "Synthetic snapshot entry", status: "DRAFT", voidReason: null, fund: { name: "Synthetic fund" } };
  const after = { ...before, status: "VOID", voidReason: "Synthetic concurrent void" };
  let current = before;
  mocks.transaction.mockImplementationOnce(async (callback, options) => {
    expect(options).toEqual({ isolationLevel: "RepeatableRead" });
    const snapshot = current;
    return callback({
      fund: { findMany: mocks.funds },
      fundDisbursement: {
        groupBy: async (args: { by: string[] }) => {
          if (args.by.includes("financialYear")) return [{ financialYear: "2026-27" }];
          current = after;
          return [{ status: snapshot.status, _count: { _all: 1 }, _sum: { amount: snapshot.amount } }];
        },
        findMany: async () => [snapshot],
      },
    });
  });
  const html = renderToStaticMarkup(await FundSpendingPage({ searchParams: Promise.resolve({}) }));
  expect(current.status).toBe("VOID");
  expect(mocks.transaction).toHaveBeenCalledOnce();
  expect(mocks.directRead).not.toHaveBeenCalled();
  expect(html).toContain("<strong>₹100</strong><p>Draft spending</p>");
  expect(html).toContain("<td>DRAFT</td>");
  expect(html).not.toContain("Synthetic concurrent void");
  expect(html).toContain("Page 1 of 1 · 1 records");
});
it("fails closed rather than displaying zero or partial totals when the snapshot fails", async () => {
  mocks.transaction.mockRejectedValueOnce(new Error("Synthetic snapshot unavailable"));
  await expect(FundSpendingPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("Synthetic snapshot unavailable");
  expect(mocks.directRead).not.toHaveBeenCalled();
});
