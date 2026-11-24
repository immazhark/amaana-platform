import Link from "next/link";
import type { CSSProperties } from "react";
import { FundGlyph } from "@/components/fund-giving/fund-glyphs";
import { ZAKAT_TAG } from "@/components/fund-giving/fund-copy";
import type { PublicFundRow } from "@/lib/public-fund-ledger";
import styles from "./public-fund-ledger.module.css";

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const PREVIEW = 3;

function Stat({ label, value }: { label: string; value: string }) {
  return <div className={styles.stat}><dt>{label}</dt><dd>{value}</dd></div>;
}

function Entry({ entry }: { entry: PublicFundRow["entries"][number] }) {
  return (
    <li className={styles.entry}>
      <time dateTime={entry.spentOn}>{day(entry.spentOn)}</time>
      <span className={styles.entryBody}>
        <strong>{entry.title}</strong>
        {entry.publicSummary ? <span>{entry.publicSummary}</span> : null}
        {entry.pool === "ZAKAT" ? <span className={styles.pool}>Paid from Zakat funds</span> : null}
      </span>
      <span className={styles.entryAmount}>{rupees(entry.amountPaise)}</span>
    </li>
  );
}

// A fund with no gifts, no published spending and nothing held for the year. Ten of these would repeat the same two empty
// sentences ten times, so they render as one compact line each; any activity at all restores the full card.
const isQuiet = (row: PublicFundRow) => row.receivedPaise === 0 && row.spentPaise === 0 && row.heldPaise === 0 && row.entries.length === 0;

function FundCard({ row, index, year }: { row: PublicFundRow; index: number; year: string }) {
  const headingId = `ledger-${row.slug}`;
  if (isQuiet(row)) {
    return (
      <li className={`${styles.card} ${styles.cardQuiet}`} style={{ "--i": index } as CSSProperties}>
        <article aria-labelledby={headingId}>
          <header className={styles.cardHead}>
            <span className={styles.glyph}><FundGlyph slug={row.slug} /></span>
            <div>
              <h3 id={headingId}>{row.name}</h3>
              <span className={styles.tag} data-policy={row.zakatPolicy === "ACCEPTED" ? "zakat" : "non-zakat"}>{ZAKAT_TAG[row.zakatPolicy]}</span>
            </div>
          </header>
          <p className={styles.empty}>No gifts or published spending in {year} yet.</p>
          <Link className={styles.give} href={`/give?fund=${row.slug}`}>Give to this fund <span aria-hidden="true">→</span></Link>
        </article>
      </li>
    );
  }
  const shown = row.entries.slice(0, PREVIEW);
  const more = row.entries.slice(PREVIEW);
  const percent = Math.round(row.spentShare * 100);
  return (
    <li className={styles.card} style={{ "--i": index } as CSSProperties}>
      <article aria-labelledby={headingId}>
        <header className={styles.cardHead}>
          <span className={styles.glyph}><FundGlyph slug={row.slug} /></span>
          <div>
            <h3 id={headingId}>{row.name}</h3>
            <span className={styles.tag} data-policy={row.zakatPolicy === "ACCEPTED" ? "zakat" : "non-zakat"}>{ZAKAT_TAG[row.zakatPolicy]}</span>
          </div>
        </header>
        <dl className={styles.stats}>
          <Stat label={`Received in ${year}`} value={rupees(row.receivedPaise)} />
          <Stat label="Spent and published" value={rupees(row.spentPaise)} />
          <Stat label="Held for this fund" value={rupees(row.heldPaise)} />
        </dl>
        <div className={styles.meter} aria-hidden="true"><span style={{ "--share": row.spentShare } as CSSProperties} /></div>
        <p className={styles.meterText}>{row.receivedPaise > 0 ? `${percent}% of what was received this year has been spent and published.` : "No gifts recorded in this financial year yet."}</p>
        {row.entries.length > 0 ? (
          <>
            <ul className={styles.entries} aria-label={`Published spending from ${row.name}`}>{shown.map(entry => <Entry key={entry.id} entry={entry} />)}</ul>
            {more.length > 0 ? (
              <details className={styles.more}>
                <summary>Show {more.length} more {more.length === 1 ? "entry" : "entries"}</summary>
                <ul className={styles.entries}>{more.map(entry => <Entry key={entry.id} entry={entry} />)}</ul>
              </details>
            ) : null}
          </>
        ) : <p className={styles.empty}>Nothing has been published as spent from this fund in {year} yet.</p>}
        <Link className={styles.give} href={`/give?fund=${row.slug}`}>Give to this fund <span aria-hidden="true">→</span></Link>
      </article>
    </li>
  );
}

export function PublicFundLedgerView({ rows, totals, year, years }: { rows: readonly PublicFundRow[]; totals: { receivedPaise: number; spentPaise: number; heldPaise: number }; year: string; years: readonly string[] }) {
  return (
    <section className={styles.shell} aria-labelledby="ledger-heading">
      <div className={styles.top}>
        <h2 id="ledger-heading">Financial year {year}</h2>
        {years.length > 1 ? (
          <nav aria-label="Financial year">
            <ul className={styles.years}>{years.map(label => <li key={label}><Link href={`/funds?fy=${label}`} aria-current={label === year ? "page" : undefined}>{label}</Link></li>)}</ul>
          </nav>
        ) : null}
      </div>
      <dl className={styles.band}>
        <Stat label="Received (verified)" value={rupees(totals.receivedPaise)} />
        <Stat label="Spent and published" value={rupees(totals.spentPaise)} />
        <Stat label="Held for purpose, to date" value={rupees(totals.heldPaise)} />
      </dl>
      {rows.length > 0 && rows.every(isQuiet) ? <p className={styles.quietNote}>The public ledger is open for {year}. Each fund shows its verified gifts and published spending here as they are recorded, and nothing is estimated.</p> : null}
      <ul className={styles.cards}>{rows.map((row, index) => <FundCard key={row.slug} row={row} index={index} year={year} />)}</ul>
      <p className={styles.method}>Figures come from verified payments, net of any refunds, and from spending entries that Amaana&apos;s team has recorded and published. Payments still waiting for bank verification are never counted, and nothing is estimated.</p>
    </section>
  );
}
