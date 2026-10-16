import { AssistanceStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  invalidate: vi.fn(),
  hasPermission: vi.fn(),
  requestFind: vi.fn(),
  requestFindFirst: vi.fn(),
  requestUpdateMany: vi.fn(),
  followUpFindMany: vi.fn(), followUpUpdateMany: vi.fn(),
  userFindFirst: vi.fn(),
  verificationUpsert: vi.fn(),
  verificationUpdateMany: vi.fn(),
  appealUpdateMany: vi.fn(),
  updateTag: vi.fn(),
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
vi.mock("@/lib/assistance-outcome-invalidation", () => ({
  withdrawStaleAnonymousOutcomeCopies: mocks.invalidate,
}));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate, updateTag: mocks.updateTag }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { assignRequest, convertToAppeal, saveVerification, updateRequest, withdrawConvertedAppealDisclosure } from "./actions";

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
    assistanceVerification: { upsert: mocks.verificationUpsert, updateMany: mocks.verificationUpdateMany },
    assistanceFollowUp: { findMany: mocks.followUpFindMany, updateMany: mocks.followUpUpdateMany },
    user: { findFirst: mocks.userFindFirst },
    appeal: { create: mocks.appealCreate, updateMany: mocks.appealUpdateMany },
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
  it.each(["/admin/requests/request-synthetic", "/admin", "/impact"])("keeps an audited assignment committed when refreshing %s fails", async failedPath => {
    mocks.revalidate.mockImplementation(path => { if (path === failedPath) throw new Error("cache service unavailable"); });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
    await expect(assignRequest(assignment())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.transaction).toHaveBeenCalledOnce(); expect(mocks.requestUpdateMany).toHaveBeenCalledOnce();
    expect(mocks.auditCreate).toHaveBeenCalledOnce();
    expect(mocks.revalidate.mock.calls.map(call => call[0])).toEqual(["/admin/requests/request-synthetic", "/admin", "/impact"]);
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/requests/request-synthetic");
    expect(mocks.auditCreate.mock.invocationCallOrder[0]).toBeLessThan(mocks.revalidate.mock.invocationCallOrder[0]!);
  });
  it("keeps the normal action response when all dependent views refresh", async () => {
    await assignRequest(assignment());
    expect(mocks.revalidate).toHaveBeenCalledTimes(3); expect(mocks.redirect).not.toHaveBeenCalled();
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


describe("unambiguous case verification fields", () => {
  const values: Record<string, string> = {
    id: "request-1", expectedRequestUpdatedAt: "2026-10-16T08:00:00.000Z", expectedVerificationUpdatedAt: "",
    needConfirmed: "", evidenceReviewed: "", otherFundingChecked: "", verifiedNeedAmount: "1000", approvedPublicTarget: "",
    paymentDestination: "Verified institution", otherFundingNotes: "", verificationSummary: "Evidence reviewed and need verified.",
    decision: "PENDING", confidentialityLevel: "CONFIDENTIAL", publicNameConsent: "UNCONFIRMED", photoConsent: "UNCONFIRMED",
    medicalDetailsConsent: "UNCONFIRMED", institutionNameConsent: "UNCONFIRMED", archiveConsent: "UNCONFIRMED", zakatStatus: "UNREVIEWED", markComplete: "",
  };
  beforeEach(() => {
    vi.resetAllMocks(); mocks.requirePermission.mockResolvedValue({ id: "reviewer" });
    mocks.hasPermission.mockReturnValue(true);
    mocks.requestFind.mockResolvedValue({ id: "request-1", status: "SUBMITTED", appealId: null, verification: null });
  });
  it.each(Object.keys(values))("rejects repeated verification %s before mutation", async key => {
    const data = form(values); data.append(key, values[key]!);
    await expect(saveVerification(data)).rejects.toThrow("Repeated");
    expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.verificationUpsert).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
  it.each([assignRequest, updateRequest, convertToAppeal])("rejects repeated case identity before reading or mutating records", async action => {
    const data = form({ id: "request-1" }); data.append("id", "another-case");
    await expect(action(data)).rejects.toThrow("Repeated");
    expect(mocks.requestFind).not.toHaveBeenCalled(); expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("post-conversion public disclosure withdrawal", () => {
  const date = new Date("2026-10-17T03:00:00.000Z");
  const original = {
    id: "case-1", status: AssistanceStatus.CONVERTED_TO_APPEAL,
    appealId: "appeal-1", updatedAt: date,
    appeal: { id: "appeal-1", slug: "published-case", status: "PUBLISHED", updatedAt: date },
    verification: {
      id: "verification-1", updatedAt: date,
      decision: "APPROVED_PUBLIC", confidentialityLevel: "STANDARD",
      publicNameConsent: "ALLOWED", photoConsent: "ALLOWED",
      medicalDetailsConsent: "ALLOWED", institutionNameConsent: "ALLOWED",
      archiveConsent: "ALLOWED",
    },
  };
  const input = () => form({
    id: "case-1", expectedRequestUpdatedAt: date.toISOString(),
    expectedVerificationUpdatedAt: date.toISOString(),
    expectedAppealUpdatedAt: date.toISOString(),
    confirmWithdrawal: "on",
    reason: "The family withdrew permission to publish this case.",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.revalidate.mockReset();
    mocks.updateTag.mockReset();
    mocks.invalidate.mockReset();
    mocks.requirePermission.mockResolvedValue({ id: "privacy-reviewer" });
    mocks.hasPermission.mockReturnValue(true);
    mocks.transaction.mockImplementation(async callback => callback(tx()));
    mocks.requestFind.mockResolvedValue(original);
    mocks.verificationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.appealUpdateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
  });

  it("atomically revokes disclosures, pauses active fundraising, audits reason and invalidates public caches", async () => {
    await expect(withdrawConvertedAppealDisclosure(input())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.verificationUpdateMany).toHaveBeenCalledWith({
      where: { id: "verification-1", assistanceRequestId: "case-1", updatedAt: date },
      data: {
        decision: "APPROVED_PRIVATE", confidentialityLevel: "HIGHLY_SENSITIVE",
        publicNameConsent: "NOT_ALLOWED", photoConsent: "NOT_ALLOWED",
        medicalDetailsConsent: "NOT_ALLOWED", institutionNameConsent: "NOT_ALLOWED",
        archiveConsent: "NOT_ALLOWED",
      },
    });
    expect(mocks.appealUpdateMany).toHaveBeenCalledWith({
      where: { id: "appeal-1", status: "PUBLISHED", updatedAt: date },
      data: { status: "PAUSED", isFeatured: false, featuredOrder: null },
    });
    expect(mocks.invalidate).toHaveBeenCalledWith(expect.anything(), "case-1", "privacy-reviewer", "VERIFICATION_CHANGED");
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "assistance.public_disclosure_withdrawn",
        entityId: "case-1",
        metadata: expect.objectContaining({
          reason: "The family withdrew permission to publish this case.",
          previousAppealStatus: "PUBLISHED", nextAppealStatus: "PAUSED",
          previousDecision: "APPROVED_PUBLIC",
        }),
      }),
    });
    expect(mocks.updateTag).toHaveBeenCalledExactlyOnceWith("appeals");
    for (const path of ["/", "/appeals", "/appeals/published-case", "/donate/published-case", "/admin/requests/case-1", "/admin/appeals/appeal-1"]) {
      expect(mocks.revalidate).toHaveBeenCalledWith(path);
    }
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/requests/case-1?privacy=withdrawn");
    expect(mocks.auditCreate.mock.invocationCallOrder[0]).toBeLessThan(mocks.updateTag.mock.invocationCallOrder[0]!);
  });

  it("closes a previously funded linked appeal so archive denial hides the direct public page", async () => {
    mocks.requestFind.mockResolvedValue({ ...original, appeal: { ...original.appeal, status: "FUNDED" } });
    await expect(withdrawConvertedAppealDisclosure(input())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.appealUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "CLOSED" }),
    }));
  });

  it("retains an already closed appeal while denying its public archive", async () => {
    mocks.requestFind.mockResolvedValue({ ...original, appeal: { ...original.appeal, status: "CLOSED" } });
    await expect(withdrawConvertedAppealDisclosure(input())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.appealUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "CLOSED" }),
    }));
  });

  it("rejects unconfirmed or malicious repeated withdrawal values before the database transaction", async () => {
    const missing = input(); missing.delete("confirmWithdrawal");
    await expect(withdrawConvertedAppealDisclosure(missing)).rejects.toThrow(/confirm/i);
    const repeated = input(); repeated.append("reason", "contradictory reason");
    await expect(withdrawConvertedAppealDisclosure(repeated)).rejects.toThrow(/Repeated reason/);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires both private verification approval and appeal approval", async () => {
    mocks.hasPermission.mockReturnValue(false);
    await expect(withdrawConvertedAppealDisclosure(input())).rejects.toThrow(/approval permission/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a changed verification/appeal version before any modification", async () => {
    mocks.requestFind.mockResolvedValue({
      ...original, verification: { ...original.verification, updatedAt: new Date(date.getTime() + 1000) },
    });
    await expect(withdrawConvertedAppealDisclosure(input())).rejects.toThrow(/changed while/i);
    expect(mocks.verificationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.appealUpdateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it("rejects an unlinked assistance case without generating audit or cache calls", async () => {
    mocks.requestFind.mockResolvedValue({ ...original, appealId: null, appeal: null });
    await expect(withdrawConvertedAppealDisclosure(input())).rejects.toThrow(/linked appeal/i);
    expect(mocks.verificationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it("rolls back the emergency withdrawal on a losing appeal CAS update", async () => {
    mocks.appealUpdateMany.mockResolvedValue({ count: 0 });
    await expect(withdrawConvertedAppealDisclosure(input())).rejects.toThrow(/changed while/i);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
    expect(mocks.updateTag).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("attempts every cache refresh and reports delayed public removal if one invalidation fails", async () => {
    mocks.updateTag.mockImplementation(() => { throw new Error("cache offline"); });
    await expect(withdrawConvertedAppealDisclosure(input())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.revalidate).toHaveBeenCalledWith("/appeals/published-case");
    expect(mocks.revalidate).toHaveBeenCalledWith("/donate/published-case");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/requests/case-1?privacy=refresh-delayed");
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1);
  });
});
