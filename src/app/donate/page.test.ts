import { createElement, type ReactNode } from "react";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ appeals: vi.fn(), funds: vi.fn(), detail: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/public-page-data", () => ({ getAppealsIndexData: m.appeals, getDonationImpactHighlights: async () => [], getDonationPageData: m.detail }));
vi.mock("@/lib/prisma", () => ({ prisma: { givingFund: { findMany: m.funds } } }));
vi.mock("@/lib/server-log", () => ({ logServerError: m.log }));
vi.mock("@/components/navigation-link", () => ({ default: ({ children, ...props }: { children: ReactNode }) => createElement("a", props, children) }));
vi.mock("next/script", () => ({ default: () => createElement("span", { "data-gateway-script": "loaded" }) }));
vi.mock("@/components/canonical-article", () => ({ CanonicalArticle: ({ children, title, intro, heroVisualTitle, blocks }: { children: ReactNode; title: string; intro: string; heroVisualTitle: string; blocks: { paragraphs: string[] }[] }) => createElement("main", null,
  createElement("h1", null, title), createElement("p", null, intro), createElement("p", null, heroVisualTitle), ...blocks.flatMap(block => block.paragraphs.map(text => createElement("p", { key: text }, text))), children) }));
import Page, { dynamic, metadata } from "./page";
const id = "cmf1234567890123456789012";
const approved = { id, slug: "reviewed-fund", name: "Reviewed programme", purpose: "A reviewed domestic charitable purpose for donors.", disclosure: "Donations remain restricted to the approved programme purpose.", accountCode: "PRIVATE-ACCOUNT", acceptedIntents: ["GENERAL"], currency: "INR", status: "APPROVED", revision: 4, createdById: "creator", lastEditedById: "editor", approvedById: "reviewer", approvedAt: new Date(), privateNotes: "DO NOT DISCLOSE" };
const appeal = { id: "appeal", slug: "real-public-appeal", title: "Reviewed public appeal", status: "PUBLISHED", goalAmount: 1000, amountRaised: 0 };
async function html() {
  const page = await Page();
  return new Promise<string>((resolve, reject) => {
    const output = new PassThrough();
    const chunks: Buffer[] = [];
    output.on("data", chunk => chunks.push(chunk));
    output.on("end", () => resolve(Buffer.concat(chunks).toString()));
    output.on("error", reject);
    const stream = renderToPipeableStream(page, { onAllReady: () => stream.pipe(output), onError: reject });
  });
}

describe("donation landing with real fund release controls", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("AMAANA_FUND_CHECKOUT_ENABLED", "true"); vi.stubEnv("AMAANA_FUND_CHECKOUT_ALLOWLIST", id); m.appeals.mockResolvedValue([]); m.funds.mockResolvedValue([approved]); m.detail.mockResolvedValue(null); });
  afterEach(() => vi.unstubAllEnvs());
  it.each(["false", "TRUE", ""])("keeps existing enquiry/appeal routes and omits all fund checkout when flag is %s", async flag => {
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ENABLED", flag);
    const result = await html();
    expect(result).toContain("Find an Approved Way to Support."); expect(result).toContain("/appeals"); expect(result).toContain("/get-involved/sponsor-education");
    expect(result).not.toMatch(/giving-fund-choice|fundPurposeConfirmed|data-gateway-script/); expect(m.funds).not.toHaveBeenCalled();
  });
  it("requires the per-fund allowlist even when the flag is true", async () => {
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ALLOWLIST", ""); expect(await html()).not.toContain("giving-fund-choice"); expect(m.funds).not.toHaveBeenCalled();
  });
  it("renders only reviewed public fields and explicit consent even without an open appeal", async () => {
    const result = await html();
    expect(result).toContain("Give With Confidence. Give With Purpose."); expect(result).toContain(approved.purpose); expect(result).toContain(approved.disclosure);
    expect(result).toContain('href="/donate?giving=fund#donation-route-choice"'); expect(result).toContain('name="fundPurposeConfirmed"');
    expect(result).not.toMatch(/PRIVATE-ACCOUNT|DO NOT DISCLOSE|creator|reviewer|value="ZAKAT"/);
  });
  it("rereads approval on each server visit, withdrawing a paused fund", async () => {
    expect(await html()).toContain("giving-fund-choice"); m.funds.mockResolvedValueOnce([{ ...approved, status: "PAUSED" }]);
    expect(await html()).not.toContain("giving-fund-choice"); expect(m.funds).toHaveBeenCalledTimes(2); expect(dynamic).toBe("force-dynamic");
  });
  it("preserves available public appeals when the optional fund read fails", async () => {
    m.funds.mockRejectedValueOnce(new Error("private database details"));
    m.appeals.mockResolvedValue([appeal]);
    m.detail.mockResolvedValueOnce({ ...appeal, zakatEligible: false });
    const result = await html(); expect(result).toContain("See all verified appeals");
    expect(result).toContain("Choose an appeal &amp; give here");
    expect(result).toContain("Giving fund availability could not be checked.");
    expect(m.detail).toHaveBeenCalledWith("real-public-appeal");
    expect(result).not.toContain("private database details"); expect(result).not.toContain("giving-fund-choice");
    expect(m.log).toHaveBeenCalledWith("donation.fund_choices_unavailable", { errorName: "Error" });
  });
  it("keeps canonical metadata and domestic/provisional tax disclosures", async () => {
    const result = await html(); expect(metadata.alternates?.canonical).toBe("/donate");
    expect(result).toMatch(/domestic/i); expect(result).toMatch(/provisional/i);
  });
});
