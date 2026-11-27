// Counts by current status and receipt age, not first-review history. A submitted request may already have a saved review.
// No target response time is implied or promised.
import type { Prisma } from "@prisma/client";

const OPEN = ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION"] as const;
const FOLLOW_UP = ["APPROVED", "CONVERTED_TO_APPEAL"] as const;
const DAY_MS = 86_400_000;

export const waitDays = (from: Date, now: Date) => Math.max(0, Math.floor((now.getTime() - from.getTime()) / DAY_MS));

type StageCount = { count: number; oldestAgeDays: number | null };
type WorkloadStatus = typeof OPEN[number] | typeof FOLLOW_UP[number];
export type AssistanceStageWorkload<S extends WorkloadStatus = typeof OPEN[number]> = { status: S; total: StageCount; mine: StageCount; unassigned: StageCount };
export type AssistanceWorkload = { submitted: number; oldestSubmittedAgeDays: number | null; openUnassigned: number; openMine: number; open: number; stages: AssistanceStageWorkload[]; followUpStages: AssistanceStageWorkload<typeof FOLLOW_UP[number]>[] };

const empty = (): StageCount => ({ count: 0, oldestAgeDays: null });

function include(target: StageCount, count: number, oldest: Date | null, now: Date) {
  target.count += count;
  if (oldest) target.oldestAgeDays = Math.max(target.oldestAgeDays ?? 0, waitDays(oldest, now));
}

/** One grouped snapshot for the current authorized record view. Staff IDs are used only to classify groups
 * as mine/unassigned/other and never returned. No applicant records or details are selected. */
export async function assistanceWorkload(
  db: Pick<Prisma.TransactionClient, "assistanceRequest">, scope: Prisma.AssistanceRequestWhereInput, reviewerId: string, now = new Date(),
): Promise<AssistanceWorkload> {
  const groups = await db.assistanceRequest.groupBy({
    by: ["status", "assignedToId"],
    where: { ...scope, status: { in: [...OPEN, ...FOLLOW_UP] } },
    _count: { _all: true },
    _min: { createdAt: true },
  });
  const stages: AssistanceStageWorkload[] = OPEN.map(status => ({ status, total: empty(), mine: empty(), unassigned: empty() }));
  const followUpStages: AssistanceStageWorkload<typeof FOLLOW_UP[number]>[] = FOLLOW_UP.map(status => ({ status, total: empty(), mine: empty(), unassigned: empty() }));
  const allStages = [...stages, ...followUpStages];
  for (const group of groups) {
    const stage = allStages.find(item => item.status === group.status);
    if (!stage) continue;
    const count = group._count._all;
    const oldest = group._min.createdAt;
    include(stage.total, count, oldest, now);
    if (group.assignedToId === null) include(stage.unassigned, count, oldest, now);
    else if (group.assignedToId === reviewerId) include(stage.mine, count, oldest, now);
  }
  return {
    submitted: stages[0]!.total.count,
    oldestSubmittedAgeDays: stages[0]!.total.oldestAgeDays,
    openUnassigned: stages.reduce((sum, stage) => sum + stage.unassigned.count, 0),
    openMine: stages.reduce((sum, stage) => sum + stage.mine.count, 0),
    open: stages.reduce((sum, stage) => sum + stage.total.count, 0),
    stages,
    followUpStages,
  };
}
