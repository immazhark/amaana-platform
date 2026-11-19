import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fundFind: vi.fn(), count: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: async (fn: (tx: unknown) => unknown) => fn({
    fund: { findUnique: mocks.fundFind },
    fundCampaign: { count: mocks.count, create: mocks.create, findUnique: mocks.findUnique, update: mocks.update },
    auditEvent: { create: mocks.audit },
  }),
}));

import { CampaignAdminError, createCampaign, updateCampaign } from "./fund-campaign-service";

const input = { fundId: "fund_eid_kits", slug: "eid-kits-2027", title: "Eid Kits 2027", unitLabel: "kit", unitLabelPlural: "kits", unitPrice: 1500, maxUnits: 100, opensAt: new Date("2027-02-18T03:30:00Z"), closesAt: new Date("2027-02-24T18:29:00Z"), status: "ACTIVE" as const, note: null };
const fields = { title: "Eid Kits 2027", unitLabel: "kit", unitLabelPlural: "kits", unitPrice: "1500", maxUnits: "100", opensAt: "2027-02-18T09:00", closesAt: "2027-02-24T23:59", status: "ACTIVE", note: "" };
const current = (over: Record<string, unknown> = {}) => ({ id: "camp_1", fundId: "fund_eid_kits", status: "DRAFT", unitPrice: { toString: () => "1500" }, maxUnits: 100, opensAt: new Date("2027-02-18T03:30:00Z"), closesAt: new Date("2027-02-24T18:29:00Z"), fund: { status: "ACTIVE" }, _count: { donations: 0 }, ...over });

describe("createCampaign", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.fundFind.mockResolvedValue({ id: "fund_eid_kits", status: "ACTIVE" }); mocks.count.mockResolvedValue(0); mocks.create.mockResolvedValue({ id: "camp_new" }); });
  it("creates the campaign and audits it, stamping the creator", async () => {
    await expect(createCampaign(input, "admin_1")).resolves.toEqual({ id: "camp_new" });
    expect(mocks.create.mock.calls[0]?.[0].data).toMatchObject({ slug: "eid-kits-2027", unitPrice: 1500, createdById: "admin_1" });
    expect(mocks.audit.mock.calls[0]?.[0].data).toMatchObject({ actorId: "admin_1", action: "fund.campaign.create", entityId: "camp_new" });
  });
  it("refuses an unknown fund, and opening a campaign on a fund that is not active", async () => {
    mocks.fundFind.mockResolvedValueOnce(null);
    await expect(createCampaign(input, "a")).rejects.toThrow(/does not exist/);
    mocks.fundFind.mockResolvedValueOnce({ id: "fund_eid_kits", status: "DRAFT" });
    await expect(createCampaign(input, "a")).rejects.toThrow(/Activate the fund/);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("allows a draft campaign on a draft fund", async () => {
    mocks.fundFind.mockResolvedValueOnce({ id: "fund_eid_kits", status: "DRAFT" });
    await expect(createCampaign({ ...input, status: "DRAFT" }, "a")).resolves.toBeTruthy();
  });
  it("refuses an active window that overlaps another active campaign on the fund", async () => {
    mocks.count.mockResolvedValueOnce(1);
    await expect(createCampaign(input, "a")).rejects.toThrow(/overlaps/);
    expect(mocks.count.mock.calls[0]?.[0].where).toMatchObject({ fundId: "fund_eid_kits", status: "ACTIVE", opensAt: { lt: input.closesAt }, closesAt: { gt: input.opensAt } });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("does not check overlap for a draft", async () => {
    await createCampaign({ ...input, status: "DRAFT" }, "a");
    expect(mocks.count).not.toHaveBeenCalled();
  });
  it("reports a duplicate slug plainly", async () => {
    mocks.create.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
    await expect(createCampaign(input, "a")).rejects.toThrow(/already exists/);
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});

describe("updateCampaign", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.count.mockResolvedValue(0); mocks.findUnique.mockResolvedValue(current()); });
  it("updates, never touching the slug or the fund, and audits before and after", async () => {
    await updateCampaign("camp_1", { ...fields, slug: "hijack", fundId: "other" }, "admin_1");
    const data = mocks.update.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({ status: "ACTIVE", unitPrice: 1500 });
    expect(data).not.toHaveProperty("slug");
    expect(data).not.toHaveProperty("fundId");
    expect(mocks.audit.mock.calls[0]?.[0].data.metadata).toMatchObject({ before: { status: "DRAFT", unitPrice: 1500 }, after: { status: "ACTIVE", unitPrice: 1500 }, giftsAtChange: 0 });
  });
  it("freezes the price once any gift exists, but still allows closing", async () => {
    mocks.findUnique.mockResolvedValue(current({ status: "ACTIVE", _count: { donations: 4 } }));
    await expect(updateCampaign("camp_1", { ...fields, unitPrice: "1600" }, "a")).rejects.toThrow(/price cannot change/);
    expect(mocks.update).not.toHaveBeenCalled();
    await expect(updateCampaign("camp_1", { ...fields, status: "CLOSED" }, "a")).resolves.toBeUndefined();
  });
  it("lets the price change while there are no gifts", async () => {
    await updateCampaign("camp_1", { ...fields, unitPrice: "1600" }, "a");
    expect(mocks.update.mock.calls[0]?.[0].data.unitPrice).toBe(1600);
  });
  it("never reopens a closed campaign or moves an active one back to draft", async () => {
    mocks.findUnique.mockResolvedValue(current({ status: "CLOSED" }));
    await expect(updateCampaign("camp_1", { ...fields, status: "ACTIVE" }, "a")).rejects.toThrow(/cannot be reopened/);
    mocks.findUnique.mockResolvedValue(current({ status: "ACTIVE" }));
    await expect(updateCampaign("camp_1", { ...fields, status: "DRAFT" }, "a")).rejects.toThrow(/stay active or be closed/);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("needs an active fund, no overlap (excluding itself), and valid fields", async () => {
    mocks.findUnique.mockResolvedValue(current({ fund: { status: "PAUSED" } }));
    await expect(updateCampaign("camp_1", fields, "a")).rejects.toThrow(/Activate the fund/);
    mocks.findUnique.mockResolvedValue(current());
    mocks.count.mockResolvedValueOnce(2);
    await expect(updateCampaign("camp_1", fields, "a")).rejects.toThrow(/overlaps/);
    expect(mocks.count.mock.calls[0]?.[0].where.id).toEqual({ not: "camp_1" });
    await expect(updateCampaign("camp_1", { ...fields, unitPrice: "0" }, "a")).rejects.toBeInstanceOf(CampaignAdminError);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects an unknown campaign", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(updateCampaign("missing", fields, "a")).rejects.toThrow(/does not exist/);
  });
});
