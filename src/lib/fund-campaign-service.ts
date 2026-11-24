import { Prisma } from "@prisma/client";
import { parseCampaignFields, statusTransitionAllowed, type CampaignFields, type CreateCampaignInput } from "@/lib/fund-campaign";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

export class CampaignAdminError extends Error {}

type Tx = Prisma.TransactionClient;

// Two open campaigns on one fund would make the donor's choice ambiguous, so ACTIVE windows may not overlap.
async function assertNoOverlap(tx: Tx, fundId: string, fields: Pick<CampaignFields, "status" | "opensAt" | "closesAt">, exceptId?: string) {
  if (fields.status !== "ACTIVE") return;
  const clash = await tx.fundCampaign.count({
    where: { fundId, status: "ACTIVE", opensAt: { lt: fields.closesAt }, closesAt: { gt: fields.opensAt }, ...(exceptId ? { id: { not: exceptId } } : {}) },
  });
  if (clash > 0) throw new CampaignAdminError("Another active campaign on this fund overlaps that window.");
}

export async function createCampaign(input: CreateCampaignInput, actorId: string) {
  try {
    return await withSerializableTransactionRetry(async tx => {
      const fund = await tx.fund.findUnique({ where: { id: input.fundId }, select: { id: true, status: true } });
      if (!fund) throw new CampaignAdminError("That fund does not exist.");
      if (input.status === "ACTIVE" && fund.status !== "ACTIVE") throw new CampaignAdminError("Activate the fund before opening a campaign on it.");
      await assertNoOverlap(tx, input.fundId, input);
      const created = await tx.fundCampaign.create({
        data: {
          fundId: input.fundId, slug: input.slug, title: input.title, unitLabel: input.unitLabel, unitLabelPlural: input.unitLabelPlural,
          unitPrice: input.unitPrice, maxUnits: input.maxUnits, opensAt: input.opensAt, closesAt: input.closesAt, status: input.status, note: input.note, createdById: actorId,
        },
        select: { id: true },
      });
      await tx.auditEvent.create({
        data: { actorId, action: "fund.campaign.create", entityType: "FundCampaign", entityId: created.id, metadata: { fundId: input.fundId, slug: input.slug, unitPrice: input.unitPrice, maxUnits: input.maxUnits, status: input.status } },
      });
      return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new CampaignAdminError("A campaign with that slug already exists.");
    throw error;
  }
}

// The slug and fund never change. Once a gift exists the unit price is frozen, because every gift snapshots it and the
// database insists amount = units x price; to change the price, close the campaign and open a new one.
export async function updateCampaign(id: string, raw: Record<string, unknown>, actorId: string) {
  return withSerializableTransactionRetry(async tx => {
    const current = await tx.fundCampaign.findUnique({
      where: { id },
      select: { id: true, fundId: true, status: true, unitPrice: true, maxUnits: true, opensAt: true, closesAt: true, fund: { select: { status: true } }, _count: { select: { donations: true } } },
    });
    if (!current) throw new CampaignAdminError("That campaign does not exist.");
    const parsed = parseCampaignFields(raw);
    if (!parsed.ok) throw new CampaignAdminError(parsed.error);
    const next = parsed.value;
    if (!statusTransitionAllowed(current.status, next.status)) throw new CampaignAdminError(current.status === "CLOSED" ? "A closed campaign cannot be reopened; create a new one." : "An active campaign can only stay active or be closed.");
    if (current._count.donations > 0 && Number(current.unitPrice) !== next.unitPrice) throw new CampaignAdminError("The price cannot change after gifts have been made. Close this campaign and open a new one.");
    if (next.status === "ACTIVE" && current.fund.status !== "ACTIVE") throw new CampaignAdminError("Activate the fund before opening a campaign on it.");
    await assertNoOverlap(tx, current.fundId, next, id);
    await tx.fundCampaign.update({
      where: { id },
      data: { title: next.title, unitLabel: next.unitLabel, unitLabelPlural: next.unitLabelPlural, unitPrice: next.unitPrice, maxUnits: next.maxUnits, opensAt: next.opensAt, closesAt: next.closesAt, status: next.status, note: next.note },
    });
    await tx.auditEvent.create({
      data: {
        actorId, action: "fund.campaign.update", entityType: "FundCampaign", entityId: id,
        metadata: {
          before: { status: current.status, unitPrice: Number(current.unitPrice), maxUnits: current.maxUnits, opensAt: current.opensAt.toISOString(), closesAt: current.closesAt.toISOString() },
          after: { status: next.status, unitPrice: next.unitPrice, maxUnits: next.maxUnits, opensAt: next.opensAt.toISOString(), closesAt: next.closesAt.toISOString() },
          giftsAtChange: current._count.donations,
        },
      },
    });
  });
}
