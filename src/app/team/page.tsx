import "./team.css";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedTeam } from "@/lib/team-data";
import { normalizeStructuredDataSiteUrl, serializeStructuredData } from "@/lib/structured-data";

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
  const origin = normalizeStructuredDataSiteUrl();
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
                        alt={`${member.fullName}, ${member.designation}${member.photoAlt ? ` — ${member.photoAlt}` : ""}`} loading="lazy" unoptimized
                      /> : <span aria-hidden="true">{initials(member.fullName)}</span>}
                    </div>
                    <div className="team-member-copy">
                      <h3>{member.fullName}</h3>
                      <div className="team-designation">{member.designation}</div>
                      {member.bio ? <p className="team-bio">{member.bio}</p> : null}
                      {member.linkedinUrl || member.email ? (
                        <div className="team-member-links">
                          {member.linkedinUrl ? <a href={member.linkedinUrl} aria-label={`${member.fullName}, ${member.designation}, on LinkedIn (opens in a new tab)`} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a> : null}
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
