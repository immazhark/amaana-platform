import Link from "@/components/navigation-link";
import styles from "./verified-impact-strip.module.css";

export type VerifiedImpactItem = {
  slug: string;
  title: string;
  value: string;
  label: string;
};

/** Published initiative-year facts only: never infer a total raised or a
 * fundraising target from a delivered kit/student/beneficiary count. */
export function VerifiedImpactStrip({ items, headingId = "published-outcomes-heading" }: {
  items: readonly VerifiedImpactItem[];
  headingId?: string;
}) {
  // Publication approval is checked by the database projection. Guard the
  // public link boundary separately so malformed legacy slugs or blank values
  // do not create navigable routes or misleading evidence cards.
  const visible = items.filter(item =>
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) &&
    item.title.trim().length > 0 && item.value.trim().length > 0 &&
    item.label.trim().length > 0,
  ).filter((item, index, list) => list.findIndex(candidate => candidate.slug === item.slug) === index).slice(0, 3);
  if (visible.length === 0) return null;
  return <aside className={styles.root} aria-labelledby={headingId}>
    <div className={styles.header}>
      <div><span className={styles.kicker}>Publicly documented outcomes</span>
        <h2 id={headingId}>The work behind every invitation to give.</h2>
      </div>
      <Link className={styles.more} href="/impact">Explore evidence <span aria-hidden="true">↗</span></Link>
    </div>
    <div className={styles.grid}>
      {visible.map(item => <Link key={item.slug} className={styles.item}
        href={`/our-work/${item.slug}`} aria-label={`${item.value} ${item.label}, ${item.title}. View documented work`}>
        <strong>{item.value}</strong>
        <span>{item.label}</span>
        <small>{item.title} <span aria-hidden="true">↗</span></small>
      </Link>)}
    </div>
    <p className={styles.disclaimer}>These figures describe individual published initiatives.
      They are not live donation balances, pooled fundraising totals or projections.
      Sensitive records used for verification remain private.</p>
  </aside>;
}
