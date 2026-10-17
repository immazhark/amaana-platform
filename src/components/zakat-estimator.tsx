"use client";

import { useState } from "react";
import Link from "@/components/navigation-link";
import { calculateZakatEstimate, formatZakatPaise,
  type ZakatAssetKey, type ZakatEstimateInput } from "@/lib/zakat-estimate";
import styles from "./zakat-estimator.module.css";

const assetFields: readonly { id: ZakatAssetKey; label: string; help: string }[] = [
  { id: "cash", label: "Cash, savings and bank balances", help: "Combined value in Indian rupees." },
  { id: "metals", label: "Eligible gold and silver", help: "Enter monetary value, not metal weight. Jewellery treatment differs by scholarly approach." },
  { id: "investments", label: "Eligible investments and shares", help: "Enter only the value considered Zakatable under your reviewed guidance." },
  { id: "inventory", label: "Trade goods and business stock", help: "Value stock intended for resale, not personal-use possessions." },
  { id: "receivables", label: "Recoverable money owed to you", help: "Include only eligible recoverable debts." },
];
const initial: ZakatEstimateInput = {
  cash: "", metals: "", investments: "", inventory: "", receivables: "",
  liabilities: "", nisab: "", hawl: "unsure",
};

export function ZakatEstimator() {
  const [values, setValues] = useState<ZakatEstimateInput>(initial);
  const result = calculateZakatEstimate(values);
  const set = (name: keyof ZakatEstimateInput, value: string) =>
    setValues(previous => ({ ...previous, [name]: value }));
  const currency = (name: keyof Omit<ZakatEstimateInput, "hawl">,
    label: string, help: string) => <div className={styles.field} key={name}>
      <label htmlFor={"zakat-" + name}>{label}</label>
      <p id={"zakat-" + name + "-hint"} className={styles.help}>{help}</p>
      <span className={styles.currency}>
        <span aria-hidden="true">₹</span>
        <input id={"zakat-" + name} name={name} type="text"
          inputMode="decimal" autoComplete="off" maxLength={16}
          placeholder="0.00" aria-describedby={"zakat-" + name + "-hint"}
          value={values[name]} onChange={event => set(name, event.target.value)}/>
      </span>
    </div>;

  const statusText = {
    missing_nisab: "Enter a current nisab amount from a source you trust. No threshold is fetched or assumed.",
    invalid_input: "Check all rupee entries: enter non-negative amounts with at most two decimal places, without commas.",
    below_nisab: "Net wealth is below the nisab amount you entered. This estimate does not show Zakat payable.",
    hawl_unconfirmed: "The entered net amount meets your nisab, but the lunar-year condition has not been confirmed. No payment estimate is shown.",
    estimated: "Estimated amount at 2.5% of the entered net eligible monetary wealth. Review all inclusions, deductions and your nisab basis before acting.",
  }[result.status];

  return <div className={styles.root}>
    <section className={styles.form} aria-labelledby="zakat-entry-title">
      <h2 id="zakat-entry-title">Your monetary wealth</h2>
      <p className={styles.lead}>Use amounts in INR valued on your own Zakat calculation date. Leave unused asset fields blank.</p>
      <div className={styles.fields}>
        {assetFields.map(field => currency(field.id, field.label, field.help))}
      </div>
      <h2 className={styles.subheading}>Deductions and threshold</h2>
      {currency("liabilities", "Eligible liabilities due", "Deduct only amounts permitted by the scholarly approach you follow; do not automatically deduct an entire long-term mortgage.")}
      {currency("nisab", "Your current nisab threshold in INR", "Required. Enter the current gold- or silver-based threshold you have independently checked; this site does not supply live rates.")}
      <fieldset className={styles.hawl}>
        <legend>Have you satisfied your applicable lunar-year (hawl) condition?</legend>
        <p>Different circumstances and scholarly approaches may change this assessment.</p>
        {([
          ["unsure", "Not sure — review first"],
          ["yes", "Yes, I have confirmed it"],
          ["no", "No, not completed"],
        ] as const).map(([value, label]) => <label key={value}>
          <input type="radio" name="hawl" checked={values.hawl === value}
            onChange={() => set("hawl", value)}/>{label}
        </label>)}
      </fieldset>
      <button type="button" className={styles.reset} onClick={() => setValues({ ...initial })}>
        Clear all figures
      </button>
    </section>

    <aside className={styles.result} aria-labelledby="zakat-estimate-title">
      <span className={styles.kicker}>Private, client-side calculation</span>
      <h2 id="zakat-estimate-title">Your estimate</h2>
      <p className={styles.notice}>No account, upload or payment is created. Your entries stay in this page&apos;s temporary memory and are not sent to Amaana.</p>
      {result.status !== "invalid_input" && result.status !== "missing_nisab" &&
        <dl className={styles.breakdown}>
          <div><dt>Entered eligible assets</dt><dd>{formatZakatPaise(result.assetsPaise)}</dd></div>
          <div><dt>Entered deductible liabilities</dt><dd>{formatZakatPaise(result.liabilitiesPaise)}</dd></div>
          <div><dt>Net eligible amount</dt><dd>{formatZakatPaise(result.netPaise)}</dd></div>
          <div><dt>Your nisab threshold</dt><dd>{formatZakatPaise(result.nisabPaise)}</dd></div>
        </dl>}
      <div role="status" aria-live="polite" className={styles.status}>
        {result.status === "estimated" &&
          <strong className={styles.amount}>{formatZakatPaise(result.zakatPaise)}</strong>}
        <p>{statusText}</p>
      </div>
      <p className={styles.disclaimer}>Educational estimate only, not a fatwa or an assessment of Amaana&apos;s Zakat-eligible donation destinations. Jewellery, shares, debts, pensions and the appropriate nisab basis can require qualified scholarly advice.</p>
      <Link className={styles.donate} href="/donate">Review currently approved donation purposes <span aria-hidden="true">↗</span></Link>
      <p className={styles.sources}>Calculation background:{" "}
        <a href="https://islamic-relief.org/news/how-to-calculate-and-pay-zakat/" target="_blank" rel="noopener noreferrer">Islamic Relief calculation guide</a>
        {" · "}
        <a href="https://islamic-relief.org/nisab/" target="_blank" rel="noopener noreferrer">Nisab explained</a>.
        External guidance is not an Amaana endorsement of one school of jurisprudence.</p>
    </aside>
  </div>;
}
