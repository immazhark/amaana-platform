import "server-only";
import { prisma } from "@/lib/prisma";

export async function getPublishedTeam() {
  const groups = await prisma.teamGroup.findMany({
    where: { members: { some: { isPublished: true, deletedAt: null } } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      members: {
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true, slug: true, fullName: true, designation: true, bio: true,
          photoStorageKey: true, photoConsentAt: true, photoAlt: true,
          linkedinUrl: true, email: true, updatedAt: true,
        },
      },
    },
  });
  return groups.filter(group => group.members.length > 0);
}

export async function getPublishedTrustees() {
  const group = await prisma.teamGroup.findUnique({
    where: { key: "TRUSTEES" },
    select: {
      members: {
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, slug: true, fullName: true, designation: true },
      },
    },
  });
  return group?.members ?? [];
}
