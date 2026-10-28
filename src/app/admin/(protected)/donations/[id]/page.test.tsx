import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  canReconcile: vi.fn(),
  findDonation: vi.fn(),
  evidence: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: mocks.permission,
  hasPermission: mocks.canReconcile,
}));
vi.mock("@/lib/prisma", () => ({ prisma: { donation: { findUnique: mocks.findDonation } } }));
vi.mock("@/lib/storage", () => ({ getDonationEvidenceUrl: mocks.evidence }));
vi.mock("../actions", () => ({ reconcileDonationAction: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("Not found"); } }));

import DonationDetailPage from "./page";

const istNewYear = new Date("2026-12-31T18:35:00.000Z");
const amount = (value: number) => ({ toNumber: () => value });

function donation(overrides: Record<string, unknown> = {}) {
  return {
    id: "synthetic-donation",
    referenceNumber: "SYNTHETIC-IST-001",
    appeal: { title: "Synthetic approved appeal" },
    status: "CAPTURED",
    donorName: "Synthetic donor",
    isAnonymous: true,
    donorEmail: "synthetic@example.invalid",
    donorPhone: null,
    givingIntent: "GENERAL",
    paymentMethod: "BANK_TRANSFER",
    transferReference: "SYNTHETIC-UTR",
    transferredAt: istNewYear,
    transferEvidenceKey: null,
    reconciledBy: null,
    reconciliationNotes: null,
    providerOrderId: null,
    providerPaymentId: null,
    receiptNumber: null,
    amount: amount(2000),
    refundedAmount: amount(0),
    createdAt: istNewYear,
    capturedAt: null,
    failedAt: null,
    refundedAt: null,
    events: [],
    ...overrides,
  };
}

async function renderDonation() {
  const element = await DonationDetailPage({ params: Promise.resolve({ id: "synthetic-donation" }) });
  return renderToStaticMarkup(element);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("TZ", "UTC");
  mocks.permission.mockResolvedValue({ id: "synthetic-viewer" });
  mocks.canReconcile.mockReturnValue(false);
  mocks.findDonation.mockResolvedValue(donation());
});

afterEach(() => { vi.unstubAllEnvs(); });

describe("private donation detail India-local timestamps", () => {
  it("renders transfer and record dates after IST midnight, not the UTC date", async () => {
    const html = await renderDonation();

    expect(mocks.permission).toHaveBeenCalledWith("donation.view");
    expect(html.match(/1\/1\/2027/g)).toHaveLength(2);
    expect(html).not.toContain("31/12/2026");
    expect(html.match(/Not recorded/g)).toHaveLength(3);
    expect(mocks.evidence).not.toHaveBeenCalled();
  });

  it("renders payment event timestamps in IST without changing event order or identifiers", async () => {
    mocks.findDonation.mockResolvedValue(donation({
      paymentMethod: "RAZORPAY",
      providerOrderId: "synthetic-order",
      providerPaymentId: "synthetic-payment",
      events: [
        { id: "event-2", eventType: "payment.captured", providerEventId: "synthetic-event-2", processedAt: istNewYear },
        { id: "event-1", eventType: "payment.authorized", providerEventId: "synthetic-event-1", processedAt: new Date("2026-12-31T17:30:00.000Z") },
      ],
    }));

    const html = await renderDonation();

    expect(html.match(/1\/1\/2027/g)).toHaveLength(2);
    expect(html).toContain("31/12/2026");
    expect(html.indexOf("synthetic-event-2")).toBeLessThan(html.indexOf("synthetic-event-1"));
    expect(html).not.toContain("6:35:00 pm");
    expect(mocks.evidence).not.toHaveBeenCalled();
  });
});
