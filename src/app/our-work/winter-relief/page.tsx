import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Winter Drive",
  description: "Amaana Foundation's documented Winter Drive, a multi-phase community distribution of winter support with 234+ campaign-reported beneficiaries.",
};

const principles = [
  ["Warmth", "Winter support is presented around practical items and documented distribution, not sentimentalised hardship."],
  ["Specificity", "The 234+ figure remains labelled as campaign-reported rather than being converted into a broader lifetime claim."],
  ["Privacy", "Public imagery is selected for dignity first, especially when children or identifiable recipients appear."],
] as const;

export default async function WinterReliefPage() {
  const initiative = await getPublishedInitiativeBySlug("winter-relief");
  if (!initiative) notFound();

  const media = initiative.mediaAssets;
  const leadMedia = media[0];
  const galleryMedia = media.slice(1);

  return (
    <div className="v2-home v2-winter-page">
      <section className="v2-winter-hero">
        <div className="v2-shell v2-winter-hero-grid">
          <div className="v2-winter-copy">
            <p className="v2-kicker">Winter Drive · 2025–2026</p>
            <h1>Warmth should reach<br />before winter bites harder.</h1>
            <p>{initiative.summary}</p>
            <div className="v2-hero-actions">
              <a className="v2-button" href="#winter-record">See the documented record</a>
              <Link className="v2-button ghost" href="/our-work">All initiatives</Link>
            </div>
          </div>
          <div className="v2-winter-hero-media">
            {leadMedia ? (
              <PublicMedia asset={leadMedia} />
            ) : (
              <div className="v2-winter-placeholder" aria-label="Approved Winter Drive media publication gate">
                <span>Campaign-reported reach</span>
                <strong>234+</strong>
                <p>beneficiaries across the documented Winter Drive</p>
                <small>Authentic Amaana media appears only after privacy and public-use approval.</small>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="v2-winter-record" id="winter-record">
        <div className="v2-shell v2-winter-record-grid">
          <div className="v2-winter-stat"><strong>234+</strong><span>campaign-reported beneficiaries</span></div>
          <div>
            <p className="v2-section-label">The documented record</p>
            <h2>Multi-phase winter support,<br />kept attached to its source.</h2>
            <p>{initiative.story}</p>
            <p>The website deliberately labels this number as campaign-reported. It is not presented as an audited lifetime total or merged with unrelated programmes.</p>
          </div>
        </div>
      </section>

      <section className="v2-section paper v2-winter-story">
        <div className="v2-shell v2-winter-story-grid">
          <div>
            <p className="v2-section-label">What the drive responds to</p>
            <h2>Seasonal need is still real need.</h2>
          </div>
          <div>
            <p>Amaana&apos;s Winter Drive is documented as a multi-phase community distribution of warm clothing, blankets and winter kits.</p>
            <p>That is the level of claim this page keeps: what was prepared, what was distributed and the campaign-reported reach. The design avoids turning vulnerable people into proof-of-suffering imagery.</p>
          </div>
        </div>
      </section>

      <section className="v2-section dark v2-winter-principles">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">How this page tells the story</p><h2 className="v2-section-title">Warmth, specificity, privacy.</h2></div>
            <p className="v2-section-intro">A strong public record can be visually rich without becoming emotionally manipulative.</p>
          </div>
          <div className="v2-winter-principle-grid">
            {principles.map(([title, copy], index) => (
              <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="v2-section v2-winter-evidence">
        <div className="v2-shell v2-winter-evidence-grid">
          <div className="v2-winter-evidence-mark"><span>Campaign evidence</span><strong>234+</strong><span>not a universal total</span></div>
          <div>
            <p className="v2-section-label">Evidence boundary</p>
            <h2>One number should mean one thing.</h2>
            <p>The Winter Drive figure is useful because its scope is clear. Amaana&apos;s public site keeps programme metrics attached to the programme and period that produced them.</p>
          </div>
        </div>
      </section>

      <section className="v2-section paper v2-winter-field">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">Field record</p><h2 className="v2-section-title">Document the preparation and distribution responsibly.</h2></div>
            <p className="v2-section-intro">Approved originals are preferred over designed social graphics. Identifiable recipients, particularly children, require a stricter privacy decision before publication.</p>
          </div>
          {galleryMedia.length > 0 ? (
            <div className="v2-media-grid v2-media-grid-editorial">{galleryMedia.map(asset => <PublicMedia asset={asset} key={asset.id} />)}</div>
          ) : (
            <div className="v2-winter-publication-note"><span>Publication gate active</span><strong>Real winter-drive material will appear selectively.</strong><p>The archive is being audited independently so public media can show the work without exposing people unnecessarily.</p></div>
          )}
        </div>
      </section>

      <section className="v2-closing v2-winter-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Seasonal response, wider continuity</p>
          <h2>Meet the season.<br />Keep the dignity.</h2>
          <p>Explore Amaana&apos;s wider work or see how impact figures are published.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/our-work">Explore all work</Link>
            <Link className="v2-text-link" href="/impact">See impact →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
