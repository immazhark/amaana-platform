import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { indiaCalendarDay } from "@/lib/assistance-follow-up";

const mock = vi.hoisted(() => ({ authorize: vi.fn(), count: vi.fn(), findMany: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mock.authorize }));
vi.mock("@/lib/prisma", () => ({
  prisma: { assistanceFollowUp: { count: mock.count, findMany: mock.findMany } },
}));
import AssistanceFollowUpWorkboard from "./page";

const render = async (params: Record<string, string | string[]> = {}) =>
  renderToStaticMarkup(await AssistanceFollowUpWorkboard({ searchParams: Promise.resolve(params) }));

beforeEach(() => {
  vi.resetAllMocks();
  mock.authorize.mockResolvedValue({ id: "synthetic-staff" });
  mock.count.mockResolvedValue(1);
  mock.findMany.mockResolvedValue([{
    id: "task-synthetic", summary: "Contact the designated institution for an update.",
    dueOn: new Date("2026-10-15T00:00:00.000Z"),
    createdAt: new Date("2026-10-15T07:00:00.000Z"), state: "OPEN",
    assignedTo: { name: "Team member" },
    assistanceRequest: {
      id: "case-synthetic", referenceNumber: "AF-SYNTHETIC",
      category: "EDUCATION", city: "Hyderabad",
    },
  }]);
});

describe("restricted private next-action workboard", () => {
  it("requires the case-view permission before any sensitive task query", async () => {
    mock.authorize.mockRejectedValue(new Error("Forbidden"));
    await expect(render()).rejects.toThrow("Forbidden");
    expect(mock.count).not.toHaveBeenCalled();
    expect(mock.findMany).not.toHaveBeenCalled();
  });

  it("defaults to the signed-in staff member's due tasks and bounded records", async () => {
    const page = await render();
    expect(mock.authorize).toHaveBeenCalledWith("assistance.view");
    const where = mock.count.mock.calls[0]?.[0]?.where;
    expect(where).toEqual(expect.objectContaining({
      state: "OPEN", assignedToId: "synthetic-staff",
      dueOn: { lte: new Date(indiaCalendarDay(new Date()) + "T00:00:00.000Z") },
      assistanceRequest: expect.objectContaining({ appealId: null }),
    }));
    expect(mock.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where, take: 25, skip: 0,
      select: expect.objectContaining({ assistanceRequest: expect.any(Object) }),
    }));
    expect(page).toContain("Next staff actions");
    expect(page).toContain("AF-SYNTHETIC");
    expect(page).toContain("Contact the designated institution for an update.");
  });

  it("allows team-wide upcoming tasks but not arbitrary query filter values", async () => {
    await render({ view: "team", window: "upcoming", page: "2" });
    const options = mock.count.mock.calls[0]?.[0]?.where;
    expect(options.assignedToId).toBeUndefined();
    expect(options.dueOn.gt).toEqual(new Date(indiaCalendarDay(new Date()) + "T00:00:00.000Z"));
    await render({ view: "other-staff", window: "unsafe", page: "not-a-page" });
    expect(mock.count.mock.calls[1]?.[0]?.where.assignedToId).toBe("synthetic-staff");
  });

  it("does not expose private task text in pagination and filter URLs", async () => {
    const page = await render();
    expect(page).toContain("/admin/follow-ups");
    expect(page).not.toContain("summary=");
    expect(page).not.toContain("assignedToId=");
  });
});


describe("follow-up history and case scope", () => {
  it("keeps completed history visible after a case closes, without applying a due-date filter", async () => {
    mock.findMany.mockResolvedValue([{
      id: "task-completed", summary: "Review institutional response.", dueOn: new Date("2026-10-10T00:00:00Z"),
      createdAt: new Date("2026-10-09T10:00:00Z"), state: "COMPLETED", resolvedAt: new Date("2026-10-11T10:00:00Z"),
      assignedTo: { name: "Staff member" }, assistanceRequest: { id: "closed-case", referenceNumber: "AF-PRIVATE-CLOSED", category: "EDUCATION", city: "Hyderabad", status: "CLOSED" },
    }]);
    const html = await render({ state: "COMPLETED", window: "due", view: "team" });
    expect(mock.count.mock.calls[0]?.[0].where).toEqual({ state: "COMPLETED", assistanceRequest: {} });
    expect(mock.findMany.mock.calls[0]?.[0]).toMatchObject({ take: 25, skip: 0, orderBy: [{ resolvedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }] });
    expect(html).toContain("AF-PRIVATE-CLOSED"); expect(html).toContain("Completed"); expect(html).toContain("IST");
    expect(html).not.toContain('aria-label="Staff-selected follow-up dates"');
    expect(html).toContain("not verified aid delivery");
    expect(html).toContain("/admin/follow-ups?view=team");
  });

  it("allows staff to inspect open tasks on inactive cases without changing them", async () => {
    const html = await render({ cases: "inactive", window: "all" });
    const where = mock.count.mock.calls[0]?.[0].where;
    expect(where.state).toBe("OPEN"); expect(where.assignedToId).toBe("synthetic-staff");
    expect(where.assistanceRequest.OR).toEqual([
      { status: { notIn: ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED"] } },
      { appealId: { not: null } },
    ]);
    expect(html).toContain("Closed or converted cases"); expect(html).not.toContain("<form");
  });

  it("preserves team, cancelled state and explicit case scope across pages", async () => {
    mock.count.mockResolvedValue(75);
    const html = await render({ view: "team", state: "CANCELLED", cases: "inactive", page: "2" });
    expect(mock.findMany.mock.calls[0]?.[0].skip).toBe(25);
    expect(html).toContain("view=team&amp;state=CANCELLED&amp;cases=inactive&amp;page=3");
    expect(html).not.toContain("summary=");
    expect(mock.findMany.mock.calls[0]?.[0].select).not.toHaveProperty("resolvedBy");
    expect(mock.findMany.mock.calls[0]?.[0].select.assistanceRequest.select).not.toHaveProperty("applicantName");
  });

  it("defaults invalid or repeated state/scope values safely", async () => {
    await render({ state: ["COMPLETED", "CANCELLED"], cases: ["all", "inactive"] });
    expect(mock.count.mock.calls[0]?.[0].where.state).toBe("OPEN");
    expect(mock.count.mock.calls[0]?.[0].where.assistanceRequest.appealId).toBeNull();
  });
});
