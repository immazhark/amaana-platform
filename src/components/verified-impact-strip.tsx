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
export function VerifiedImpactStrip({ items }: { items: readonly VerifiedImpactItem[] }) {
  if (items.length === 0) return null;
  return <aside className={styles.root} aria-labelledby="published-outcomes-heading">
    <div className={styles.header}>
      <div><span className={styles.kicker}>Publicly documented outcomes</span>
        <h2 id="published-outcomes-heading">The work behind every invitation to give.</h2>
      </div>
      <Link className={styles.more} href="/impact">Explore evidence <span aria-hidden="true">↗</span></Link>
    </div>
    <div className={styles.grid}>
      {items.slice(0, 3).map(item => <Link key={item.slug} className={styles.item}
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
