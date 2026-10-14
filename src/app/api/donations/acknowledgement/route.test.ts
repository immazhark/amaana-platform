import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  return {
    RequestBodyTooLargeError,
    readTextBodyWithLimit: async (request: Request, maxBytes: number) => {
      const declared = Number(request.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > maxBytes) throw new RequestBodyTooLargeError();
      return request.text();
    },
  };
});

vi.mock("@/lib/donations", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/donations")>(),
  hashReceiptToken: () => "0".repeat(64),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    donation: {
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("@/lib/request-security", () => ({
  isSameOrigin: () => true,
}));

import { POST } from "./route";

function acknowledgementRequest(headers?: HeadersInit) {
  return new Request("https://amaana.example/api/donations/acknowledgement", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      reference: "AFD-STAGING-REFUNDED",
      token: "receipt-token-at-least-twenty-characters",
    }),
  });
}

describe("private donation acknowledgement request bounds", () => {
  beforeEach(() => mocks.findUnique.mockReset());
  it("rejects an oversized acknowledgement payload before donation lookup", async () => {
    const response = await POST(acknowledgementRequest({ "Content-Length": String(8 * 1024 + 1) }));
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toEqual({ found: false });
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  const original = {
    receiptTokenHash: "0".repeat(64),
    appealId: "appeal-1",
    designationSnapshot: {
      version: 1, kind: "APPEAL", appealId: "appeal-1",
      label: "Original donor designation", givingIntent: "GENERAL",
    },
    status: "CAPTURED",
    amount: { toNumber: () => 500 },
    refundedAmount: { toNumber: () => 0 },
    receiptNumber: "ACK-STAGING",
    referenceNumber: "AFD-STAGING-REFUNDED",
    donorName: "Synthetic donor",
    givingIntent: "GENERAL",
    capturedAt: new Date("2026-10-12T12:00:00.000Z"),
    refundedAt: null,
    createdAt: new Date("2026-10-11T12:00:00.000Z"),
    providerPaymentId: "pay_synthetic",
    appeal: {
      title: "Rewritten public campaign name",
      slug: "synthetic-campaign",
      assistanceRequest: null,
    },
  };

  it("returns the original donor designation rather than a later edited campaign title", async () => {
    mocks.findUnique.mockResolvedValue(original);
    const response = await POST(acknowledgementRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.found).toBe(true);
    expect(body.donation.appeal).toEqual({ title: "Original donor designation", slug: "synthetic-campaign" });
    expect(JSON.stringify(body)).not.toContain("Rewritten public campaign name");
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/);
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({
        designationSnapshot: true, appealId: true,
      }),
    }));
  });

  it("retains legacy title lookup when a historical donation has no snapshot", async () => {
    mocks.findUnique.mockResolvedValue({ ...original, designationSnapshot: null });
    const response = await POST(acknowledgementRequest());
    expect((await response.json()).donation.appeal.title).toBe("Rewritten public campaign name");
  });

  it("does not silently replace invalid snapshot history with a new campaign purpose", async () => {
    mocks.findUnique.mockResolvedValue({
      ...original,
      designationSnapshot: { ...original.designationSnapshot, appealId: "another-appeal" },
    });
    const response = await POST(acknowledgementRequest());
    expect((await response.json()).donation.appeal.title).toBe("Donation designation requires review");
  });

  it("redacts historical title and destination slug when the case becomes highly sensitive", async () => {
    mocks.findUnique.mockResolvedValue({
      ...original,
      designationSnapshot: { ...original.designationSnapshot, label: "Highly personal original title" },
      appeal: {
        title: "Current private title", slug: "private-person-full-name",
        assistanceRequest: { verification: { confidentialityLevel: "HIGHLY_SENSITIVE" } },
      },
    });
    const response = await POST(acknowledgementRequest());
    const body = await response.json();
    expect(body.found).toBe(true);
    expect(body.donation.appeal).toEqual({ title: "Confidential assistance appeal", slug: null });
    expect(JSON.stringify(body)).not.toMatch(/Highly personal original title|private-person-full-name|Current private title/);
  });

  it("returns the original approved giving fund purpose without a fake appeal link", async () => {
    const snapshot = {
      version: 1, kind: "FUND", fundId: "approved-fund", fundRevision: 4,
      label: "Original approved programme",
      purpose: "Independently approved programme purpose for testing.",
      disclosure: "Donor-facing restrictions independently approved for this giving fund.",
      accountCode: "FUND-TEST", givingIntent: "GENERAL",
    };
    mocks.findUnique.mockResolvedValue({
      ...original, appealId: null, fundId: "approved-fund", appeal: null,
      fund: { name: "Renamed current programme" },
      designationSnapshot: snapshot,
    });
    const response = await POST(acknowledgementRequest());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.donation.designationKind).toBe("FUND");
    expect(body.donation.appeal).toEqual({ title: "Original approved programme", slug: null });
    expect(JSON.stringify(body)).not.toContain("Renamed current programme");
  });

  it("does not re-label a malformed fund snapshot as an approved purpose", async () => {
    mocks.findUnique.mockResolvedValue({
      ...original, appealId: null, fundId: "approved-fund", appeal: null,
      fund: { name: "Renamed fund" }, designationSnapshot: null,
    });
    const response = await POST(acknowledgementRequest());
    expect(response.status).toBe(200);
    expect((await response.json()).donation.appeal.title).toBe("Fund designation requires review");
  });

});
