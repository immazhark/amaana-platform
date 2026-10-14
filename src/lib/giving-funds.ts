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

// Validates one specific approved definition at the server boundary.
// Never let client-submitted names, intent eligibility or revision become
// authoritative, and never treat an approval as a live payment destination.
export function approvedFundDesignationSnapshot(
  fund: {
    id: string; slug: string; name: string; purpose: string; disclosure: string;
    accountCode: string; currency: string; acceptedIntents: readonly DonationIntentValue[];
    status: FundStatus; revision: number; createdById: string; lastEditedById: string;
    approvedById: string | null; approvedAt: Date | null;
  },
  expectedRevision: number,
  givingIntent: DonationIntentValue,
) {
  if (fund.status !== "APPROVED" || fund.currency !== "INR") {
    throw new FundValidationError("This fund is not currently accepting donations.");
  }
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 ||
      !Number.isSafeInteger(fund.revision) || fund.revision !== expectedRevision) {
    throw new FundValidationError("The fund details changed. Review the current purpose before donating.");
  }
  if (!fund.id || !fund.approvedById || !(fund.approvedAt instanceof Date) ||
      !Number.isFinite(fund.approvedAt.getTime()) ||
      fund.approvedById === fund.createdById || fund.approvedById === fund.lastEditedById) {
    throw new FundValidationError("This fund does not have an independent approval.");
  }
  const definition = parseFundDraft({
    slug: fund.slug, name: fund.name, purpose: fund.purpose,
    disclosure: fund.disclosure, accountCode: fund.accountCode,
    acceptedIntents: fund.acceptedIntents,
  });
  if (!FUND_INTENTS.some(intent => intent === givingIntent) ||
      !definition.acceptedIntents.some(intent => intent === givingIntent)) {
    throw new FundValidationError("This giving intention is not approved for this fund.");
  }
  return {
    version: 1 as const,
    kind: "FUND" as const,
    fundId: fund.id,
    fundRevision: fund.revision,
    label: definition.name,
    purpose: definition.purpose,
    disclosure: definition.disclosure,
    accountCode: definition.accountCode,
    givingIntent,
  };
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
