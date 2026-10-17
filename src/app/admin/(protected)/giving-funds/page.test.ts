import { Prisma } from "@prisma/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), has: vi.fn(), find: vi.fn(), totals: vi.fn(), count: vi.fn(), planning: vi.fn(), plans: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission, hasPermission: m.has }));
vi.mock("@/lib/prisma", () => ({ prisma: { givingFund: { findMany: m.find, count: m.count }, donation: { groupBy: m.totals }, donationAllocationProposal: { groupBy: m.plans } } }));
vi.mock("./actions", () => ({ createGivingFund: vi.fn(), updateGivingFund: vi.fn(), transitionGivingFund: vi.fn() }));
vi.mock("@/lib/allocation-proposal-operations", () => ({ allocationPlanningEnabled: m.planning }));
import GivingFundsPage from "./page";
const fund = { id: "fund-1", slug: "synthetic-fund", name: "Synthetic private fund", purpose: "A reviewed synthetic purpose.", disclosure: "A reviewed synthetic donor disclosure.", accountCode: "TEST-FUND", currency: "INR", acceptedIntents: ["GENERAL"], status: "UNDER_REVIEW", revision: 3, createdById: "creator", lastEditedById: "editor", createdBy: { name: "Synthetic creator" }, approvedBy: null };
async function markup(params = {}) { return renderToStaticMarkup(await GivingFundsPage({ searchParams: Promise.resolve(params) })); }
describe("private giving fund admin rendering", () => {
  beforeEach(() => { vi.clearAllMocks(); m.permission.mockResolvedValue({ id: "approver" }); m.has.mockReturnValue(true); m.find.mockResolvedValue([fund]); m.totals.mockResolvedValue([]); m.count.mockResolvedValue(1); m.planning.mockReturnValue(false); m.plans.mockResolvedValue([]); });
  it("does not query definitions for an unauthorized user", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(markup()).rejects.toThrow("Forbidden");
    expect(m.find).not.toHaveBeenCalled();
  });
  it("keeps view-only access read-only", async () => {
    m.has.mockReturnValue(false);
    const html = await markup();
    expect(html).toContain("Synthetic private fund");
    expect(html).not.toContain('name="reason"');
    expect(html).not.toContain('name="accountCode"');
    expect(html).not.toContain("Create draft");
    expect(m.permission).toHaveBeenCalledWith("fund.view");
  });
  it.each(["creator", "editor"])("does not offer approval to the %s", async id => {
    m.permission.mockResolvedValue({ id });
    const html = await markup();
    expect(html.match(/<select id="fund-1-status"[^>]*>(.*?)<\/select>/)?.[1]).not.toContain('<option value="APPROVED">');
    expect(html).toContain("A different approver must review this fund.");
  });
  it("offers independent review with exact revision and linked field labels", async () => {
    const html = await markup();
    expect(html.match(/<select id="fund-1-status"[^>]*>(.*?)<\/select>/)?.[1]).toContain('<option value="APPROVED">');
    expect(html).toContain('name="revision" value="3"');
    expect(html).toContain('for="fund-1-reason"');
    expect(html).toContain('id="fund-1-reason"');
    expect(html).toContain('for="new-fund-name"');
    expect(html).toContain('id="new-fund-name"');
    expect(html).toContain("Registry approval does not open public checkout or move money.");
  });
  it("does not query donation money without a separate donation viewing permission", async () => {
    m.has.mockImplementation((_user, permission) => permission !== "donation.view");
    const html = await markup();
    expect(html).not.toContain("Gross captured:");
    expect(m.totals).not.toHaveBeenCalled();
  });
  it("shows net amounts only for verified captured or refunded fund records", async () => {
    m.totals.mockResolvedValueOnce([{
      fundId: "fund-1", _count: { _all: 2 },
      _sum: { amount: new Prisma.Decimal(500), refundedAmount: new Prisma.Decimal(125) },
    }]);
    const html = await markup();
    expect(html).toContain("Gross captured:");
    expect(html).toContain("Net retained:");
    expect(m.totals).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: { in: ["CAPTURED", "REFUNDED"] } }),
    }));
  });

  it.each([
    ["90071992547410", "0"],
    ["100.001", "0"],
    ["100", "0.001"],
    ["100", "101"],
  ])("flags invalid aggregate %s / %s without presenting a balance", async (gross, refunded) => {
    m.totals.mockResolvedValueOnce([{
      fundId: "fund-1", _count: { _all: 2 },
      _sum: { amount: new Prisma.Decimal(gross), refundedAmount: new Prisma.Decimal(refunded) },
    }]);
    const html = await markup();
    expect(html).toContain('role="alert"');
    expect(html).toContain("Fund net receipts require financial reconciliation.");
    expect(html).not.toContain("Net retained:");
  });
  it("subtracts exact decimal paise before rendering INR", async () => {
    m.totals.mockResolvedValueOnce([{
      fundId: "fund-1", _count: { _all: 2 },
      _sum: { amount: new Prisma.Decimal("100.30"), refundedAmount: new Prisma.Decimal("100.10") },
    }]);
    expect(await markup()).toContain("Net retained: ₹0.20");
  });
  it("reaches later funds with stable bounded pages instead of stopping at 100", async () => {
    m.count.mockResolvedValue(125); m.find.mockResolvedValue([{ ...fund, id: "fund-101", name: "Later reviewed fund" }]);
    const html = await markup({ page: "3" });
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 100, take: 50, orderBy: [{ status: "asc" }, { updatedAt: "desc" }, { id: "desc" }] }));
    expect(html).toContain("Later reviewed fund"); expect(html).toContain("Page 3 of 3");
    expect(html).toContain('href="/admin/giving-funds?page=2"');
    expect(html).not.toContain("Further records require an expanded registry view");
    expect(m.totals.mock.calls[0]![0].where.fundId).toEqual({ in: ["fund-101"] });
  });
  it("uses the same combined status and search predicate for counts and records", async () => {
    m.count.mockResolvedValue(150); const html = await markup({ status: "PAUSED", q: "  TEST-FUND  ", page: "2" });
    const where = { status: "PAUSED", OR: ["name", "slug", "accountCode"].map(field => ({ [field]: { contains: "TEST-FUND", mode: "insensitive" } })) };
    expect(m.count).toHaveBeenCalledWith({ where });
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 50 }));
    expect(html).toContain('href="/admin/giving-funds?status=PAUSED&amp;q=TEST-FUND&amp;page=3"');
    expect(html).toContain('value="PAUSED" selected=""'); expect(html).toContain('value="TEST-FUND"');
    expect(html).toContain('for="fund-registry-search"'); expect(html).toContain('id="fund-registry-search"');
  });
  it.each([{ status: ["DRAFT", "APPROVED"], q: ["private", "text"] }, { status: "UNKNOWN", q: "x".repeat(81) }])("ignores malformed/repeated filters without reflecting them", async params => {
    const html = await markup(params); expect(m.count).toHaveBeenCalledWith({ where: {} });
    expect(html).not.toContain("UNKNOWN"); expect(html).not.toContain("x".repeat(81));
  });
  it("clamps stale page links after filtering or removal", async () => {
    await markup({ page: "999", status: "CLOSED" });
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "CLOSED" }, skip: 0, take: 50 }));
  });
  it("does not load unrelated financial groups or any financial data for an empty view", async () => {
    m.find.mockResolvedValue([]); m.planning.mockReturnValue(true); const html = await markup({ q: "no-match" });
    expect(html).toContain("No funds match this registry view."); expect(m.totals).not.toHaveBeenCalled(); expect(m.plans).not.toHaveBeenCalled();
  });
  it("reads only displayed registry fields and aggregates complete planning groups for displayed funds", async () => {
    m.planning.mockReturnValue(true); await markup();
    const query = m.find.mock.calls[0]![0]; expect(query.include).toBeUndefined(); expect(query.select.approvedAt).toBeUndefined();
    expect(query.select.revision).toBe(true); expect(query.select.lastEditedById).toBe(true);
    expect(m.plans).toHaveBeenCalledTimes(2);
    for (const [args] of m.plans.mock.calls) { expect(args.where.fundId).toEqual({ in: ["fund-1"] }); expect(args.take).toBeUndefined(); }
  });
  it("preserves refund-conflict suppression on a later filtered fund page", async () => {
    m.count.mockResolvedValue(125); m.planning.mockReturnValue(true);
    m.totals.mockResolvedValue([{ fundId: "fund-1", _count: { _all: 1 }, _sum: { amount: new Prisma.Decimal(100), refundedAmount: new Prisma.Decimal(10) } }]);
    m.plans.mockResolvedValueOnce([{ fundId: "fund-1", _count: { _all: 1 }, _sum: { amountPaise: 1000 } }]).mockResolvedValueOnce([{ fundId: "fund-1", _count: { _all: 1 } }]);
    const html = await markup({ page: "3", status: "APPROVED" });
    expect(html).toContain("Do not infer an available balance."); expect(html).not.toContain("Unplanned portion of retained receipts:");
    expect(html).toContain("not bank cash, paid expenses or beneficiary outcomes");
  });

  it("distinguishes a committed save from delayed cache refresh without a repeat-write prompt", async () => {
    const html = await markup({ saved: "1", refresh: "delayed" });
    expect(html).toContain("Fund registry saved."); expect(html).toContain("View refresh was delayed. Reload before making another change.");
    expect(await markup({ refresh: "delayed" })).not.toContain("View refresh was delayed");
  });

});
