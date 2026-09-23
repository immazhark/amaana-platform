import { AssistanceStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  hasPermission: vi.fn(),
  requestFind: vi.fn(),
  requestFindFirst: vi.fn(),
  requestUpdateMany: vi.fn(),
  userFindFirst: vi.fn(),
  verificationUpsert: vi.fn(),
  appealCreate: vi.fn(),
  auditCreate: vi.fn(),
  notificationCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: mocks.requirePermission,
  hasPermission: mocks.hasPermission,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assistanceRequest: {
      findUniqueOrThrow: mocks.requestFind,
      findFirst: mocks.requestFindFirst,
      updateMany: mocks.requestUpdateMany,
    },
  },
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { assignRequest, convertToAppeal, saveVerification } from "./actions";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function tx() {
  return {
    assistanceRequest: {
      findUniqueOrThrow: mocks.requestFind,
      findFirst: mocks.requestFindFirst,
      updateMany: mocks.requestUpdateMany,
    },
    assistanceVerification: { upsert: mocks.verificationUpsert },
    user: { findFirst: mocks.userFindFirst },
    appeal: { create: mocks.appealCreate },
    auditEvent: { create: mocks.auditCreate },
    notification: { create: mocks.notificationCreate },
  };
}

describe("assistance admin concurrency guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "admin-1" });
    mocks.hasPermission.mockReturnValue(true);
    mocks.transaction.mockImplementation(async callback => callback(tx()));
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    mocks.requestUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects a stale assignment before mutating or auditing", async () => {
    const renderedAt = new Date("2026-09-23T04:00:00.000Z");
    const newerAt = new Date("2026-09-23T04:01:00.000Z");
    mocks.userFindFirst.mockResolvedValue({ id: "staff-2" });
    mocks.requestFind.mockResolvedValue({ assignedToId: "staff-1", updatedAt: newerAt });

    await expect(assignRequest(form({
      id: "request-1",
      assignedToId: "staff-2",
      expectedUpdatedAt: renderedAt.toISOString(),
    }))).rejects.toThrow(/changed while you were reviewing/i);

    expect(mocks.requestUpdateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rejects appeal conversion when verification changed after the screen was rendered", async () => {
    const renderedAt = new Date("2026-09-23T04:00:00.000Z");
    const newerVerificationAt = new Date("2026-09-23T04:01:00.000Z");
    mocks.requestFind.mockResolvedValue({
      id: "request-1",
      status: AssistanceStatus.APPROVED,
      appealId: null,
      updatedAt: renderedAt,
      category: "MEDICAL",
      applicantName: "Private applicant",
      email: null,
      referenceNumber: "AF-REQ-1",
      verification: {
        id: "verification-1",
        updatedAt: newerVerificationAt,
        completedAt: new Date("2026-09-23T03:00:00.000Z"),
        reviewedById: "reviewer-1",
      },
    });

    await expect(convertToAppeal(form({
      id: "request-1",
      expectedUpdatedAt: renderedAt.toISOString(),
      expectedVerificationUpdatedAt: renderedAt.toISOString(),
      title: "Verified medical assistance",
      publicSummary: "A privacy-safe verified public summary.",
      publicStory: "A sufficiently detailed privacy-safe verified public story for this appeal.",
    }))).rejects.toThrow(/Verification changed while you were reviewing/i);

    expect(mocks.requestUpdateMany).not.toHaveBeenCalled();
    expect(mocks.appealCreate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rejects verification save when another reviewer changed the verification version", async () => {
    const requestAt = new Date("2026-09-23T04:00:00.000Z");
    const renderedVerificationAt = new Date("2026-09-23T03:00:00.000Z");
    const newerVerificationAt = new Date("2026-09-23T03:30:00.000Z");
    mocks.requestFind.mockResolvedValue({
      id: "request-1",
      appealId: null,
      status: AssistanceStatus.UNDER_REVIEW,
      verification: { completedAt: null },
    });
    mocks.requestFindFirst.mockResolvedValue({
      id: "request-1",
      updatedAt: requestAt,
      verification: { updatedAt: newerVerificationAt },
    });

    await expect(saveVerification(form({
      id: "request-1",
      expectedRequestUpdatedAt: requestAt.toISOString(),
      expectedVerificationUpdatedAt: renderedVerificationAt.toISOString(),
      verifiedNeedAmount: "1000",
      paymentDestination: "Verified institution",
      verificationSummary: "Evidence reviewed and need verified.",
      decision: "PENDING",
      confidentialityLevel: "CONFIDENTIAL",
      publicNameConsent: "UNCONFIRMED",
      photoConsent: "UNCONFIRMED",
      medicalDetailsConsent: "UNCONFIRMED",
      institutionNameConsent: "UNCONFIRMED",
      archiveConsent: "UNCONFIRMED",
      zakatStatus: "UNREVIEWED",
    }))).rejects.toThrow(/Verification changed while you were reviewing/i);

    expect(mocks.verificationUpsert).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
