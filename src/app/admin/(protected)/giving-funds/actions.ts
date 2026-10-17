"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { FUND_STATUSES, FundValidationError, assertFundTransition, parseFundDraft, parseFundRevision, type FundStatus } from "@/lib/giving-funds";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

function draftFromForm(form: FormData) {
  return parseFundDraft({
    slug: form.get("slug"), name: form.get("name"),
    purpose: form.get("purpose"), disclosure: form.get("disclosure"),
    accountCode: form.get("accountCode"), acceptedIntents: form.getAll("acceptedIntents"),
  });
}

function fundId(form: FormData) {
  const id = String(form.get("id") ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new FundValidationError("Choose an existing fund and refresh before saving.");
  return id;
}

function definitionSnapshot(fund: { slug: string; name: string; purpose: string; disclosure: string; accountCode: string; acceptedIntents: readonly string[] }) {
  const { slug, name, purpose, disclosure, accountCode, acceptedIntents } = fund;
  return { slug, name, purpose, disclosure, accountCode, acceptedIntents: [...acceptedIntents] };
}

async function finishMutation(operation: () => Promise<void>) {
  try {
    await operation();
  } catch (error) {
    const notice = error instanceof FundValidationError ? error.message
      : error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" ? "A fund already uses this slug or accounting code."
      : "Unable to save the fund. Refresh and check the registry before trying again.";
    redirect(`/admin/giving-funds?error=${encodeURIComponent(notice)}`);
  }
  // Persistence and audit already committed. A view-refresh failure must not
  // turn a successful registry change into an apparent failed write.
  let delayed = false;
  for (const path of ["/admin/giving-funds", "/donate"]) {
    try { revalidatePath(path); } catch { delayed = true; }
  }
  redirect(`/admin/giving-funds?saved=1${delayed ? "&refresh=delayed" : ""}`);
}

export async function createGivingFund(form: FormData) {
  const user = await requirePermission("fund.manage");
  await finishMutation(async () => {
    const draft = draftFromForm(form);
    await withSerializableTransactionRetry(async tx => {
      const fund = await tx.givingFund.create({ data: { ...draft, createdById: user.id, lastEditedById: user.id }, select: { id: true } });
      await tx.auditEvent.create({ data: { actorId: user.id, action: "fund.created", entityType: "GivingFund", entityId: fund.id, metadata: { status: "DRAFT", definition: definitionSnapshot(draft) } } });
    });
  });
}

export async function updateGivingFund(form: FormData) {
  const user = await requirePermission("fund.manage");
  await finishMutation(async () => {
    const id = fundId(form);
    const revision = parseFundRevision(form.get("revision"));
    const draft = draftFromForm(form);
    await withSerializableTransactionRetry(async tx => {
      const previous = await tx.givingFund.findUniqueOrThrow({ where: { id } });
      if (previous.revision !== revision || previous.status !== "DRAFT") throw new FundValidationError("The fund changed or is no longer a draft. Refresh before editing.");
      const saved = await tx.givingFund.updateMany({ where: { id, revision, status: "DRAFT" }, data: { ...draft, lastEditedById: user.id, revision: { increment: 1 } } });
      if (saved.count !== 1) throw new FundValidationError("The fund changed or is no longer a draft. Refresh before editing.");
      await tx.auditEvent.create({ data: { actorId: user.id, action: "fund.updated", entityType: "GivingFund", entityId: id, metadata: { previousRevision: revision, revision: revision + 1, before: definitionSnapshot(previous), after: definitionSnapshot(draft) } } });
    });
  });
}

export async function transitionGivingFund(form: FormData) {
  const next = String(form.get("status") ?? "") as FundStatus;
  const user = await requirePermission(next === "UNDER_REVIEW" ? "fund.manage" : "fund.approve");
  await finishMutation(async () => {
    if (!FUND_STATUSES.includes(next)) throw new FundValidationError("Invalid fund status transition.");
    const id = fundId(form);
    const revision = parseFundRevision(form.get("revision"));
    const reason = String(form.get("reason") ?? "").trim();
    if (reason.length < 12 || reason.length > 500) throw new FundValidationError("Record the review or status-change reason in 12 to 500 characters.");
    await withSerializableTransactionRetry(async tx => {
      const fund = await tx.givingFund.findUniqueOrThrow({ where: { id } });
      if (fund.revision !== revision) throw new FundValidationError("The fund changed while you were reviewing it. Refresh before changing status.");
      assertFundTransition(fund, next, user.id);
      if (next === "APPROVED") parseFundDraft({ slug: fund.slug, name: fund.name, purpose: fund.purpose, disclosure: fund.disclosure, accountCode: fund.accountCode, acceptedIntents: fund.acceptedIntents });
      const approval = next === "APPROVED" ? { approvedById: user.id, approvedAt: new Date() }
        : next === "DRAFT" ? { approvedById: null, approvedAt: null } : {};
      const saved = await tx.givingFund.updateMany({ where: { id, revision, status: fund.status }, data: { status: next, revision: { increment: 1 }, ...approval } });
      if (saved.count !== 1) throw new FundValidationError("The fund changed while you were reviewing it. Refresh before changing status.");
      await tx.auditEvent.create({ data: { actorId: user.id, action: "fund.status_changed", entityType: "GivingFund", entityId: id, metadata: { from: fund.status, to: next, reason, previousRevision: revision, revision: revision + 1, definition: definitionSnapshot(fund) } } });
    });
  });
}
