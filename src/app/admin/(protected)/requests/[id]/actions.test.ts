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

import { assignRequest, convertToAppeal, saveVerification, saveVerificationWithFeedback, updateRequestWithFeedback } from "./actions";

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

  it("rejects a retained unavailable assignee before any request mutation or audit", async () => {
    mocks.userFindFirst.mockResolvedValue(null);
    await expect(assignRequest(form({
      id: "synthetic-request", assignedToId: "synthetic-inactive",
      expectedUpdatedAt: "2026-10-27T00:00:00.000Z",
    }))).rejects.toThrow("The selected staff member cannot access assistance requests");
    expect(mocks.userFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "synthetic-inactive", status: "ACTIVE" }),
    }));
    expect(mocks.requestFind).not.toHaveBeenCalled();
    expect(mocks.requestUpdateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
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
      status: AssistanceStatus.UNDER_VERIFICATION,
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

describe("private follow-up note before requesting missing information", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "synthetic-reviewer" });
    mocks.hasPermission.mockReturnValue(true);
    mocks.transaction.mockImplementation(async callback => callback(tx()));
    mocks.requestUpdateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({ id: "synthetic-audit" });
  });

  it("rejects an empty or vague follow-up note without changing the request or queuing notice", async () => {
    mocks.requestFind.mockResolvedValue({
      id: "synthetic-request", status: AssistanceStatus.SUBMITTED,
      appealId: null, email: "synthetic@example.test", referenceNumber: "AF-SYNTH-04",
      updatedAt: new Date("2026-11-23T08:00:00.000Z"), verification: null,
    });
    for (const notes of ["", "Need info"]) {
      const result = await updateRequestWithFeedback({ kind: "idle", message: "" }, form({
        id: "synthetic-request", expectedUpdatedAt: "2026-11-23T08:00:00.000Z",
        status: "DOCUMENTS_REQUESTED", internalNotes: notes,
      }));
      expect(result.kind).toBe("error");
      expect(result.message).toMatch(/specific missing items/i);
    }
    expect(mocks.requestUpdateMany).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("keeps a specific private note while the request is still awaiting information", async () => {
    mocks.requestFind.mockResolvedValue({
      id: "synthetic-request", status: AssistanceStatus.DOCUMENTS_REQUESTED, appealId: null,
      email: null, referenceNumber: "AF-SYNTH-04", internalNotes: "Supply the missing private verification evidence.",
      updatedAt: new Date("2026-11-23T08:00:00.000Z"), verification: null,
    });
    for (const notes of ["", "Need info"]) {
      const result = await updateRequestWithFeedback({ kind: "idle", message: "" }, form({
        id: "synthetic-request", expectedUpdatedAt: "2026-11-23T08:00:00.000Z",
        status: "DOCUMENTS_REQUESTED", internalNotes: notes,
      }));
      expect(result.kind).toBe("error");
      expect(result.message).toMatch(/specific missing items/i);
    }
    expect(mocks.requestUpdateMany).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("allows a revised specific note while the request continues awaiting information", async () => {
    mocks.requestFind.mockResolvedValue({
      id: "synthetic-request", status: AssistanceStatus.DOCUMENTS_REQUESTED, appealId: null,
      email: null, referenceNumber: "AF-SYNTH-04",
      updatedAt: new Date("2026-11-23T08:00:00.000Z"), verification: null,
    });
    const specific = "Please provide the updated private medical quotation.";
    const result = await updateRequestWithFeedback({ kind: "idle", message: "" }, form({
      id: "synthetic-request", expectedUpdatedAt: "2026-11-23T08:00:00.000Z",
      status: "DOCUMENTS_REQUESTED", internalNotes: specific,
    }));
    expect(result).toEqual({ kind: "success", message: "Request changes saved." });
    expect(mocks.requestUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: "DOCUMENTS_REQUESTED", internalNotes: specific },
    }));
  });

  it("queues a generic status only; the staff follow-up question stays private", async () => {
    mocks.requestFind.mockResolvedValue({
      id: "synthetic-request", status: AssistanceStatus.SUBMITTED, appealId: null,
      email: "synthetic@example.test", referenceNumber: "AF-SYNTH-04",
      updatedAt: new Date("2026-11-23T08:00:00.000Z"), verification: null,
    });
    const result = await updateRequestWithFeedback({ kind: "idle", message: "" }, form({
      id: "synthetic-request", expectedUpdatedAt: "2026-11-23T08:00:00.000Z",
      status: "DOCUMENTS_REQUESTED", internalNotes: "Verify the updated hospital cost estimate privately.",
    }));
    expect(result).toEqual({ kind: "success", message: "Request changes saved." });
    expect(mocks.requestUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: "DOCUMENTS_REQUESTED", internalNotes: "Verify the updated hospital cost estimate privately." },
    }));
    const notification = mocks.notificationCreate.mock.calls[0]?.[0];
    expect(notification?.data.payload).toEqual({ referenceNumber: "AF-SYNTH-04", status: "DOCUMENTS_REQUESTED" });
    expect(JSON.stringify(notification)).not.toContain("hospital");
  });
});

describe("reviewer-facing validation feedback (AF-ADMIN-500)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "synthetic-reviewer" });
    mocks.hasPermission.mockReturnValue(true);
    mocks.transaction.mockImplementation(async callback => callback(tx()));
  });

  it("returns a field-level verification error instead of crashing when the summary is missing", async () => {
    const renderedAt = new Date("2026-11-07T08:00:00.000Z");
    mocks.requestFind.mockResolvedValue({
      id: "synthetic-request", appealId: null, status: AssistanceStatus.UNDER_VERIFICATION,
      verification: null,
    });
    const result = await saveVerificationWithFeedback({ kind: "idle", message: "" }, form({
      id: "synthetic-request",
      expectedRequestUpdatedAt: renderedAt.toISOString(),
      expectedVerificationUpdatedAt: "",
      verifiedNeedAmount: "500000",
      approvedPublicTarget: "500000",
      paymentDestination: "Verified domestic settlement",
      decision: "APPROVED_PUBLIC",
      confidentialityLevel: "CONFIDENTIAL",
      publicNameConsent: "ALLOWED",
      photoConsent: "ALLOWED",
      medicalDetailsConsent: "NOT_ALLOWED",
      institutionNameConsent: "NOT_ALLOWED",
      archiveConsent: "ALLOWED",
      zakatStatus: "NOT_APPLICABLE",
      markComplete: "on",
      needConfirmed: "on",
      evidenceReviewed: "on",
      otherFundingChecked: "on",
      verificationSummary: "",
    }));
    expect(result).toEqual({ kind: "error", message: "Verification summary is required." });
    expect(mocks.verificationUpsert).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("returns the request-approval prerequisite without crashing or changing status", async () => {
    mocks.requestFind.mockResolvedValue({
      id: "synthetic-request", status: AssistanceStatus.UNDER_VERIFICATION,
      appealId: null, email: null, referenceNumber: "AF-SYNTH-01",
      updatedAt: new Date("2026-11-07T08:00:00.000Z"),
      verification: { decision: "PENDING", completedAt: null },
    });
    const result = await updateRequestWithFeedback({ kind: "idle", message: "" }, form({
      id: "synthetic-request", expectedUpdatedAt: "2026-11-07T08:00:00.000Z",
      status: "APPROVED", internalNotes: "",
    }));
    expect(result).toEqual({ kind: "error", message: "Complete verification with an approved decision before marking this request approved" });
    expect(mocks.requestUpdateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rethrows database faults instead of misreporting them as input validation", async () => {
    mocks.requirePermission.mockRejectedValueOnce(new Error("Synthetic authentication backend unavailable"));
    await expect(saveVerificationWithFeedback({ kind: "idle", message: "" }, form({ id: "synthetic-request" })))
      .rejects.toThrow("Synthetic authentication backend unavailable");
  });

  it("rejects a user without update permission rather than returning a successful response", async () => {
    mocks.requirePermission.mockRejectedValueOnce(new Error("Not authorized"));
    await expect(updateRequestWithFeedback({ kind: "idle", message: "" }, form({ id: "synthetic-request" })))
      .rejects.toThrow("Not authorized");
  });
});
