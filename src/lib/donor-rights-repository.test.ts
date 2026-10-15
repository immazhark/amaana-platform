import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(), findMany: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  donorRightsRequest: { findFirst: mocks.findFirst, findMany: mocks.findMany },
} }));
vi.mock("@/lib/donations", () => ({ hashReceiptToken: () => "0".repeat(64) }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: vi.fn(),
}));
import { readDonationRightsStatuses } from "./donor-rights-repository";

describe("donation rights status history completeness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockImplementation(async ({ where }: { where: { kind: string } }) => {
      const kind = where.kind;
      if (kind === "CORRECTION") return null;
      return { kind, status: kind === "ACCESS" ? "IN_REVIEW" : "CLOSED",
        createdAt: new Date(kind === "ACCESS" ? "2026-10-12T12:00:00Z" : "2026-10-10T12:00:00Z") };
    });
  });
  it("reads latest status of each kind even after other categories have many closed records", async () => {
    const result = await readDonationRightsStatuses("scoped-donation-id");
    expect(result).toEqual([
      { kind: "ACCESS", status: "IN_REVIEW", requestedAt: "2026-10-12T12:00:00.000Z" },
      { kind: "DELETION_REVIEW", status: "CLOSED", requestedAt: "2026-10-10T12:00:00.000Z" },
    ]);
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.findFirst).toHaveBeenCalledTimes(3);
    const kinds = mocks.findFirst.mock.calls.map(([args]) => args.where.kind);
    expect(kinds).toEqual(["ACCESS", "CORRECTION", "DELETION_REVIEW"]);
    for (const [args] of mocks.findFirst.mock.calls) {
      expect(args.where.donationId).toBe("scoped-donation-id");
      expect(args.select).toEqual({ kind: true, status: true, createdAt: true });
    }
    expect(JSON.stringify(result)).not.toContain("scoped-donation-id");
  });
});
