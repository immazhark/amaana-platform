"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { deletePublicMediaObject, uploadPublicMediaFile } from "@/lib/storage";
import { logServerError } from "@/lib/server-log";
import {
  parseTeamMemberForm, parseTeamGroupForm, parseTeamCommand,
  singleTeamId, teamEditVersion, teamPhotoInput,
} from "@/lib/team-validation";

function refreshTeam() {
  revalidatePath("/team");
  revalidatePath("/about");
  revalidatePath("/admin/team");
}

function teamActionError(error: unknown): string {
  if (!(error instanceof Error)) return "Unable to save this change.";
  if ("code" in error && error.code === "P2002") return "The slug or group key is already in use.";
  const message = error.message;
  if (/^(Invalid|Provide|Choose|Photograph|Team |This team|No such|An identity|A group)/i.test(message)) return message.slice(0, 170);
  logServerError("admin.team.action_failed");
  return "Unable to save this change. Please retry.";
}

async function perform(change: () => Promise<void>, success: string) {
  let errorMessage: string | null = null;
  try {
    await change();
  } catch (error) {
    errorMessage = teamActionError(error);
  }
  if (errorMessage) redirect(`/admin/team?error=${encodeURIComponent(errorMessage)}`);
  refreshTeam();
  redirect(`/admin/team?notice=${encodeURIComponent(success)}`);
}

async function storePortrait(file: File) {
  const input = Buffer.from(await file.arrayBuffer());
  const bytes = await sharp(input, { failOn: "error", limitInputPixels: 25_000_000 })
    .rotate().resize({ width: 960, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 }).toBuffer();
  return uploadPublicMediaFile(new File([new Uint8Array(bytes)], "team-portrait.webp", { type: "image/webp" }));
}

async function cleanupPhoto(storageKey: string) {
  try { await deletePublicMediaObject(storageKey); }
  catch { logServerError("admin.team.photo_cleanup_failed"); }
}

export async function createTeamMember(formData: FormData) {
  const user = await requirePermission("content.update");
  await perform(async () => {
    const input = parseTeamMemberForm(formData);
    const { file } = teamPhotoInput(formData);
    const uploaded = file ? await storePortrait(file) : null;
    try {
      await withSerializableTransactionRetry(async tx => {
        const group = await tx.teamGroup.findUnique({ where: { id: input.groupId } });
        if (!group) throw new Error("No such team group.");
        const last = await tx.teamMember.aggregate({ where: { groupId: input.groupId }, _max: { sortOrder: true } });
        const record = await tx.teamMember.create({
          data: {
            ...input, sortOrder: (last._max.sortOrder ?? 0) + 10,
            photoStorageKey: uploaded?.objectKey ?? null,
            photoWidth: uploaded?.width ?? null, photoHeight: uploaded?.height ?? null,
            photoConsentAt: uploaded ? new Date() : null,
          },
        });
        await tx.auditEvent.create({
          data: { actorId: user.id, action: "team.member_created", entityType: "TeamMember", entityId: record.id },
        });
      });
    } catch (error) {
      if (uploaded) await cleanupPhoto(uploaded.objectKey);
      throw error;
    }
  }, "Team member added.");
}

export async function updateTeamMember(formData: FormData) {
  const user = await requirePermission("content.update");
  await perform(async () => {
    const id = singleTeamId(formData);
    const version = teamEditVersion(formData);
    const input = parseTeamMemberForm(formData);
    const { file, removePhoto } = teamPhotoInput(formData);
    const previous = await prisma.teamMember.findUnique({ where: { id } });
    if (!previous || previous.deletedAt) throw new Error("No such team member.");
    if (previous.updatedAt.getTime() !== version.getTime()) {
      throw new Error("This team member changed. Refresh before editing.");
    }
    const uploaded = file ? await storePortrait(file) : null;
    try {
      await withSerializableTransactionRetry(async tx => {
        const claimed = await tx.teamMember.updateMany({
          where: { id, updatedAt: version, deletedAt: null },
          data: {
            ...input,
            ...(uploaded
              ? { photoStorageKey: uploaded.objectKey, photoConsentAt: new Date(), photoWidth: uploaded.width, photoHeight: uploaded.height }
              : removePhoto
                ? { photoStorageKey: null, photoConsentAt: null, photoWidth: null, photoHeight: null, photoAlt: null }
                : {}),
          },
        });
        if (claimed.count !== 1) throw new Error("This team member changed. Refresh before editing.");
        await tx.auditEvent.create({
          data: { actorId: user.id, action: "team.member_updated", entityType: "TeamMember", entityId: id },
        });
      });
    } catch (error) {
      if (uploaded) await cleanupPhoto(uploaded.objectKey);
      throw error;
    }
    if ((uploaded || removePhoto) && previous.photoStorageKey && previous.photoStorageKey !== uploaded?.objectKey) {
      await cleanupPhoto(previous.photoStorageKey);
    }
  }, "Team member updated.");
}

export async function deleteTeamMember(formData: FormData) {
  const user = await requirePermission("content.update");
  await perform(async () => {
    const id = singleTeamId(formData);
    const version = teamEditVersion(formData);
    if (formData.getAll("confirm").length !== 1 || formData.get("confirm") !== "DELETE") {
      throw new Error("Choose DELETE to confirm removal.");
    }
    const formerKey = await withSerializableTransactionRetry(async tx => {
      const member = await tx.teamMember.findUnique({ where: { id } });
      if (!member || member.deletedAt || member.updatedAt.getTime() !== version.getTime()) {
        throw new Error("This team member changed. Refresh before removal.");
      }
      const removed = await tx.teamMember.updateMany({
        where: { id, updatedAt: version, deletedAt: null },
        data: {
          deletedAt: new Date(),
          isPublished: false,
          fullName: "Removed team member",
          designation: "Removed",
          bio: null,
          linkedinUrl: null,
          email: null,
          photoStorageKey: null,
          photoConsentAt: null,
          photoAlt: null,
          photoWidth: null,
          photoHeight: null,
        },
      });
      if (removed.count !== 1) throw new Error("This team member changed. Refresh before removal.");
      await tx.auditEvent.create({
        data: { actorId: user.id, action: "team.member_deleted", entityType: "TeamMember", entityId: id },
      });
      return member.photoStorageKey;
    });
    if (formerKey) await cleanupPhoto(formerKey);
  }, "Team member removed.");
}

export async function reorderTeamMember(formData: FormData) {
  const user = await requirePermission("content.update");
  await perform(async () => {
    const { id, direction } = parseTeamCommand(formData);
    await withSerializableTransactionRetry(async tx => {
      const selected = await tx.teamMember.findUnique({ where: { id } });
      if (!selected || selected.deletedAt) throw new Error("No such team member.");
      const siblings = await tx.teamMember.findMany({
        where: { groupId: selected.groupId, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      const at = siblings.findIndex(item => item.id === id);
      if (at < 0) throw new Error("No such team member.");
      const next = at + (direction === "up" ? -1 : 1);
      if (next < 0 || next >= siblings.length) return;
      const currentMember = siblings[at]!;
      siblings[at] = siblings[next]!;
      siblings[next] = currentMember;
      for (let index = 0; index < siblings.length; index++) {
        await tx.teamMember.update({ where: { id: siblings[index]!.id }, data: { sortOrder: (index + 1) * 10 } });
      }
      await tx.auditEvent.create({
        data: { actorId: user.id, action: "team.members_reordered", entityType: "TeamGroup", entityId: selected.groupId },
      });
    });
  }, "Member order updated.");
}

export async function createTeamGroup(formData: FormData) {
  const user = await requirePermission("content.update");
  await perform(async () => {
    const input = parseTeamGroupForm(formData);
    await withSerializableTransactionRetry(async tx => {
      const last = await tx.teamGroup.aggregate({ _max: { sortOrder: true } });
      const group = await tx.teamGroup.create({ data: { ...input, sortOrder: (last._max.sortOrder ?? 0) + 10 } });
      await tx.auditEvent.create({
        data: { actorId: user.id, action: "team.group_created", entityType: "TeamGroup", entityId: group.id },
      });
    });
  }, "Team group added.");
}

export async function updateTeamGroup(formData: FormData) {
  const user = await requirePermission("content.update");
  await perform(async () => {
    const id = singleTeamId(formData);
    const version = teamEditVersion(formData);
    const input = parseTeamGroupForm(formData);
    await withSerializableTransactionRetry(async tx => {
      const updated = await tx.teamGroup.updateMany({ where: { id, updatedAt: version }, data: input });
      if (updated.count !== 1) throw new Error("This team group changed. Refresh before editing.");
      await tx.auditEvent.create({
        data: { actorId: user.id, action: "team.group_updated", entityType: "TeamGroup", entityId: id },
      });
    });
  }, "Team group updated.");
}

export async function reorderTeamGroup(formData: FormData) {
  const user = await requirePermission("content.update");
  await perform(async () => {
    const { id, direction } = parseTeamCommand(formData);
    await withSerializableTransactionRetry(async tx => {
      const groups = await tx.teamGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } });
      const at = groups.findIndex(group => group.id === id);
      if (at < 0) throw new Error("No such team group.");
      const next = at + (direction === "up" ? -1 : 1);
      if (next < 0 || next >= groups.length) return;
      const currentGroup = groups[at]!;
      groups[at] = groups[next]!;
      groups[next] = currentGroup;
      for (let index = 0; index < groups.length; index++) {
        await tx.teamGroup.update({ where: { id: groups[index]!.id }, data: { sortOrder: (index + 1) * 10 } });
      }
      await tx.auditEvent.create({
        data: { actorId: user.id, action: "team.groups_reordered", entityType: "TeamGroup", entityId: id },
      });
    });
  }, "Group order updated.");
}
