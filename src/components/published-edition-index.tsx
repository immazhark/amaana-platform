import Link from "@/components/navigation-link";
import styles from "./published-edition-index.module.css";

export type PublishedEdition = {
  slug: string;
  title: string;
  year: number | null;
  startYear: number | null;
  endYear: number | null;
  primaryMetric: string | null;
  primaryMetricLabel: string | null;
};

function validYear(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 2000 && value <= 2100;
}

export function approvedEditionTimeline(editions: readonly PublishedEdition[]) {
  const seen = new Set<string>();
  return editions.flatMap(item => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || seen.has(item.slug)) return [];
    const from = validYear(item.year) ? item.year : validYear(item.startYear) ? item.startYear : null;
    const until = validYear(item.year) ? item.year : validYear(item.endYear) ? item.endYear : from;
    if (from === null || until === null || until < from) return [];
    seen.add(item.slug);
    const metric = item.primaryMetric?.trim() ?? "";
    const metricLabel = item.primaryMetricLabel?.trim() ?? "";
    return [{
      slug: item.slug,
      title: item.title.trim() || "Published programme edition",
      period: from === until ? String(from) : `${from}–${until}`,
      sortYear: until,
      metric: metric && metricLabel ? metric : null,
      metricLabel: metric && metricLabel ? metricLabel : null,
    }];
  }).sort((a,b) => a.sortYear - b.sortYear || a.slug.localeCompare(b.slug));
}

/** A plain linked alternative to the year carousel: no inferred campaign
 * budgets, raised totals or progress percentages from beneficiary counts. */
export function PublishedEditionIndex({ editions }: { editions: readonly PublishedEdition[] }) {
  const ordered = approvedEditionTimeline(editions);
  if (ordered.length < 2) return null;
  return <nav className={styles.root} aria-label="Published programme edition index">
    <div className={styles.heading}>
      <strong>Explore published editions by year</strong>
      <p>Each documented result belongs to its own edition. These are not live donation totals or fundraising goals.</p>
    </div>
    <ol className={styles.items}>
      {ordered.map(item => <li key={item.slug}>
        <Link href={`/our-work/${item.slug}`} aria-label={`Read ${item.title}, ${item.period}`}>
          <span className={styles.year}>{item.period}</span>
          <span className={styles.detail}>
            <strong>{item.title}</strong>
            {item.metric && <small>{item.metric} · {item.metricLabel}</small>}
          </span>
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </Link>
      </li>)}
    </ol>
  </nav>;
}
