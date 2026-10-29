import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { programmeBySlug } from "@/lib/master-copy";
import { selectImpactComparison, type ImpactComparisonSearch } from "@/lib/impact-comparison";
import { getImpactComparisonPageData } from "@/lib/public-page-data";
import { documentedImpactMetric } from "@/lib/documented-impact-metric";

/** A published headline requires both its quantity and its context label.
 * Keep reviewed original strings; do not imply evidence where the label is blank. */
function DocumentedComparisonOutcome({ value, label }: {
  value: string | null | undefined;
  label: string | null | undefined;
}) {
  const metric = documentedImpactMetric(value, label);
  if (metric) return <p><strong>{metric.value}</strong> — {metric.label}</p>;
  // A quantity without a contextual unit is not evidence; do not claim the
  // underlying quantity was never published.
  return typeof value === "string" && value.trim()
    ? <p>A complete headline outcome is not available for this initiative.</p>
    : <p>No headline quantity has been published for this initiative.</p>;
}

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Compare Documented Impact",
  description: "Review two published Amaana initiatives side by side, with each initiative's own evidence and outcome kept in context.",
  alternates: { canonical: "/impact/compare" },
  openGraph: {
    title: "Compare Published Impact | Amaana Foundation",
    description: "Two published outcomes, each presented in its own context. No combined totals or beneficiary information.",
    url: "/impact/compare",
    type: "website",
  },
};

export default async function ImpactComparisonPage({
  searchParams,
}: {
  searchParams: Promise<ImpactComparisonSearch>;
}) {
  const [records, search] = await Promise.all([getImpactComparisonPageData(), searchParams]);
  // Keep the same canonical, non-child, published portfolio as /impact.
  const published = records.filter(item => {
    const canonical = programmeBySlug(item.slug);
    return Boolean(canonical) && !(canonical && "parentSlug" in canonical && canonical.parentSlug);
  });
  const choice = selectImpactComparison(published, search);

  return (
    <div className="v2-home v2-impact-page">
      <PageHero
        variant="level1"
        eyebrow="Impact · Compare published outcomes"
        title="Two initiatives. Their own stories."
        description={<p>Choose two published initiatives to understand their documented outcomes side by side. Different programmes serve different needs, so their figures must never be combined or treated as a ranking.</p>}
        actions={[
          { label: "Choose initiatives", href: "#comparison" },
          { label: "See all documented impact", href: "/impact", secondary: true },
        ]}
        visualKicker="Evidence before conclusions"
        visualTitle="Context. Not competition."
        visualNote="Only published programme summaries and reviewed outcome labels appear here. Private case records never enter a comparison."
      />

      <section className="v2-section paper" id="comparison" aria-labelledby="comparison-title">
        <div className="v2-shell">
          <SectionHeading
            id="comparison-title"
            eyebrow={<>Explore the public record</>}
            title={<>Choose two published initiatives.</>}
            subtitle={<>Each published figure stays attached to the initiative that reported it. This does not compare people&apos;s needs or the value of different kinds of support.</>}
          />
          <form key={choice.selected?.map(item => item.slug).join(":") ?? "empty"} method="get" action="/impact/compare#comparison" aria-label="Compare two published initiatives" className="form-grid" style={{ marginBlock: "1.5rem" }}>
            <label className="field" style={{ minWidth: 0 }} htmlFor="compare-left">First initiative
              <select style={{ minWidth: 0, minHeight: "3.125rem", fontSize: "1rem" }} name="left" id="compare-left" required aria-invalid={choice.invalid || undefined} aria-describedby={choice.invalid ? "comparison-error" : undefined} defaultValue={choice.selected?.[0].slug ?? ""}>
                <option value="" disabled>Choose an initiative</option>
                {choice.options.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
              </select>
            </label>
            <label className="field" style={{ minWidth: 0 }} htmlFor="compare-right">Second initiative
              <select style={{ minWidth: 0, minHeight: "3.125rem", fontSize: "1rem" }} name="right" id="compare-right" required aria-invalid={choice.invalid || undefined} aria-describedby={choice.invalid ? "comparison-error" : undefined} defaultValue={choice.selected?.[1].slug ?? ""}>
                <option value="" disabled>Choose another initiative</option>
                {choice.options.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
              </select>
            </label>
            <button type="submit" className="v2-button" style={{ gridColumn: "1 / -1", justifySelf: "start", maxWidth: "100%", whiteSpace: "normal" }}>Compare published outcomes</button>
          </form>

          {choice.invalid && <p id="comparison-error" role="alert">These comparison choices could not be read. Please select two different published initiatives.</p>}
          {choice.requested && <p><Link href="/impact/compare#comparison" className="v2-text-link">Clear comparison</Link></p>}
          {choice.selected ? (
            <section aria-label="Side-by-side published outcomes">
              <div className="form-grid">
              {choice.selected.map((item, index) => (
                <article className="v2-reminder" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0, overflowWrap: "anywhere" }} key={item.slug}>
                  <span className="v2-reminder-label">Published initiative {index + 1} · {item.cause.title}</span>
                  <h2>{item.title}</h2>
                  <DocumentedComparisonOutcome value={item.primaryMetric} label={item.primaryMetricLabel} />
                  <p>{item.summary}</p>
                  <Link className="v2-button" style={{ marginTop: "auto", maxWidth: "100%", whiteSpace: "normal" }} href={`/our-work/${item.slug}`}>Read the full initiative</Link>
                </article>
              ))}
              </div>
              <p>This view is not a ranking or a combined total. Outcomes describe different activities, periods and recipients; follow the full initiative records for their limitations and evidence.</p>
            </section>
          ) : (
            <div className="v2-reminder">
              <h2>Select two published initiatives</h2>
              <p>Choose both initiatives above to review their separate, documented outcomes here. No account, upload or personal details are required.</p>
            </div>
          )}
          <p><Link href="/impact" className="v2-text-link">Explore the complete impact record →</Link></p>
        </div>
      </section>
    </div>
  );
}
