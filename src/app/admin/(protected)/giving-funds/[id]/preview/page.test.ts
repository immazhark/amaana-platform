import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), find: vi.fn(), form: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission }));
vi.mock("@/lib/prisma", () => ({ prisma: { givingFund: { findUnique: m.find } } }));
vi.mock("@/components/fund-purpose-disclosure", () => ({ FundPurposeDisclosure: (props: unknown) => { m.form(props); return createElement("p", null, "Synthetic form boundary"); } }));
import FundPreview from "./page";
const fund = { id: "fund", slug: "fund-review", name: "Programme review", purpose: "A reviewed charitable programme purpose.", disclosure: "A reviewed description of programme restrictions.", accountCode: "PRIVATE-CODE", acceptedIntents: ["GENERAL"], status: "UNDER_REVIEW", revision: 4 };
const markup = async () => renderToStaticMarkup(await FundPreview({ params: Promise.resolve({ id: "fund" }) }));
describe("protected fund donor preview", () => {
  beforeEach(() => { vi.resetAllMocks(); m.permission.mockResolvedValue({ id: "staff" }); m.find.mockResolvedValue(fund); });
  it("authorizes before looking up fund definitions", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden")); await expect(markup()).rejects.toThrow("Forbidden"); expect(m.find).not.toHaveBeenCalled();
  });
  it("keeps preview non-paying with exact purpose and revision", async () => {
    const html = await markup();
    expect(html).toContain("does not accept payments");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<script");
    expect(html).toContain("<fieldset disabled");
    expect(m.form).toHaveBeenCalledWith(expect.objectContaining({ fund: { id: "fund", revision: 4, name: fund.name, purpose: fund.purpose, disclosure: fund.disclosure, acceptedIntents: ["GENERAL"] } }));
  });
  it("does not render a payment form for malformed definitions", async () => {
    m.find.mockResolvedValueOnce({ ...fund, purpose: "short" }); expect(await markup()).toContain('role="alert"'); expect(m.form).not.toHaveBeenCalled();
  });
});
