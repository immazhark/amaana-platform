import { afterEach, describe, expect, it, vi } from "vitest";
import { Children, isValidElement, Suspense, type ReactElement, type ReactNode } from "react";

vi.mock("@/lib/prisma", () => ({ prisma: { fund: { findMany: vi.fn() }, fundCampaign: { findMany: vi.fn() } } }));
vi.mock("@/lib/public-page-data", () => ({ getDonationImpactHighlights: vi.fn() }));
vi.mock("@/lib/server-log", () => ({ logServerError: vi.fn() }));
vi.mock("@/lib/donation-payment-details", () => ({ getDonationPaymentDetails: () => ({}) }));

import Page from "./page";
import { prisma } from "@/lib/prisma";
import { getDonationImpactHighlights } from "@/lib/public-page-data";
import { logServerError } from "@/lib/server-log";
import { FundGivingCheckout } from "@/components/fund-giving/fund-giving-checkout";
import { VerifiedImpactStrip } from "@/components/verified-impact-strip";

afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

describe("/give activation", () => {
  it("is a real 404 (thrown before streaming) while the switch is off", () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "false");
    expect(() => Page({ searchParams: Promise.resolve({}) })).toThrow();
    try { Page({ searchParams: Promise.resolve({}) }); } catch (error) {
      expect(String((error as { digest?: string }).digest)).toContain("404");
    }
  });
  it("is also closed when the switch is unset", () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "");
    expect(() => Page({ searchParams: Promise.resolve({}) })).toThrow();
  });
  it("renders once the owner switches it on", () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    expect(() => Page({ searchParams: Promise.resolve({}) })).not.toThrow();
  });
});

// Exercise the server-component boundaries without connecting to a database or
// mounting the client checkout. The existing strip tests cover its actual HTML.
type Deferred = ReactElement<Record<string, unknown>, (props: Record<string, unknown>) => Promise<ReactElement | null>>;
function deferred(node: ReactNode): Deferred {
  if (!isValidElement(node) || typeof node.type !== "function") throw new Error("Missing server component");
  return node as Deferred;
}

async function articleChildren() {
  vi.stubEnv("FUND_GIVING_ENABLED", "true");
  vi.mocked(prisma.fund.findMany).mockResolvedValueOnce([
    { slug: "general", name: "General Fund", summary: "Synthetic", zakatPolicy: "GENERAL_ONLY", isGeneral: true },
  ] as unknown as Awaited<ReturnType<typeof prisma.fund.findMany>>);
  vi.mocked(prisma.fundCampaign.findMany).mockResolvedValueOnce([]);
  const outer = Page({ searchParams: Promise.resolve({ fund: "general" }) }) as ReactElement<{ children: ReactNode }>;
  const content = deferred(outer.props.children);
  const article = await content.type(content.props) as ReactElement<{ children: ReactNode }>;
  return Children.toArray(article.props.children).filter(isValidElement) as ReactElement<{ children?: ReactNode; fallback?: ReactNode; initialSlug?: string }>[];
}

async function evidenceChild() {
  const children = await articleChildren();
  expect(children[0]?.type).toBe(FundGivingCheckout);
  expect(children[0]?.props.initialSlug).toBe("general");
  expect(children[1]?.type).toBe(Suspense);
  expect(children[1]?.props.fallback).toBeNull();
  expect(getDonationImpactHighlights).not.toHaveBeenCalled();
  const child = deferred(children[1]?.props.children);
  return child.type(child.props);
}

describe("/give reviewed outcomes", () => {
  it("streams the existing reviewed evidence independently after the checkout", async () => {
    vi.mocked(getDonationImpactHighlights).mockResolvedValueOnce([
      { slug: "synthetic-evidence", title: "Synthetic evidence", primaryMetric: "42", primaryMetricLabel: "reviewed units" },
    ]);
    const result = await evidenceChild() as ReactElement<{ headingId: string; items: unknown[] }>;
    expect(result.type).toBe(VerifiedImpactStrip);
    expect(result.props.headingId).toBe("give-published-outcomes");
    expect(result.props.items).toEqual([
      { slug: "synthetic-evidence", title: "Synthetic evidence", value: "42", label: "reviewed units" },
    ]);
  });

  it("renders no evidence claim when the reviewed projection is empty", async () => {
    vi.mocked(getDonationImpactHighlights).mockResolvedValueOnce([]);
    expect(await evidenceChild()).toBeNull();
  });

  it("keeps checkout available if optional evidence fails without logging sensitive details", async () => {
    vi.mocked(getDonationImpactHighlights).mockRejectedValueOnce(new Error("synthetic private diagnostic"));
    expect(await evidenceChild()).toBeNull();
    expect(logServerError).toHaveBeenCalledWith("give.published_impact_unavailable", { errorName: "Error" });
  });
});
