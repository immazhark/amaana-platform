"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { DonationMethods } from "@/components/donation-methods";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { zakatNoticeForFund } from "@/lib/giving-funds";
import { FundGlyph } from "./fund-glyphs";
import { fundDonationFormCopy, ZAKAT_TAG, type GiveFund } from "./fund-copy";
import styles from "./fund-giving.module.css";

const RUNNING_COSTS_SLUG = "foundation-operations";
const MAX_GIFT_RUPEES = 1_000_000; // mirrors the server limit; the server enforces it

function FundCard({ fund, index, selected, locked, onSelect }: { fund: GiveFund; index: number; selected: boolean; locked: boolean; onSelect: (slug: string) => void }) {
  const tagId = `fund-tag-${fund.slug}`;
  return (
    <label className={styles.card} data-selected={selected} data-locked={locked} style={{ "--i": index } as CSSProperties}>
      <input type="radio" name="fund" value={fund.slug} className={styles.radio} checked={selected} disabled={locked} aria-describedby={tagId} onChange={() => onSelect(fund.slug)} />
      <span className={styles.glyph}><FundGlyph slug={fund.slug} /></span>
      <span className={styles.cardBody}>
        <strong className={styles.cardName}>{fund.name}</strong>
        <span className={styles.cardSummary}>{fund.summary}</span>
      </span>
      <span id={tagId} className={styles.tag} data-policy={fund.zakatPolicy === "ACCEPTED" ? "zakat" : "non-zakat"}>{ZAKAT_TAG[fund.zakatPolicy]}</span>
      <span className={styles.check} aria-hidden="true" />
    </label>
  );
}

/** Donor chooses a designated fund, then pays through the same hardened checkout forms the appeals use.
 * The server re-validates the fund, the Zakat rule and every amount; nothing here is trusted. */
export function FundGivingCheckout({ funds, initialSlug, paymentDetails, feeBps }: { funds: readonly GiveFund[]; initialSlug?: string; paymentDetails: DonationPaymentDetails; feeBps: number }) {
  const primary = useMemo(() => funds.filter(fund => fund.slug !== RUNNING_COSTS_SLUG), [funds]);
  const running = useMemo(() => funds.filter(fund => fund.slug === RUNNING_COSTS_SLUG), [funds]);
  const fallback = funds.find(fund => fund.isGeneral) ?? funds[0];
  const [selectedSlug, setSelectedSlug] = useState(() => (funds.some(fund => fund.slug === initialSlug) ? initialSlug : fallback?.slug) ?? "");
  const [requested, setRequested] = useState(false);
  const [locked, setLocked] = useState(false);
  const lockRef = useRef(false);
  const paymentRef = useRef<HTMLDivElement>(null);
  const selected = funds.find(fund => fund.slug === selectedSlug) ?? fallback;

  const onLockChange = useCallback((value: boolean) => { lockRef.current = value; setLocked(value); }, []);
  const select = useCallback((slug: string) => {
    if (lockRef.current) return;
    setSelectedSlug(slug);
    setRequested(false);
  }, []);

  useEffect(() => {
    if (!requested) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paymentRef.current?.focus({ preventScroll: true });
    paymentRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [requested]);

  if (!selected) return null;
  const notice = zakatNoticeForFund(selected.zakatPolicy);
  const copy = fundDonationFormCopy(selected);
  const customRequest = selected.isGeneral ? (
    <div className="field full">
      <label htmlFor="donorDirective">Want it used for something specific? <span className="muted">optional</span></label>
      <textarea id="donorDirective" name="donorDirective" rows={3} maxLength={500} />
      <small>This is a request, not a guarantee. Our team confirms whether it can be honoured; otherwise your gift supports the General Fund.</small>
    </div>
  ) : undefined;

  return (
    <section className={styles.shell} aria-labelledby="give-fund-heading">
      <fieldset className={styles.fieldset} disabled={locked}>
        <legend className={styles.legend}><span className={styles.eyebrow}>Step 1</span><span id="give-fund-heading" className={styles.heading}>Choose where your gift goes</span></legend>
        <div className={styles.grid}>
          {primary.map((fund, index) => <FundCard key={fund.slug} fund={fund} index={index} selected={fund.slug === selected.slug} locked={locked} onSelect={select} />)}
        </div>
        {running.length > 0 && <div className={styles.running}>
          <p className={styles.runningNote}>Prefer to keep the work itself running? Administration and recurring costs have their own fund, kept separate from every cause above.</p>
          <div className={styles.grid}>{running.map((fund, index) => <FundCard key={fund.slug} fund={fund} index={primary.length + index} selected={fund.slug === selected.slug} locked={locked} onSelect={select} />)}</div>
        </div>}
      </fieldset>

      <p className="sr-only" role="status" aria-live="polite">Selected fund: {selected.name}. {ZAKAT_TAG[selected.zakatPolicy]}.</p>
      <div key={selected.slug} className={styles.panel}>
        <p className={styles.panelTitle}>{selected.name}</p>
        <p>{selected.summary}</p>
        {notice && <p className={styles.notice} data-tone={selected.zakatPolicy === "NOT_ACCEPTED" ? "firm" : "soft"}><strong>{selected.zakatPolicy === "NOT_ACCEPTED" ? "Please note: " : "Note: "}</strong>{notice}</p>}
        <p className={styles.fine}>If a fund is fully funded or its purpose cannot go ahead, your gift goes to the nearest similar purpose and is recorded in our ledger. Zakat is never moved to a different purpose without your permission.</p>
        <button type="button" className="v2-button" aria-expanded={requested} aria-controls="fund-payment" disabled={locked} onClick={() => { if (!lockRef.current) setRequested(true); }}>
          {requested ? "Payment options are open below" : `Give to ${selected.name}`}
        </button>
      </div>

      <div id="fund-payment" ref={paymentRef} tabIndex={-1} className={styles.payment}>
        {requested && <DonationMethods key={selected.slug} fundSlug={selected.slug} feeBps={feeBps} appealTitle={selected.name} maxAmount={MAX_GIFT_RUPEES} paymentDetails={paymentDetails} copy={copy} extraFields={customRequest} onLockChange={onLockChange} />}
      </div>
    </section>
  );
}
