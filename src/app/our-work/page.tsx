import evidenceStyles from "@/components/evidence-pathway.module.css";
import { SectionHeading } from "@/components/section-heading";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { WorkPortfolio } from "@/components/work-portfolio";
import { getOurWorkIndexData } from "@/lib/public-page-data";
import { selectIdentityPublicImage } from "@/lib/public-media";
import { filterWork, type WorkSearch } from "@/lib/work-filters";
import "./work-filters.css";
import auditStyles from "./work-filter-audit.module.css";
import { programmeBySlug, programmeCategories } from '@/lib/master-copy';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Work",
  description: "Explore Amaana Foundation initiatives across medical and financial relief, emergency response, Ramadan and Eid, Taleem education support, and seasonal relief.",
  alternates: { canonical: "/our-work" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: "website", url: "/our-work", title: "Our Work | Amaana Foundation", description: "Explore documented Amaana Foundation initiatives and the evidence, stories and approved media connected to them." },
  twitter: { images: ["/twitter-image"], card: "summary_large_image", title: "Our Work | Amaana Foundation", description: "Explore documented Amaana Foundation initiatives and the evidence, stories and approved media connected to them." },
};

export default async function OurWorkPage({ searchParams }: { searchParams: Promise<WorkSearch> }) {
  const rawCauses = await getOurWorkIndexData();
  const search = await searchParams;
  const allInitiatives = rawCauses.flatMap(cause => cause.initiatives);
  const canonicalInitiatives = allInitiatives.filter(item => { const canonical = programmeBySlug(item.slug); if (!canonical) return false; const isChild = 'parentSlug' in canonical && Boolean(canonical.parentSlug); return Boolean(search.year) || !isChild; });
  const visibleCauses = programmeCategories.map(category => ({ id: category.slug, slug: category.slug, title: category.title, summary: category.summary, initiatives: canonicalInitiatives.filter(item => programmeBySlug(item.slug)?.causeSlug === category.slug) })).filter(cause => cause.initiatives.length > 0);
  const filters = filterWork(visibleCauses, search);
  const initiativeCount = visibleCauses.reduce((total, cause) => total + cause.initiatives.length, 0);
  const causeCount = visibleCauses.length;
  const ramadanEidMedia = visibleCauses
    .find(cause => cause.slug === "ramadan-eid")
    ?.initiatives
    .map(initiative => selectIdentityPublicImage(initiative.mediaAssets))
    .find(Boolean) ?? null;
  const heroMedia = ramadanEidMedia
    ?? visibleCauses
      .flatMap(cause => cause.initiatives)
      .map(initiative => selectIdentityPublicImage(initiative.mediaAssets))
      .find(Boolean)
    ?? null;

  return (
    <div className="v2-home v2-work-index">
      <PageHero
        variant="level1"
        className="page-hero--long-title"
        eyebrow="Our Work · Hyderabad"
        title="Different Needs. One Standard of Care."
        description={<p>Some needs return every year. Others arrive without warning. Explore Amaana’s medical and financial relief, emergency response, Ramadan and Eid initiatives, Taleem education support and seasonal relief.</p>}
        actions={[{ label: "Explore the portfolio", href: "#work-results" }, { label: "See documented impact", href: "/impact", secondary: true }]}
        visual={heroMedia ? <PublicMedia asset={heroMedia} priority sizes="(max-width: 900px) calc(100vw - 2rem), 42vw" /> : <div className="page-hero__visual-fallback page-hero__visual-fallback--stats"><span>Documented public portfolio</span><strong>{initiativeCount} published programmes</strong><div className="page-hero__stat-row"><b>{causeCount}</b><small>programme areas</small></div><i /></div>}
      />

      <section className="v2-section paper" id="work-results"><div className="v2-shell"><SectionHeading eyebrow={<>Explore by need</>} title={<>A living portfolio of service.</>} subtitle={<>Start with a programme area, then use the year filter to explore a specific annual edition.</>} />
        <form className={`work-filters ${auditStyles.toolbar}`} action="/our-work#work-results" method="get" aria-label="Filter published initiatives"><label className={auditStyles.filterLabel} htmlFor="work-programme">Programme<select className={auditStyles.filterSelect} id="work-programme" name="programme" defaultValue={filters.programme}><option value="">All programmes</option>{filters.programme && !visibleCauses.some(cause => cause.slug === filters.programme) && <option value={filters.programme}>Unavailable programme</option>}{visibleCauses.map(cause => <option key={cause.slug} value={cause.slug}>{cause.title}</option>)}</select></label><label className={auditStyles.filterLabel} htmlFor="work-year">Year<select className={auditStyles.filterSelect} id="work-year" name="year" defaultValue={filters.year}><option value="">All years</option>{filters.year && !filters.years.some(year => String(year) === filters.year) && <option value={filters.year}>Unavailable year</option>}{filters.years.map(year => <option key={year} value={year}>{year}</option>)}</select></label><button className="v2-button" type="submit">Apply filters</button>{filters.active && <Link className={auditStyles.clear} href="/our-work#work-results">Clear filters</Link>}</form>
        <p className="work-results-count">{filters.count} published {filters.count === 1 ? "initiative" : "initiatives"}{filters.active ? " matching these filters" : " available to explore"}.</p>
        {filters.results.length > 0 ? (
          <WorkPortfolio causes={filters.results} expanded={filters.active} yearFiltered={Boolean(search.year)} />) : <div className="v2-reminder v2-light-reminder"><h3>{filters.active ? "No published initiatives match these filters." : "The public archive is being prepared."}</h3><p>{filters.active ? "Choose another programme or year, or clear the filters to see all available work." : "Initiative stories and evidence will appear here as public records are available."}</p></div>}
      </div></section>

      <section className={`v2-section dark ${evidenceStyles.surface}`}><div className={`v2-shell ${evidenceStyles.grid}`}><div><p className="v2-section-label">See the evidence</p><h2 className="v2-section-title">The work does not end at the initiative page.</h2><p className="v2-section-intro">Impact, stories, public-safe media and transparency records continue the journey so visitors can understand what happened after support was given.</p></div><div className="v2-reminder"><span className="v2-reminder-label">Follow the trail</span><blockquote>Work → evidence → story → known outcome.</blockquote><div className="v2-hero-actions"><Link className="v2-button ghost" href="/impact">Explore impact</Link><Link className="v2-text-link" href="/stories">Read stories →</Link></div></div></div></section>
      <section className="v2-closing"><div className="v2-shell"><SectionHeading eyebrow={<>Take the next step</>} title={<>Understand first. Then decide how to stand with the work.</>} subtitle={<>Explore completed work, read the stories behind it, or see whether a verified public appeal is currently active.</>} /><div className="v2-hero-actions v2-actions-centered"><Link className="v2-button" href="/appeals">Support a verified need</Link><Link className="v2-text-link" href="/get-involved">Other ways to get involved →</Link></div></div></section>
    </div>
  );
}
