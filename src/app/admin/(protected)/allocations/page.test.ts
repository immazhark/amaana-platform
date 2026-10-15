import { Prisma } from "@prisma/client";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), has: vi.fn(), enabled: vi.fn(), list: vi.fn(), count: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission, hasPermission: m.has }));
vi.mock("@/lib/prisma", () => ({ prisma: { donationAllocationProposal: { findMany: m.list, count: m.count } } }));
vi.mock("@/lib/allocation-proposal-operations", () => ({ allocationPlanningEnabled: m.enabled }));
vi.mock("@/components/navigation-link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => createElement("a", { href }, children) }));
vi.mock("./actions", () => ({ reviewAllocationAction: vi.fn(), reverseAllocationAction: vi.fn() }));
import Page from "./page";
const record = (id = "proposal-00001", patch = {}) => ({
  id, donationId: "donation-00001", fundId: "fund-00001", givingIntent: "GENERAL",
  amountPaise: 10000, status: "PENDING", purposeNote: "Programme supplies",
  createdAt: new Date("2026-10-15T09:00:00Z"), createdBy: { id: "maker-00001", name: "Maker" }, reviewedBy: null, reversal: null,
  fund: { name: "Approved fund", accountCode: "GENERAL" },
  donation: { id: "donation-00001", referenceNumber: "PRIVATE-REF", status: "CAPTURED", currency: "INR",
    amount: new Prisma.Decimal(200), refundedAmount: new Prisma.Decimal(0),
    appealId: null, fundId: "fund-00001", givingIntent: "GENERAL", fund: { status: "APPROVED" },
    domesticConfirmedAt: new Date(), fundDisclosureConfirmedAt: new Date(),
    designationSnapshot: { version: 1, kind: "FUND", fundId: "fund-00001", fundRevision: 1,
      label: "Approved fund", purpose: "Approved programme supply purpose.", disclosure: "Original approved donor restrictions.", accountCode: "GENERAL", givingIntent: "GENERAL" } },
  ...patch,
});
const markup = (params = {}) => Page({ searchParams: Promise.resolve(params) }).then(renderToStaticMarkup);
function queue(pending: ReturnType<typeof record>[], conflicts: ReturnType<typeof record>[] = [], history: ReturnType<typeof record>[] = []) {
  m.list.mockImplementation(async input => input.select ? [] : input.where.status === "PENDING" ? pending : input.where.status === "APPROVED" ? conflicts : history);
}
describe("actionable allocation review queues", () => {
  beforeEach(() => { vi.resetAllMocks(); m.permission.mockResolvedValue({ id: "checker-00001" }); m.has.mockReturnValue(true); m.enabled.mockReturnValue(true); m.count.mockResolvedValue(0); queue([record()]); });
  it("offers rejection without approval for an ineligible donation", async () => {
    const value = record(); value.donation.status = "REFUNDED"; value.donation.refundedAmount = new Prisma.Decimal(200);
    queue([value]); const html = await markup();
    expect(html).toContain("Reject proposal"); expect(html).not.toContain("Approve internal allocation");
    expect(html).toContain("cannot be approved");
  });
  it("offers both decisions for eligible independent review", async () => {
    const html = await markup(); expect(html).toContain("Approve internal allocation"); expect(html).toContain("Reject proposal");
  });
  it.each(["maker", "viewer"])("keeps %s from receiving review controls", async role => {
    if (role === "maker") m.permission.mockResolvedValue({ id: "maker-00001" }); else m.has.mockReturnValue(false);
    const html = await markup(); expect(html).not.toContain("Reject proposal"); expect(html).not.toContain("Approve internal allocation");
  });
  it("never queries financial rows without donation viewing permission", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden")); await expect(markup()).rejects.toThrow("Forbidden"); expect(m.list).not.toHaveBeenCalled();
  });
  it("does not query the dormant workflow", async () => {
    m.enabled.mockReturnValue(false); await markup(); expect(m.list).not.toHaveBeenCalled(); expect(m.count).not.toHaveBeenCalled();
  });
  it("uses bounded seek pages, preserves independent cursors and never renders the lookahead row", async () => {
    queue(Array.from({ length: 61 }, (_, i) => record(`proposal-${String(i).padStart(5, "0")}`)));
    const html = await markup({ conflictsAfter: "conflict-0001", historyAfter: "reviewed-0001" });
    expect(html).toContain("pendingAfter=proposal-00059"); expect(html).toContain("conflictsAfter=conflict-0001"); expect(html).toContain("historyAfter=reviewed-0001");
    expect(html).not.toContain('value="proposal-00060"');
    expect(m.list.mock.calls[0]?.[0]).toMatchObject({ take: 61, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    expect(m.list.mock.calls[1]?.[0]).toMatchObject({ take: 41, cursor: { id: "conflict-0001" }, skip: 1 });
    expect(m.list.mock.calls[2]?.[0]).toMatchObject({ take: 41, cursor: { id: "reviewed-0001" }, skip: 1 });
  });
  it("uses the last displayed row as the next cursor in both independent reviewed queues", async () => {
    const rows = Array.from({ length: 41 }, (_, i) => record(`reviewed-${String(i).padStart(5, "0")}`, { status: "APPROVED" }));
    queue([], rows, rows); m.count.mockResolvedValue(81);
    const html = await markup();
    expect(html).toContain("conflictsAfter=reviewed-00039"); expect(html).toContain("historyAfter=reviewed-00039");
    expect(html).toContain("81 unresolved refund/status conflicts");
    expect(html).toContain("Recent reviewed proposals"); expect(html).not.toContain("No reviewed proposals on this page");
  });
  it("drops malformed or multi-valued cursor input and provides a reset for valid pages", async () => {
    const html = await markup({ pendingAfter: "<script>", conflictsAfter: ["conflict-0001"], historyAfter: "reviewed-0001" });
    expect(m.list.mock.calls[0]?.[0]).not.toHaveProperty("cursor"); expect(m.list.mock.calls[1]?.[0]).not.toHaveProperty("cursor");
    expect(html).toContain('href="/admin/allocations#historyAfter"'); expect(html).not.toContain("script&gt;");
  });
});
