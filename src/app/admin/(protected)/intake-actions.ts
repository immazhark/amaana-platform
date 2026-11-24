"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Opens or pauses new assistance requests. Authorised approvers only; the change is audited. Never reopens by itself. */
export async function setAssistanceIntakeAction(formData: FormData): Promise<void> {
  const user = await requirePermission("assistance.approve");
  const paused = formData.get("paused") === "true";
  await prisma.$transaction([
    prisma.assistanceIntakeSetting.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", paused, updatedById: user.id },
      update: { paused, updatedById: user.id },
    }),
    prisma.auditEvent.create({
      data: { actorId: user.id, action: paused ? "assistance.intake_paused" : "assistance.intake_opened", entityType: "AssistanceIntakeSetting", entityId: "singleton", metadata: {} },
    }),
  ]);
  revalidatePath("/admin");
}
