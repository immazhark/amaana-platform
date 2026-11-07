import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ publicAppeal: vi.fn(), donation: vi.fn(), cover: vi.fn(), details: vi.fn(), view: vi.fn(), privacy: vi.fn() }));
vi.mock("@/lib/public-page-data", () => ({ getAppealPageData: mocks.publicAppeal, getDonationPageData: mocks.donation, getAppealCoverMedia: mocks.cover }));
vi.mock("@/lib/donation-payment-details", () => ({ getDonationPaymentDetails: mocks.details }));
vi.mock("@/components/reviewed-medical-appeal", () => ({ ReviewedMedicalAppeal: (props: unknown) => { mocks.view(props); return <div>Reviewed integrated appeal</div>; } }));
vi.mock("@/lib/appeal-search-privacy", () => ({ getAppealSearchPrivacy: mocks.privacy }));
import Page, { generateMetadata } from "./page";

beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("MR_KHAJA_PUBLIC_APPEAL_SLUG", ""); });
afterEach(() => vi.unstubAllEnvs());

it("does not guess a financial case or query records without an explicit binding", async () => {
  const html = renderToStaticMarkup(await Page());
  expect(html).toContain("not yet active");
  expect(html).toContain("approved fundraising target");
  expect(html).not.toContain("not an approved, remaining fundraising target");
  expect(mocks.publicAppeal).not.toHaveBeenCalled();
  expect(mocks.donation).not.toHaveBeenCalled();
});

it("uses only the explicitly bound publicly reviewed appeal and its reviewed cover", async () => {
  vi.stubEnv("MR_KHAJA_PUBLIC_APPEAL_SLUG", "synthetic-reviewed-case");
  const appeal = { slug: "synthetic-reviewed-case", coverImageUrl: "/media/synthetic-reviewed.webp" };
  const donation = { id: "synthetic-financial-case" };
  const cover = { id: "synthetic-reviewed-cover" };
  mocks.publicAppeal.mockResolvedValue(appeal); mocks.donation.mockResolvedValue(donation);
  mocks.privacy.mockResolvedValue("HIGHLY_SENSITIVE"); mocks.cover.mockResolvedValue(cover); mocks.details.mockReturnValue({ synthetic: true });
  const html = renderToStaticMarkup(await Page());
  expect(html).toContain("Reviewed integrated appeal");
  expect(mocks.publicAppeal).toHaveBeenCalledWith("synthetic-reviewed-case");
  expect(mocks.donation).toHaveBeenCalledWith("synthetic-reviewed-case");
  expect(mocks.cover).toHaveBeenCalledWith("/media/synthetic-reviewed.webp");
  expect(mocks.view).toHaveBeenCalledWith({ appeal, donation, coverMedia: cover, highlySensitive: true, paymentDetails: { synthetic: true } });
});

it("keeps payment components unavailable when the configured case is not public", async () => {
  vi.stubEnv("MR_KHAJA_PUBLIC_APPEAL_SLUG", "synthetic-private-case");
  mocks.publicAppeal.mockResolvedValue(null);
  renderToStaticMarkup(await Page());
  expect(mocks.donation).not.toHaveBeenCalled();
  expect(mocks.view).not.toHaveBeenCalled();
});

it.each(["../another-case", "https://foreign.invalid/case", "case?private=true"])("ignores an invalid binding: %s", async binding => {
  vi.stubEnv("MR_KHAJA_PUBLIC_APPEAL_SLUG", binding);
  renderToStaticMarkup(await Page());
  expect(mocks.publicAppeal).not.toHaveBeenCalled();
  expect(mocks.view).not.toHaveBeenCalled();
});


it("uses privacy-safe metadata for a bound highly sensitive appeal", async () => {
  vi.stubEnv("MR_KHAJA_PUBLIC_APPEAL_SLUG", "synthetic-sensitive-case");
  mocks.publicAppeal.mockResolvedValue({ slug: "synthetic-sensitive-case", title: "Sensitive name", summary: "Sensitive medical narrative" });
  mocks.privacy.mockResolvedValue("HIGHLY_SENSITIVE");
  const metadata = await generateMetadata();
  expect(metadata.title).toBe("Verified Support Appeal");
  expect(JSON.stringify(metadata)).not.toMatch(/Sensitive name|Sensitive medical narrative/);
});
