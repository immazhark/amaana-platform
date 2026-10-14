"use client";

import { lazy, Suspense, useCallback, useRef, useState, type ReactNode } from "react";
import { getAppealProgressPercent } from "@/lib/appeals";
import styles from "./appeal-donation-flow.module.css";

const DonationMethods = lazy(() => import("@/components/donation-methods")
  .then(module => ({ default: module.DonationMethods })));

export type AppealDonationChoice = {
  id: string;
  slug: string;
  title: string;
  raised: number;
  goal: number;
  remaining: number;
  zakatEligible: boolean;
};

type Props = {
  appeals: readonly AppealDonationChoice[];
  bankAvailable: boolean;
  onSubmissionLockChange?: (locked: boolean) => void;
  paymentInstructions: {
    DIRECT_UPI: ReactNode;
    BANK_TRANSFER: ReactNode;
  };
};

/** A bounded, server-approved set of current appeals. Payment methods remain
 * the original reviewed components. Do not unmount a checkout mid-payment. */
export function AppealDonationFlow({ appeals, paymentInstructions, bankAvailable, onSubmissionLockChange }: Props) {
  const [selectedId, setSelectedId] = useState(appeals[0]?.id ?? "");
  const [locked, setLocked] = useState(false);
  const lockRef = useRef(false);
  const updateLock = useCallback((next: boolean) => {
    lockRef.current = next;
    setLocked(next);
    onSubmissionLockChange?.(next);
  }, [onSubmissionLockChange]);
  const selected = appeals.find(appeal => appeal.id === selectedId) ?? appeals[0];
  if (!selected) return <p role="status">No verified appeal is available for checkout.</p>;

  return <section className={styles.root} id="active-appeal-checkout" aria-labelledby="appeal-checkout-heading">
    <div className={styles.intro}>
      <span className={styles.eyebrow}>Approved appeals · live verified goals</span>
      <h2 id="appeal-checkout-heading">Choose an active appeal and give directly.</h2>
      <p>Each target belongs to its own currently reviewed appeal, not a pooled campaign total.
        A goal or donation may change before checkout; the server rechecks eligibility and remaining need.</p>
    </div>
    <div className={styles.choiceGrid} role="group" aria-label="Select a verified appeal">
      {appeals.map(appeal => {
        const percent = getAppealProgressPercent(appeal.raised, appeal.goal);
        return <button key={appeal.id} type="button" disabled={locked}
          className={styles.choice} aria-pressed={selected.id === appeal.id}
          onClick={() => { if (!lockRef.current) setSelectedId(appeal.id); }}>
          <strong>{appeal.title}</strong>
          <span>₹{appeal.remaining.toLocaleString("en-IN", { maximumFractionDigits: 2 })} remaining</span>
          <span className={styles.track} aria-hidden="true"><span style={{ width: `${percent}%` }}/></span>
          <small>{percent}% of the reviewed ₹{appeal.goal.toLocaleString("en-IN", { maximumFractionDigits: 2 })} goal</small>
        </button>;
      })}
    </div>
    <div className={styles.checkout}>
      <p className={styles.selected}>Selected: <strong>{selected.title}</strong> · verified remaining need
        ₹{selected.remaining.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
      <Suspense fallback={<p role="status">Preparing secure donation methods…</p>}>
        <DonationMethods key={selected.id} appealId={selected.id} appealTitle={selected.title}
          maxAmount={selected.remaining} zakatEligible={selected.zakatEligible}
          bankAvailable={bankAvailable} paymentInstructions={paymentInstructions}
          onSubmissionLockChange={updateLock}/>
      </Suspense>
    </div>
  </section>;
}
