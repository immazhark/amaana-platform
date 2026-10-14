import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), create: vi.fn(), find: vi.fn(), update: vi.fn(), audit: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: (fn: (tx: unknown) => unknown) => fn({ givingFund: { create: m.create, findUniqueOrThrow: m.find, updateMany: m.update }, auditEvent: { create: m.audit } }) }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (target: string) => { throw new Error(target); } }));
import { createGivingFund, transitionGivingFund, updateGivingFund } from "./actions";
const current = { id: "fund-1", revision: 3, status: "UNDER_REVIEW", createdById: "creator", lastEditedById: "editor", slug: "reviewed-fund", name: "Reviewed programme", purpose: "A reviewed restricted programme purpose.", disclosure: "The reviewed donor-facing purpose and restrictions.", accountCode: "TEST-FUND", acceptedIntents: ["GENERAL"] };
function form(values: Record<string, string> = {}) {
  const f = new FormData();
  for (const [key, value] of Object.entries({ id: "fund-1", revision: "3", status: "APPROVED", reason: "The purpose and disclosure have been independently reviewed.", ...values })) f.set(key, value);
  return f;
}
function draftForm(values: Record<string, string> = {}) {
  const f = form({ slug: current.slug, name: current.name, purpose: current.purpose, disclosure: current.disclosure, accountCode: current.accountCode, ...values });
  f.set("acceptedIntents", "GENERAL");
  return f;
}
describe("fund registry server actions", () => {
  beforeEach(() => { vi.clearAllMocks(); m.permission.mockResolvedValue({ id: "approver" }); m.find.mockResolvedValue(current); m.create.mockResolvedValue({ id: "fund-1" }); m.update.mockResolvedValue({ count: 1 }); m.audit.mockResolvedValue({ id: "audit-1" }); });
  it.each([createGivingFund, updateGivingFund, transitionGivingFund])("requires permission before any persistence", async action => {
    m.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(action(draftForm())).rejects.toThrow("Forbidden");
    expect(m.create).not.toHaveBeenCalled(); expect(m.find).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
  });
  it("creates a private draft with creator/editor identity and one audit", async () => {
    await expect(createGivingFund(draftForm())).rejects.toThrow("saved=1");
    expect(m.permission).toHaveBeenCalledWith("fund.manage");
    expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ createdById: "approver", lastEditedById: "approver", acceptedIntents: ["GENERAL"] }), select: { id: true } });
    expect(m.create.mock.calls[0]![0].data).not.toHaveProperty("status");
    expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "fund.created", actorId: "approver" }) });
  });
  it("rejects unreviewed Zakat draft data before writing", async () => {
    const f = draftForm(); f.set("acceptedIntents", "ZAKAT");
    await expect(createGivingFund(f)).rejects.toThrow("error=");
    expect(m.create).not.toHaveBeenCalled();
  });
  it("restricts updates to the exact rendered draft revision", async () => {
    m.find.mockResolvedValue({ ...current, status: "DRAFT" });
    await expect(updateGivingFund(draftForm())).rejects.toThrow("saved=1");
    expect(m.update).toHaveBeenCalledWith({ where: { id: "fund-1", revision: 3, status: "DRAFT" }, data: expect.objectContaining({ revision: { increment: 1 }, lastEditedById: "approver" }) });
  });
  it.each(["creator", "editor"])("rejects approval by %s inside the transaction", async id => {
    m.permission.mockResolvedValue({ id });
    await expect(transitionGivingFund(form())).rejects.toThrow(/different%20approver/);
    expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  });
  it("binds independent approval to exact state/revision and stamps the reviewer", async () => {
    await expect(transitionGivingFund(form())).rejects.toThrow("saved=1");
    expect(m.permission).toHaveBeenCalledWith("fund.approve");
    expect(m.update).toHaveBeenCalledWith({ where: { id: "fund-1", revision: 3, status: "UNDER_REVIEW" }, data: { status: "APPROVED", revision: { increment: 1 }, approvedById: "approver", approvedAt: expect.any(Date) } });
    expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "fund.status_changed", metadata: expect.objectContaining({ from: "UNDER_REVIEW", to: "APPROVED" }) }) });
    expect(m.revalidate.mock.invocationCallOrder[0]).toBeGreaterThan(m.audit.mock.invocationCallOrder[0]!);
    expect(m.revalidate).toHaveBeenCalledWith("/donate");
  });
  it("rejects a stale review before the status write", async () => {
    m.find.mockResolvedValue({ ...current, revision: 4 });
    await expect(transitionGivingFund(form())).rejects.toThrow(/changed/);
    expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  });
  it.each([updateGivingFund, transitionGivingFund])("rejects a lost mutation claim without audit or success invalidation", async action => {
    if (action === updateGivingFund) m.find.mockResolvedValue({ ...current, status: "DRAFT" });
    m.update.mockResolvedValue({ count: 0 });
    await expect(action(draftForm())).rejects.toThrow("error=");
    expect(m.audit).not.toHaveBeenCalled(); expect(m.revalidate).not.toHaveBeenCalled();
  });
  it("preserves the actual before/after fund definition in the private audit", async () => {
    m.find.mockResolvedValue({ ...current, status: "DRAFT" });
    await expect(updateGivingFund(draftForm({ purpose: "An independently reviewable revised programme purpose." }))).rejects.toThrow("saved=1");
    expect(m.audit).toHaveBeenCalledWith({ data: expect.objectContaining({ metadata: expect.objectContaining({
      before: { slug: current.slug, name: current.name, purpose: current.purpose, disclosure: current.disclosure, accountCode: current.accountCode, acceptedIntents: ["GENERAL"] },
      after: expect.objectContaining({ purpose: "An independently reviewable revised programme purpose." }),
    }) }) });
    expect(m.revalidate.mock.invocationCallOrder[0]).toBeGreaterThan(m.audit.mock.invocationCallOrder[0]!);
    expect(m.revalidate).toHaveBeenCalledWith("/donate");
  });
  it.each([{ status: "DRAFT", revision: 4 }, { status: "APPROVED", revision: 3 }])("does not edit a changed draft or approved definition", async state => {
    m.find.mockResolvedValue({ ...current, ...state });
    await expect(updateGivingFund(draftForm())).rejects.toThrow("error=");
    expect(m.update).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  });
  it("clears approval when a paused definition returns for editing", async () => {
    m.find.mockResolvedValue({ ...current, status: "PAUSED", approvedById: "other-approver", approvedAt: new Date() });
    await expect(transitionGivingFund(form({ status: "DRAFT" }))).rejects.toThrow("saved=1");
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "DRAFT", revision: { increment: 1 }, approvedById: null, approvedAt: null } }));
  });
  it("revalidates stored intentions at approval, including direct database corruption", async () => {
    m.find.mockResolvedValue({ ...current, acceptedIntents: ["ZAKAT"] });
    await expect(transitionGivingFund(form())).rejects.toThrow("error=");
    expect(m.update).not.toHaveBeenCalled();
  });
  it.each(["create", "find", "update", "audit"] as const)("does not expose unexpected %s diagnostics", async boundary => {
    m[boundary].mockRejectedValue(new Error("synthetic-private-database-credential"));
    await expect((boundary === "create" ? createGivingFund : transitionGivingFund)(draftForm())).rejects.toThrow("error=Unable%20to%20save");
    expect(m.revalidate).not.toHaveBeenCalled();
  });
});
