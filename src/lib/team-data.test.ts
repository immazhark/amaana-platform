import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { teamGroup: { findMany: mocks.findMany, findUnique: mocks.findUnique } },
}));

import { getPublishedTeam, getPublishedTrustees } from "./team-data";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findMany.mockResolvedValue([]);
  mocks.findUnique.mockResolvedValue(null);
});

it("AF-R012 selects only rendered public Team group fields with the approved member projection", async () => {
  const approvedMember = {
    id: "synthetic-member",
    slug: "synthetic-member",
    fullName: "Synthetic Volunteer",
    designation: "Volunteer",
    bio: "Synthetic profile",
    photoStorageKey: null,
    photoConsentAt: null,
    photoAlt: null,
    linkedinUrl: null,
    email: null,
    updatedAt: new Date("2026-11-10T00:00:00Z"),
  };
  const group = {
    id: "synthetic-group",
    key: "VOLUNTEERS",
    title: "Volunteers",
    description: "Synthetic public team",
    members: [approvedMember],
  };
  mocks.findMany.mockResolvedValue([group]);

  const result = await getPublishedTeam();

  expect(mocks.findMany).toHaveBeenCalledExactlyOnceWith({
    where: { members: { some: { isPublished: true, deletedAt: null } } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      key: true,
      title: true,
      description: true,
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
  expect(result).toEqual([group]);
});

it("does not render empty Team sections even if the query provides one", async () => {
  const published = {
    id: "group-with-members",
    key: "VOLUNTEERS",
    title: "Volunteers",
    description: null,
    members: [{ id: "synthetic-member" }],
  };
  mocks.findMany.mockResolvedValue([
    { id: "group-without-members", key: "OTHER", title: "Other", description: null, members: [] },
    published,
  ]);
  expect(await getPublishedTeam()).toEqual([published]);
});

it("keeps the separate trustees reader limited to approved directory identity fields", async () => {
  const trustees = [{ id: "synthetic-trustee", slug: "synthetic-trustee", fullName: "Synthetic Trustee", designation: "Trustee" }];
  mocks.findUnique.mockResolvedValue({ members: trustees });
  expect(await getPublishedTrustees()).toEqual(trustees);
  expect(mocks.findUnique).toHaveBeenCalledExactlyOnceWith({
    where: { key: "TRUSTEES" },
    select: {
      members: {
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, slug: true, fullName: true, designation: true },
      },
    },
  });
});
