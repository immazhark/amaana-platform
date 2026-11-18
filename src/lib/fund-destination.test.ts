import { describe, expect, it, vi } from "vitest";
import { resolveFundDestination } from "./fund-destination";

const fund = (overrides: Record<string, unknown> = {}) => ({ id: "fund_x", slug: "x", name: "X Fund", zakatPolicy: "ACCEPTED", isGeneral: false, ...overrides });
const client = (row: unknown) => ({ fund: { findFirst: vi.fn().mockResolvedValue(row) } }) as never;

describe("resolveFundDestination", () => {
  it("asks only for ACTIVE funds by slug", async () => {
    const c = client(fund());
    await resolveFundDestination(c, { fundSlug: "x", givingIntent: "SADAQAH" });
    expect((c as { fund: { findFirst: ReturnType<typeof vi.fn> } }).fund.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "x", status: "ACTIVE" } }));
  });
  it("resolves an accepted intent", async () => {
    await expect(resolveFundDestination(client(fund()), { fundSlug: "x", givingIntent: "ZAKAT" })).resolves.toEqual({ ok: true, value: { fundId: "fund_x", fundSlug: "x", title: "X Fund", donorDirective: null } });
  });
  it.each(["NOT_ACCEPTED", "UNDER_REVIEW"])("refuses Zakat when the fund policy is %s", async zakatPolicy => {
    const result = await resolveFundDestination(client(fund({ zakatPolicy })), { fundSlug: "x", givingIntent: "ZAKAT" });
    expect(result).toMatchObject({ ok: false, status: 409 });
  });
  it.each(["NOT_ACCEPTED", "UNDER_REVIEW"])("still takes Sadaqah and General when the policy is %s", async zakatPolicy => {
    for (const givingIntent of ["SADAQAH", "GENERAL"]) expect((await resolveFundDestination(client(fund({ zakatPolicy })), { fundSlug: "x", givingIntent })).ok).toBe(true);
  });
  it("rejects a fund that is missing or not active", async () => {
    await expect(resolveFundDestination(client(null), { fundSlug: "x", givingIntent: "GENERAL" })).resolves.toMatchObject({ ok: false, status: 409 });
  });
  it("keeps a trimmed custom request only for the General fund", async () => {
    await expect(resolveFundDestination(client(fund({ isGeneral: true })), { fundSlug: "x", givingIntent: "GENERAL", donorDirective: "  note  " })).resolves.toMatchObject({ ok: true, value: { donorDirective: "note" } });
    await expect(resolveFundDestination(client(fund()), { fundSlug: "x", givingIntent: "GENERAL", donorDirective: "note" })).resolves.toMatchObject({ ok: false, status: 400 });
    await expect(resolveFundDestination(client(fund()), { fundSlug: "x", givingIntent: "GENERAL", donorDirective: "   " })).resolves.toMatchObject({ ok: true, value: { donorDirective: null } });
  });
});
