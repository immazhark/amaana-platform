import { Prisma } from "@prisma/client";
import type { CreateFundInput, UpdateFundInput } from "@/lib/fund-admin";
import { parseUpdateFund } from "@/lib/fund-admin";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

export class FundAdminError extends Error {}

export async function createFund(input: CreateFundInput, actorId: string) {
  try {
    return await withSerializableTransactionRetry(async tx => {
      const created = await tx.fund.create({
        data: { slug: input.slug, name: input.name, summary: input.summary, zakatPolicy: input.zakatPolicy, status: input.status, sortOrder: input.sortOrder, isGeneral: false },
        select: { id: true },
      });
      await tx.auditEvent.create({
        data: { actorId, action: "fund.create", entityType: "Fund", entityId: created.id, metadata: { slug: input.slug, zakatPolicy: input.zakatPolicy, status: input.status, zakatBasis: input.zakatBasis } },
      });
      return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new FundAdminError("A fund with that slug already exists.");
    throw error;
  }
}

// Edits a fund in one serializable transaction and audits what changed. The slug and the General flag never change,
// so deep links and the single-General-fund rule stay stable. Past gifts keep the Zakat intent they were given with.
export async function updateFund(id: string, raw: Record<string, unknown>, actorId: string) {
  return withSerializableTransactionRetry(async tx => {
    const current = await tx.fund.findUnique({ where: { id }, select: { id: true, name: true, summary: true, zakatPolicy: true, status: true, sortOrder: true, isGeneral: true } });
    if (!current) throw new FundAdminError("That fund does not exist.");
    const parsed = parseUpdateFund(raw, current);
    if (!parsed.ok) throw new FundAdminError(parsed.error);
    const next: UpdateFundInput = parsed.value;
    if (current.isGeneral && next.status !== "ACTIVE" && next.status !== "PAUSED") throw new FundAdminError("The General Fund cannot be closed or returned to draft.");
    await tx.fund.update({ where: { id }, data: { name: next.name, summary: next.summary, zakatPolicy: next.zakatPolicy, status: next.status, sortOrder: next.sortOrder } });
    await tx.auditEvent.create({
      data: {
        actorId, action: "fund.update", entityType: "Fund", entityId: id,
        metadata: {
          before: { zakatPolicy: current.zakatPolicy, status: current.status, sortOrder: current.sortOrder },
          after: { zakatPolicy: next.zakatPolicy, status: next.status, sortOrder: next.sortOrder },
          zakatBasis: next.zakatBasis,
        },
      },
    });
  });
}
