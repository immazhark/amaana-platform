// Counts by current status and receipt age, not first-review history. A submitted request may already have a saved review.
// No target response time is implied or promised.
import type { Prisma } from "@prisma/client";

const OPEN = ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION"] as const;
const DAY_MS = 86_400_000;

export const waitDays = (from: Date, now: Date) => Math.max(0, Math.floor((now.getTime() - from.getTime()) / DAY_MS));

export type AssistanceWorkload = { submitted: number; oldestSubmittedAgeDays: number | null; openUnassigned: number; open: number };

export async function assistanceWorkload(
  db: Pick<Prisma.TransactionClient, "assistanceRequest">, scope: Prisma.AssistanceRequestWhereInput, now = new Date(),
): Promise<AssistanceWorkload> {
  const submittedScope = { ...scope, status: "SUBMITTED" as const };
  const open = { ...scope, status: { in: [...OPEN] } };
  const [submitted, oldest, openUnassigned, openCount] = await Promise.all([
    db.assistanceRequest.count({ where: submittedScope }),
    db.assistanceRequest.findFirst({ where: submittedScope, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { createdAt: true } }),
    db.assistanceRequest.count({ where: { ...open, assignedToId: null } }),
    db.assistanceRequest.count({ where: open }),
  ]);
  return { submitted, oldestSubmittedAgeDays: oldest ? waitDays(oldest.createdAt, now) : null, openUnassigned, open: openCount };
}
