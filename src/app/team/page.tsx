import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedTeam } from "@/lib/team-data";
import { serializeStructuredData } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

const description = "Meet the trustees, finance professionals and volunteers who guide and support Amaana Foundation, a registered public charitable trust in Hyderabad.";

export const metadata: Metadata = {
  title: "Our Team",
  description,
  alternates: { canonical: "/team" },
  openGraph: {
    type: "website", url: "/team", title: "Our Team | Amaana Foundation",
    description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }],
  },
  twitter: { card: "summary_large_image", title: "Our Team | Amaana Foundation", description, images: ["/twitter-image"] },
};

function initials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  return [words[0]?.[0], words.at(-1)?.[0]].filter(Boolean).join("").toUpperCase();
}

export default async function TeamPage() {
  const groups = await getPublishedTeam();
  const origin = (process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    member: groups.flatMap(group => group.members.map(member => ({
      "@type": "Person",
      name: member.fullName,
      jobTitle: member.designation,
      ...(member.photoStorageKey && member.photoConsentAt
        ? { image: `${origin}/team/photo/${encodeURIComponent(member.slug)}` }
        : {}),
    }))),
  };

  return (
    <div className="v2-home team-page">
      <style>{"\n.team-page{background:var(--af-color-canvas);color:var(--af-color-text)}\n.team-hero{padding:clamp(4rem,8vw,7rem) 0 clamp(2.5rem,5vw,4rem);border-bottom:1px solid var(--af-color-border)}\n.team-hero-label{margin:0 0 1.15rem;color:var(--af-color-gold-ink);font-size:.8rem;letter-spacing:.2em;font-weight:800}\n.team-hero h1{max-width:15ch;margin:0;font:500 clamp(2.8rem,6.5vw,5.5rem)/1.05 var(--af-font-display);letter-spacing:-.045em;text-transform:uppercase}\n.team-intro{max-width:66ch;margin:1.6rem 0 2rem;color:var(--af-color-muted);font-size:clamp(1.05rem,1.6vw,1.24rem);line-height:1.8}\n.team-gold-rule{display:block;height:2px;width:clamp(5rem,18vw,11rem);background:var(--af-color-gold-500)}\n.team-content{padding-block:clamp(2.5rem,6vw,5rem) clamp(4rem,8vw,7rem)}\n.team-section{padding:clamp(2rem,5vw,3.5rem) 0}\n.team-section+.team-section{border-top:1px solid var(--af-color-border)}\n.team-section-heading{display:grid;grid-template-columns:minmax(0,1fr);gap:.45rem;margin-bottom:2rem}\n.team-section-heading h2{margin:0;font:500 clamp(2rem,3.5vw,3.1rem)/1.13 var(--af-font-display);color:var(--af-color-navy-950)}\n.team-section-heading p{max-width:64ch;margin:0;color:var(--af-color-muted)}\n.team-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;list-style:none;padding:0;margin:0}\n.team-member{min-width:0;display:grid;grid-template-columns:minmax(5rem,6.5rem) minmax(0,1fr);gap:1rem;align-items:start;padding:1rem;border:1px solid var(--af-color-border);border-top:2px solid var(--af-color-blue-600);background:var(--af-color-surface)}\n.team-portrait{aspect-ratio:4/5;display:grid;place-items:center;width:100%;overflow:hidden;border:1px solid var(--af-color-blue-600);background:var(--af-color-canvas);color:var(--af-color-navy-700);font:500 clamp(1.4rem,3vw,2.3rem)/1 var(--af-font-display)}\n.team-portrait img{width:100%;height:100%;object-fit:cover}\n.team-member-copy{min-width:0}\n.team-member h3{overflow-wrap:anywhere;margin:0 0 .35rem;font:500 clamp(1.22rem,1.8vw,1.6rem)/1.2 var(--af-font-display)}\n.team-designation{font-size:.76rem;font-weight:750;text-transform:uppercase;letter-spacing:.07em;color:var(--af-color-blue-600);overflow-wrap:anywhere}\n.team-bio{font-size:.92rem;line-height:1.65;color:var(--af-color-muted);margin:.8rem 0 0}\n.team-member-links{display:flex;flex-wrap:wrap;gap:1rem;margin-top:.9rem;font-size:.85rem}\n.team-member-links a{color:var(--af-color-blue-600);text-underline-offset:.2rem}\n.team-page a:focus-visible{outline:3px solid var(--af-color-focus);outline-offset:3px}\n.team-cta{margin-top:3rem;padding:clamp(1.5rem,4vw,3rem);border-top:2px solid var(--af-color-gold-500);background:var(--af-color-surface-muted)}\n.team-cta h2{margin:0 0 .6rem;font:500 clamp(1.7rem,3vw,2.4rem)/1.2 var(--af-font-display)}\n.team-cta p{margin:0;color:var(--af-color-muted);line-height:1.7}\n.team-cta a{color:var(--af-color-blue-600);font-weight:750;text-underline-offset:.2em}\n@media(min-width:680px){.team-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.team-member{grid-template-columns:minmax(0,1fr);align-content:start}.team-portrait{max-width:100%}}\n@media(min-width:1100px){.team-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.team-grid--trustees{grid-template-columns:repeat(3,minmax(0,1fr))}}\n@media(prefers-reduced-motion:reduce){.team-page *, .team-page *::before,.team-page *::after{scroll-behavior:auto!important;transition:none!important}}\n"}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(jsonLd) }} />
      <header className="team-hero">
        <div className="v2-shell">
          <p className="team-hero-label">OUR TEAM</p>
          <h1>The people behind Amaana</h1>
          <p className="team-intro">Amaana Foundation is a registered public charitable trust. It is guided by its trustees and supported by professionals and volunteers who contribute their time and expertise to serving families in need, without distinction of caste, religion or creed.</p>
          <span className="team-gold-rule" aria-hidden="true" />
        </div>
      </header>
      <div className="v2-shell team-content">
        {groups.map(group => (
          <section className="team-section" aria-labelledby={`team-group-${group.id}`} key={group.id}>
            <div className="team-section-heading">
              <h2 id={`team-group-${group.id}`}>{group.title}</h2>
              {group.description ? <p>{group.description}</p> : null}
            </div>
            <ul className={group.key === "TRUSTEES" ? "team-grid team-grid--trustees" : "team-grid"}>
              {group.members.map(member => {
                const hasPhoto = Boolean(member.photoStorageKey && member.photoConsentAt);
                return (
                  <li className="team-member" key={member.id}>
                    <div className="team-portrait">
                      {hasPhoto ? <Image
                        src={`/team/photo/${encodeURIComponent(member.slug)}?v=${member.updatedAt.getTime()}`}
                        width={480} height={600} sizes="(max-width: 679px) 104px, (max-width: 1099px) 44vw, 24vw"
                        alt={`${member.fullName}, ${member.designation}`} loading="lazy" unoptimized
                      /> : <span aria-hidden="true">{initials(member.fullName)}</span>}
                    </div>
                    <div className="team-member-copy">
                      <h3>{member.fullName}</h3>
                      <div className="team-designation">{member.designation}</div>
                      {member.bio ? <p className="team-bio">{member.bio}</p> : null}
                      {member.linkedinUrl || member.email ? (
                        <div className="team-member-links">
                          {member.linkedinUrl ? <a href={member.linkedinUrl} aria-label={`${member.fullName}, ${member.designation}, on LinkedIn`} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a> : null}
                          {member.email ? <a href={`mailto:${member.email}`} aria-label={`Email ${member.fullName}, ${member.designation}`}>Email</a> : null}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <section className="team-cta" aria-labelledby="team-volunteer">
          <h2 id="team-volunteer">Want to volunteer your skills?</h2>
          <p>Amaana welcomes people who can contribute time or expertise. <Link href="/contact">Get in touch</Link>.</p>
        </section>
      </div>
    </div>
  );
}
