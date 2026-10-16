import { SectionHeading } from "@/components/section-heading";
import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { notFound } from "next/navigation";
import { BreadcrumbStructuredData } from "@/components/breadcrumb-structured-data";
import { AppealStructuredData } from "@/components/appeal-structured-data";
import { PageHero, PAGE_HERO_IMAGE_SIZES } from "@/components/page-hero";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { PublicMedia } from "@/components/public-media";
import { MobileSupportBar } from "@/components/mobile-support-bar";
import { AppealShare } from "@/components/appeal-share";
import { getAppealSearchPrivacy } from "@/lib/appeal-search-privacy";
import { getAppealPublicCopy } from "@/lib/appeal-public-copy";
import { normalizeSafePublicMediaUrl } from "@/lib/public-media";
import { openGraphShareImages, twitterShareImages } from "@/lib/social-share-media";
import { getPublicAppealCheckoutEligibility } from "@/lib/public-appeal-checkout";
import { getPublicAppealProgress } from "@/lib/public-appeal-progress";
import { PublicFundingMeter } from "@/components/public-funding-meter";
import { getAppealCoverMedia, getAppealPageData } from "@/lib/public-page-data";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [appeal, confidentialityLevel] = await Promise.all([getAppealPageData(slug), getAppealSearchPrivacy(slug)]);
  if (!appeal) return { title: "Appeal not found" };
  const canonical = `/appeals/${appeal.slug}`;
  const highlySensitive = confidentialityLevel === "HIGHLY_SENSITIVE";
  const { title: metadataTitle, description: metadataDescription } =
    getAppealPublicCopy(appeal.title, appeal.summary, highlySensitive);
  return { title: metadataTitle, description: metadataDescription, alternates: { canonical }, robots: highlySensitive ? { index: false, follow: true, nocache: true } : undefined, openGraph: { type: "article", url: canonical, title: `${metadataTitle} | Amaana Foundation`, description: metadataDescription, publishedTime: appeal.publishedAt?.toISOString(), images: openGraphShareImages() }, twitter: { card: "summary_large_image", title: `${metadataTitle} | Amaana Foundation`, description: metadataDescription, images: twitterShareImages() } };
}

export default async function AppealDetailPage({ params }: Props) {
  const { slug } = await params;
  const [appeal, confidentialityLevel] = await Promise.all([
    getAppealPageData(slug),
    getAppealSearchPrivacy(slug),
  ]);
  if (!appeal) notFound();
  const coverUrl = normalizeSafePublicMediaUrl(appeal.coverImageUrl);
  const coverMedia = await getAppealCoverMedia(coverUrl);
  // One ledger projection for detail, cards and checkout. Never advertise
  // a public amount or donation CTA if its paise precision cannot be trusted.
  const progress = getPublicAppealProgress(appeal.amountRaised, appeal.goalAmount);
  // Publication alone does not guarantee a payable whole-rupee balance.
  // All public donation CTAs, including mobile and JSON-LD, share this gate.
  const isOpen = getPublicAppealCheckoutEligibility(appeal) !== null;
  const highlySensitive = confidentialityLevel === "HIGHLY_SENSITIVE";
  const safeShareCopy = getAppealPublicCopy(appeal.title, appeal.summary, highlySensitive);

  return (
    <div className="v2-home v2-appeal-detail-page">
      <AppealStructuredData slug={appeal.slug} title={appeal.title} summary={appeal.summary} isOpen={isOpen} highlySensitive={highlySensitive} />
      <BreadcrumbStructuredData items={[{ name: "Home", path: "/" }, { name: "Verified Appeals", path: "/appeals" }, { name: safeShareCopy.title, path: `/appeals/${appeal.slug}` }]} />
      <PageHero
        variant="level2"
        eyebrow={`${appeal.category.replaceAll("_", " ")} · ${appeal.beneficiaryLocation || "Location withheld"} · ${isOpen ? "Open appeal" : "Appeal closed"}`}
        title={appeal.title}
        description={<p>{appeal.summary}</p>}
        actions={[{ label: "Back to current appeals", href: "/appeals", secondary: true }, ...(isOpen ? [{ label: "Support this appeal", href: `/donate/${appeal.slug}` } as const] : [])]}
        visual={coverMedia ? <PublicMedia asset={coverMedia} priority sizes={PAGE_HERO_IMAGE_SIZES} /> : <WorkVisualPlaceholder label={appeal.title} />}
      />

      <section className="v2-appeal-funding-strip" aria-label="Appeal funding status">
        <div className="v2-shell">
          <aside className="v2-appeal-donation-panel" aria-describedby="appeal-payment-boundary">
            <div>
              <small>Appeal progress</small>
              {progress
                ? <><strong>{progress.raisedLabel}</strong><p>raised of {progress.goalLabel}</p></>
                : <p role="status">Financial figures are being reconciled.</p>}
            </div>
            <div className="v2-appeal-funding-progress">
              {progress ? <>
                <PublicFundingMeter progress={progress} title={appeal.title} trackClassName="v2-appeal-progress" />
                <div className="v2-appeal-progress-foot">
                  <span>{progress.percentage}% supported</span><span>INR · India only</span>
                </div>
              </> : <p role="status">A verified fundraising balance is not available. Please review the case before contributing.</p>}
            </div>
            <div>
              {isOpen
                ? <Link className="v2-button v2-appeal-donate-button" href={`/donate/${appeal.slug}`}>Support this appeal</Link>
                : <span className="v2-appeal-closed">{progress ? "This appeal is closed" : "Contributions paused for review"}</span>}
              <p className="v2-appeal-secure-note" id="appeal-payment-boundary">
                Eligible domestic INR donations are processed securely through Razorpay. Amaana does not accept foreign contributions.
              </p>
            </div>
          </aside>
          <AppealShare title={safeShareCopy.title} summary={safeShareCopy.description} path={`/appeals/${appeal.slug}`} />
        </div>
      </section>

      <section className="v2-appeal-context-strip" aria-label="How this appeal is handled"><div className="v2-shell"><div><span>01</span><strong>Reviewed need</strong><small>Information assessed before publication</small></div><div><span>02</span><strong>Public-safe story</strong><small>Private proofs remain private</small></div><div><span>03</span><strong>Tracked support</strong><small>Progress stays attached to this appeal</small></div><div><span>04</span><strong>Known updates</strong><small>Only confirmed outcomes are published</small></div></div></section>

      <section className="v2-section paper"><div className="v2-shell v2-appeal-story-grid"><div><p className="v2-section-label">The need</p><h2>{appeal.beneficiaryDisplayName ?? "A verified request for support"}</h2></div><div className="v2-appeal-story-copy"><div className="v2-appeal-story">{appeal.story}</div><div className="v2-appeal-privacy-note"><span>Privacy boundary</span><p>Only information approved for public sharing appears here. Supporting documents used during review remain private.</p></div></div></div></section>

      {appeal.updates.length > 0 && <section className="v2-section dark v2-appeal-updates"><div className="v2-shell"><SectionHeading eyebrow={<>Field updates</>} title={<>What is known, as it becomes known.</>} subtitle={<>Updates record confirmed developments without filling gaps with assumptions.</>} /><div className="v2-appeal-update-line">{appeal.updates.map((update, index) => <article key={update.id}><span>{String(index + 1).padStart(2, "0")}</span><small>{update.publishedAt?.toLocaleDateString("en-IN", { dateStyle: "long" })}</small><h3>{update.title}</h3><p>{update.content}</p></article>)}</div></div></section>}

      <section className="v2-section v2-appeal-giving-note"><div className="v2-shell v2-appeal-giving-note-grid"><div><p className="v2-section-label">{isOpen ? "Before you give" : "After the appeal"}</p><h2 className="v2-section-title">{isOpen ? "Support should begin with understanding." : "A closed appeal remains part of the record."}</h2></div><div><p>{isOpen ? "Review the need and its confirmed context before contributing. Support through this page is attached specifically to this published appeal." : "Fundraising has ended, but the public record remains available so the need, progress and confirmed updates do not disappear when an appeal closes."}</p><div className="v2-hero-actions">{isOpen && <Link className="v2-button" href={`/donate/${appeal.slug}`}>Support this appeal</Link>}<Link className="v2-text-link" href="/how-we-verify">How Amaana reviews requests →</Link></div></div></div></section>

      <section className="v2-closing"><div className="v2-shell"><SectionHeading eyebrow={<>Continue exploring</>} title={<>See the wider work behind the record.</>} subtitle={<>Explore completed initiatives and Amaana&apos;s approach to public accountability.</>} /><div className="v2-hero-actions v2-hero-actions-centered"><Link className="v2-button" href="/our-work">Explore our work</Link><Link className="v2-text-link" href="/transparency">Transparency →</Link></div></div></section>
      {isOpen && progress ? <MobileSupportBar
        href={`/donate/${appeal.slug}`}
        label="Support this appeal"
        context={`${progress.remainingLabel} remaining verified need`}
      /> : null}
    </div>
  );
}
