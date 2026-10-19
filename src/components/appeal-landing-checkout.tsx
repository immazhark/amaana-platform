"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { getWholeRupeeCheckoutRange } from "@/lib/donation-amount-input";
import { formatCheckoutRemainingINR } from "@/lib/donation-checkout-balance";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import type { DonationFormCopy } from "./donation-form-copy";
import { DonationMethods } from "./donation-methods";
// Reuse the same client module boundary as the canonical appeal checkout.
// The actual payment form stays unmounted until the donor requests methods.

export type ReviewedAppealChoice = {
  id: string;
  slug: string;
  title: string;
  maxAmount: number;
  zakatEligible: boolean;
  copy: DonationFormCopy;
};

const selectionGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))",
  gap: ".75rem",
  margin: "1rem 0",
};
const choiceCard: CSSProperties = {
  display: "grid",
  gap: ".5rem",
  padding: "1rem",
  border: "1px solid var(--af-color-blue-600)",
  borderRadius: ".8rem",
  color: "var(--af-color-navy-950)",
  background: "var(--af-color-surface)",
  textAlign: "left",
  cursor: "pointer",
  font: "inherit",
};
const section: CSSProperties = {
  margin: "clamp(1.5rem, 4vw, 3rem) 0",
  padding: "clamp(1rem, 2.5vw, 2rem)",
  border: "1px solid rgb(18 34 57 / 14%)",
  borderRadius: "1rem",
  background: "var(--af-color-white)",
  color: "var(--af-color-navy-950)",
};

/** Server-approved appeals only. Never infer payment eligibility from this view;
 * the order/transfer endpoints perform their own fresh financial checks. */
export function AppealLandingCheckout({ appeals, paymentDetails }: {
  appeals: readonly ReviewedAppealChoice[];
  paymentDetails: DonationPaymentDetails;
}) {
  const eligible = appeals.filter(appeal =>
    Boolean(appeal.id.trim() && appeal.title.trim()) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(appeal.slug) &&
    getWholeRupeeCheckoutRange(appeal.maxAmount) !== null,
  ).slice(0, 4);
  const [selectedId, setSelectedId] = useState(eligible[0]?.id ?? "");
  const [locked, setLocked] = useState(false);
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const lockRef = useRef(false);
  const handleLockChange = useCallback((value: boolean) => {
    lockRef.current = value;
    setLocked(value);
  }, []);
  const selected = eligible.find(appeal => appeal.id === selectedId) ?? eligible[0];
  if (!selected) return null;

  return <section id="choose-appeal-checkout" style={section} aria-labelledby="choose-appeal-checkout-title">
    <span className="v2-section-label">Currently reviewed giving destinations</span>
    <h2 className="v2-section-title" id="choose-appeal-checkout-title">Choose an appeal and give on this page.</h2>
    <p>Each appeal has its own verified remaining need. Review the case before selecting a destination.
      The payment server checks the latest approval and balance again before any online order.</p>
    <div style={selectionGrid} role="group" aria-label="Choose a reviewed appeal">
      {eligible.map(appeal => <div key={appeal.id} style={{ minWidth: 0 }}>
        <button
          type="button"
          style={{ ...choiceCard, width: "100%", outlineOffset: "3px", opacity: locked ? .7 : 1 }}
          aria-pressed={appeal.id === selected.id}
          aria-label={`Select ${appeal.title}, with ${formatCheckoutRemainingINR(appeal.maxAmount)} remaining`}
          disabled={locked}
          onClick={() => { if (!lockRef.current) { setSelectedId(appeal.id); setCheckoutRequested(false); } }}
        >
          <strong>{appeal.title}</strong>
          <span>{formatCheckoutRemainingINR(appeal.maxAmount)} remaining</span>
        </button>
        <Link className="v2-text-link" href={`/appeals/${appeal.slug}`}>Review this appeal <span aria-hidden="true">↗</span></Link>
      </div>)}
    </div>
    <p role="status" aria-live="polite">Selected destination: <strong>{selected.title}</strong>.
      {locked ? " Payment or verification in progress; destination changes are disabled." : " You can change your selection before submitting."}</p>
    <button type="button" className="v2-button" aria-expanded={checkoutRequested}
      aria-controls="reviewed-appeal-payment-methods" disabled={locked}
      onClick={() => { if (!lockRef.current) setCheckoutRequested(true); }}>
      {checkoutRequested ? "Payment methods ready below" : "Continue to payment methods"}
    </button>
    <div id="reviewed-appeal-payment-methods">
      {checkoutRequested && <>
        <DonationMethods key={selected.id} appealId={selected.id} appealTitle={selected.title}
          maxAmount={selected.maxAmount} zakatEligible={selected.zakatEligible}
          paymentDetails={paymentDetails} copy={selected.copy}
          onLockChange={handleLockChange} />
      </>}
    </div>
  </section>;
}
