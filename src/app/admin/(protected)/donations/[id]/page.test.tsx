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


it("announces the evidence tab while preserving the generated private URL", async () => {
  mocks.findDonation.mockResolvedValue(donation({ transferEvidenceKey: "synthetic-evidence-key" }));
  mocks.evidence.mockResolvedValue("https://example.invalid/synthetic-evidence");
  const html = await renderDonation();
  const anchor = html.match(/<a\b[^>]*href="https:\/\/example\.invalid\/synthetic-evidence"[^>]*>[\s\S]*?<\/a>/)?.[0];
  expect(anchor).toContain('target="_blank"');
  expect(anchor).toContain('rel="noreferrer"');
  expect(anchor).toContain('Open private evidence<span class="sr-only"> (opens in a new tab)</span>');
  expect(mocks.evidence).toHaveBeenCalledWith("synthetic-evidence-key", "synthetic-donation");
  expect(mocks.permission).toHaveBeenCalledWith("donation.view");
});


describe("AF-R012 private donation-detail server authorization and reconciliation boundaries", () => {
  it("rejects a viewer without donation.view before querying a private record", async () => {
    mocks.permission.mockRejectedValueOnce(new Error("Permission denied: donation.view"));
    await expect(renderDonation()).rejects.toThrow("Permission denied: donation.view");
    expect(mocks.permission).toHaveBeenCalledWith("donation.view");
    expect(mocks.findDonation).not.toHaveBeenCalled();
    expect(mocks.canReconcile).not.toHaveBeenCalled();
    expect(mocks.evidence).not.toHaveBeenCalled();
  });

  it("does not generate a private evidence URL for an unavailable donation", async () => {
    mocks.findDonation.mockResolvedValueOnce(null);
    await expect(renderDonation()).rejects.toThrow("Not found");
    expect(mocks.permission).toHaveBeenCalledWith("donation.view");
    expect(mocks.findDonation).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "synthetic-donation" },
    }));
    expect(mocks.canReconcile).not.toHaveBeenCalled();
    expect(mocks.evidence).not.toHaveBeenCalled();
  });

  it("keeps a view-only operator from verifying a pending direct UPI claim", async () => {
    mocks.findDonation.mockResolvedValueOnce(donation({
      status: "PENDING_VERIFICATION",
      paymentMethod: "DIRECT_UPI",
    }));
    const html = await renderDonation();
    expect(html).toContain("Your account can view this record but cannot reconcile donations.");
    expect(html).not.toContain("Verify received transfer");
    expect(html).not.toContain("Reject claim");
    expect(mocks.canReconcile).toHaveBeenCalledWith({ id: "synthetic-viewer" }, "donation.reconcile");
  });

  it("renders the existing reconciliation form only for permitted pending direct claims", async () => {
    mocks.canReconcile.mockReturnValueOnce(true);
    mocks.findDonation.mockResolvedValueOnce(donation({
      status: "PENDING_VERIFICATION",
      paymentMethod: "BANK_TRANSFER",
    }));
    const html = await renderDonation();
    expect(html).toContain("Verify received transfer");
    expect(html).toContain("Reject claim");
    expect(html).toContain('name="donationId"');
    expect(html).toContain("Verify against Amaana");
    expect(mocks.evidence).not.toHaveBeenCalled();
  });

  it("does not expose a second reconciliation action for a captured direct transfer", async () => {
    mocks.canReconcile.mockReturnValueOnce(true);
    mocks.findDonation.mockResolvedValueOnce(donation({
      status: "CAPTURED",
      paymentMethod: "DIRECT_UPI",
    }));
    const html = await renderDonation();
    expect(html).toContain("Payment events");
    expect(html).not.toContain("Verify received transfer");
    expect(html).not.toContain("Reject claim");
    expect(html).not.toContain('name="donationId"');
  });

  it("never offers direct-transfer reconciliation controls to a Razorpay record", async () => {
    mocks.canReconcile.mockReturnValueOnce(true);
    mocks.findDonation.mockResolvedValueOnce(donation({
      status: "PENDING_VERIFICATION",
      paymentMethod: "RAZORPAY",
    }));
    const html = await renderDonation();
    expect(html).toContain("Payment events");
    expect(html).not.toContain("Verify received transfer");
    expect(html).not.toContain("Reject claim");
    expect(mocks.evidence).not.toHaveBeenCalled();
  });

  it("fails closed when private evidence has no approved signed URL", async () => {
    mocks.findDonation.mockResolvedValueOnce(donation({
      transferEvidenceKey: "synthetic-private-evidence",
    }));
    mocks.evidence.mockResolvedValueOnce(null);
    const html = await renderDonation();
    expect(html).toContain("Not supplied");
    expect(html).not.toContain("Open private evidence");
    expect(html).not.toContain("synthetic-private-evidence");
    expect(mocks.evidence).toHaveBeenCalledWith("synthetic-private-evidence", "synthetic-donation");
  });

  it("does not render an unsigned evidence fallback when URL signing fails", async () => {
    mocks.findDonation.mockResolvedValueOnce(donation({
      transferEvidenceKey: "synthetic-private-evidence",
    }));
    mocks.evidence.mockRejectedValueOnce(new Error("Private evidence unavailable"));
    await expect(renderDonation()).rejects.toThrow("Private evidence unavailable");
    expect(mocks.permission).toHaveBeenCalledWith("donation.view");
    expect(mocks.evidence).toHaveBeenCalledWith("synthetic-private-evidence", "synthetic-donation");
  });
});

describe("donation detail minimum linked-record projections", () => {
  it("fetches only the displayed appeal title", async () => {
    const html = await renderDonation();
    expect(mocks.findDonation).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      include: expect.objectContaining({ appeal: { select: { title: true } } }),
    }));
    expect(html).toContain("Synthetic approved appeal");
    expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("donation.view");
  });

  it("fetches only displayed event fields while preserving stable newest-first order", async () => {
    mocks.findDonation.mockResolvedValueOnce(donation({
      paymentMethod: "RAZORPAY",
      events: [
        { id: "event-2", eventType: "payment.captured", providerEventId: "synthetic-event-2", processedAt: istNewYear },
        { id: "event-1", eventType: "payment.authorized", providerEventId: "synthetic-event-1", processedAt: new Date("2026-12-31T17:30:00.000Z") },
      ],
    }));
    const html = await renderDonation();
    expect(mocks.findDonation).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      include: expect.objectContaining({
        events: {
          select: { id: true, eventType: true, providerEventId: true, processedAt: true },
          orderBy: [{ processedAt: "desc" }, { id: "desc" }],
        },
        reconciledBy: { select: { name: true } },
      }),
    }));
    expect(html).toContain("payment.captured");
    expect(html).toContain("payment.authorized");
    expect(html.indexOf("synthetic-event-2")).toBeLessThan(html.indexOf("synthetic-event-1"));
    expect(mocks.evidence).not.toHaveBeenCalled();
  });
});

it("selects only displayed private Donation detail fields and bounded linked records", async () => {
  const html = await renderDonation();
  expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("donation.view");
  expect(mocks.findDonation).toHaveBeenCalledExactlyOnceWith({
    where: { id: "synthetic-donation" },
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      donorName: true,
      isAnonymous: true,
      donorEmail: true,
      donorPhone: true,
      givingIntent: true,
      paymentMethod: true,
      transferReference: true,
      transferredAt: true,
      transferEvidenceKey: true,
      reconciliationNotes: true,
      providerOrderId: true,
      providerPaymentId: true,
      receiptNumber: true,
      amount: true,
      refundedAmount: true,
      createdAt: true,
      capturedAt: true,
      failedAt: true,
      refundedAt: true,
      appeal: { select: { title: true } },
      events: {
        select: { id: true, eventType: true, providerEventId: true, processedAt: true },
        orderBy: [{ processedAt: "desc" }, { id: "desc" }],
      },
      reconciledBy: { select: { name: true } },
    },
  });
  expect(html).toContain("Synthetic donor");
  expect(html).toContain("Synthetic approved appeal");
  expect(html).toContain("SYNTHETIC-IST-001");
});
