"use client";
import { Suspense, useCallback, useRef, useState } from "react";
import { isSameReviewedFundSnapshot, type DonorFund } from "@/lib/fund-checkout-contract";

import { LazyDonationForm as DonationForm } from "./donation-checkout-loaders";

/** Only separately activated, independently reviewed disclosures reach here. */
export function FundDonationFlow({ funds, onSubmissionLockChange }: { funds: readonly DonorFund[]; onSubmissionLockChange?: (locked: boolean) => void }) {
  const [fund, setFund] = useState<DonorFund | undefined>(funds[0]);
  const [reviewVersion, setReviewVersion] = useState(0);
  const lockRef = useRef(false);
  const [locked, setLocked] = useState(false);
  const updateLock = useCallback((value: boolean) => { lockRef.current = value; setLocked(value); onSubmissionLockChange?.(value); }, [onSubmissionLockChange]);
  if (!fund) {
    const available = funds[0];
    return available
      ? <button type="button" className="v2-button" onClick={() => setFund(available)}>Review {available.name}</button>
      : <p role="status">No approved giving fund is available for checkout.</p>;
  }
  const current = funds.find(item => item.id === fund.id);
  const changed = !current || !isSameReviewedFundSnapshot(fund, current);
  return <section aria-labelledby="giving-fund-selection">
    <h2 id="giving-fund-selection">Choose the purpose of your contribution</h2>
    <div className="v2-premium-form field"><label htmlFor="giving-fund-choice">Approved giving fund</label>
    <select id="giving-fund-choice" value={fund.id} disabled={locked} onChange={event => {
      if (lockRef.current) return;
      const next = funds.find(item => item.id === event.target.value);
      if (next) setFund(next);
    }}>{!funds.some(item => item.id === fund.id) && <option value={fund.id}>{fund.name} — review availability</option>}{funds.map(item => <option value={item.id} key={item.id}>{item.id === fund.id && changed ? `${fund.name} — review updated details` : item.name}</option>)}</select></div>
    {changed && <div role="status">
      <p>{current ? "This fund’s reviewed details have changed. Review the updated purpose before starting a new contribution." : "This fund is no longer available for a new contribution. Choose another approved fund or contact Amaana."}</p>
      {current && <button type="button" className="v2-button v2-button--paper-secondary" disabled={locked} onClick={() => { if (!lockRef.current) { setFund(current); setReviewVersion(version => version + 1); } }}>Review updated fund details</button>}
    </div>}
    <Suspense fallback={<p role="status">Preparing secure contribution form…</p>}>
      <DonationForm key={`${fund.id}:${fund.revision}:${reviewVersion}`} fund={fund} requiresFundReview={changed} maxAmount={1_000_000} onSubmissionLockChange={updateLock}/>
    </Suspense>
  </section>;
}
