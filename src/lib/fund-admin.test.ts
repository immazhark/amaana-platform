import { describe, expect, it } from "vitest";
import { parseCreateFund, parseUpdateFund, validFundId } from "./fund-admin";

const base = { name: "Winter Relief Fund", summary: "Blankets and warm clothing for families in need.", zakatPolicy: "NOT_ACCEPTED", status: "DRAFT", sortOrder: "120" };
const create = (over: Record<string, unknown> = {}) => parseCreateFund({ slug: "winter-relief", ...base, ...over });

describe("parseCreateFund", () => {
  it("accepts a valid non-Zakat fund and defaults the display order", () => {
    expect(create()).toEqual({ ok: true, value: { slug: "winter-relief", name: "Winter Relief Fund", summary: "Blankets and warm clothing for families in need.", zakatPolicy: "NOT_ACCEPTED", status: "DRAFT", sortOrder: 120, zakatBasis: null } });
    expect(create({ sortOrder: "" })).toMatchObject({ ok: true, value: { sortOrder: 0 } });
  });
  it.each(["", "a", "UPPER", "has space", "double--hyphen", "-lead", "trail-", "x".repeat(41), "a/b", "../x", "admin", "api", "give", "funds", "new"])("rejects slug %j", slug => {
    expect(create({ slug }).ok).toBe(false);
  });
  it.each([
    [{ name: "ab" }], [{ name: "x".repeat(81) }], [{ summary: "too short" }], [{ summary: "y".repeat(201) }],
    [{ summary: "Call 98765 43210 for details" }], [{ name: "mail a@b.co" }],
    [{ zakatPolicy: "MAYBE" }], [{ zakatPolicy: undefined }], [{ status: "LIVE" }], [{ status: undefined }],
    [{ sortOrder: "-1" }], [{ sortOrder: "1001" }], [{ sortOrder: "1.5" }], [{ sortOrder: "abc" }], [{ sortOrder: "12345" }],
  ])("rejects %j", over => expect(create(over).ok).toBe(false));
  it("requires the ruling to be recorded before a new fund can accept Zakat", () => {
    expect(create({ zakatPolicy: "ACCEPTED" }).ok).toBe(false);
    expect(create({ zakatPolicy: "ACCEPTED", zakatBasis: "short" }).ok).toBe(false);
    expect(create({ zakatPolicy: "ACCEPTED", zakatBasis: "x".repeat(501) }).ok).toBe(false);
    expect(create({ zakatPolicy: "ACCEPTED", zakatBasis: "Ruled eligible for the poor by the owner" })).toMatchObject({ ok: true, value: { zakatBasis: "Ruled eligible for the poor by the owner" } });
  });
  it("ignores a stray Zakat basis on a fund that does not accept Zakat", () => {
    expect(create({ zakatPolicy: "NOT_ACCEPTED", zakatBasis: "irrelevant text here" })).toMatchObject({ ok: true, value: { zakatBasis: null } });
  });
});

describe("parseUpdateFund", () => {
  const update = (over: Record<string, unknown>, current: "ACCEPTED" | "NOT_ACCEPTED" | "UNDER_REVIEW" = "NOT_ACCEPTED") => parseUpdateFund({ ...base, ...over }, { zakatPolicy: current });
  it("needs no basis when the Zakat position is unchanged", () => {
    expect(update({})).toMatchObject({ ok: true, value: { zakatBasis: null } });
  });
  it.each([["UNDER_REVIEW", "ACCEPTED"], ["NOT_ACCEPTED", "ACCEPTED"], ["ACCEPTED", "NOT_ACCEPTED"], ["ACCEPTED", "UNDER_REVIEW"]] as const)("requires a recorded basis to change %s to %s", (from, to) => {
    expect(update({ zakatPolicy: to }, from).ok).toBe(false);
    expect(update({ zakatPolicy: to, zakatBasis: "short" }, from).ok).toBe(false);
    expect(update({ zakatPolicy: to, zakatBasis: "Owner ruling recorded on 19 Nov 2026" }, from)).toMatchObject({ ok: true, value: { zakatPolicy: to, zakatBasis: "Owner ruling recorded on 19 Nov 2026" } });
  });
  it("shares the public-text and range checks with create", () => {
    expect(update({ summary: "visit https://example.org now" }).ok).toBe(false);
    expect(update({ sortOrder: "5000" }).ok).toBe(false);
    expect(update({ status: "DELETED" }).ok).toBe(false);
  });
});

describe("validFundId", () => {
  it("accepts identifier-shaped ids only", () => {
    expect(validFundId("fund_general")).toBe(true);
    expect(validFundId("cmf1234567890123456789012")).toBe(true);
    for (const bad of ["", "ab", "has space", "a/b", "x".repeat(65), 5, null, undefined]) expect(validFundId(bad)).toBe(false);
  });
});
