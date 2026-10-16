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
