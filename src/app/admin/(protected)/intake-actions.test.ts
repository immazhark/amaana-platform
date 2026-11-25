import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  upsert: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    assistanceIntakeSetting: { upsert: mocks.upsert },
    auditEvent: { create: mocks.audit },
    $transaction: mocks.transaction,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { setAssistanceIntakeAction } from "./intake-actions";

const actorId = "synthetic-approver";
const form = (...values: (string | File)[]) => {
  const data = new FormData();
  for (const value of values) data.append("paused", value);
  return data;
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({ id: actorId });
  mocks.upsert.mockReturnValue("setting-operation");
  mocks.audit.mockReturnValue("audit-operation");
  mocks.transaction.mockResolvedValue([]);
});

function expectNoWrite() {
  expect(mocks.upsert).not.toHaveBeenCalled();
  expect(mocks.audit).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
}

describe("assistance intake decision", () => {
  it.each([
    { name: "missing", data: form() },
    { name: "empty", data: form("") },
    { name: "invalid", data: form("other") },
    { name: "uppercase", data: form("TRUE") },
    { name: "repeated", data: form("true", "true") },
    { name: "conflicting", data: form("false", "true") },
    { name: "file", data: form(new File(["false"], "decision.txt")) },
  ])("refuses $name input without any setting, audit or cache effect", async ({ data }) => {
    await expect(setAssistanceIntakeAction(data)).rejects.toThrow("Invalid intake decision.");
    expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("assistance.approve");
    expectNoWrite();
  });

  it.each([true, false])("honours an explicit %s decision and records the actor atomically", async (paused) => {
    await setAssistanceIntakeAction(form(String(paused)));
    expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("assistance.approve");
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      where: { id: "singleton" },
      create: { id: "singleton", paused, updatedById: actorId },
      update: { paused, updatedById: actorId },
    });
    expect(mocks.audit).toHaveBeenCalledExactlyOnceWith({
      data: {
        actorId, action: paused ? "assistance.intake_paused" : "assistance.intake_opened",
        entityType: "AssistanceIntakeSetting", entityId: "singleton", metadata: {},
      },
    });
    expect(mocks.transaction).toHaveBeenCalledExactlyOnceWith(["setting-operation", "audit-operation"]);
    expect(mocks.revalidate).toHaveBeenCalledExactlyOnceWith("/admin");
  });

  it("stops when the existing approval permission is denied", async () => {
    mocks.permission.mockRejectedValue(new Error("Permission denied"));
    await expect(setAssistanceIntakeAction(form("false"))).rejects.toThrow("Permission denied");
    expect(mocks.permission).toHaveBeenCalledExactlyOnceWith("assistance.approve");
    expectNoWrite();
  });
});
