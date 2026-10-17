import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { givingFund: { findMany: m.find } } }));
import { getDonorFundChoices } from "./donor-funds";
const id = "cmf1234567890123456789012";
const approved = { id, slug: "reviewed-fund", name: "Reviewed programme", purpose: "A reviewed domestic charitable purpose for donors.", disclosure: "Donations remain restricted to the approved programme purpose.", accountCode: "PRIVATE-ACCOUNT", acceptedIntents: ["GENERAL"], currency: "INR", status: "APPROVED", revision: 4, createdById: "creator", lastEditedById: "editor", approvedById: "reviewer", approvedAt: new Date(), privateNotes: "DO NOT DISCLOSE" };
describe("dormant donor fund read boundary", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("AMAANA_FUND_CHECKOUT_ENABLED", "true"); vi.stubEnv("AMAANA_FUND_CHECKOUT_ALLOWLIST", id); m.find.mockResolvedValue([approved]); });
  afterEach(() => vi.unstubAllEnvs());
  it("does not query any private records while disabled", async () => {
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ENABLED", "false"); expect(await getDonorFundChoices()).toEqual([]); expect(m.find).not.toHaveBeenCalled();
  });
  it("does not query without an explicit per-fund activation list", async () => {
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ALLOWLIST", ""); expect(await getDonorFundChoices()).toEqual([]); expect(m.find).not.toHaveBeenCalled();
  });
  it("returns only reviewed donor disclosures with bounded approved selection", async () => {
    const result = await getDonorFundChoices();
    expect(result).toEqual([{ id, revision: 4, name: approved.name, purpose: approved.purpose, disclosure: approved.disclosure, acceptedIntents: ["GENERAL"] }]);
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE-ACCOUNT|DO NOT DISCLOSE|reviewer|creator/);
    expect(m.find.mock.calls[0]![0].select).not.toHaveProperty("privateNotes");
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: [id] }, status: "APPROVED" }, take: 100 }));
  });
  it.each([{ status: "PAUSED" }, { approvedById: "creator" }, { acceptedIntents: ["ZAKAT"] }, { disclosure: "" }])("omits unsafe definitions %o", async patch => {
    m.find.mockResolvedValueOnce([{ ...approved, ...patch }]); expect(await getDonorFundChoices()).toEqual([]);
  });
});
