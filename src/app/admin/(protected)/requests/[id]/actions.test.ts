import { AssistanceStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  hasPermission: vi.fn(),
  requestFind: vi.fn(),
  requestFindFirst: vi.fn(),
  requestUpdateMany: vi.fn(),
  followUpFindMany: vi.fn(), followUpUpdateMany: vi.fn(),
  userFindFirst: vi.fn(),
  verificationUpsert: vi.fn(),
  appealCreate: vi.fn(),
  auditCreate: vi.fn(),
  notificationCreate: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(), redirect: vi.fn(),
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
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { assignRequest, convertToAppeal, saveVerification, updateRequest } from "./actions";

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
    assistanceFollowUp: { findMany: mocks.followUpFindMany, updateMany: mocks.followUpUpdateMany },
    user: { findFirst: mocks.userFindFirst },
    appeal: { create: mocks.appealCreate },
    auditEvent: { create: mocks.auditCreate },
    notification: { create: mocks.notificationCreate },
  };
}

describe("assistance admin concurrency guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.revalidate.mockReset();
    mocks.redirect.mockReset();
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


describe("assistance post-commit refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.revalidate.mockReset(); mocks.redirect.mockReset();
    mocks.requirePermission.mockResolvedValue({ id: "admin-1" });
    mocks.hasPermission.mockReturnValue(true);
    mocks.transaction.mockImplementation(async callback => callback(tx()));
    mocks.requestFind.mockResolvedValue({ assignedToId: "old-staff", updatedAt: new Date("2026-10-15T00:00:00Z") });
    mocks.requestUpdateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({ id: "audit" });
  });
  const assignment = () => form({ id: "request-synthetic", assignedToId: "", expectedUpdatedAt: "2026-10-15T00:00:00.000Z" });
  it.each(["/admin/requests/request-synthetic", "/admin"])("keeps an audited assignment committed when refreshing %s fails", async failedPath => {
    mocks.revalidate.mockImplementation(path => { if (path === failedPath) throw new Error("cache service unavailable"); });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
    await expect(assignRequest(assignment())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.transaction).toHaveBeenCalledOnce(); expect(mocks.requestUpdateMany).toHaveBeenCalledOnce();
    expect(mocks.auditCreate).toHaveBeenCalledOnce();
    expect(mocks.revalidate.mock.calls.map(call => call[0])).toEqual(["/admin/requests/request-synthetic", "/admin"]);
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/requests/request-synthetic");
    expect(mocks.auditCreate.mock.invocationCallOrder[0]).toBeLessThan(mocks.revalidate.mock.invocationCallOrder[0]!);
  });
  it("keeps the normal action response when both views refresh", async () => {
    await assignRequest(assignment());
    expect(mocks.revalidate).toHaveBeenCalledTimes(2); expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("does not refresh or redirect after a transaction failure", async () => {
    mocks.transaction.mockRejectedValueOnce(new Error("transaction failed"));
    await expect(assignRequest(assignment())).rejects.toThrow("transaction failed");
    expect(mocks.revalidate).not.toHaveBeenCalled(); expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("terminal assistance case task lifecycle", () => {
  const time = new Date("2026-10-16T08:00:00.000Z");
  const caseRecord = {
    id: "case-synthetic", status: AssistanceStatus.SUBMITTED,
    appealId: null, email: null, referenceNumber: "AF-SYNTHETIC",
    updatedAt: time, verification: null,
  };
  const close = () => form({
    id: "case-synthetic", expectedUpdatedAt: time.toISOString(),
    status: AssistanceStatus.CLOSED, internalNotes: "",
  });
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "reviewer-synthetic" });
    mocks.hasPermission.mockReturnValue(true);
    mocks.transaction.mockImplementation(async cb => cb(tx()));
    mocks.requestFind.mockResolvedValue(caseRecord);
    mocks.requestUpdateMany.mockResolvedValue({ count: 1 });
    mocks.followUpFindMany.mockResolvedValue([]);
    mocks.followUpUpdateMany.mockResolvedValue({ count: 0 });
    mocks.auditCreate.mockResolvedValue({ id: "audit-synthetic" });
  });
  it("closes a case without a task audit when no open tasks remain", async () => {
    await updateRequest(close());
    expect(mocks.followUpFindMany).toHaveBeenCalledWith({
      where: { assistanceRequestId: "case-synthetic", state: "OPEN" },
      select: { id: true },
    });
    expect(mocks.followUpUpdateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledOnce();
  });
  it("retires open tasks and keeps an auditable count in the same transaction", async () => {
    mocks.followUpFindMany.mockResolvedValue([{ id: "task-1" }, { id: "task-2" }]);
    mocks.followUpUpdateMany.mockResolvedValue({ count: 2 });
    await updateRequest(close());
    expect(mocks.followUpUpdateMany).toHaveBeenCalledWith({
      where: { assistanceRequestId: "case-synthetic", state: "OPEN" },
      data: { state: "CANCELLED", resolvedAt: expect.any(Date),
        resolvedById: "reviewer-synthetic" },
    });
    expect(mocks.auditCreate).toHaveBeenCalledWith({ data: {
      actorId: "reviewer-synthetic", action: "assistance.follow_up_tasks_closed_with_case",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: { reason: "CASE_CLOSED", count: 2 },
    } });
    expect(mocks.auditCreate).toHaveBeenCalledTimes(2);
  });
  it("rejects a concurrent cleanup mismatch before notification or refresh", async () => {
    mocks.followUpFindMany.mockResolvedValue([{ id: "task-1" }, { id: "task-2" }]);
    mocks.followUpUpdateMany.mockResolvedValue({ count: 1 });
    await expect(updateRequest(close())).rejects.toThrow("Follow-up tasks changed");
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
