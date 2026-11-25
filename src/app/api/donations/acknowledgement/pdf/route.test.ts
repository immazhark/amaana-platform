import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(), rateLimit: vi.fn(), sameOrigin: vi.fn(), readError: undefined as Error | undefined,
}));

vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  return {
    RequestBodyTooLargeError,
    readTextBodyWithLimit: async (request: Request, maxBytes: number) => {
      if (mocks.readError) throw mocks.readError;
      const declared = Number(request.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > maxBytes) throw new RequestBodyTooLargeError();
      return request.text();
    },
  };
});
vi.mock("@/lib/donations", () => ({ hashReceiptToken: (token: string) => (token.startsWith("good-") ? "a" : "b").repeat(64) }));
vi.mock("@/lib/prisma", () => ({ prisma: { donation: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => mocks.sameOrigin(), enforceAcknowledgementRateLimit: mocks.rateLimit }));

import { POST } from "./route";

const GOOD = "good-token-at-least-twenty-chars";
const decimal = (value: number) => ({ toNumber: () => value });
const donation = (over: Record<string, unknown> = {}) => ({
  receiptTokenHash: "a".repeat(64), status: "CAPTURED", amount: decimal(1250), refundedAmount: decimal(0), feeContributionAmount: decimal(0),
  receiptNumber: "AFR-2026-000123", referenceNumber: "AFD-2026-37563771", donorName: "Synthetic Donor", givingIntent: "GENERAL",
  capturedAt: new Date("2026-11-22T02:20:00Z"), createdAt: new Date("2026-11-22T02:19:00Z"),
  appeal: null, fund: { name: "Foundation Operations Fund" }, units: null, unitPrice: null, campaign: null,
  sponsorshipProgramme: null, sponsorshipUnits: null, sponsorshipMonths: null, sponsorshipMonthlyRate: null, ...over,
});
const post = (body: string | null = new URLSearchParams({ reference: "AFD-2026-37563771", token: GOOD }).toString(), headers: HeadersInit = {}) =>
  POST(new Request("https://amaana.example/api/donations/acknowledgement/pdf", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers }, body }));
const pdfText = async (response: Response) => Buffer.from(await response.arrayBuffer()).toString("latin1");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.readError = undefined;
  mocks.sameOrigin.mockReturnValue(true);
  mocks.rateLimit.mockResolvedValue(true);
  mocks.findUnique.mockResolvedValue(donation());
});

describe("acknowledgement PDF download", () => {
  it("returns the PDF as a private attachment for a verified payment", async () => {
    const response = await post();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="amaana-acknowledgement-AFD-2026-37563771.pdf"');
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    const body = await pdfText(response);
    expect(body.startsWith("%PDF-1.4")).toBe(true);
    expect(body).toContain("Reference: AFD-2026-37563771");
    expect(body).toContain("Contribution received: INR 1,250.00");
    expect(body).toContain("Fund: Foundation Operations Fund");
    expect(body).toContain("not Form 10BE");
  });

  it("never puts the private credential in the response, its headers or the filename", async () => {
    const response = await post();
    const everything = [...response.headers.entries()].join("\n") + (await pdfText(response));
    expect(everything).not.toContain(GOOD);
  });

  it("shows only the recorded sponsorship figures, worded as the on-screen receipt words them", async () => {
    mocks.findUnique.mockResolvedValue(donation({ fund: { name: "Taleem Fund" }, sponsorshipProgramme: "nazira", sponsorshipUnits: 2, sponsorshipMonths: 3, sponsorshipMonthlyRate: decimal(1200) }));
    const body = await pdfText(await post());
    expect(body).toContain("Qur'an Nazira: 2 units x 3 months x INR 1,200.00 a month.");
    expect(body).toContain("does not name or reserve a student");
  });

  it("shows a partial refund and the covered fee, and still acknowledges the remaining gift", async () => {
    mocks.findUnique.mockResolvedValue(donation({ refundedAmount: decimal(129.5), feeContributionAmount: decimal(29.5) }));
    const body = await pdfText(await post());
    expect(body).toContain("Refunded to you: INR 100.00");
    expect(body).toContain("Payment processing cost you chose to cover: INR 29.50");
  });

  it("gives no document for a payment that is pending, failed or fully refunded, and says nothing about why", async () => {
    const wrong = await post(new URLSearchParams({ reference: "AFD-2026-37563771", token: "bad-token-at-least-twenty-chars" }).toString());
    for (const status of ["PENDING_VERIFICATION", "FAILED", "CREATED", "REFUNDED"]) {
      mocks.findUnique.mockResolvedValue(donation({ status }));
      const response = await post();
      expect(response.status, status).toBe(404);
      expect(await response.text()).toBe(await wrong.clone().text());
    }
    mocks.findUnique.mockResolvedValue(donation({ refundedAmount: decimal(1250) }));
    expect((await post()).status).toBe(404);
  });

  it("answers an unknown reference and a wrong token identically", async () => {
    const wrongToken = await post(new URLSearchParams({ reference: "AFD-2026-37563771", token: "bad-token-at-least-twenty-chars" }).toString());
    mocks.findUnique.mockResolvedValue(null);
    const unknown = await post();
    expect(wrongToken.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(await unknown.text()).toBe(await wrongToken.text());
  });

  it("stops honouring a link once staff reissue replaces the stored credential, with the same answer as any wrong token", async () => {
    mocks.findUnique.mockResolvedValue(donation({ receiptTokenHash: "c".repeat(64) }));
    const response = await post();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ found: false });
  });

  it("refuses a cross-origin request before reading anything", async () => {
    mocks.sameOrigin.mockReturnValue(false);
    expect((await post()).status).toBe(403);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects malformed credentials before the rate limit or any donor record", async () => {
    const bad = [
      null, "", "reference=AFD-2026-37563771", `token=${GOOD}`,
      `reference=AFD-2026-37563771&reference=AFD-2026-00000000&token=${GOOD}`,
      `reference=AFD-2026-37563771&token=${GOOD}&token=${GOOD}`,
      `reference=short&token=${GOOD}`, `reference=${encodeURIComponent("AFD-2026-37563771/../x")}&token=${GOOD}`,
      "reference=AFD-2026-37563771&token=tooshort", JSON.stringify({ reference: "AFD-2026-37563771", token: GOOD }),
    ];
    for (const body of bad) {
      const response = await post(body);
      expect(response.status, String(body)).toBe(404);
    }
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rate-limits valid-looking lookups before reading any donor record", async () => {
    mocks.rateLimit.mockResolvedValue(false);
    expect((await post()).status).toBe(429);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("refuses an oversized body", async () => {
    expect((await post("x".repeat(10), { "Content-Length": String(1024 * 1024) })).status).toBe(413);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("treats an interrupted body as a retryable outage, not a wrong credential", async () => {
    mocks.readError = new Error("transport closed");
    const response = await post();
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("treats a database outage as retryable and discloses nothing", async () => {
    mocks.findUnique.mockRejectedValue(new Error("connection refused postgres://secret"));
    const response = await post();
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('{"found":false}');
  });
});
