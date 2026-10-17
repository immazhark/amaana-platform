import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), has: vi.fn(), permissions: vi.fn(), redirect: vi.fn(), count: vi.fn(), group: vi.fn(), find: vi.fn(), followUps: vi.fn(), deliveryGroups: vi.fn(), outcomeGroups: vi.fn(), auditGroups: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAuthenticatedUser: m.user, hasPermission: m.has, permissionKeys: m.permissions }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { count: m.count, groupBy: m.group, findMany: m.find },
  assistanceFollowUp: { groupBy: m.followUps },
  assistanceDeliveryRecord: { groupBy: m.deliveryGroups },
  assistanceOutcomeObservation: { groupBy: m.outcomeGroups },
  auditEvent: { groupBy: m.auditGroups },
} }));
import AdminQueuePage from "./page";
const html = async (params: Record<string, string | string[]> = {}) => renderToStaticMarkup(await AdminQueuePage({ searchParams: Promise.resolve(params) }));

beforeEach(() => {
  vi.resetAllMocks();
  m.user.mockResolvedValue({ id: "staff-current" }); m.has.mockReturnValue(true);
  m.permissions.mockReturnValue(["donation.view"]);
  m.redirect.mockImplementation(() => { throw new Error("redirect"); });
  m.count.mockResolvedValue(0); m.group.mockResolvedValue([]); m.find.mockResolvedValue([]);
  m.followUps.mockResolvedValue([]); m.deliveryGroups.mockResolvedValue([]);
  m.outcomeGroups.mockResolvedValue([]); m.auditGroups.mockResolvedValue([]);
});

describe("authorized assistance queue", () => {
  it("authenticates before reading request records", async () => {
    m.user.mockRejectedValue(new Error("unauthenticated"));
    await expect(html()).rejects.toThrow("unauthenticated");
    expect(m.count).not.toHaveBeenCalled(); expect(m.group).not.toHaveBeenCalled(); expect(m.find).not.toHaveBeenCalled();
  });
  it("redirects staff without assistance permission before all queue reads", async () => {
    m.has.mockReturnValue(false);
    await expect(html({ assignment: "mine" })).rejects.toThrow("redirect");
    expect(m.redirect).toHaveBeenCalledWith("/admin/donations");
    expect(m.count).not.toHaveBeenCalled(); expect(m.group).not.toHaveBeenCalled(); expect(m.find).not.toHaveBeenCalled();
  });
  it("uses identical assignment scope for the count, records and status badges", async () => {
    await html({ status: "SUBMITTED", assignment: "mine", order: "oldest", assignedToId: "other-staff" });
    expect(m.count).toHaveBeenCalledWith({ where: { status: "SUBMITTED", assignedToId: "staff-current" } });
    expect(m.group).toHaveBeenCalledWith({ where: { assignedToId: "staff-current" }, by: ["status"], _count: { _all: true } });
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "SUBMITTED", assignedToId: "staff-current" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: 0, take: 50,
    }));
  });
  it("selects only queue display fields instead of private narratives, credentials and full staff records", async () => {
    await html();
    const query = m.find.mock.calls[0]?.[0];
    expect(query).not.toHaveProperty("include");
    expect(query.select).toEqual({
      id: true, referenceNumber: true, applicantName: true, city: true, category: true,
      status: true, createdAt: true, assignedTo: { select: { name: true } },
      verification: { select: { decision: true, completedAt: true } },
      _count: { select: { documents: true } },
    });
    expect(query.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
  });
  it("keeps status, assignment and order in bounded next-page links", async () => {
    m.count.mockResolvedValue(101);
    const result = await html({ status: "SUBMITTED", assignment: "unassigned", order: "oldest", page: "2" });
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 50, take: 50, where: { status: "SUBMITTED", assignedToId: null } }));
    expect(result).toContain("status=SUBMITTED&amp;assignment=unassigned&amp;order=oldest&amp;page=3");
    expect(result).toContain("Page 2 of 3 · 101 records");
    expect(result).toContain("Age is time since receipt, not a response deadline, verified urgency, or SLA breach.");
  });
  it("clamps an excessive page and resets page when switching filters", async () => {
    m.count.mockResolvedValue(51);
    const result = await html({ status: "CLOSED", assignment: "mine", order: "oldest", page: "9999999" });
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 50, take: 50 }));
    expect(result).toContain('href="/admin?status=CLOSED&amp;order=oldest"');
    expect(result).not.toContain("page=9999999");
  });
  it("renders request age and stable case links without adding contact data", async () => {
    m.count.mockResolvedValue(1);
    m.find.mockResolvedValue([{
      id: "case-synthetic", referenceNumber: "AF-SYNTHETIC", applicantName: "Synthetic applicant", city: "Hyderabad",
      category: "MEDICAL", status: "SUBMITTED", createdAt: new Date(0), assignedTo: null,
      verification: null, _count: { documents: 2 },
    }]);
    const result = await html();
    expect(result).toContain('href="/admin/requests/case-synthetic"');
    expect(result).toContain("Unassigned"); expect(result).toContain("Request age"); expect(result).toMatch(/\d+ days/);
    expect(result).not.toContain('href="tel:'); expect(result).not.toContain('href="mailto:');
    // Summaries are scoped to IDs already loaded in this page, never private narratives.
    const scopedIds = { in: ["case-synthetic"] };
    expect(m.followUps).toHaveBeenCalledWith(expect.objectContaining({
      by: ["assistanceRequestId"], where: expect.objectContaining({ assistanceRequestId: scopedIds }),
    }));
    expect(m.deliveryGroups).toHaveBeenCalledWith(expect.objectContaining({
      by: ["assistanceRequestId", "state"], where: expect.objectContaining({ assistanceRequestId: scopedIds }),
    }));
    expect(m.outcomeGroups).toHaveBeenCalledWith(expect.objectContaining({
      by: ["assistanceRequestId", "state"], where: expect.objectContaining({ assistanceRequestId: scopedIds }),
    }));
    expect(m.auditGroups).toHaveBeenCalledWith(expect.objectContaining({
      by: ["entityId"], where: expect.objectContaining({ entityId: scopedIds }),
    }));
  });
});
