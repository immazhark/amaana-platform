import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(), has: vi.fn(), transaction: vi.fn(), request: vi.fn(),
  taskFind: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), staffFind: vi.fn(),
  audit: vi.fn(), revalidate: vi.fn(), redirect: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: m.auth, hasPermission: m.has }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: m.transaction,
}));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
import {
  assignAssistanceFollowUp, createAssistanceFollowUp, resolveAssistanceFollowUp,
  rescheduleAssistanceFollowUp,
} from "./follow-up-actions";
import { indiaCalendarDay, shiftedCalendarDay } from "@/lib/assistance-follow-up";

const version = new Date("2026-10-16T07:00:00.000Z");
const submissionId = "e6d9ae63-a62b-4bca-b77b-e9574482db6a";
const tomorrow = () => shiftedCalendarDay(indiaCalendarDay(new Date()), 1);
const form = (values: Record<string, string>) => {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
};
const creation = () => form({
  id: "case-synthetic", submissionId, assignedToId: "reviewer-1",
  summary: "Contact the case referral institution for an update.",
  dueOn: tomorrow(), expectedUpdatedAt: version.toISOString(),
});
const resolution = (state = "COMPLETED") => form({
  id: "case-synthetic", taskId: "task-synthetic",
  state, expectedTaskUpdatedAt: version.toISOString(),
});
const task = () => ({
  id: "task-synthetic", assistanceRequestId: "case-synthetic",
  assignedToId: "reviewer-1", state: "OPEN", dueOn: new Date(tomorrow() + "T00:00:00.000Z"),
  updatedAt: version,
});
const tx = {
  assistanceRequest: { findUnique: m.request }, user: { findFirst: m.staffFind },
  assistanceFollowUp: {
    findUnique: m.taskFind, count: m.count,
    create: m.create, updateMany: m.update,
  },
  auditEvent: { create: m.audit },
};
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ id: "reviewer-1" });
  m.has.mockReturnValue(true);
  m.transaction.mockImplementation(async (operation: (value: typeof tx) => Promise<unknown>) =>
    operation(tx));
  m.request.mockResolvedValue({
    id: "case-synthetic", status: "UNDER_VERIFICATION",
    appealId: null, updatedAt: version,
  });
  m.taskFind.mockResolvedValue(null);
  m.staffFind.mockResolvedValue({ id: "reviewer-1" });
  m.count.mockResolvedValue(0);
  m.create.mockResolvedValue({ id: "task-synthetic" });
  m.update.mockResolvedValue({ count: 1 });
  m.audit.mockResolvedValue({ id: "audit-1" });
  m.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
});

describe("staff-selected assistance follow-up actions", () => {
  it("records a bounded open task, never a public update or applicant notification", async () => {
    await expect(createAssistanceFollowUp(creation())).rejects.toThrow("NEXT_REDIRECT");
    expect(m.auth).toHaveBeenCalledWith("assistance.update");
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        assistanceRequestId: "case-synthetic", submissionId, createdById: "reviewer-1", assignedToId: "reviewer-1",
      }),
    }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: "assistance.follow_up_task_created",
        entityType: "AssistanceRequest", entityId: "case-synthetic",
      }),
    }));
    expect(m.revalidate).toHaveBeenCalledWith("/admin");
  });

  it("does not duplicate a prior matching submission", async () => {
    m.taskFind.mockResolvedValue({
      assistanceRequestId: "case-synthetic", assignedToId: "reviewer-1",
      summary: "Contact the case referral institution for an update.",
      dueOn: new Date(tomorrow() + "T00:00:00.000Z"),
    });
    await expect(createAssistanceFollowUp(creation())).rejects.toThrow("NEXT_REDIRECT");
    expect(m.create).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it("rejects changed replay payloads and stale case versions", async () => {
    m.taskFind.mockResolvedValueOnce({
      assistanceRequestId: "another-case", assignedToId: "reviewer-1", summary: "Unrelated task",
      dueOn: new Date(tomorrow() + "T00:00:00.000Z"),
    });
    await expect(createAssistanceFollowUp(creation())).rejects.toThrow("token was already used");
    m.taskFind.mockResolvedValue(null);
    m.request.mockResolvedValueOnce({
      id: "case-synthetic", status: "UNDER_VERIFICATION", appealId: null,
      updatedAt: new Date("2026-10-16T09:00:00.000Z"),
    });
    await expect(createAssistanceFollowUp(creation())).rejects.toThrow("case changed");
    expect(m.create).not.toHaveBeenCalled();
  });

  it("locks closed cases and caps open case worklists", async () => {
    m.request.mockResolvedValueOnce({
      id: "case-synthetic", status: "CLOSED", appealId: null, updatedAt: version,
    });
    await expect(createAssistanceFollowUp(creation())).rejects.toThrow("not open");
    m.count.mockResolvedValueOnce(20);
    await expect(createAssistanceFollowUp(creation())).rejects.toThrow("20 open tasks");
    expect(m.create).not.toHaveBeenCalled();
  });

  it("completes a task with exact-case CAS and one audit event", async () => {
    m.taskFind.mockResolvedValue(task());
    await expect(resolveAssistanceFollowUp(resolution())).rejects.toThrow("NEXT_REDIRECT");
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ assistanceRequestId: "case-synthetic",
        state: "OPEN", updatedAt: version }),
      data: expect.objectContaining({ state: "COMPLETED", resolvedById: "reviewer-1" }),
    }));
    expect(m.audit).toHaveBeenCalledOnce();
  });

  it("requires independent approval permission before cancellation", async () => {
    m.has.mockReturnValue(false);
    await expect(resolveAssistanceFollowUp(resolution("CANCELLED"))).rejects
      .toThrow("Only an assistance approver");
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("does not let a non-coordinator resolve or reschedule another person's task", async () => {
    m.has.mockReturnValue(false);
    m.taskFind.mockResolvedValue({ ...task(), assignedToId: "another-reviewer" });
    await expect(resolveAssistanceFollowUp(resolution())).rejects.toThrow("responsible staff");
    const change = form({ id: "case-synthetic", taskId: "task-synthetic",
      dueOn: shiftedCalendarDay(tomorrow(), 3), expectedTaskUpdatedAt: version.toISOString() });
    await expect(rescheduleAssistanceFollowUp(change)).rejects.toThrow("responsible staff");
    expect(m.update).not.toHaveBeenCalled();
  });

  it("does not permit a reviewer to delegate a new task without assignment authority", async () => {
    m.has.mockReturnValue(false);
    const data = creation();
    data.set("assignedToId", "other-reviewer");
    await expect(createAssistanceFollowUp(data)).rejects.toThrow("Assignment permission");
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("validates an eligible assignee for new tasks", async () => {
    m.staffFind.mockResolvedValue(null);
    await expect(createAssistanceFollowUp(creation())).rejects.toThrow("not an active eligible");
    expect(m.create).not.toHaveBeenCalled();
  });

  it("moves task ownership with CAS and a restricted audit trail", async () => {
    m.taskFind.mockResolvedValue(task());
    const reassignment = form({ id: "case-synthetic", taskId: "task-synthetic",
      assignedToId: "reviewer-2", expectedTaskUpdatedAt: version.toISOString() });
    await expect(assignAssistanceFollowUp(reassignment)).rejects.toThrow("NEXT_REDIRECT");
    expect(m.auth).toHaveBeenCalledWith("assistance.assign");
    expect(m.staffFind).toHaveBeenCalledOnce();
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { assignedToId: "reviewer-2" },
    }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "assistance.follow_up_task_reassigned" }),
    }));
  });

  it("does not resolve a task belonging to a different assistance case", async () => {
    m.taskFind.mockResolvedValue({ ...task(), assistanceRequestId: "another-case" });
    await expect(resolveAssistanceFollowUp(resolution())).rejects.toThrow("does not belong");
    expect(m.update).not.toHaveBeenCalled();
  });

  it("idempotently ignores repeated completion without appending a duplicate audit event", async () => {
    m.taskFind.mockResolvedValue({ ...task(), state: "COMPLETED" });
    await expect(resolveAssistanceFollowUp(resolution())).rejects.toThrow("NEXT_REDIRECT");
    expect(m.update).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });

  it("rejects conflicting stale task resolution", async () => {
    m.taskFind.mockResolvedValue({ ...task(),
      updatedAt: new Date("2026-10-16T10:00:00.000Z") });
    await expect(resolveAssistanceFollowUp(resolution())).rejects.toThrow("reviewer updated");
    expect(m.audit).not.toHaveBeenCalled();
  });

  it("reschedules only an open task and emits the before/after staff-selected dates", async () => {
    m.taskFind.mockResolvedValue(task());
    const formData = form({
      id: "case-synthetic", taskId: "task-synthetic",
      dueOn: shiftedCalendarDay(tomorrow(), 4),
      expectedTaskUpdatedAt: version.toISOString(),
    });
    await expect(rescheduleAssistanceFollowUp(formData)).rejects.toThrow("NEXT_REDIRECT");
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ state: "OPEN", updatedAt: version }),
    }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: "assistance.follow_up_task_rescheduled",
        metadata: expect.objectContaining({ taskId: "task-synthetic" }),
      }),
    }));
  });
});
