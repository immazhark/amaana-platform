import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), has: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission, hasPermission: m.has }));
vi.mock("@/lib/prisma", () => ({ prisma: { givingFund: { findMany: m.find } } }));
vi.mock("./actions", () => ({ createGivingFund: vi.fn(), updateGivingFund: vi.fn(), transitionGivingFund: vi.fn() }));
import GivingFundsPage from "./page";
const fund = { id: "fund-1", slug: "synthetic-fund", name: "Synthetic private fund", purpose: "A reviewed synthetic purpose.", disclosure: "A reviewed synthetic donor disclosure.", accountCode: "TEST-FUND", currency: "INR", acceptedIntents: ["GENERAL"], status: "UNDER_REVIEW", revision: 3, createdById: "creator", lastEditedById: "editor", createdBy: { name: "Synthetic creator" }, approvedBy: null };
async function markup() { return renderToStaticMarkup(await GivingFundsPage({ searchParams: Promise.resolve({}) })); }
describe("private giving fund admin rendering", () => {
  beforeEach(() => { vi.clearAllMocks(); m.permission.mockResolvedValue({ id: "approver" }); m.has.mockReturnValue(true); m.find.mockResolvedValue([fund]); });
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
    expect(html).not.toContain('<option value="APPROVED">');
    expect(html).toContain("A different approver must review this fund.");
  });
  it("offers independent review with exact revision and linked field labels", async () => {
    const html = await markup();
    expect(html).toContain('<option value="APPROVED">');
    expect(html).toContain('name="revision" value="3"');
    expect(html).toContain('for="fund-1-reason"');
    expect(html).toContain('id="fund-1-reason"');
    expect(html).toContain('for="new-fund-name"');
    expect(html).toContain('id="new-fund-name"');
    expect(html).toContain("Registry approval does not open public checkout or move money.");
  });
});
