"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import {
  PRIVATE_MILESTONE_ACTION,
  canAddPrivateMilestone,
  parsePrivateMilestoneInput,
  readPrivateMilestone,
} from "@/lib/assistance-private-milestone";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

/** Private, append-only operational log. Does not change case status, verification,
 * beneficiary communications or public appeal updates. */
export async function addPrivateMilestone(form: FormData) {
  const user = await requirePermission("assistance.update");
  const { id, kind, summary, submissionId, expectedUpdatedAt } = parsePrivateMilestoneInput(form);

  await withSerializableTransactionRetry(async tx => {
    const request = await tx.assistanceRequest.findUnique({
      where: { id },
      select: { id: true, status: true, appealId: true, updatedAt: true },
    });
    if (!request) throw new Error("Assistance case no longer exists.");

    // A browser retry after an uncertain response must not create a second
    // private milestone. Serializable isolation resolves concurrent submissions.
    const previous = await tx.auditEvent.findFirst({
      where: {
        entityType: "AssistanceRequest",
        entityId: id,
        action: PRIVATE_MILESTONE_ACTION,
        metadata: { path: ["submissionId"], equals: submissionId },
      },
      select: { id: true, metadata: true },
    });
    if (previous) {
      const recorded = readPrivateMilestone(previous.metadata);
      if (!recorded || recorded.kind !== kind || recorded.summary !== summary) {
        throw new Error("Submission token was reused for a different private follow-up. Reload this case.");
      }
      return;
    }

    if (!canAddPrivateMilestone(request.status, request.appealId)) {
      throw new Error("This case is closed, rejected or linked to an appeal. New case follow-ups are locked.");
    }
    if (request.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new Error("The case changed during review. Reload before recording a follow-up.");
    }

    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        action: PRIVATE_MILESTONE_ACTION,
        entityType: "AssistanceRequest",
        entityId: id,
        metadata: { kind, summary, submissionId },
      },
    });
  });

  // Cache invalidation is not part of the committed append-only transaction.
  try { revalidatePath(`/admin/requests/${id}`); } catch { /* navigation forces a fresh read */ }
  redirect(`/admin/requests/${id}`);
}
