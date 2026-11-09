import { validateGivingProposal } from "./giving-foundation";

/**
 * Offline-only designation contract.
 *
 * A validated snapshot is not an authorization to collect money. Callers must
 * obtain a current server-controlled policy and, for APPEAL, a reviewed
 * appeal-to-fund mapping. Database exclusivity and atomic persistence are
 * separate release gates.
 */

type DesignationFields = Readonly<{
  resolvedFundId: string;
  policyVersionId: string;
  amountPaise: number;
  currency: "INR";
  givingIntent: "GENERAL";
}>;

export type GivingDesignationSnapshot = DesignationFields & (
  | Readonly<{ targetKind: "FUND"; fundId: string; appealId: null }>
  | Readonly<{ targetKind: "APPEAL"; fundId: null; appealId: string }>
);

const SNAPSHOT_KEYS = new Set([
  "targetKind", "fundId", "appealId", "resolvedFundId",
  "policyVersionId", "amountPaise", "currency", "givingIntent",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nonblank(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value === value.trim();
}

function exactSnapshotShape(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length === SNAPSHOT_KEYS.size && keys.every(key => SNAPSHOT_KEYS.has(key));
}

export function createDesignationSnapshot(
  input: unknown,
  approvedProposal: unknown,
  approvedAppealMapping?: unknown,
): GivingDesignationSnapshot | null {
  const draft = asRecord(input);
  if (!draft || !exactSnapshotShape(draft)) return null;

  // The proof of review is external; the pure helper enforces consistent
  // identities and rejects a proposal whose current contract is not active.
  if (!validateGivingProposal(approvedProposal)) return null;
  const proposal = asRecord(approvedProposal);
  const fund = asRecord(proposal?.fund);
  const policy = asRecord(proposal?.policy);
  if (!proposal || !fund || !policy) return null;

  if (!nonblank(draft.resolvedFundId) ||
      !nonblank(draft.policyVersionId) ||
      draft.resolvedFundId !== fund.id ||
      draft.policyVersionId !== policy.id ||
      draft.givingIntent !== "GENERAL" ||
      draft.givingIntent !== proposal.intent ||
      draft.currency !== "INR" ||
      typeof draft.amountPaise !== "number" ||
      !Number.isSafeInteger(draft.amountPaise) ||
      draft.amountPaise <= 0 ||
      draft.amountPaise !== proposal.amountPaise) {
    return null;
  }

  const common = {
    resolvedFundId: draft.resolvedFundId,
    policyVersionId: draft.policyVersionId,
    amountPaise: draft.amountPaise,
    currency: "INR" as const,
    givingIntent: "GENERAL" as const,
  };

  if (draft.targetKind === "FUND") {
    // An appeal mapping must not be smuggled into a direct fund collection.
    if (approvedAppealMapping !== undefined ||
        !nonblank(draft.fundId) ||
        draft.appealId !== null ||
        draft.fundId !== draft.resolvedFundId) {
      return null;
    }
    return Object.freeze({
      targetKind: "FUND" as const,
      fundId: draft.fundId,
      appealId: null,
      ...common,
    });
  }

  if (draft.targetKind === "APPEAL") {
    const mapping = asRecord(approvedAppealMapping);
    if (!mapping ||
        draft.fundId !== null ||
        !nonblank(draft.appealId) ||
        mapping.status !== "APPROVED" ||
        !nonblank(mapping.evidenceRef) ||
        mapping.appealId !== draft.appealId ||
        mapping.fundId !== draft.resolvedFundId ||
        mapping.policyVersionId !== draft.policyVersionId) {
      return null;
    }
    return Object.freeze({
      targetKind: "APPEAL" as const,
      fundId: null,
      appealId: draft.appealId,
      ...common,
    });
  }

  return null;
}
