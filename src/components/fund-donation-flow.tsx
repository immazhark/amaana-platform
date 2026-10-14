"use client";
import { useCallback, useRef, useState } from "react";
import { DonationForm } from "@/components/donation-form";
import type { DonorFund } from "@/lib/fund-checkout-contract";

/** Future public flow receives only separately activated, reviewed disclosures. */
export function FundDonationFlow({ funds }: { funds: readonly DonorFund[] }) {
  const [fund, setFund] = useState<DonorFund | undefined>(funds[0]);
  const lockRef = useRef(false);
  const [locked, setLocked] = useState(false);
  const updateLock = useCallback((value: boolean) => { lockRef.current = value; setLocked(value); }, []);
  if (!fund) {
    const available = funds[0];
    return available
      ? <button type="button" onClick={() => setFund(available)}>Review {available.name}</button>
      : <p role="status">No approved giving fund is available for checkout.</p>;
  }
  return <section aria-labelledby="giving-fund-selection">
    <h2 id="giving-fund-selection">Choose the purpose of your contribution</h2>
    <label htmlFor="giving-fund-choice">Approved giving fund</label>
    <select id="giving-fund-choice" value={fund.id} disabled={locked} onChange={event => {
      if (lockRef.current) return;
      const next = funds.find(item => item.id === event.target.value);
      if (next) setFund(next);
    }}>{!funds.some(item => item.id === fund.id) && <option value={fund.id}>{fund.name} — review availability</option>}{funds.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
    <DonationForm key={`${fund.id}:${fund.revision}`} fund={fund} maxAmount={1_000_000} onSubmissionLockChange={updateLock}/>
  </section>;
}
