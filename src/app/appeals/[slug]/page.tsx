import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatINR } from "@/lib/appeals";
import { getAppealPageData } from "@/lib/public-page-data";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const appeal = await getAppealPageData(slug);
  if (!appeal) return { title: "Appeal not found" };

  const canonical = `/appeals/${appeal.slug}`;
  return {
    title: appeal.title,
    description: appeal.summary,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: appeal.title,
      description: appeal.summary,
      publishedTime: appeal.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary",
      title: appeal.title,
      description: appeal.summary,
    },
  };
}

export default async function AppealDetailPage({ params }: Props) {
  const { slug } = await params;
  const appeal = await getAppealPageData(slug);
  if (!appeal) notFound();

  const raised = appeal.amountRaised.toNumber();
  const goal = appeal.goalAmount.toNumber();
  const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const isOpen = appeal.status === "PUBLISHED";

  return (
    <div className="v2-home v2-appeal-detail-page">
      <section className="v2-appeal-detail-hero">
        <div className="v2-shell v2-appeal-detail-hero-grid">
          <div className="v2-appeal-detail-copy">
            <div className="v2-appeal-detail-meta"><span>{appeal.category.replaceAll("_", " ")}</span><span>{appeal.beneficiaryLocation || "Location withheld"}</span><span>{isOpen ? "Open appeal" : "Appeal closed"}</span></div>
            <h1>{appeal.title}</h1>
            <p>{appeal.summary}</p>
          </div>
          <aside className="v2-appeal-donation-panel" aria-label="Appeal funding status">
            <small>Appeal progress</small>
            <strong>{formatINR(raised)}</strong>
            <p>raised of {formatINR(goal)}</p>
            <div className="v2-appeal-progress" role="progressbar" aria-label={`${appeal.title} funding progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
            <div className="v2-appeal-progress-foot"><span>{progress}% supported</span><span>INR · India only</span></div>
            {isOpen ? <Link className="v2-button v2-appeal-donate-button" href={`/donate/${appeal.slug}`}>Support this appeal</Link> : <span className="v2-appeal-closed">This appeal is closed</span>}
            <p className="v2-appeal-secure-note">Domestic INR donations are processed securely through Razorpay. Amaana does not accept foreign contributions.</p>
          </aside>
        </div>
      </section>

      <section className="v2-appeal-context-strip" aria-label="How this appeal is handled"><div className="v2-shell"><div><span>01</span><strong>Reviewed need</strong><small>Information assessed before publication</small></div><div><span>02</span><strong>Public-safe story</strong><small>Private proofs remain private</small></div><div><span>03</span><strong>Tracked support</strong><small>Progress stays attached to this appeal</small></div><div><span>04</span><strong>Known updates</strong><small>Only confirmed outcomes are published</small></div></div></section>

      <section className="v2-section paper">
        <div className="v2-shell v2-appeal-story-grid">
          <div>
            <p className="v2-section-label">The need</p>
            <h2>{appeal.beneficiaryDisplayName ?? "A verified request for support"}</h2>
          </div>
          <div className="v2-appeal-story-copy"><div className="v2-appeal-story">{appeal.story}</div><div className="v2-appeal-privacy-note"><span>Privacy boundary</span><p>Only information approved for public sharing appears here. Supporting documents used during review remain private.</p></div></div>
        </div>
      </section>

      {appeal.updates.length > 0 && <section className="v2-section dark v2-appeal-updates"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Field updates</p><h2 className="v2-section-title">What is known, as it becomes known.</h2></div><p className="v2-section-intro">Updates record confirmed developments without filling gaps with assumptions.</p></div><div className="v2-appeal-update-line">{appeal.updates.map((update, index) => <article key={update.id}><span>{String(index + 1).padStart(2, "0")}</span><small>{update.publishedAt?.toLocaleDateString("en-IN", { dateStyle: "long" })}</small><h3>{update.title}</h3><p>{update.content}</p></article>)}</div></div></section>}

      <section className="v2-section v2-appeal-giving-note"><div className="v2-shell v2-appeal-giving-note-grid"><div><p className="v2-section-label">Before you give</p><h2 className="v2-section-title">Support should begin with understanding.</h2></div><div><p>This page is designed to give enough context to make an informed decision without turning a person&apos;s hardship into a fundraising performance. If an appeal is open, support goes specifically to this published appeal through its donation journey.</p><div className="v2-hero-actions">{isOpen && <Link className="v2-button" href={`/donate/${appeal.slug}`}>Support this appeal</Link>}<Link className="v2-text-link" href="/how-we-verify">How Amaana reviews requests →</Link></div></div></div></section>

      <section className="v2-closing"><div className="v2-shell"><p className="v2-section-label">Continue with context</p><h2>See the work around the appeal.</h2><p>Explore completed initiatives, documented outcomes and Amaana&apos;s public evidence approach before or after contributing.</p><div className="v2-hero-actions v2-hero-actions-centered"><Link className="v2-button" href="/our-work">Explore our work</Link><Link className="v2-text-link" href="/transparency">Transparency →</Link></div></div></section>
    </div>
  );
}
