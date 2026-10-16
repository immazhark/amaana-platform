import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  permission: vi.fn(), transact: vi.fn(), request: vi.fn(),
  duplicate: vi.fn(), audit: vi.fn(), revalidate: vi.fn(), redirect: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: mock.permission }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mock.transact }));
vi.mock("next/cache", () => ({ revalidatePath: mock.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mock.redirect }));
import { addPrivateMilestone } from "./milestone-actions";

const updatedAt = new Date("2026-10-16T08:00:00Z");
const submissionId = "56d6e16d-781f-464f-bc4c-2178d93cdd01";
const form = () => {
  const data = new FormData();
  for (const [name, value] of Object.entries({
    id: "case-synthetic", kind: "REVIEW_HANDOFF",
    summary: "Waiting for the designated reviewer to check this case.",
    submissionId, expectedUpdatedAt: updatedAt.toISOString(),
  })) data.set(name, value);
  return data;
};
const tx = {
  assistanceRequest: { findUnique: mock.request },
  auditEvent: { findFirst: mock.duplicate, create: mock.audit },
};

beforeEach(() => {
  vi.resetAllMocks();
  mock.permission.mockResolvedValue({ id: "reviewer-synthetic" });
  mock.transact.mockImplementation(async (callback: (value: typeof tx) => Promise<void>) => callback(tx));
  mock.request.mockResolvedValue({ id: "case-synthetic", status: "UNDER_VERIFICATION", appealId: null, updatedAt });
  mock.duplicate.mockResolvedValue(null);
  mock.audit.mockResolvedValue({ id: "audit-synthetic" });
  mock.redirect.mockImplementation(() => { throw new Error("NAVIGATE"); });
});

describe("authorized private case milestone mutation", () => {
  it("writes only an append-only, permission-scoped milestone with a replay token", async () => {
    await expect(addPrivateMilestone(form())).rejects.toThrow("NAVIGATE");
    expect(mock.permission).toHaveBeenCalledWith("assistance.update");
    expect(mock.audit).toHaveBeenCalledWith({ data: {
      actorId: "reviewer-synthetic", action: "assistance.private_milestone_added",
      entityType: "AssistanceRequest", entityId: "case-synthetic",
      metadata: { kind: "REVIEW_HANDOFF", summary: "Waiting for the designated reviewer to check this case.", submissionId },
    } });
    expect(mock.request).toHaveBeenCalledWith({ where: { id: "case-synthetic" },
      select: { id: true, status: true, appealId: true, updatedAt: true } });
    expect(mock.redirect).toHaveBeenCalledWith("/admin/requests/case-synthetic");
  });

  it("does not append a duplicate when a prior submission committed", async () => {
    mock.duplicate.mockResolvedValue({ id: "previous-entry" });
    await expect(addPrivateMilestone(form())).rejects.toThrow("NAVIGATE");
    expect(mock.audit).not.toHaveBeenCalled();
    expect(mock.duplicate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ metadata: { path: ["submissionId"], equals: submissionId } }),
    }));
  });

  it("rejects a changed request version before any append-only write", async () => {
    mock.request.mockResolvedValue({ id: "case-synthetic", status: "UNDER_VERIFICATION",
      appealId: null, updatedAt: new Date("2026-10-16T09:00:00Z") });
    await expect(addPrivateMilestone(form())).rejects.toThrow("case changed during review");
    expect(mock.audit).not.toHaveBeenCalled();
  });

  it.each(["CLOSED", "REJECTED", "CONVERTED_TO_APPEAL"])(
    "refuses new milestones for terminal case state %s", async status => {
      mock.request.mockResolvedValue({ id: "case-synthetic", status, appealId: null, updatedAt });
      await expect(addPrivateMilestone(form())).rejects.toThrow("New case follow-ups are locked");
      expect(mock.audit).not.toHaveBeenCalled();
    },
  );

  it("does not query private case information without update permission", async () => {
    mock.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(addPrivateMilestone(form())).rejects.toThrow("Forbidden");
    expect(mock.transact).not.toHaveBeenCalled();
  });

  it("rejects malformed follow-up types before a transaction", async () => {
    const data = form();
    data.set("kind", "APPROVED_PUBLIC");
    await expect(addPrivateMilestone(data)).rejects.toThrow("approved internal follow-up");
    expect(mock.transact).not.toHaveBeenCalled();
  });
});
