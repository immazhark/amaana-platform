"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TALEEM_CATALOGUE, type TaleemProgrammeId } from "@/content/taleem-catalogue";
import { DonationMethods } from "@/components/donation-methods";
import type { DonationFormCopy } from "@/components/donation-form-copy";
import type { GiveFund } from "@/components/fund-giving/fund-copy";
import styles from "@/components/fund-giving/fund-giving.module.css";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { MAX_SPONSORSHIP_UNITS, quoteSponsorship, SPONSORSHIP_MONTH_OPTIONS, type SponsorshipSelection } from "@/lib/taleem-sponsorship";

const MAX_GIFT_RUPEES = 1_000_000; // mirrors the server limit; the server enforces it
const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const MONTH_LABEL: Record<number, string> = { 1: "1 month", 3: "3 months", 6: "6 months", 12: "12 months" };

/** The form copy is built on the server and passed in, so the copy modules are not duplicated into this client chunk
 * (the JS budget is enforced and the fund checkout already ships them).
 *
 * A donor chooses a Taleem programme, how many units and for how many months, then pays through the same hardened
 * checkout forms every other gift uses. The price shown here comes from the same engine the server uses, but the server
 * recomputes it from the approved catalogue and refuses any other amount. The gift supports the programme: it does not
 * name or reserve a student, and the period is paid once, never as a recurring mandate. */
export function TaleemSponsorshipConfigurator({ fund, copy, paymentDetails, feeBps }: { fund: GiveFund; copy: DonationFormCopy; paymentDetails: DonationPaymentDetails; feeBps: number }) {
  const programmes = TALEEM_CATALOGUE.programmes.filter(item => item.available && item.approval === "APPROVED");
  const [programmeId, setProgrammeId] = useState<TaleemProgrammeId | undefined>(programmes[0]?.id);
  const [months, setMonths] = useState<number>(SPONSORSHIP_MONTH_OPTIONS[0]);
  const [unitsText, setUnitsText] = useState("1");
  const [requested, setRequested] = useState(false);
  const [locked, setLocked] = useState(false);
  const lockRef = useRef(false);
  const paymentRef = useRef<HTMLDivElement>(null);

  const onLockChange = useCallback((value: boolean) => { lockRef.current = value; setLocked(value); }, []);
  const change = (next: () => void) => { if (lockRef.current) return; next(); setRequested(false); };

  useEffect(() => {
    if (!requested) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paymentRef.current?.focus({ preventScroll: true });
    paymentRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [requested]);

  const programme = programmes.find(item => item.id === programmeId);
  if (!programme) return null;
  const parsedUnits = /^[0-9]{1,2}$/.test(unitsText) ? Number(unitsText) : 1;
  const units = Math.min(Math.max(parsedUnits, 1), MAX_SPONSORSHIP_UNITS);
  const quoted = quoteSponsorship({ programmeId: programme.id, units, months });
  if (!quoted.ok || quoted.quote.totalPaise % 100 !== 0 || quoted.quote.totalPaise / 100 > MAX_GIFT_RUPEES) return null;
  const totalRupees = quoted.quote.totalPaise / 100;
  const unitRate = programme.monthlyPaise / 100;
  const selection: SponsorshipSelection = { programmeId: programme.id, units, months, totalRupees };

  return (
    <section id="programme-sponsorship" className={styles.shell} aria-labelledby="programme-sponsorship-heading">
      <fieldset className={styles.fieldset} disabled={locked}>
        <legend className={styles.legend}>
          <span className={styles.eyebrow}>Programme sponsorship</span>
          <span id="programme-sponsorship-heading" className={styles.heading}>Sponsor a Taleem programme.</span>
        </legend>
        <p className={styles.fine}>Your gift supports the Taleem programme and its teaching. It does not name or reserve a student. The period you choose is paid once; it is not a monthly subscription.</p>

        <div className={styles.modes} role="radiogroup" aria-label="Programme">
          {programmes.map(item => (
            <label className={styles.mode} key={item.id}>
              <input type="radio" name="sponsorshipProgramme" value={item.id} checked={item.id === programme.id} onChange={() => change(() => setProgrammeId(item.id))} />
              <span>{item.name}</span>
            </label>
          ))}
        </div>
        <p>{programme.summary} <span className="muted">{rupees(unitRate)} a month for each unit.</span></p>

        <fieldset className={styles.campaign} disabled={locked}>
          <legend className={styles.campaignTitle}>How long, and how many units</legend>
          <div className={styles.modes} role="radiogroup" aria-label="Duration, paid once">
            {SPONSORSHIP_MONTH_OPTIONS.map(option => (
              <label className={styles.mode} key={option}>
                <input type="radio" name="sponsorshipMonths" value={option} checked={option === months} onChange={() => change(() => setMonths(option))} />
                <span>{MONTH_LABEL[option]}</span>
              </label>
            ))}
          </div>
          <div className={styles.stepper}>
            <button type="button" className={styles.step} aria-label="Fewer units" disabled={units <= 1} onClick={() => change(() => setUnitsText(String(units - 1)))}>−</button>
            <label className={styles.units}>
              <span className="sr-only">Number of units</span>
              <input inputMode="numeric" pattern="[0-9]*" value={unitsText} aria-describedby="programme-total" onChange={event => change(() => setUnitsText(event.target.value.replace(/[^0-9]/g, "").slice(0, 2)))} onBlur={() => setUnitsText(String(units))} />
            </label>
            <button type="button" className={styles.step} aria-label="More units" disabled={units >= MAX_SPONSORSHIP_UNITS} onClick={() => change(() => setUnitsText(String(units + 1)))}>+</button>
            <p id="programme-total" className={styles.total} aria-live="polite">{plural(units, "unit", "units")} × {plural(months, "month", "months")} × {rupees(unitRate)} = <strong>{rupees(totalRupees)}</strong></p>
          </div>
        </fieldset>
      </fieldset>

      <div className={styles.panel}>
        <p className={styles.panelTitle}>{programme.name}: {rupees(totalRupees)} in one payment</p>
        <p className={styles.fine}>Months are a prepaid period, not a recurring mandate. If the programme cannot go ahead as planned, your gift goes to the nearest similar Taleem purpose and is recorded in our ledger. Zakat is never moved to a different purpose without your permission.</p>
        <button type="button" className="v2-button" aria-expanded={requested} aria-controls="programme-payment" disabled={locked} onClick={() => { if (!lockRef.current) setRequested(true); }}>
          {requested ? "Payment options are open below" : `Give ${rupees(totalRupees)} to ${programme.name}`}
        </button>
      </div>

      <div id="programme-payment" ref={paymentRef} tabIndex={-1} className={styles.payment}>
        {requested && <DonationMethods key={`${selection.programmeId}-${selection.units}-${selection.months}`} fundSlug={fund.slug} sponsorship={selection} feeBps={feeBps} appealTitle={`${fund.name}: ${programme.name} sponsorship`} maxAmount={MAX_GIFT_RUPEES} zakatEligible={fund.zakatPolicy === "ACCEPTED"} paymentDetails={paymentDetails} copy={copy} onLockChange={onLockChange} />}
      </div>
    </section>
  );
}
