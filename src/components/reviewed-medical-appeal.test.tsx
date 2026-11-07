import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const methods = vi.hoisted(() => vi.fn());
vi.mock("@/components/donation-methods", () => ({ DonationMethods: (props: unknown) => { methods(props); return <div>Existing payment methods</div>; } }));
vi.mock("@/components/page-hero", () => ({ PageHero: ({ title, visual }: { title: string; visual: import("react").ReactNode }) => <header><h1>{title}</h1>{visual}</header> }));
vi.mock("@/components/public-media", () => ({ PublicMedia: () => <div>Reviewed case photograph</div> }));
vi.mock("@/components/appeal-share", () => ({ AppealShare: () => <div>Share appeal</div> }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: import("react").ComponentProps<"a">) => <a {...props}>{children}</a> }));
import { ReviewedMedicalAppeal } from "./reviewed-medical-appeal";

const decimal = (value: number) => new Prisma.Decimal(value);
const appeal = {
  slug: "synthetic-reviewed-case", title: "Synthetic reviewed medical appeal", summary: "Approved public summary.",
  category: "MEDICAL" as const, beneficiaryLocation: "Hyderabad", beneficiaryDisplayName: "Synthetic case",
  story: "Approved public story.\nPrivate supporting documents stay private.", status: "PUBLISHED" as const,
  goalAmount: decimal(10000), amountRaised: decimal(2500), closesAt: null, publishedAt: new Date("2026-11-07T00:00:00Z"), coverImageUrl: null, updates: [],
};
const donation = { id: "synthetic-case-id", slug: appeal.slug, title: appeal.title, summary: appeal.summary,
  beneficiaryLocation: appeal.beneficiaryLocation, category: appeal.category, status: appeal.status,
  goalAmount: appeal.goalAmount, amountRaised: appeal.amountRaised, closesAt: null, zakatEligible: false };
const paymentDetails = { upi: { id: "synthetic@upi", qrImageUrl: null }, bank: null };
beforeEach(() => methods.mockClear());

it("renders the story, actual funding details and existing same-page payment flow", () => {
  const html = renderToStaticMarkup(<ReviewedMedicalAppeal highlySensitive={true} appeal={appeal} donation={donation} coverMedia={null} paymentDetails={paymentDetails} />);
  expect(html).toContain(appeal.story);
  expect(html).toContain("Support this appeal");
  expect(html).toContain("Existing payment methods");
  expect(methods).toHaveBeenCalledWith(expect.objectContaining({ appealId: "synthetic-case-id", maxAmount: 7500, zakatEligible: false, paymentDetails }));
});

it("keeps its support panel as a labelled section instead of a nested complementary landmark", () => {
  const html = renderToStaticMarkup(<ReviewedMedicalAppeal highlySensitive={true} appeal={appeal} donation={donation} coverMedia={null} paymentDetails={paymentDetails} />);
  expect(html).toMatch(/<section\b[^>]*id="support-this-appeal"[^>]*aria-labelledby="medical-support-heading"/);
  expect(html).not.toMatch(/<aside\b[^>]*id="support-this-appeal"/);
});

it.each([
  null,
  { ...donation, slug: "another-case" },
  { ...donation, status: "PUBLISHED" as const, amountRaised: decimal(10000) },
])("does not mount a payment flow without the same eligible reviewed case", donation => {
  const html = renderToStaticMarkup(<ReviewedMedicalAppeal highlySensitive={true} appeal={appeal} donation={donation} coverMedia={null} paymentDetails={paymentDetails} />);
  expect(methods).not.toHaveBeenCalled();
  expect(html).not.toContain("Existing payment methods");
});

it("renders only a supplied reviewed cover and public update copy", () => {
  const cover = { id: "synthetic-reviewed-image", kind: "IMAGE" as const, title: "Reviewed redacted photo", publicUrl: "/media/synthetic.webp", externalUrl: null, altText: "Reviewed redacted photo", caption: null, sourceYear: 2026, sortOrder: 0, width: 800, height: 600 };
  const html = renderToStaticMarkup(<ReviewedMedicalAppeal highlySensitive={true} appeal={{ ...appeal, updates: [{ id: "synthetic-update", title: "Confirmed update", content: "Approved public update", publishedAt: new Date("2026-11-07T00:00:00Z") }] }} donation={donation} coverMedia={cover} paymentDetails={paymentDetails} />);
  expect(html).toContain("Reviewed case photograph");
  expect(html).toContain("Approved public update");
});
