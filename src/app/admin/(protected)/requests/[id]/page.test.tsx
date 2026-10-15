import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), has: vi.fn(), request: vi.fn(), staff: vi.fn(), history: vi.fn(), missing: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission, hasPermission: m.has }));
vi.mock("next/navigation", () => ({ notFound: m.missing }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  assistanceRequest: { findUnique: m.request }, user: { findMany: m.staff }, auditEvent: { findMany: m.history },
} }));
vi.mock("./actions", () => ({ assignRequest: vi.fn(), convertToAppeal: vi.fn(), saveVerification: vi.fn(), updateRequest: vi.fn() }));
import RequestDetailPage from "./page";
const render = async () => renderToStaticMarkup(await RequestDetailPage({ params: Promise.resolve({ id: "case-synthetic" }) }));
beforeEach(() => {
  vi.resetAllMocks(); m.permission.mockResolvedValue({ id: "viewer" }); m.has.mockReturnValue(false);
  m.request.mockResolvedValue({
    id: "case-synthetic", referenceNumber: "AF-SYNTHETIC", applicantName: "Synthetic applicant", category: "MEDICAL", city: "Hyderabad",
    status: "SUBMITTED", createdAt: new Date("2026-10-15T00:00:00Z"), updatedAt: new Date("2026-10-15T00:00:00Z"),
    phone: "synthetic-contact", email: null, description: "Private case narrative", documents: [], verification: null, appeal: null, appealId: null,
  });
  m.staff.mockResolvedValue([{ id: "reviewer", name: "Synthetic reviewer" }]); m.history.mockResolvedValue([]);
});
describe("private assistance detail projections", () => {
  it("enforces view permission before any case, staff or history read", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(render()).rejects.toThrow("Forbidden");
    expect(m.request).not.toHaveBeenCalled(); expect(m.staff).not.toHaveBeenCalled(); expect(m.history).not.toHaveBeenCalled();
  });
  it("fetches only staff names/IDs and never full authentication profiles or audit metadata", async () => {
    const result = await render();
    expect(m.permission).toHaveBeenCalledWith("assistance.view");
    expect(m.staff).toHaveBeenCalledWith(expect.objectContaining({
      select: { id: true, name: true }, orderBy: [{ name: "asc" }, { id: "asc" }],
    }));
    expect(m.history).toHaveBeenCalledWith(expect.objectContaining({
      where: { entityType: "AssistanceRequest", entityId: "case-synthetic" },
      select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } },
    }));
    expect(m.request.mock.calls[0]?.[0].include).toEqual({
      documents: true, appeal: { select: { title: true, status: true } },
      verification: { include: { reviewedBy: { select: { name: true } } } },
    });
    expect(result).toContain("Synthetic reviewer"); expect(result).toContain("Private case narrative");
    expect(result).toContain("Save assignment"); expect(result).toContain("disabled");
  });
});
