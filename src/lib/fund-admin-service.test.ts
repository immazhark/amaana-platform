import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: async (fn: (tx: unknown) => unknown) => fn({
    fund: { create: mocks.create, findUnique: mocks.findUnique, update: mocks.update },
    auditEvent: { create: mocks.audit },
  }),
}));

import { FundAdminError, createFund, updateFund } from "./fund-admin-service";

const input = { slug: "winter-relief", name: "Winter Relief Fund", summary: "Blankets and warm clothing for families.", zakatPolicy: "ACCEPTED" as const, status: "DRAFT" as const, sortOrder: 120, zakatBasis: "Owner ruling recorded 19 Nov 2026" };
const fields = { name: "Orphan Fund", summary: "Scholarships and essentials for orphaned children.", zakatPolicy: "ACCEPTED", status: "ACTIVE", sortOrder: "50" };
const current = (over: Record<string, unknown> = {}) => ({ id: "fund_orphan", name: "Orphan Fund", summary: "old", zakatPolicy: "ACCEPTED", status: "ACTIVE", sortOrder: 50, isGeneral: false, ...over });

describe("createFund", () => {
  beforeEach(() => vi.clearAllMocks());
  it("creates a non-General fund and audits the Zakat basis", async () => {
    mocks.create.mockResolvedValue({ id: "fund_new" });
    await expect(createFund(input, "admin_1")).resolves.toEqual({ id: "fund_new" });
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ slug: "winter-relief", isGeneral: false, zakatPolicy: "ACCEPTED" });
    expect(mocks.audit.mock.calls[0]?.[0].data).toMatchObject({ actorId: "admin_1", action: "fund.create", entityId: "fund_new", metadata: { zakatBasis: "Owner ruling recorded 19 Nov 2026" } });
  });
  it("reports a duplicate slug plainly", async () => {
    mocks.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
    await expect(createFund(input, "admin_1")).rejects.toThrow(/already exists/);
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("never lets a client create a second General fund", async () => {
    mocks.create.mockResolvedValue({ id: "x" });
    await createFund({ ...input, isGeneral: true } as never, "admin_1");
    expect(mocks.create.mock.calls[0]?.[0].data.isGeneral).toBe(false);
  });
});

describe("updateFund", () => {
  beforeEach(() => vi.clearAllMocks());
  it("updates and audits before/after without storing a basis when Zakat is unchanged", async () => {
    mocks.findUnique.mockResolvedValue(current());
    await updateFund("fund_orphan", { ...fields, name: "Orphan Care Fund", status: "PAUSED" }, "admin_1");
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "fund_orphan" }, data: expect.objectContaining({ name: "Orphan Care Fund", status: "PAUSED" }) });
    expect(mocks.audit.mock.calls[0]?.[0].data.metadata).toEqual({ before: { zakatPolicy: "ACCEPTED", status: "ACTIVE", sortOrder: 50 }, after: { zakatPolicy: "ACCEPTED", status: "PAUSED", sortOrder: 50 }, zakatBasis: null });
  });
  it("refuses a Zakat change without a recorded basis and changes nothing", async () => {
    mocks.findUnique.mockResolvedValue(current({ zakatPolicy: "NOT_ACCEPTED" }));
    await expect(updateFund("fund_orphan", fields, "admin_1")).rejects.toBeInstanceOf(FundAdminError);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("records the basis when the Zakat position changes", async () => {
    mocks.findUnique.mockResolvedValue(current({ zakatPolicy: "NOT_ACCEPTED" }));
    await updateFund("fund_orphan", { ...fields, zakatBasis: "Beneficiaries are all Zakat-eligible" }, "admin_1");
    expect(mocks.audit.mock.calls[0]?.[0].data.metadata).toMatchObject({ before: { zakatPolicy: "NOT_ACCEPTED" }, after: { zakatPolicy: "ACCEPTED" }, zakatBasis: "Beneficiaries are all Zakat-eligible" });
  });
  it("protects the General fund from being closed or sent back to draft", async () => {
    mocks.findUnique.mockResolvedValue(current({ isGeneral: true }));
    for (const status of ["CLOSED", "DRAFT"]) await expect(updateFund("fund_general", { ...fields, status }, "admin_1")).rejects.toThrow(/General Fund/);
    expect(mocks.update).not.toHaveBeenCalled();
    await expect(updateFund("fund_general", { ...fields, status: "PAUSED" }, "admin_1")).resolves.toBeUndefined();
  });
  it("rejects an unknown fund and never touches the slug or the General flag", async () => {
    mocks.findUnique.mockResolvedValueOnce(null);
    await expect(updateFund("missing_fund", fields, "admin_1")).rejects.toThrow(/does not exist/);
    mocks.findUnique.mockResolvedValue(current());
    await updateFund("fund_orphan", { ...fields, slug: "hijack", isGeneral: true }, "admin_1");
    const data = mocks.update.mock.calls[0]?.[0].data;
    expect(data).not.toHaveProperty("slug");
    expect(data).not.toHaveProperty("isGeneral");
  });
});
