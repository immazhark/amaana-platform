"use client";

import { GivingNoScriptNotice } from "@/components/giving-no-script-notice";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DonationMethods } from "@/components/donation-methods";
import type { DonationPaymentDetails } from "@/lib/donation-payment-details";
import { zakatNoticeForFund } from "@/lib/giving-funds";
import type { CampaignSelection } from "@/lib/fund-campaign";
import type { GiveCampaign, GiveFund } from "./fund-copy";
import type { DonationFormCopy } from "@/components/donation-form-copy";
import { ZAKAT_TAG } from "./fund-labels";
import styles from "./fund-giving.module.css";

const RUNNING_COSTS_SLUG = "foundation-operations";
const MAX_GIFT_RUPEES = 1_000_000; // mirrors the server limit; the server enforces it

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

function FundCard({ fund, index, selected, locked, onSelect, glyph }: { fund: GiveFund; index: number; selected: boolean; locked: boolean; onSelect: (slug: string) => void; glyph: ReactNode }) {
  const tagId = `fund-tag-${fund.slug}`;
  return (
    <label className={styles.card} data-selected={selected} data-locked={locked} style={{ "--i": index } as CSSProperties}>
      <input type="radio" name="fund" value={fund.slug} className={styles.radio} checked={selected} disabled={locked} aria-describedby={tagId} onChange={() => onSelect(fund.slug)} />
      <span className={styles.glyph}>{glyph}</span>
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
export function FundGivingCheckout({ funds, copies, glyphs, initialSlug, paymentDetails, feeBps, campaigns = [] }: { copies: Record<string, DonationFormCopy>; glyphs: Record<string, ReactNode>; funds: readonly GiveFund[]; initialSlug?: string; paymentDetails: DonationPaymentDetails; feeBps: number; campaigns?: readonly GiveCampaign[] }) {
  const primary = useMemo(() => funds.filter(fund => fund.slug !== RUNNING_COSTS_SLUG), [funds]);
  const running = useMemo(() => funds.filter(fund => fund.slug === RUNNING_COSTS_SLUG), [funds]);
  const fallback = funds.find(fund => fund.isGeneral) ?? funds[0];
  const [selectedSlug, setSelectedSlug] = useState(() => (funds.some(fund => fund.slug === initialSlug) ? initialSlug : fallback?.slug) ?? "");
  const [requested, setRequested] = useState(false);
  const [locked, setLocked] = useState(false);
  const [giftMode, setGiftMode] = useState<"campaign" | "custom">("campaign");
  const [unitsText, setUnitsText] = useState("1");
  const lockRef = useRef(false);
  const paymentRef = useRef<HTMLDivElement>(null);
  const selected = funds.find(fund => fund.slug === selectedSlug) ?? fallback;

  const onLockChange = useCallback((value: boolean) => { lockRef.current = value; setLocked(value); }, []);
  const select = useCallback((slug: string) => {
    if (lockRef.current) return;
    setSelectedSlug(slug);
    setRequested(false);
    setGiftMode("campaign");
    setUnitsText("1");
  }, []);

  useEffect(() => {
    if (!requested) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paymentRef.current?.focus({ preventScroll: true });
    paymentRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [requested]);

  if (!selected) return null;
  const campaign = campaigns.find(item => item.fundSlug === selected.slug);
  const parsedUnits = /^[0-9]{1,4}$/.test(unitsText) ? Number(unitsText) : 1;
  const units = campaign ? Math.min(Math.max(parsedUnits, 1), campaign.maxUnits) : 1;
  const selection: CampaignSelection | undefined = campaign && giftMode === "campaign"
    ? { slug: campaign.slug, units, unitPrice: campaign.unitPrice, unitLabel: campaign.unitLabel, unitLabelPlural: campaign.unitLabelPlural }
    : undefined;
  const total = selection ? selection.units * selection.unitPrice : 0;
  const changeGift = (next: () => void) => { if (lockRef.current) return; next(); setRequested(false); };
  const notice = zakatNoticeForFund(selected.zakatPolicy);
  const copy = copies[selected.slug];
  if (!copy) return null;
  const customRequest = selected.isGeneral ? (
    <div className="field full">
      <label htmlFor="donorDirective">Want it used for something specific? <span className="muted">optional</span></label>
      <textarea id="donorDirective" name="donorDirective" rows={3} maxLength={500} />
      <small>This is a request, not a guarantee. Our team confirms whether it can be honoured; otherwise your gift supports the General Fund.</small>
    </div>
  ) : undefined;

  return (
    <section id="choose-fund" className={styles.shell} aria-labelledby="give-fund-heading">
      <GivingNoScriptNotice />
      <fieldset className={styles.fieldset} disabled={locked}>
        <legend className={styles.legend}><span className={styles.eyebrow}>Step 1</span><span id="give-fund-heading" className={styles.heading}>Choose where your gift goes</span></legend>
        <a className={styles.reviewLink} href="#fund-review">Review selected fund</a>
        <div className={styles.grid}>
          {primary.map((fund, index) => <FundCard key={fund.slug} fund={fund} index={index} selected={fund.slug === selected.slug} locked={locked} onSelect={select} glyph={glyphs[fund.slug]} />)}
        </div>
        {running.length > 0 && <div className={styles.running}>
          <p className={styles.runningNote}>Prefer to keep the work itself running? Administration and recurring costs have their own fund, kept separate from every cause above.</p>
          <div className={styles.grid}>{running.map((fund, index) => <FundCard key={fund.slug} fund={fund} index={primary.length + index} selected={fund.slug === selected.slug} locked={locked} onSelect={select} glyph={glyphs[fund.slug]} />)}</div>
        </div>}
      </fieldset>

      <p className="sr-only" role="status" aria-live="polite">Selected fund: {selected.name}. {ZAKAT_TAG[selected.zakatPolicy]}.</p>
      <div key={selected.slug} className={styles.panel}>
        <p id="fund-review" tabIndex={-1} className={`${styles.panelTitle} ${styles.reviewTarget}`}>{selected.name}</p>
        <p>{selected.summary}</p>
        {campaign && <fieldset className={styles.campaign} disabled={locked}>
          <legend className={styles.campaignTitle}>{campaign.title}</legend>
          <p className={styles.campaignMeta}>{rupees(campaign.unitPrice)} per {campaign.unitLabel} · open until {campaign.closesLabel}{campaign.note ? ` · ${campaign.note}` : ""}</p>
          <div className={styles.modes}>
            <label className={styles.mode}><input type="radio" name="giftMode" checked={giftMode === "campaign"} onChange={() => changeGift(() => setGiftMode("campaign"))} /><span>Sponsor {campaign.unitLabelPlural}</span></label>
            <label className={styles.mode}><input type="radio" name="giftMode" checked={giftMode === "custom"} onChange={() => changeGift(() => setGiftMode("custom"))} /><span>Give another amount</span></label>
          </div>
          {giftMode === "campaign" && <div className={styles.stepper}>
            <button type="button" className={styles.step} aria-label={`Fewer ${campaign.unitLabelPlural}`} disabled={units <= 1} onClick={() => changeGift(() => setUnitsText(String(units - 1)))}>−</button>
            <label className={styles.units}><span className="sr-only">Number of {campaign.unitLabelPlural}</span><input inputMode="numeric" pattern="[0-9]*" value={unitsText} aria-describedby="campaign-total" onChange={event => changeGift(() => setUnitsText(event.target.value.replace(/[^0-9]/g, "").slice(0, 4)))} onBlur={() => setUnitsText(String(units))} /></label>
            <button type="button" className={styles.step} aria-label={`More ${campaign.unitLabelPlural}`} disabled={units >= campaign.maxUnits} onClick={() => changeGift(() => setUnitsText(String(units + 1)))}>+</button>
            <p id="campaign-total" className={styles.total} aria-live="polite">{units} {units === 1 ? campaign.unitLabel : campaign.unitLabelPlural} × {rupees(campaign.unitPrice)} = <strong>{rupees(total)}</strong></p>
          </div>}
        </fieldset>}
        {notice && <p className={styles.notice} data-tone={selected.zakatPolicy === "NOT_ACCEPTED" ? "firm" : "soft"}><strong>{selected.zakatPolicy === "NOT_ACCEPTED" ? "Please note: " : "Note: "}</strong>{notice}</p>}
        <p className={styles.fine}>If a fund is fully funded or its purpose cannot go ahead, your gift goes to the nearest similar purpose and is recorded in our ledger. Zakat is never moved to a different purpose without your permission.</p>
        <button type="button" className="v2-button" aria-expanded={requested} aria-controls="fund-payment" disabled={locked} onClick={() => { if (!lockRef.current) setRequested(true); }}>
          {requested ? "Payment options are open below" : selection ? `Give ${rupees(total)} to ${selected.name}` : `Give to ${selected.name}`}
        </button>
      </div>

      <div id="fund-payment" ref={paymentRef} tabIndex={-1} className={styles.payment}>
        {requested && <DonationMethods key={`${selected.slug}-${selection ? `${selection.slug}-${selection.units}` : "open"}`} campaign={selection} fundSlug={selected.slug} feeBps={feeBps} appealTitle={selected.name} maxAmount={MAX_GIFT_RUPEES} paymentDetails={paymentDetails} copy={copy} extraFields={customRequest} onLockChange={onLockChange} />}
      </div>
    </section>
  );
}
