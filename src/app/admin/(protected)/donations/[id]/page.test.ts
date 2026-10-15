import { Prisma } from "@prisma/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), find: vi.fn(), evidence: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission, hasPermission: () => false }));
vi.mock("@/lib/prisma", () => ({ prisma: { donation: { findUnique: m.find } } }));
vi.mock("@/lib/storage", () => ({ getDonationEvidenceUrl: m.evidence }));
vi.mock("../actions", () => ({ reconcileDonationAction: vi.fn() }));
import DonationDetailPage from "./page";
const base = {
  id: "synthetic", referenceNumber: "AFD-SYNTHETIC", appealId: "appeal", fundId: null,
  designationSnapshot: null, givingIntent: "GENERAL", appeal: { title: "Synthetic appeal" },
  currency: "INR", status: "PENDING_VERIFICATION", amount: new Prisma.Decimal(100), refundedAmount: new Prisma.Decimal(0),
  donorName: "Synthetic donor", donorEmail: "donor@example.test", paymentMethod: "DIRECT_UPI",
  events: [], createdAt: new Date("2026-10-14"), transferEvidenceKey: null,
};
const markup = async () => renderToStaticMarkup(await DonationDetailPage({ params: Promise.resolve({ id: "synthetic" }) }));
describe("individual donation financial display", () => {
  beforeEach(() => { vi.resetAllMocks(); m.permission.mockResolvedValue({ id: "operator" }); m.find.mockResolvedValue(base); });
  it.each(["CREATED", "AUTHORIZED", "PENDING_VERIFICATION", "FAILED", "REJECTED"])("does not count %s as retained funds", async status => {
    m.find.mockResolvedValue({ ...base, status });
    expect(await markup()).toContain("<dt>Net retained</dt><dd>₹0.00</dd>");
  });
  it("retains partial refund accounting for captured money", async () => {
    m.find.mockResolvedValue({ ...base, status: "CAPTURED", refundedAmount: new Prisma.Decimal(25) });
    expect(await markup()).toContain("<dt>Net retained</dt><dd>₹75.00</dd>");
  });
  it.each([
    { refundedAmount: new Prisma.Decimal(101) },
    { currency: "USD" },
    { amount: new Prisma.Decimal("100.001") },
    { status: "REFUNDED", refundedAmount: new Prisma.Decimal(25) },
  ])("flags inconsistent accounting %o", async patch => {
    m.find.mockResolvedValue({ ...base, status: "CAPTURED", ...patch });
    const html = await markup();
    expect(html).toContain('role="alert"');
    expect(html).toContain("Donation amounts require financial reconciliation.");
    expect(html).toContain("<dt>Net retained</dt><dd>Requires reconciliation</dd>");
  });
  it("checks authorization before record or evidence access", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(markup()).rejects.toThrow("Forbidden");
    expect(m.find).not.toHaveBeenCalled(); expect(m.evidence).not.toHaveBeenCalled();
  });
});
