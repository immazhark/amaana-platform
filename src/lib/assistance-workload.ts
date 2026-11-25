// Reviewer workload at a glance, derived only from existing rows: how many requests are waiting for a first look, how long the
// oldest has waited, and how many open requests nobody owns. No target response time is implied or promised.
import type { Prisma } from "@prisma/client";

const OPEN = ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION"] as const;
const DAY_MS = 86_400_000;

export const waitDays = (from: Date, now: Date) => Math.max(0, Math.floor((now.getTime() - from.getTime()) / DAY_MS));

export type AssistanceWorkload = { awaitingFirstReview: number; oldestWaitingDays: number | null; openUnassigned: number; open: number };

export async function assistanceWorkload(
  db: Pick<Prisma.TransactionClient, "assistanceRequest">, scope: Prisma.AssistanceRequestWhereInput, now = new Date(),
): Promise<AssistanceWorkload> {
  const waiting = { ...scope, status: "SUBMITTED" as const };
  const open = { ...scope, status: { in: [...OPEN] } };
  const [awaitingFirstReview, oldest, openUnassigned, openCount] = await Promise.all([
    db.assistanceRequest.count({ where: waiting }),
    db.assistanceRequest.findFirst({ where: waiting, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { createdAt: true } }),
    db.assistanceRequest.count({ where: { ...open, assignedToId: null } }),
    db.assistanceRequest.count({ where: open }),
  ]);
  return { awaitingFirstReview, oldestWaitingDays: oldest ? waitDays(oldest.createdAt, now) : null, openUnassigned, open: openCount };
}
