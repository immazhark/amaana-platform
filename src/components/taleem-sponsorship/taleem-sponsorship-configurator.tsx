"use client";

import { GivingNoScriptNotice } from "@/components/giving-no-script-notice";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { DonationMethods } from "@/components/donation-methods";
import type { DonationFormCopy } from "@/components/donation-form-copy";
import type { TaleemProgrammeId } from "@/content/taleem-catalogue";
import type { GiveFund } from "@/components/fund-giving/fund-copy";
import type { TaleemClasses } from "./taleem-sponsorship-copy";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import type { SponsorshipSelection, SponsorshipOffer } from "@/lib/taleem-sponsorship";

const MAX_GIFT_RUPEES = 1_000_000; // mirrors the server limit; the server enforces it
const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** The programme list, durations and fine print are built on the server from the approved catalogue and passed in, so
 * neither the catalogue, the pricing engine nor the copy modules ship in this client chunk (the JS budget is enforced).
 *
 * A donor chooses a Taleem programme, how many units and for how many months, then pays through the same hardened
 * checkout forms every other gift uses. The price shown here comes from the same engine the server uses, but the server
 * recomputes it from the approved catalogue and refuses any other amount. The gift supports the programme: it does not
 * name or reserve a student, and the period is paid once, never as a recurring mandate. */
export function TaleemSponsorshipConfigurator({ fund, offer, copy, paymentDetails, feeBps, classes, head, intro, panelNote, initialProgrammeId }: { fund: GiveFund; offer: SponsorshipOffer; copy: DonationFormCopy; paymentDetails: DonationPaymentDetails; feeBps: number; classes: TaleemClasses; head: ReactNode; intro: ReactNode; panelNote: ReactNode; initialProgrammeId?: TaleemProgrammeId }) {
  const { programmes, monthOptions, maxUnits } = offer;
  const [programmeId, setProgrammeId] = useState(programmes.find(item => item.id === initialProgrammeId)?.id ?? programmes[0]?.id);
  const [months, setMonths] = useState<number>(monthOptions[0] ?? 1);
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
  const units = Math.min(Math.max(parsedUnits, 1), maxUnits);
  const unitRate = programme.monthlyRupees;
  const totalRupees = unitRate * units * months;
  const selection: SponsorshipSelection = { fields: { sponsorshipProgramme: programme.id, sponsorshipUnits: units, sponsorshipMonths: months }, totalRupees };

  return (
    <section id="programme-sponsorship" className={classes.shell} aria-labelledby="programme-sponsorship-heading">
      <GivingNoScriptNotice />
      <fieldset className={classes.fieldset} disabled={locked}>
        {head}
        {intro}

        <div className={classes.modes} role="radiogroup" aria-label="Programme">
          {programmes.map(item => (
            <label className={classes.mode} key={item.id}>
              <input type="radio" name="sponsorshipProgramme" value={item.id} checked={item.id === programme.id} onChange={() => change(() => setProgrammeId(item.id))} />
              <span>{item.name}</span>
            </label>
          ))}
        </div>
        <p>{programme.summary} <span className="muted">{rupees(unitRate)} a month for each unit.</span></p>

        <fieldset className={classes.campaign} disabled={locked}>
          <legend className={classes.campaignTitle}>How long, and how many units</legend>
          <div className={classes.modes} role="radiogroup" aria-label="Duration, paid once">
            {monthOptions.map(option => (
              <label className={classes.mode} key={option}>
                <input type="radio" name="sponsorshipMonths" value={option} checked={option === months} onChange={() => change(() => setMonths(option))} />
                <span>{plural(option, "month", "months")}</span>
              </label>
            ))}
          </div>
          <div className={classes.stepper}>
            <button type="button" className={classes.step} aria-label="Fewer units" disabled={units <= 1} onClick={() => change(() => setUnitsText(String(units - 1)))}>−</button>
            <label className={classes.units}>
              <span className="sr-only">Number of units</span>
              <input inputMode="numeric" pattern="[0-9]*" value={unitsText} aria-describedby="programme-total" onChange={event => change(() => setUnitsText(event.target.value.replace(/[^0-9]/g, "").slice(0, 2)))} onBlur={() => setUnitsText(String(units))} />
            </label>
            <button type="button" className={classes.step} aria-label="More units" disabled={units >= maxUnits} onClick={() => change(() => setUnitsText(String(units + 1)))}>+</button>
            <p id="programme-total" className={classes.total} aria-live="polite">{plural(units, "unit", "units")} × {plural(months, "month", "months")} × {rupees(unitRate)} = <strong>{rupees(totalRupees)}</strong></p>
          </div>
        </fieldset>
      </fieldset>

      <div className={classes.panel}>
        <p className={classes.panelTitle}>{programme.name}: {rupees(totalRupees)} in one payment</p>
        {panelNote}
        <button type="button" className="v2-button" aria-expanded={requested} aria-controls="programme-payment" disabled={locked} onClick={() => { if (!lockRef.current) setRequested(true); }}>
          {requested ? "Payment options are open below" : `Give ${rupees(totalRupees)} to ${programme.name}`}
        </button>
      </div>

      <div id="programme-payment" ref={paymentRef} tabIndex={-1} className={classes.payment}>
        {requested && <DonationMethods key={`${programme.id}-${units}-${months}`} fundSlug={fund.slug} sponsorship={selection} feeBps={feeBps} appealTitle={`${fund.name}: ${programme.name} sponsorship`} maxAmount={MAX_GIFT_RUPEES} zakatEligible={fund.zakatPolicy === "ACCEPTED"} paymentDetails={paymentDetails} copy={copy} onLockChange={onLockChange} />}
      </div>
    </section>
  );
}
