import { notFound } from "next/navigation";
import { WorkPortfolio } from "@/components/work-portfolio";
import { programmeCategories, programmes } from "@/lib/master-copy";
import "@/app/our-work.css";
import "@/app/our-work/work-filters.css";
import styles from "@/app/our-work/work-filter-audit.module.css";
export const dynamic = "force-dynamic";
export default function PortfolioFixture() {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();
  const causes = programmeCategories.map(category => ({ ...category, id: category.slug, initiatives: programmes.filter(item => item.causeSlug === category.slug && !("parentSlug" in item)).map(item => ({
    id: item.slug, slug: item.slug, title: item.title, summary: item.summary,
    year: "year" in item ? Number(item.year) : null,
    startYear: null, endYear: null, isFeatured: false,
    primaryMetric: "primaryMetric" in item ? String(item.primaryMetric) : null,
    primaryMetricLabel: "primaryMetricLabel" in item ? String(item.primaryMetricLabel) : null,
    mediaAssets: [],
  })) }));
  return <div className="v2-home v2-work-index"><h1 className="v2-shell">Portfolio browser acceptance</h1><section className="v2-section paper"><div className="v2-shell">
    <form className={`work-filters ${styles.toolbar}`} aria-label="Filter fixture"><label className={styles.filterLabel}>Programme<select className={styles.filterSelect}><option>All programmes</option><option>Medical &amp; Financial Relief</option></select></label><label className={styles.filterLabel}>Year<select className={styles.filterSelect}><option>All years</option><option>2025</option></select></label><button className="v2-button">Apply filters</button></form>
    <WorkPortfolio causes={causes} />
  </div></section></div>;
}
