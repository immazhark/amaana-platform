import type { CSSProperties } from "react";
import Link from "next/link";

export type VerifiedImpactItem = {
  slug: string;
  title: string;
  value: string;
  label: string;
};

// Reuse approved brand variables and site focus-link styles. Keeping this
// server-rendered component's layout local avoids adding another global or
// route-repeated stylesheet to the tightly budgeted public site.
const surface: CSSProperties = {
  margin: "clamp(1.25rem, 3vw, 2.5rem) 0",
  padding: "clamp(1rem, 2.3vw, 1.75rem)",
  border: "1px solid rgb(18 34 57 / 14%)",
  borderRadius: "1rem",
  background: "linear-gradient(120deg, var(--af-color-surface), var(--af-color-blue-note))",
  color: "var(--af-color-navy-950)",
};
const heading: CSSProperties = {
  display: "flex", alignItems: "end", justifyContent: "space-between",
  gap: "1rem", flexWrap: "wrap",
};
const cards: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))",
  gap: ".75rem", marginTop: "1.25rem",
};
const card: CSSProperties = {
  display: "grid", alignContent: "start", gap: ".4rem", minWidth: 0,
  border: "1px solid rgb(18 34 57 / 14%)", borderRadius: ".75rem",
  background: "var(--af-color-white)", padding: "1.1rem",
  color: "var(--af-color-navy-950)", overflowWrap: "anywhere",
  textDecoration: "none",
};
const amount: CSSProperties = {
  fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
  lineHeight: 1.16,
  fontWeight: 750,
};
const annotation: CSSProperties = {
  color: "var(--af-color-muted)", fontSize: ".875rem", lineHeight: 1.55,
};

/** Only publication-approved initiative-year facts may enter this view.
 * Never add counts together or imply any live financial balance. */
export function VerifiedImpactStrip({ items, headingId = "published-outcomes-heading" }: {
  items: readonly VerifiedImpactItem[];
  headingId?: string;
}) {
  const visible = items.filter(item =>
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) &&
    item.title.trim().length > 0 &&
    item.value.trim().length > 0 &&
    item.label.trim().length > 0,
  ).filter((item, index, list) => list.findIndex(candidate => candidate.slug === item.slug) === index).slice(0, 3);
  if (visible.length === 0) return null;

  return <aside style={surface} aria-labelledby={headingId}>
    <div style={heading}>
      <div>
        <span className="v2-section-label">Publicly documented outcomes</span>
        <h2 className="v2-section-title" id={headingId}>The work behind every invitation to give.</h2>
      </div>
      <Link className="v2-text-link" href="/impact">Explore evidence <span aria-hidden="true">↗</span></Link>
    </div>
    <div style={cards}>
      {visible.map(item => <Link
        key={item.slug}
        className="v2-text-link"
        style={card}
        href={`/our-work/${item.slug}`}
        aria-label={`${item.value} ${item.label}, ${item.title}. View documented work`}
      >
        <strong style={amount}>{item.value}</strong>
        <span>{item.label}</span>
        <small style={annotation}>{item.title} <span aria-hidden="true">↗</span></small>
      </Link>)}
    </div>
    <p style={{ ...annotation, margin: "1rem 0 0" }}>
      These figures describe individual published initiatives. They are not live donation balances,
      pooled fundraising totals or projections. Sensitive verification records remain private.
    </p>
  </aside>;
}
