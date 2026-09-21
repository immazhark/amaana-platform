import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { getFaithDiscoveryData } from "@/lib/public-discovery-data";
import styles from "./faith-audit.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Faith & Reflections",
  description: "Reviewed Islamic articles, reminders and videos that connect faith, compassion and service.",
  alternates: { canonical: "/faith-and-reflections" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }],
    type: "website",
    url: "/faith-and-reflections",
    title: "Faith & Reflections | Amaana Foundation",
    description: "Reviewed Islamic articles, reminders and videos connecting faith, compassion and service.",
  },
  twitter: { images: ["/twitter-image"],
    card: "summary_large_image",
    title: "Faith & Reflections | Amaana Foundation",
    description: "Reviewed Islamic reflections connecting compassion, generosity, service and Amaana's work.",
  },
};

export default async function FaithAndReflectionsPage() {
  const content = await getFaithDiscoveryData();
  const topics = Array.from(new Map(content.flatMap(item => item.topics.map(link => [link.topic.slug, link.topic.name] as const))).entries());
  const articles = content.filter(item => item.type === "ARTICLE");
  const reminders = content.filter(item => item.type === "REMINDER");
  const videos = content.filter(item => item.type === "VIDEO");
  const lead = content[0];
  const rest = content.slice(1);

  return (
    <div className="v2-home v2-faith-page">
      <PageHero
        variant="level1"
        eyebrow="Faith & Reflections"
        title="A place for the heart to return."
        description={<p>A reviewed library of Islamic articles, reminders and videos centred on compassion, generosity, gratitude, service and the values that inspire Amaana&apos;s work.</p>}
        actions={[
          { label: "Explore the library", href: "#library" },
          { label: "See faith in action", href: "/our-work", secondary: true },
        ]}
        visual={lead?.mediaAssets[0] ? <PublicMedia asset={lead.mediaAssets[0]} priority /> : undefined}
        visualKicker="Reflect · Serve"
        visualTitle="أمانة"
        visualNote="Reviewed religious content only. Sources, attribution and verification remain part of the public record."
      />

      <section className="v2-faith-standard" aria-labelledby="faith-standard-title">
        <div className="v2-shell v2-faith-standard-grid"><div><p className="v2-section-label">Editorial trust</p><h2 id="faith-standard-title">Religious content should be handled with care.</h2></div><div><p>Qur&apos;an citations, translations, hadith references and religious claims stay out of the public library until their review state is verified.</p><p>Amaana shares beneficial material without presenting itself as a scholarly authority.</p></div></div>
      </section>

      <section className="v2-section paper" id="library" aria-labelledby="faith-library-title">
        <div className="v2-shell">
          <div className="v2-section-head"><div><p className="v2-section-label">The library</p><h2 className="v2-section-title" id="faith-library-title">Read. Reflect. Watch.</h2></div><p className="v2-section-intro">{content.length > 0 ? `${content.length} verified item${content.length === 1 ? "" : "s"} are currently published.` : "No religious content is currently published. Drafts and unverified material remain private until review is complete."}</p></div>
          {content.length > 0 ? <div className="v2-faith-format-grid"><article><span>01</span><strong>{articles.length}</strong><h3>Articles</h3><p>Long-form reflection with source and review context.</p></article><article><span>02</span><strong>{reminders.length}</strong><h3>Reminders</h3><p>Concise, purposeful reflection without engagement bait.</p></article><article><span>03</span><strong>{videos.length}</strong><h3>Videos</h3><p>Reviewed visual content with attribution and context.</p></article></div> : <div className={styles.emptyState}><div className={styles.emptyIcon} aria-hidden="true">✦</div><span className={styles.emptyKicker}>Editorial library under curation</span><h3>Reviewed faith content will appear here when it is ready.</h3><p>Sources, translations, citations and scholarly attributions are checked before publication. Drafts remain private until that review is complete.</p><div className={styles.emptyActions}><Link className="v2-button" href="/our-work">See faith in action</Link><Link className="v2-text-link" href="/about">Why Amaana handles content carefully →</Link></div></div>}
        </div>
      </section>

      {lead && <section className="v2-section dark v2-faith-feature" aria-labelledby="featured-reflection-title"><div className="v2-shell v2-faith-feature-grid"><div className="v2-faith-feature-copy"><p className="v2-section-label">Featured reflection</p><small>{lead.type.toLowerCase()}</small><h2 id="featured-reflection-title">{lead.title}</h2><p>{lead.excerpt}</p>{lead.sourceCitation && <div className="v2-faith-source"><span>Reviewed source</span><p>{lead.sourceCitation}</p></div>}<Link className="v2-button ghost" href={`/faith-and-reflections/${lead.slug}`}>Read the reviewed reflection</Link></div><div className="v2-faith-feature-media">{lead.mediaAssets[0] ? <PublicMedia asset={lead.mediaAssets[0]} /> : <div className="v2-faith-feature-placeholder"><span>Reviewed content</span><strong>{lead.title}</strong><small>Visual media appears only when separately approved for public use.</small></div>}</div></div></section>}

      {rest.length > 0 && <section className="v2-section v2-faith-archive" aria-labelledby="published-reflections-title"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Published reflections</p><h2 className="v2-section-title" id="published-reflections-title">Verified before it reaches you.</h2></div><p className="v2-section-intro">Every public item has both publication approval and verified religious review.</p></div><div className="v2-faith-library-grid">{rest.map((item,index)=><Link className={`v2-faith-library-item ${index===0?"wide":""}`} href={`/faith-and-reflections/${item.slug}`} key={item.id} aria-label={`Open ${item.title}`}><span>{String(index+2).padStart(2,"0")}</span><small>{item.type.toLowerCase()}</small><h3>{item.title}</h3><p>{item.excerpt}</p>{item.sourceCitation && <div><b>Source</b><p>{item.sourceCitation}</p></div>}<strong className="v2-faith-library-action">Open reflection ↗</strong></Link>)}</div></div></section>}

      <section className="v2-section paper v2-faith-topics"><div className="v2-shell"><div className="v2-section-head"><div><p className="v2-section-label">Themes</p><h2 className="v2-section-title">A library that grows with meaning.</h2></div><p className="v2-section-intro">Topics come from the reviewed editorial taxonomy rather than decorative hard-coded labels.</p></div>{topics.length > 0 ? <div className="v2-faith-topic-cloud">{topics.map(([slug,name],index)=><span key={slug}><b>{String(index+1).padStart(2,"0")}</b>{name}</span>)}</div> : <p className="v2-section-intro">Topics will appear when reviewed Faith content is published.</p>}</div></section>

      <section className="v2-section dark v2-faith-action"><div className="v2-shell v2-faith-action-grid"><div><p className="v2-section-label">Reflection into service</p><h2 className="v2-section-title">Faith is not only read. It is lived.</h2></div><div><p>Where appropriate, reviewed content connects naturally to Amaana&apos;s real initiatives so visitors can move from understanding a value to seeing how that value is carried into service.</p><div className="v2-hero-actions"><Link className="v2-button" href="/our-work">Explore our work</Link><Link className="v2-text-link" href="/about">Our story →</Link></div></div></div></section>
    </div>
  );
}
