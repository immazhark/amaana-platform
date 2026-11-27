import type { Prisma } from "@prisma/client";

const ROUTES: Record<string, string> = {
  PENDING: "Decision pending", APPROVED_PUBLIC: "Public fundraising", APPROVED_PRIVATE: "Private assistance",
  APPROVED_PARTIAL: "Partial assistance", REFERRED: "Referred", DECLINED: "Declined",
};
const APPEALS: Record<string, string> = {
  DRAFT: "Draft", UNDER_REVIEW: "Under review", PUBLISHED: "Published", PAUSED: "Paused",
  FUNDED: "Funded", CLOSED: "Closed", REJECTED: "Rejected",
};
type Evidence = {
  status: string; createdAt: Date; acceptedAt?: Date | null;
  verification?: { decision: string; completedAt?: Date | null } | null;
  appealId?: string | null; appeal?: { status: string } | null;
};
type Closure = { kind: "not_closed" | "missing" | "unavailable" } | { kind: "recorded"; at: Date };
const dateAtOrAfter = (value: Date | null | undefined, start: Date) =>
  value instanceof Date && Number.isFinite(value.getTime()) && value >= start ? value : null;

/** Display existing recorded facts only. Case closure and appeal funding are not evidence of delivery. */
export function lifecycleEvidence(record: Evidence, transition: { createdAt: Date } | null | undefined) {
  const acceptedAt = dateAtOrAfter(record.acceptedAt, record.createdAt);
  const verificationCompletedAt = dateAtOrAfter(record.verification?.completedAt, record.createdAt);
  const decision = record.verification?.decision;
  const route = decision && Object.hasOwn(ROUTES, decision) ? ROUTES[decision] : "Not recorded";
  const appealState = record.appeal && Object.hasOwn(APPEALS, record.appeal.status) ? APPEALS[record.appeal.status]
    : record.appealId || record.status === "CONVERTED_TO_APPEAL" ? "Linked appeal record unavailable" : "No linked appeal";
  const gaps: ("acceptance" | "verification" | "appeal_link")[] = [];
  if (["APPROVED", "CONVERTED_TO_APPEAL"].includes(record.status)) {
    if (!acceptedAt) gaps.push("acceptance");
    if (!verificationCompletedAt || !decision || !["APPROVED_PUBLIC", "APPROVED_PRIVATE", "APPROVED_PARTIAL"].includes(decision)) gaps.push("verification");
  }
  if (record.status === "CONVERTED_TO_APPEAL" && (!record.appealId || !record.appeal) || record.appealId && !record.appeal || record.appeal && !record.appealId) gaps.push("appeal_link");
  const closureAt = dateAtOrAfter(transition?.createdAt, record.createdAt);
  const closure: Closure = record.status !== "CLOSED" ? { kind: "not_closed" }
    : transition === undefined ? { kind: "unavailable" }
      : closureAt ? { kind: "recorded", at: closureAt } : { kind: "missing" };
  return { acceptedAt, verificationCompletedAt, route, appealState, gaps, closure, deliveryEstablished: false as const };
}

/** Query the most recent recorded transition, excluding ordinary note-only saves while closed. */
export function closureTransitionQuery(caseId: string) {
  return {
    where: {
      entityType: "AssistanceRequest", entityId: caseId, action: "assistance.updated",
      AND: [
        { metadata: { path: ["status"], equals: "CLOSED" } },
        { OR: ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED", "REJECTED"].map(value => ({ metadata: { path: ["previousStatus"], equals: value } })) },
      ],
    },
    select: { createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1,
  } satisfies Prisma.AuditEventFindManyArgs;
}
