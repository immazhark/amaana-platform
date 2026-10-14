import { z } from "zod";
import type { DonationIntentValue } from "@/lib/donation-intent";

export class FundValidationError extends Error {}

export const FUND_INTENTS = ["GENERAL", "SADAQAH"] as const;
export const FUND_STATUSES = ["DRAFT", "UNDER_REVIEW", "APPROVED", "PAUSED", "CLOSED"] as const;
export type FundStatus = typeof FUND_STATUSES[number];

const fundDraftSchema = z.object({
  slug: z.string().trim().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(5).max(120),
  purpose: z.string().trim().min(20).max(1_000),
  disclosure: z.string().trim().min(20).max(2_000),
  accountCode: z.string().trim().min(2).max(32).regex(/^[A-Z0-9]+(?:[-_][A-Z0-9]+)*$/),
  acceptedIntents: z.array(z.enum(FUND_INTENTS)).min(1).max(2),
}).strict();

export function parseFundDraft(input: unknown) {
  const result = fundDraftSchema.safeParse(input);
  if (!result.success) throw new FundValidationError("Enter a valid fund name, slug, purpose, disclosure, accounting code and supported giving intentions.");
  if (new Set(result.data.acceptedIntents).size !== result.data.acceptedIntents.length) throw new FundValidationError("Choose each giving intention only once.");
  // Canonical ordering also matches the database constraint. Zakat funds require
  // a separate reviewed eligibility domain; they cannot be approved here.
  return { ...result.data, acceptedIntents: FUND_INTENTS.filter(intent => result.data.acceptedIntents.includes(intent)) };
}

export function parseFundRevision(value: unknown) {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) throw new FundValidationError("Fund edit version is missing or invalid. Refresh before saving.");
  const revision = Number(value);
  if (!Number.isSafeInteger(revision)) throw new FundValidationError("Fund edit version is missing or invalid. Refresh before saving.");
  return revision;
}

const transitions: Record<FundStatus, readonly FundStatus[]> = {
  DRAFT: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["DRAFT", "APPROVED"],
  APPROVED: ["PAUSED", "CLOSED"],
  PAUSED: ["DRAFT", "APPROVED", "CLOSED"],
  CLOSED: [],
};

export function fundNextStatuses(status: FundStatus) {
  return transitions[status];
}

export function assertFundTransition(fund: { status: FundStatus; createdById: string; lastEditedById: string }, next: FundStatus, actorId: string) {
  if (!transitions[fund.status]?.includes(next)) throw new FundValidationError("Invalid fund status transition.");
  if (next === "APPROVED" && (actorId === fund.createdById || actorId === fund.lastEditedById)) {
    throw new FundValidationError("A different approver must review this fund. Its creator and last editor cannot approve it.");
  }
}
