// Annual individual-case capacity. A case counts when it is formally taken up (approved), not when a request arrives or money
// is paid. Calendar year in India time. Annual distributions, Taleem sponsorships and other programmes are never counted here
// because only AssistanceRequest rows with an acceptance time are.
import type { Prisma } from "@prisma/client";
import { INDIVIDUAL_CASE_ANNUAL_CAPACITY } from "@/lib/assistance-policy";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Start (inclusive) and end (exclusive) of the India-time calendar year containing `now`. */
export function capacityYearBounds(now: Date): { year: number; start: Date; end: Date } {
  const year = new Date(now.getTime() + IST_OFFSET_MS).getUTCFullYear();
  return { year, start: new Date(Date.UTC(year, 0, 1) - IST_OFFSET_MS), end: new Date(Date.UTC(year + 1, 0, 1) - IST_OFFSET_MS) };
}

/** Counted: accepted this year and still an accepted case. A request moved back into review or rejected after acceptance
 * frees its place; a case later closed or turned into an appeal keeps it. */
export const countedCaseWhere = (now: Date): Prisma.AssistanceRequestWhereInput => {
  const { start, end } = capacityYearBounds(now);
  return { acceptedAt: { gte: start, lt: end }, status: { in: ["APPROVED", "CONVERTED_TO_APPEAL", "CLOSED"] } };
};

export async function capacityUsed(db: Pick<Prisma.TransactionClient, "assistanceRequest">, now = new Date()) {
  return db.assistanceRequest.count({ where: countedCaseWhere(now) });
}

export const capacityRemaining = (used: number) => Math.max(0, INDIVIDUAL_CASE_ANNUAL_CAPACITY - used);

/** Intake is paused by the stored switch or by the deploy-time environment switch, whichever says paused. */
export async function isIntakePaused(db: Pick<Prisma.TransactionClient, "assistanceIntakeSetting">, env: Readonly<Record<string, string | undefined>> = process.env) {
  if (env.ASSISTANCE_INTAKE_PAUSED?.trim().toLowerCase() === "true") return true;
  const row = await db.assistanceIntakeSetting.findUnique({ where: { id: "singleton" }, select: { paused: true } });
  return row?.paused === true;
}
