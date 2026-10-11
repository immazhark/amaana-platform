import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashTrackingToken } from "@/lib/assistance";
import { hashReceiptToken } from "@/lib/donations";

const mocks = vi.hoisted(() => ({ donation: vi.fn(), assistance: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    donation: { findUnique: mocks.donation },
    assistanceRequest: { findUnique: mocks.assistance },
  },
}));

import { POST as acknowledgement } from "./donations/acknowledgement/route";
import { POST as tracking } from "./assistance/status/route";

const origin = "https://amaanafoundation.org";
const token = "synthetic-private-record-token-20261012";
const reference = "AF-PRIVATE-TEST-20261012";
const date = new Date("2026-10-11T00:00:00Z");

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
  vi.stubEnv("DONATION_TOKEN_PEPPER", "synthetic-donation-pepper");
  vi.stubEnv("ASSISTANCE_TOKEN_PEPPER", "synthetic-assistance-pepper");
});
afterEach(() => vi.unstubAllEnvs());

function expectPrivate(response: Response) {
  expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
}

const endpoints = [
  {
    name: "donation acknowledgement",
    path: "/api/donations/acknowledgement",
    post: acknowledgement,
    lookup: mocks.donation,
    hashField: "receiptTokenHash",
    denialStatus: 404,
    record: () => ({
      receiptTokenHash: hashReceiptToken(token),
      status: "CAPTURED", amount: { toNumber: () => 100 },
      refundedAmount: { toNumber: () => 0 },
      receiptNumber: "ACK-PRIVATE-TEST", referenceNumber: reference,
      donorName: "Synthetic Donor", givingIntent: "GENERAL", capturedAt: date,
      refundedAt: null, createdAt: date, providerPaymentId: "pay_synthetic",
      appeal: { title: "Synthetic Appeal", slug: "synthetic-appeal" },
      donorEmail: "private@example.invalid", internalNotes: "private internal note",
    }),
  },
  {
    name: "assistance tracking",
    path: "/api/assistance/status",
    post: tracking,
    lookup: mocks.assistance,
    hashField: "trackingTokenHash",
    denialStatus: 200,
    record: () => ({
      trackingTokenHash: hashTrackingToken(token), status: "UNDER_VERIFICATION",
      createdAt: date, updatedAt: date,
      applicantName: "Synthetic Applicant", internalNotes: "private internal note",
    }),
  },
];

for (const endpoint of endpoints) {
  describe(endpoint.name + " actual privacy boundaries", () => {
    function request(body = JSON.stringify({ reference, token }), requestOrigin: string | null = origin) {
      const headers = new Headers({ "Content-Type": "application/json" });
      if (requestOrigin !== null) headers.set("Origin", requestOrigin);
      return new Request(origin + endpoint.path, { method: "POST", headers, body });
    }

    it("returns only the approved fields for matching credentials", async () => {
      endpoint.lookup.mockResolvedValue(endpoint.record());
      const response = await endpoint.post(request());
      expect(response.status).toBe(200);
      expectPrivate(response);
      const body = await response.json();
      expect(body.found).toBe(true);
      if (endpoint.name === "assistance tracking") {
        expect(body).toEqual({ found: true, status: "UNDER_VERIFICATION", createdAt: date.toISOString(), updatedAt: date.toISOString() });
      } else {
        expect(Object.keys(body).sort()).toEqual(["donation", "found", "presentation"]);
        expect(Object.keys(body.donation).sort()).toEqual([
          "amount", "appeal", "donorName", "givingIntent", "providerPaymentId",
          "receiptNumber", "recordDate", "referenceNumber", "refundedAmount",
        ]);
        expect(body.donation.referenceNumber).toBe(reference);
      }
      expect(endpoint.lookup).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ where: { referenceNumber: reference } }));
      expect(mocks.donation.mock.calls.length + mocks.assistance.mock.calls.length).toBe(1);
    });

    it.each(["https://foreign.example", "null", null])("rejects origin %s before lookup", async requestOrigin => {
      endpoint.lookup.mockResolvedValue(endpoint.record());
      const response = await endpoint.post(request(undefined, requestOrigin));
      expect(response.status).toBe(403);
      expectPrivate(response);
      await expect(response.json()).resolves.toEqual({ found: false });
      expect(endpoint.lookup).not.toHaveBeenCalled();
    });

    it.each(["wrong token", "missing record", "corrupt persisted hash"])("reveals no private fields for %s", async scenario => {
      const record = endpoint.record();
      endpoint.lookup.mockResolvedValue(scenario === "missing record" ? null : {
        ...record,
        ...(scenario === "corrupt persisted hash" ? { [endpoint.hashField]: "short" } : {}),
      });
      const response = await endpoint.post(request(JSON.stringify({
        reference, token: scenario === "wrong token" ? "different-private-token-20261012" : token,
      })));
      expect(response.status).toBe(endpoint.denialStatus);
      expectPrivate(response);
      await expect(response.json()).resolves.toEqual({ found: false });
    });

    it("rejects malformed JSON before lookup", async () => {
      const response = await endpoint.post(request("{"));
      expect(response.status).toBe(endpoint.denialStatus);
      expectPrivate(response);
      await expect(response.json()).resolves.toEqual({ found: false });
      expect(endpoint.lookup).not.toHaveBeenCalled();
    });

    it("enforces actual streamed bytes without a declared content length", async () => {
      const input = request(JSON.stringify({ reference, token, padding: "x".repeat(8192) }));
      expect(input.headers.has("content-length")).toBe(false);
      const response = await endpoint.post(input);
      expect(response.status).toBe(413);
      expectPrivate(response);
      await expect(response.json()).resolves.toEqual({ found: false });
      expect(endpoint.lookup).not.toHaveBeenCalled();
    });
  });
}
