import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DonationForm } from "./donation-form";
import { donationFormCopy } from "./donation-form-copy";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/script", () => ({ default: () => null }));

describe("AF-R083 secure donation amount shortcuts", () => {
  const copy = donationFormCopy(false);

  it("renders bounded editable amount suggestions with explicit accessible names", () => {
    const markup = renderToStaticMarkup(<DonationForm
      appealId="approved-appeal" appealTitle="Reviewed appeal"
      maxAmount={900} copy={copy}
    />);
    expect(markup).toContain('aria-label="Suggested amounts in INR"');
    // Preserve unambiguous label-based access to the actual amount input.
    expect(markup).not.toMatch(/aria-label="[^"]*donation amount/i);
    expect(markup).toContain("Use ₹500 for this donation");
    expect(markup).toContain("Use ₹900 for this donation");
    expect(markup).not.toContain("Use ₹1,000 for this donation");
    expect(markup).toContain('name="amount"');
    expect(markup).toContain('type="button"');
  });

  it("does not offer impossible shortcuts when the remaining balance is invalid", () => {
    const markup = renderToStaticMarkup(<DonationForm
      appealId="closed-appeal" appealTitle="Not payable"
      maxAmount={9.5} copy={copy}
    />);
    expect(markup).not.toContain('aria-label="Suggested amounts in INR"');
    expect(markup).not.toContain("Use ₹");
  });
});


it("provides a truthful no-script recovery path without offering another payment destination", () => {
  const markup = renderToStaticMarkup(<DonationForm appealId="synthetic" appealTitle="Synthetic appeal" maxAmount={900} copy={donationFormCopy(false)} />);
  const notice = markup.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? "";
  expect(notice).toContain("Interactive payment options require JavaScript.");
  expect(notice).toContain('href="/contact"');
  expect(notice).toContain('href="/donation-policy"');
  expect(notice).toContain("currently approved donation options");
  expect(notice).not.toMatch(/<form|<input|upi:|rzp_|@bank|@upi/);
});
