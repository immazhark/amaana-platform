import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  redirect: vi.fn((url: string) => { throw new Error("MOCK_REDIRECT:" + url); }),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
  memberFind: vi.fn(),
  memberList: vi.fn(),
  memberUpdate: vi.fn(),
  groupList: vi.fn(),
  groupUpdate: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));
vi.mock("@/lib/storage", () => ({
  deletePublicMediaObject: vi.fn(),
  uploadPublicMediaFile: vi.fn(),
}));
vi.mock("@/lib/server-log", () => ({ logServerError: vi.fn() }));

import { reorderTeamGroup, reorderTeamMember } from "./actions";

function move(id: string, direction: "up" | "down") {
  const data = new FormData();
  data.set("id", id);
  data.set("direction", direction);
  return data;
}

function ordered(ids: readonly string[]) {
  return ids.map((id, index) => ({ id, sortOrder: (index + 1) * 10 }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requirePermission.mockResolvedValue({ id: "synthetic-admin" });
  mocks.memberUpdate.mockResolvedValue({});
  mocks.groupUpdate.mockResolvedValue({});
  mocks.audit.mockResolvedValue({});
  mocks.transaction.mockImplementation(async callback => callback({
    teamMember: {
      findUnique: mocks.memberFind,
      findMany: mocks.memberList,
      update: mocks.memberUpdate,
    },
    teamGroup: {
      findMany: mocks.groupList,
      update: mocks.groupUpdate,
    },
    auditEvent: { create: mocks.audit },
  }));
});

describe("bounded team reordering write cost", () => {
  it("moves an adjacent member with only two updates when positions are unique", async () => {
    mocks.memberFind.mockResolvedValue({ id: "member-b", groupId: "group-one", deletedAt: null });
    mocks.memberList.mockResolvedValue(ordered(["member-a", "member-b", "member-c", "member-d", "member-e"]));

    await expect(reorderTeamMember(move("member-b", "down"))).rejects.toThrow(/MOCK_REDIRECT/);

    expect(mocks.requirePermission).toHaveBeenCalledWith("content.update");
    expect(mocks.memberUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.memberUpdate).toHaveBeenCalledWith({
      where: { id: "member-b" }, data: { sortOrder: 30 },
    });
    expect(mocks.memberUpdate).toHaveBeenCalledWith({
      where: { id: "member-c" }, data: { sortOrder: 20 },
    });
    expect(mocks.audit).toHaveBeenCalledWith({ data: {
      actorId: "synthetic-admin",
      action: "team.members_reordered",
      entityType: "TeamGroup",
      entityId: "group-one",
    } });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/team");
  });

  it("moves an adjacent group with only two updates when positions are unique", async () => {
    mocks.groupList.mockResolvedValue(ordered(["group-a", "group-b", "group-c", "group-d", "group-e"]));

    await expect(reorderTeamGroup(move("group-b", "up"))).rejects.toThrow(/MOCK_REDIRECT/);

    expect(mocks.requirePermission).toHaveBeenCalledWith("content.update");
    expect(mocks.groupUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.groupUpdate).toHaveBeenCalledWith({
      where: { id: "group-b" }, data: { sortOrder: 10 },
    });
    expect(mocks.groupUpdate).toHaveBeenCalledWith({
      where: { id: "group-a" }, data: { sortOrder: 20 },
    });
    expect(mocks.audit).toHaveBeenCalledWith({ data: {
      actorId: "synthetic-admin",
      action: "team.groups_reordered",
      entityType: "TeamGroup",
      entityId: "group-b",
    } });
  });

  it("normalizes tied adjacent member positions instead of performing an ineffective swap", async () => {
    mocks.memberFind.mockResolvedValue({ id: "member-a", groupId: "group-one", deletedAt: null });
    mocks.memberList.mockResolvedValue([
      { id: "member-a", sortOrder: 10 },
      { id: "member-b", sortOrder: 10 },
      { id: "member-c", sortOrder: 30 },
    ]);

    await expect(reorderTeamMember(move("member-a", "down"))).rejects.toThrow(/MOCK_REDIRECT/);

    expect(mocks.memberUpdate).toHaveBeenCalledTimes(3);
    expect(mocks.memberUpdate.mock.calls.map(([arg]) => [arg.where.id, arg.data.sortOrder]))
      .toEqual([["member-b", 10], ["member-a", 20], ["member-c", 30]]);
  });

  it("normalizes when a non-adjacent group shares one of the two positions", async () => {
    mocks.groupList.mockResolvedValue([
      { id: "group-a", sortOrder: 10 },
      { id: "group-b", sortOrder: 20 },
      { id: "group-c", sortOrder: 20 },
      { id: "group-d", sortOrder: 30 },
    ]);

    await expect(reorderTeamGroup(move("group-a", "down"))).rejects.toThrow(/MOCK_REDIRECT/);

    expect(mocks.groupUpdate).toHaveBeenCalledTimes(4);
    expect(mocks.groupUpdate.mock.calls.map(([arg]) => [arg.where.id, arg.data.sortOrder]))
      .toEqual([["group-b", 10], ["group-a", 20], ["group-c", 30], ["group-d", 40]]);
  });

  it("does not write or audit when a member cannot move beyond the first position", async () => {
    mocks.memberFind.mockResolvedValue({ id: "member-a", groupId: "group-one", deletedAt: null });
    mocks.memberList.mockResolvedValue(ordered(["member-a", "member-b", "member-c"]));

    await expect(reorderTeamMember(move("member-a", "up"))).rejects.toThrow(/MOCK_REDIRECT/);

    expect(mocks.memberUpdate).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
