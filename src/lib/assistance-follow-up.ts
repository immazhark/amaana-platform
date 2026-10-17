import { singleFormValue } from "./single-form-value";
import { AssistanceFollowUpState, type Prisma } from "@prisma/client";

export const FOLLOW_UP_SUMMARY_LIMIT = 300;
export const MAX_OPEN_FOLLOW_UPS_PER_CASE = 20;

/** Owner can act on tasks only when active and permitted to view and update cases. */
export function eligibleFollowUpStaffWhere(id?: string): Prisma.UserWhereInput {
  return {
    ...(id ? { id } : {}),
    status: "ACTIVE",
    AND: [
      { roles: { some: { role: { permissions: { some: { permission: { key: "assistance.view" } } } } } } },
      { roles: { some: { role: { permissions: { some: { permission: { key: "assistance.update" } } } } } } },
    ],
  };
}
const unsafeControl = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const caseIdPattern = /^[a-zA-Z0-9_-]{3,128}$/;
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

/** A calendar day in Hyderabad, independent of database/host timezone. */
export function indiaCalendarDay(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (part: string) => parts.find(item => item.type === part)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function shiftedCalendarDay(day: string, offsetDays: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function parseCalendarDay(value: unknown, today: string): Date {
  if (typeof value !== "string" || !dayPattern.test(value)) {
    throw new Error("Choose a valid follow-up calendar date.");
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ||
      value < today || value > shiftedCalendarDay(today, 365)) {
    throw new Error("Choose a date between today and 365 days from today.");
  }
  return parsed;
}

function requiredString(form: FormData, name: string, max: number): string {
  const raw = singleFormValue(form, name);
  if (typeof raw !== "string" || raw.length > max || unsafeControl.test(raw)) {
    throw new Error(`Invalid ${name}.`);
  }
  return raw;
}

function requestId(form: FormData): string {
  const id = requiredString(form, "id", 128);
  if (!caseIdPattern.test(id)) throw new Error("Invalid assistance case reference.");
  return id;
}

export function parseFollowUpCreation(form: FormData, today: string) {
  const id = requestId(form);
  const submissionId = requiredString(form, "submissionId", 36);
  if (!uuid.test(submissionId)) throw new Error("Reload the form before creating a follow-up.");
  const assignedToId = requiredString(form, "assignedToId", 128);
  if (!caseIdPattern.test(assignedToId)) throw new Error("Choose an eligible follow-up owner.");
  const summary = requiredString(form, "summary", FOLLOW_UP_SUMMARY_LIMIT).trim();
  if (summary.length < 12) throw new Error("Follow-up summary must contain at least 12 characters.");
  const dueOn = parseCalendarDay(singleFormValue(form, "dueOn"), today);
  const version = requiredString(form, "expectedUpdatedAt", 32);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(version) ||
      Number.isNaN(Date.parse(version)) || new Date(version).toISOString() !== version) {
    throw new Error("Case version is missing. Reload before recording a task.");
  }
  return { id, submissionId, assignedToId, summary, dueOn, expectedUpdatedAt: new Date(version) };
}

export type FollowUpResolution = "COMPLETED" | "CANCELLED";
export function parseFollowUpResolution(form: FormData) {
  const id = requestId(form);
  const taskId = requiredString(form, "taskId", 128);
  if (!caseIdPattern.test(taskId)) throw new Error("Invalid follow-up reference.");
  const state = requiredString(form, "state", 16);
  if (state !== "COMPLETED" && state !== "CANCELLED") throw new Error("Invalid follow-up action.");
  const version = requiredString(form, "expectedTaskUpdatedAt", 32);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(version) ||
      Number.isNaN(Date.parse(version)) || new Date(version).toISOString() !== version) {
    throw new Error("Follow-up version is missing. Reload before updating.");
  }
  return { id, taskId, state: state as FollowUpResolution, expectedUpdatedAt: new Date(version) };
}

/** A reschedule is a reversible private operational change, never a public
 * case-impact claim or a change to verification/approval. */
export function parseFollowUpReschedule(form: FormData, today: string) {
  const id = requestId(form);
  const taskId = requiredString(form, "taskId", 128);
  if (!caseIdPattern.test(taskId)) throw new Error("Invalid follow-up reference.");
  const dueOn = parseCalendarDay(singleFormValue(form, "dueOn"), today);
  const version = requiredString(form, "expectedTaskUpdatedAt", 32);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(version) ||
      Number.isNaN(Date.parse(version)) || new Date(version).toISOString() !== version) {
    throw new Error("Follow-up version is missing. Reload before rescheduling.");
  }
  return { id, taskId, dueOn, expectedUpdatedAt: new Date(version) };
}

/** Explicit, version-checked staff reassignment for an open private task. */
export function parseFollowUpAssignment(form: FormData) {
  const id = requestId(form);
  const taskId = requiredString(form, "taskId", 128);
  const assignedToId = requiredString(form, "assignedToId", 128);
  if (!caseIdPattern.test(taskId) || !caseIdPattern.test(assignedToId)) {
    throw new Error("Invalid task or staff reference.");
  }
  const version = requiredString(form, "expectedTaskUpdatedAt", 32);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(version) ||
      Number.isNaN(Date.parse(version)) || new Date(version).toISOString() !== version) {
    throw new Error("Follow-up version is missing. Reload before reassigning.");
  }
  return { id, taskId, assignedToId, expectedUpdatedAt: new Date(version) };
}

/** Date-only source fields are stored as UTC-midnight DATE values in PostgreSQL. */
export function taskDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function followUpDueLabel(
  state: AssistanceFollowUpState, dueOn: Date, today: string,
): string {
  if (state === AssistanceFollowUpState.COMPLETED) return "Completed";
  if (state === AssistanceFollowUpState.CANCELLED) return "Cancelled";
  const due = taskDay(dueOn);
  if (due === today) return "Due today";
  if (due < today) {
    const days = Math.round((new Date(`${today}T00:00:00Z`).getTime() - dueOn.getTime()) / 86_400_000);
    return `Past selected date by ${days} ${days === 1 ? "day" : "days"}`;
  }
  return `Planned for ${due}`;
}

/** Retire outstanding private tasks atomically when the owning case enters a
 * terminal workflow. Never publish task text or send external notifications. */
export async function cancelOpenFollowUpsOnCaseExit(
  tx: Prisma.TransactionClient,
  assistanceRequestId: string,
  actorId: string,
  reason: "CASE_CLOSED" | "CASE_REJECTED" | "APPEAL_CONVERSION",
) {
  const due = await tx.assistanceFollowUp.findMany({
    where: { assistanceRequestId, state: AssistanceFollowUpState.OPEN },
    select: { id: true },
  });
  if (due.length === 0) return;
  const now = new Date();
  const result = await tx.assistanceFollowUp.updateMany({
    where: { assistanceRequestId, state: AssistanceFollowUpState.OPEN },
    data: { state: AssistanceFollowUpState.CANCELLED, resolvedAt: now, resolvedById: actorId },
  });
  if (result.count !== due.length) throw new Error("Follow-up tasks changed during case closure.");
  await tx.auditEvent.create({
    data: {
      actorId,
      action: "assistance.follow_up_tasks_closed_with_case",
      entityType: "AssistanceRequest", entityId: assistanceRequestId,
      metadata: { reason, count: result.count },
    },
  });
}
