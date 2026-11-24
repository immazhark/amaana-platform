import { loadFundsLedger } from "@/lib/funds-ledger";
import { validPublishableSummary, validVoidReason, type DisbursementInput } from "@/lib/fund-disbursement";
import { canDisburse } from "@/lib/giving-funds";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

export class DisbursementError extends Error {}

// Records money leaving a fund as a DRAFT. Serializable, so two concurrent entries cannot both spend the
// same balance; every entry and decision leaves an audit event.
export async function recordDisbursement(input: DisbursementInput, actorId: string) {
  return withSerializableTransactionRetry(async tx => {
    const fund = await tx.fund.findUnique({ where: { id: input.fundId }, select: { id: true } });
    if (!fund) throw new DisbursementError("That fund does not exist.");
    const { byFund } = await loadFundsLedger(tx, { fundId: input.fundId });
    const totals = byFund[input.fundId];
    if (!totals || !canDisburse(totals, input.pool, input.amountPaise)) {
      throw new DisbursementError(input.pool === "ZAKAT"
        ? "This exceeds the verified Zakat balance of the fund."
        : "This exceeds the verified non-Zakat balance of the fund.");
    }
    const created = await tx.fundDisbursement.create({
      data: {
        fundId: input.fundId,
        pool: input.pool,
        amount: input.amountPaise / 100,
        spentOn: new Date(`${input.spentOn}T00:00:00.000Z`),
        financialYear: input.financialYear,
        title: input.title,
        publicSummary: input.publicSummary,
        createdById: actorId,
        ...(input.pool === "ZAKAT" ? { zakatEligibilityConfirmedAt: new Date(), zakatEligibilityBasis: input.zakatEligibilityBasis } : {}),
      },
      select: { id: true },
    });
    await tx.auditEvent.create({
      data: { actorId, action: "fund.disbursement.record", entityType: "FundDisbursement", entityId: created.id, metadata: { fundId: input.fundId, pool: input.pool, amountPaise: input.amountPaise } },
    });
    return created;
  });
}

export const TWO_PERSON_MESSAGE = "A second staff member must review and publish this entry (two-person control). Ask a colleague to publish it.";

// Maker-checker (AF-ALLOCATION): the person who records spending cannot publish it to the public ledger. A genuine single
// operator can set FUND_SPENDING_SOLE_OPERATOR=true; that is an owner decision, off by default, and every self-published
// entry is marked in its audit event so the exception stays visible.
export async function publishDisbursement(id: string, actorId: string, env: Record<string, string | undefined> = process.env) {
  return withSerializableTransactionRetry(async tx => {
    const row = await tx.fundDisbursement.findUnique({ where: { id }, select: { status: true, publicSummary: true, createdById: true } });
    if (!row || row.status !== "DRAFT") throw new DisbursementError("Only a draft entry can be published.");
    const selfPublished = row.createdById === actorId;
    if (selfPublished && env.FUND_SPENDING_SOLE_OPERATOR !== "true") throw new DisbursementError(TWO_PERSON_MESSAGE);
    if (!validPublishableSummary(row.publicSummary)) throw new DisbursementError("Add a public summary (10 to 400 characters, no contact details) before publishing.");
    const changed = await tx.fundDisbursement.updateMany({ where: { id, status: "DRAFT" }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    if (changed.count !== 1) throw new DisbursementError("This entry changed; reload and try again.");
    await tx.auditEvent.create({ data: { actorId, action: "fund.disbursement.publish", entityType: "FundDisbursement", entityId: id, metadata: selfPublished ? { selfPublished: true } : {} } });
  });
}

export async function voidDisbursement(id: string, reason: unknown, actorId: string) {
  if (!validVoidReason(reason)) throw new DisbursementError("Give a reason of 5 to 500 characters.");
  return withSerializableTransactionRetry(async tx => {
    const changed = await tx.fundDisbursement.updateMany({
      where: { id, status: { in: ["DRAFT", "PUBLISHED"] } },
      data: { status: "VOID", voidedAt: new Date(), voidReason: reason.trim() },
    });
    if (changed.count !== 1) throw new DisbursementError("This entry is already void or does not exist.");
    await tx.auditEvent.create({ data: { actorId, action: "fund.disbursement.void", entityType: "FundDisbursement", entityId: id, metadata: { reasonLength: reason.trim().length } } });
  });
}
