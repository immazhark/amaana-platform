import { SectionHeading } from "@/components/section-heading";
import type { Metadata } from "next";
import "@/app/canonical-content.css";
import Link from "next/link";
import { programmes } from "@/lib/master-copy";
import { AppealCard } from "@/components/appeal-card";
import { VerifiedImpactStrip } from "@/components/verified-impact-strip";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { BodyCarousel, BodyCard } from "@/components/body-carousel";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { isAppealOpenForDonations } from "@/lib/appeals";
import { getAppealsIndexData, getCompletedAidShowcaseData, getDonationImpactHighlights } from "@/lib/public-page-data";
import styles from "./appeals-audit.module.css";
import { canExposeSyntheticStagingContent, isSyntheticStagingAppeal } from "@/lib/public-environment";
import { selectGalleryPublicImage } from "@/lib/public-media";
import { selectAppealDiscovery, type AppealSearch } from "@/lib/appeal-discovery";

export const metadata: Metadata = {
  title: "Verified Appeals",
  description: "Explore current reviewed support appeals from Amaana Foundation in Hyderabad, with public-safe context and clear donation boundaries.",
  alternates: { canonical: "/appeals" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: "website", url: "/appeals", title: "Verified Appeals | Amaana Foundation", description: "Explore current reviewed support appeals from Amaana Foundation in Hyderabad, with public-safe context and clear donation boundaries." },
  twitter: { images: ["/twitter-image"], card: "summary_large_image", title: "Verified Appeals | Amaana Foundation", description: "Explore current reviewed support appeals from Amaana Foundation in Hyderabad." },
};

// Appeal eligibility changes with time; never serve an expired fundraiser from ISR HTML.
// Reviewed database projections retain their independent bounded caches.
export const dynamic = "force-dynamic";

export default async function AppealsPage({ searchParams }: { searchParams: Promise<AppealSearch> }) {
  const [appealRecords, completedAid, publishedOutcomes] = await Promise.all([
    getAppealsIndexData(),
    getCompletedAidShowcaseData(),
    getDonationImpactHighlights().catch(() => []),
  ]);
  const isStaging = canExposeSyntheticStagingContent();
  const appeals = appealRecords.filter(appeal => isAppealOpenForDonations(appeal) && (isStaging || !isSyntheticStagingAppeal(appeal)));
  const selection = selectAppealDiscovery(appeals, await searchParams);
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (selection.q) query.set("q", selection.q);
    query.set("page", String(page));
    return `/appeals?${query.toString()}#current-appeals`;
  };
  const completedAidMedia = new Map(completedAid.map(item => [item.slug, selectGalleryPublicImage(item.mediaAssets)]));
  const publishedCompletedProgrammes = programmes.filter(
    programme => programme.causeSlug === "medical-financial-relief" && completedAidMedia.has(programme.slug),
  );

  return (
    <div className="v2-home v2-appeals-page">
      <PageHero
        variant="level1"
        className="page-hero--long-title"
        eyebrow="Support a Need · Verified Appeals"
        title="Verified Needs. Clear Purpose. Responsible Support."
        description={<p>Amaana’s public appeals are created for specific needs that have been reviewed before fundraising. Each appeal explains what support is required, what donations will be used for, the campaign status, and—once completed—the documented outcome.</p>}
        actions={[{ label: "See current appeals", href: "#current-appeals" }, { label: "How verification works", href: "/how-we-verify", secondary: true }]}
        visualKicker="Amanah in practice"
        visualTitle="Private Review → Public-Safe Appeal"
        visualNote="Need received · information reviewed · decision made · only approved context published."
      />

      <section className={`v2-appeals-trustline ${styles.lifecycle}`} aria-label="Appeal review journey"><div className={`v2-shell ${styles.lifecycleTrack}`}><span>Need received</span><b aria-hidden="true">→</b><span>Information reviewed</span><b aria-hidden="true">→</b><span>Decision made</span><b aria-hidden="true">→</b><span>Public-safe appeal</span><b aria-hidden="true">→</b><span>Known outcome recorded</span></div></section>

      <div className="v2-shell"><VerifiedImpactStrip headingId="appeals-published-outcomes" items={publishedOutcomes.flatMap(item =>
        item.primaryMetric && item.primaryMetricLabel ? [{ slug: item.slug, title: item.title, value: item.primaryMetric, label: item.primaryMetricLabel }] : [],
      )} /></div>
      <section className="v2-section paper" id="current-appeals" aria-labelledby="current-appeals-title"><div className="v2-shell"><SectionHeading eyebrow={<>Current appeals</>} title={<>Give where a reviewed need is active.</>} subtitle={<>Donations are currently limited to India. Amaana does not accept foreign contributions because the Foundation is not FCRA-registered.</>} id="current-appeals-title" />
        <form key={selection.q} className="form-grid" method="get" action="/appeals#current-appeals" aria-label="Search active appeals">
          <label className="field" htmlFor="appeal-search">Search active appeals<input id="appeal-search" name="q" type="search" maxLength={80} defaultValue={selection.q} aria-invalid={selection.invalid || undefined} aria-describedby={selection.invalid ? "appeal-search-help appeal-search-error" : "appeal-search-help"} /></label>
          <button className="v2-button" type="submit">Find appeals</button>
          {selection.active && <Link className="v2-text-link" href="/appeals#current-appeals">Clear appeal search</Link>}
        </form>
        <p id="appeal-search-help">Search reviewed public titles and summaries. Do not enter personal or case details.</p>
        {selection.invalid && <p id="appeal-search-error" role="status">This search could not be read. Clear the search or use up to 80 characters.</p>}
        {selection.active && <p>{selection.count} active {selection.count === 1 ? "appeal" : "appeals"} match this search.</p>}
        {selection.results.length ? <div className="v2-appeals-grid">{selection.results.map(appeal => <div className={styles.appealItem} key={appeal.slug}>{isStaging && isSyntheticStagingAppeal(appeal) && <span className={styles.stagingBadge}>Staging test</span>}<AppealCard appeal={appeal} /></div>)}</div> : appeals.length > 0 && selection.active ? <div className="v2-appeals-empty"><h3>No active appeals match this search</h3><p>Change your search or clear it to see current reviewed appeals.</p><Link className="v2-text-link" href="/appeals#current-appeals">View all active appeals</Link></div> : <div className="v2-appeals-empty"><span className="v2-section-label">No active public appeal right now</span><h3>No Public Appeal Is Open Right Now</h3><p>That does not mean the work has stopped. You can explore completed cases or enquire about Amaana’s recurring initiatives. New urgent appeals will appear here after verification.</p><div className="v2-hero-actions"><Link className="v2-button" href="/our-work">Explore completed work</Link><Link className="v2-text-link" href="/stories">Read Stories of Amanah →</Link></div></div>}
        {selection.totalPages > 1 && <nav aria-label="Appeal pages">
          {selection.page > 1 && <Link className="v2-text-link" href={pageHref(selection.page - 1)}>Previous appeals</Link>}
          <p>Page {selection.page} of {selection.totalPages}</p>
          {selection.page < selection.totalPages && <Link className="v2-text-link" href={pageHref(selection.page + 1)}>Next appeals</Link>}
        </nav>}
      </div></section>

      {publishedCompletedProgrammes.length > 0 && <section className="v2-section amaana-bg-body" id="completed-causes"><div className="v2-shell"><SectionHeading eyebrow="Completed support" title="See What Support Made Possible" subtitle="Completed appeals should not disappear when fundraising closes. Keeping the verified need, amount raised and documented outcome visible helps donors see how community support translated into action." /><BodyCarousel label="Completed support outcomes" variant="content-deck">{publishedCompletedProgrammes.map(p=>{const media=completedAidMedia.get(p.slug)??null;return <BodyCard key={p.slug} title={p.title} visual={media?<PublicMedia asset={media}/>:<WorkVisualPlaceholder label={p.title}/> }><p>{p.primaryMetric} · {p.primaryMetricLabel}</p><Link className="v2-text-link" href={`/our-work/${p.slug}`}>View the documented outcome →</Link></BodyCard>;})}</BodyCarousel></div></section>}
      <section className={`v2-section dark v2-appeal-method ${styles.method}`} aria-labelledby="appeal-method-title"><div className="v2-shell"><SectionHeading eyebrow={<>What review means</>} title={<>Verification happens privately. Accountability remains public.</>} subtitle={<>Supporting information is assessed before fundraising, while sensitive records stay outside the public experience. Once support is delivered, confirmed updates and known outcomes remain attached to the public record.</>} id="appeal-method-title" /><div className="v2-appeal-method-grid"><article><span>01</span><h3>Private evidence</h3><p>Relevant circumstances and supporting information are reviewed away from the public page.</p></article><article><span>02</span><h3>Responsible publication</h3><p>Only the context needed to understand an approved appeal is made public.</p></article><article><span>03</span><h3>Traceable outcome</h3><p>Confirmed progress and known outcomes remain connected to the appeal after fundraising.</p></article></div></div></section>

      <section className="v2-section v2-appeals-boundary amaana-bg-body" aria-labelledby="appeals-boundary-title"><div className="v2-shell"><SectionHeading className={styles.boundary} eyebrow="Dignity boundary" title="Proof does not have to become spectacle." id="appeals-boundary-title" subtitle={<>Medical records, identity documents, bank details and other private verification material stay outside the public experience. The website should establish trust through process, context, approved outcomes and accountable reporting — not by exposing people at vulnerable moments.<span className={styles.boundaryAction}><Link className="v2-text-link" href="/transparency">See our transparency approach →</Link></span></>} /></div></section>

      <section className="v2-closing"><div className="v2-shell"><SectionHeading eyebrow={<>Need assistance?</>} title={<>Requests begin privately, not as public appeals.</>} subtitle={<>If you or someone you know needs support, start with the assistance request journey. Publication is never the starting point.</>} /><div className="v2-hero-actions v2-hero-actions-centered"><Link className="v2-button" href="/request-assistance">Request assistance</Link><Link className="v2-text-link" href="/get-involved">Other ways to help →</Link></div></div></section>
    </div>
  );
}
