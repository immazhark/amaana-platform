import { Prisma } from "@prisma/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), aggregate: vi.fn(), count: vi.fn(), group: vi.fn(), find: vi.fn(), events: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  donation: { count: m.count, aggregate: m.aggregate, groupBy: m.group, findMany: m.find },
  paymentEvent: { count: m.count, findMany: m.events },
} }));
import DonationsPage from "./page";
const markup = async () => renderToStaticMarkup(await DonationsPage({ searchParams: Promise.resolve({}) }));
describe("private donation dashboard accounting", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.permission.mockResolvedValue({ id: "operator" });
    m.count.mockResolvedValue(0); m.group.mockResolvedValue([]);
    m.find.mockResolvedValue([]); m.events.mockResolvedValue([]);
    m.aggregate.mockResolvedValue({ _sum: { amount: null, refundedAmount: null }, _count: { _all: 0 } });
  });
  it("checks authorization before financial reads", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(markup()).rejects.toThrow("Forbidden");
    expect(m.aggregate).not.toHaveBeenCalled();
  });
  it("renders an empty ledger without an accounting alarm", async () => {
    const html = await markup();
    expect(html).toContain("Net retained:");
    expect(html).not.toContain("Donation totals require financial reconciliation.");
  });
  it.each([["100", "101"], ["100.001", "0"], ["90071992547410", "0"]])(
    "flags inconsistent aggregate %s / %s", async (gross, refunded) => {
      m.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(gross), refundedAmount: new Prisma.Decimal(refunded) }, _count: { _all: 2 } });
      const html = await markup();
      expect(html).toContain('role="alert"');
      expect(html).toContain("Donation totals require financial reconciliation.");
      expect(html).not.toContain("Net retained:");
    },
  );
  it("requires both monetary sums for a nonempty ledger", async () => {
    m.aggregate.mockResolvedValue({ _sum: { amount: null, refundedAmount: null }, _count: { _all: 2 } });
    expect(await markup()).toContain("Donation totals require financial reconciliation.");
  });
});
