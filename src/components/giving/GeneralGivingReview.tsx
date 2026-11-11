import { validateGivingProposal, type GivingProposal } from "@/lib/giving-foundation";

export type GeneralGivingReviewProps = Readonly<{
  proposal: GivingProposal | null;
}>;

/**
 * Review-only presentation for an independently approved General giving
 * proposal. No form, donor data, payment link or provider execution is exposed.
 */
export function GeneralGivingReview({ proposal }: GeneralGivingReviewProps) {
  if (!validateGivingProposal(proposal)) {
    return (
      <section aria-labelledby="general-giving-review-unavailable" className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 id="general-giving-review-unavailable" className="text-lg font-semibold text-slate-900">
          General giving is not available for review
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          A current, reviewed fund, policy and amount are required before details can be displayed.
        </p>
      </section>
    );
  }

  // validateGivingProposal fails closed above, including mismatched price.
  const amountPaise = proposal!.amountPaise;
  const rupees = Math.floor(amountPaise / 100);
  const decimals = String(amountPaise % 100).padStart(2, "0");
  const formattedAmount = `₹${rupees.toLocaleString("en-IN")}.${decimals}`;

  return (
    <section aria-labelledby="general-giving-review-heading" className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 id="general-giving-review-heading" className="text-xl font-semibold text-slate-900">
        General giving
      </h2>
      <p className="mt-2 text-sm text-slate-700">
        This is a review only. No payment is collected or initiated on this screen.
      </p>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-medium text-slate-700">Proposed amount</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-900">{formattedAmount}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">Giving purpose</dt>
          <dd className="mt-1 text-slate-900">General foundation support</dd>
        </div>
      </dl>
      <details className="mt-4 rounded-lg border border-slate-200 p-3">
        <summary className="cursor-pointer font-medium text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">
          Review details
        </summary>
        <p className="mt-3 text-sm text-slate-700">
          This view is informational and does not confirm a contribution, tax deduction or payment-provider acceptance.
        </p>
        <p className="mt-2 text-sm text-slate-700">
          The proposal is limited to the reviewed General giving purpose. Other giving categories require separate eligibility decisions.
        </p>
      </details>
    </section>
  );
}
