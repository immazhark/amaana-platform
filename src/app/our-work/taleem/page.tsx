import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMedia } from "@/components/public-media";
import { getPublishedInitiativeBySlug } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Amaana Taleem Initiative",
  description: "Amaana Foundation's documented education-support work, including a Taleem activity that reached 50 children with stationery and learning essentials.",
};

const journey = [
  ["Need", "Identify a practical learning need through a known community context."],
  ["Prepare", "Assemble useful stationery and learning essentials around the documented activity."],
  ["Deliver", "Distribute support through a trusted setting without turning children into campaign props."],
  ["Record", "Keep the public record specific to what is known rather than stretching one activity into a larger claim."],
] as const;

export default async function TaleemPage() {
  const initiative = await getPublishedInitiativeBySlug("taleem");
  if (!initiative) notFound();

  const media = initiative.mediaAssets;
  const leadMedia = media[0];
  const secondaryMedia = media.slice(1);

  return (
    <div className="v2-home v2-taleem-page">
      <section className="v2-taleem-hero">
        <div className="v2-shell v2-taleem-hero-grid">
          <div className="v2-taleem-copy">
            <p className="v2-kicker">Amaana Taleem Initiative · Education support</p>
            <h1>Learning begins<br />with something useful.</h1>
            <p>{initiative.summary}</p>
            <div className="v2-hero-actions">
              <a className="v2-button" href="#documented-activity">See the documented activity</a>
              <Link className="v2-button ghost" href="/our-work">All initiatives</Link>
            </div>
          </div>
          <div className="v2-taleem-hero-media">
            {leadMedia ? (
              <PublicMedia asset={leadMedia} />
            ) : (
              <div className="v2-taleem-placeholder" aria-label="Approved Taleem media publication gate">
                <span>Documented activity</span>
                <strong>50</strong>
                <p>children reached with stationery and learning essentials</p>
                <small>Only privacy-approved Amaana media is shown publicly, especially where children are identifiable.</small>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="v2-taleem-record" id="documented-activity">
        <div className="v2-shell v2-taleem-record-grid">
          <div>
            <p className="v2-section-label">A specific record</p>
            <h2>One documented activity.<br />Fifty children.</h2>
          </div>
          <div className="v2-taleem-number">
            <strong>50</strong>
            <span>children in a documented Taleem activity</span>
          </div>
          <div className="v2-taleem-record-copy">
            <p>{initiative.story}</p>
            <p>The public website keeps this figure attached to the activity that supports it. It is not presented as a lifetime education total or an annual beneficiary count.</p>
          </div>
        </div>
      </section>

      <section className="v2-section paper v2-taleem-purpose">
        <div className="v2-shell v2-taleem-purpose-grid">
          <div>
            <p className="v2-section-label">What Taleem is for</p>
            <h2>Practical support, not abstract promises.</h2>
          </div>
          <div className="v2-taleem-purpose-copy">
            <p>Taleem is presented around the work Amaana can document: stationery and learning essentials prepared and distributed through community activity.</p>
            <blockquote>Useful support should be visible. A child&apos;s vulnerability should not be.</blockquote>
          </div>
        </div>
      </section>

      <section className="v2-section dark v2-taleem-journey">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">How the activity is framed</p><h2 className="v2-section-title">Need → preparation → delivery → record.</h2></div>
            <p className="v2-section-intro">The Taleem page is intentionally calm. Its job is to explain useful education support while protecting the dignity and privacy of children.</p>
          </div>
          <ol className="v2-taleem-steps">
            {journey.map(([title, copy], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="v2-section v2-taleem-privacy">
        <div className="v2-shell v2-taleem-privacy-grid">
          <div className="v2-taleem-privacy-mark"><span>Child dignity</span><strong>first</strong><span>Public storytelling second</span></div>
          <div>
            <p className="v2-section-label">Child privacy</p>
            <h2>Education support does not require exposing a child.</h2>
            <p>Photos that identify children are not treated as ordinary marketing assets. Public media must pass the same approval gate as the rest of Amaana&apos;s documentary material, with a stricter standard where minors are visible.</p>
          </div>
        </div>
      </section>

      <section className="v2-section paper v2-taleem-field">
        <div className="v2-shell">
          <div className="v2-section-head">
            <div><p className="v2-section-label">Field record</p><h2 className="v2-section-title">Show the learning support, not the child&apos;s hardship.</h2></div>
            <p className="v2-section-intro">Approved images can document kits, stationery, preparation and context. Identifiable child imagery stays gated until its public-use basis is clear.</p>
          </div>
          {secondaryMedia.length > 0 ? (
            <div className="v2-media-grid v2-media-grid-editorial">{secondaryMedia.map(asset => <PublicMedia asset={asset} key={asset.id} />)}</div>
          ) : (
            <div className="v2-taleem-publication-note">
              <span>Publication gate active</span>
              <strong>Document the support without exploiting the story.</strong>
              <p>The Taleem archive is being reviewed separately. Media will appear here only after the child-privacy and public-use review is complete.</p>
            </div>
          )}
        </div>
      </section>

      <section className="v2-closing v2-taleem-closing">
        <div className="v2-shell">
          <p className="v2-section-label">Education within the wider work</p>
          <h2>Small tools.<br />Real use.</h2>
          <p>See Amaana&apos;s other initiatives or follow the evidence behind published impact.</p>
          <div className="v2-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="v2-button" href="/our-work">Explore all work</Link>
            <Link className="v2-text-link" href="/impact">See impact →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
