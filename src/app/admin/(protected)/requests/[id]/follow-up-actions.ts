"use server";

import { AssistanceFollowUpState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth";
import {
  MAX_OPEN_FOLLOW_UPS_PER_CASE, indiaCalendarDay,
  parseFollowUpCreation, parseFollowUpResolution, parseFollowUpReschedule, taskDay,
} from "@/lib/assistance-follow-up";
import { canAddPrivateMilestone } from "@/lib/assistance-private-milestone";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

function returnToCase(id: string): never {
  try { revalidatePath(`/admin/requests/${id}`); } catch { /* navigation forces a fresh read */ }
  try { revalidatePath("/admin"); } catch { /* an already committed task is not retried */ }
  redirect(`/admin/requests/${id}`);
}

/** A private operator-selected next action. This cannot make public appeal
 * updates, alter case approval, or send donor/applicant notifications. */
export async function createAssistanceFollowUp(form: FormData) {
  const user = await requirePermission("assistance.update");
  const { id, submissionId, summary, dueOn, expectedUpdatedAt } =
    parseFollowUpCreation(form, indiaCalendarDay(new Date()));
  await withSerializableTransactionRetry(async tx => {
    const prior = await tx.assistanceFollowUp.findUnique({
      where: { submissionId },
      select: { assistanceRequestId: true, summary: true, dueOn: true },
    });
    if (prior) {
      if (prior.assistanceRequestId !== id || prior.summary !== summary ||
          prior.dueOn.getTime() !== dueOn.getTime()) {
        throw new Error("The follow-up token was already used for another action. Reload this case.");
      }
      return;
    }
    const request = await tx.assistanceRequest.findUnique({
      where: { id },
      select: { id: true, status: true, appealId: true, updatedAt: true },
    });
    if (!request || !canAddPrivateMilestone(request.status, request.appealId)) {
      throw new Error("This case is not open for new follow-up tasks.");
    }
    if (request.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new Error("The case changed while this task was being prepared. Reload the case.");
    }
    const active = await tx.assistanceFollowUp.count({
      where: { assistanceRequestId: id, state: AssistanceFollowUpState.OPEN },
    });
    if (active >= MAX_OPEN_FOLLOW_UPS_PER_CASE) {
      throw new Error("This case already has 20 open tasks. Complete or cancel a task first.");
    }
    const task = await tx.assistanceFollowUp.create({
      data: { assistanceRequestId: id, submissionId, summary, dueOn, createdById: user.id },
      select: { id: true },
    });
    await tx.auditEvent.create({
      data: {
        actorId: user.id, action: "assistance.follow_up_task_created",
        entityType: "AssistanceRequest", entityId: id,
        metadata: { taskId: task.id, dueOn: taskDay(dueOn) },
      },
    });
  });
  returnToCase(id);
}

/** Both resolution types are CAS updates. Cancellation additionally requires
 * an approver, unlike ordinary task completion. The task narrative stays private. */
export async function resolveAssistanceFollowUp(form: FormData) {
  const user = await requirePermission("assistance.update");
  const { id, taskId, state, expectedUpdatedAt } = parseFollowUpResolution(form);
  if (state === "CANCELLED" && !hasPermission(user, "assistance.approve")) {
    throw new Error("Only an assistance approver can cancel a scheduled follow-up.");
  }
  await withSerializableTransactionRetry(async tx => {
    const task = await tx.assistanceFollowUp.findUnique({
      where: { id: taskId },
      select: { id: true, assistanceRequestId: true, state: true, updatedAt: true },
    });
    if (!task || task.assistanceRequestId !== id) {
      throw new Error("The follow-up does not belong to this assistance case.");
    }
    if (task.state === state) return; // response retry; no additional audit event
    if (task.state !== AssistanceFollowUpState.OPEN) {
      throw new Error("The follow-up has already been resolved differently.");
    }
    if (task.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new Error("Another reviewer updated this task. Reload before resolving it.");
    }
    const resolved = await tx.assistanceFollowUp.updateMany({
      where: { id: taskId, assistanceRequestId: id,
        state: AssistanceFollowUpState.OPEN, updatedAt: expectedUpdatedAt },
      data: { state, resolvedAt: new Date(), resolvedById: user.id },
    });
    if (resolved.count !== 1) {
      throw new Error("Another reviewer resolved this task. Reload the case.");
    }
    await tx.auditEvent.create({
      data: {
        actorId: user.id, action: "assistance.follow_up_task_resolved",
        entityType: "AssistanceRequest", entityId: id,
        metadata: { taskId, state },
      },
    });
  });
  returnToCase(id);
}

/** Explicit due-date amendment using the same CAS and audit discipline as
 * completion; original task authorship and text stay unchanged. */
export async function rescheduleAssistanceFollowUp(form: FormData) {
  const user = await requirePermission("assistance.update");
  const { id, taskId, dueOn, expectedUpdatedAt } =
    parseFollowUpReschedule(form, indiaCalendarDay(new Date()));
  await withSerializableTransactionRetry(async tx => {
    const task = await tx.assistanceFollowUp.findUnique({
      where: { id: taskId },
      select: { assistanceRequestId: true, state: true, dueOn: true, updatedAt: true },
    });
    if (!task || task.assistanceRequestId !== id) {
      throw new Error("The follow-up does not belong to this assistance case.");
    }
    if (task.state !== AssistanceFollowUpState.OPEN) {
      throw new Error("Resolved follow-ups cannot be rescheduled.");
    }
    if (task.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new Error("A reviewer changed this task. Reload before rescheduling.");
    }
    const request = await tx.assistanceRequest.findUnique({
      where: { id }, select: { status: true, appealId: true },
    });
    if (!request || !canAddPrivateMilestone(request.status, request.appealId)) {
      throw new Error("This case is no longer open for new follow-up dates.");
    }
    if (task.dueOn.getTime() === dueOn.getTime()) return;
    const changed = await tx.assistanceFollowUp.updateMany({
      where: { id: taskId, assistanceRequestId: id,
        state: AssistanceFollowUpState.OPEN, updatedAt: expectedUpdatedAt },
      data: { dueOn },
    });
    if (changed.count !== 1) {
      throw new Error("Another reviewer changed this task. Reload before rescheduling.");
    }
    await tx.auditEvent.create({
      data: {
        actorId: user.id, action: "assistance.follow_up_task_rescheduled",
        entityType: "AssistanceRequest", entityId: id,
        metadata: { taskId, previousDueOn: taskDay(task.dueOn), dueOn: taskDay(dueOn) },
      },
    });
  });
  returnToCase(id);
}
