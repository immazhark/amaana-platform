import evidenceStyles from "@/components/evidence-pathway.module.css";
import { SectionHeading } from "@/components/section-heading";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { PublicMedia } from "@/components/public-media";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import { getStoriesDiscoveryData } from "@/lib/public-discovery-data";
import { selectIdentityPublicImage } from "@/lib/public-media";
import styles from "./stories-audit.module.css";
import { selectStoryDiscovery, type StorySearch } from "@/lib/story-discovery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stories of Amanah",
  description: "Dignified, privacy-reviewed accounts of Amaana Foundation's completed assistance and community work.",
  alternates: { canonical: "/stories" },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: "website", url: "/stories", title: "Stories of Amanah | Amaana Foundation", description: "Dignified, privacy-reviewed accounts from Amaana Foundation's community work and completed assistance." },
  twitter: { images: ["/twitter-image"], card: "summary_large_image", title: "Stories of Amanah | Amaana Foundation", description: "Privacy-reviewed field accounts from Amaana Foundation's completed assistance and community work." },
};

export default async function StoriesPage({ searchParams }: { searchParams: Promise<StorySearch> }) {
  const [stories, search] = await Promise.all([getStoriesDiscoveryData(), searchParams]);
  const selection = selectStoryDiscovery(stories, search);
  const leadStory = selection.page === 1 ? selection.results[0] : undefined;
  const pageHref = (page: number) => { const params = new URLSearchParams(); if (selection.q) params.set("q", selection.q); if (selection.programme) params.set("programme", selection.programme); params.set("page", String(page)); return `/stories?${params}#story-results`; };
  const leadStoryMedia = leadStory ? selectIdentityPublicImage(leadStory.mediaAssets) : null;
  const leadStoryContext = leadStory?.initiative?.status === "PUBLISHED" && leadStory.initiative.cause.status === "PUBLISHED"
    ? leadStory.initiative.title
    : leadStory?.cause?.status === "PUBLISHED"
      ? leadStory.cause.title
      : "Story of Amanah";
  const remainingStories = leadStory ? selection.results.slice(1) : selection.results;

  return (
    <div className="v2-home v2-stories-page">
      <PageHero
        variant="level1"
        eyebrow="Stories of Amanah · Field Journal"
        title="Where the work becomes a story."
        description={<p>Human stories from Amaana’s work, shared only when they can be told with dignity and care.</p>}
        actions={[
          { label: "Enter the journal", href: "#journal" },
          { label: "Explore the work", href: "/our-work", secondary: true },
        ]}
        visual={leadStoryMedia ? <PublicMedia asset={leadStoryMedia} priority /> : undefined}
        visualKicker="Field journal"
        visualTitle={leadStory?.title ?? "Stories of Amanah"}
        visualNote="Stories shared with dignity and care."
      />

      <section className="v2-section paper" id="story-results" aria-label="Find published stories"><div className="v2-shell">
        <form key={`${selection.q}:${selection.programme}`} className="form-grid" method="get" action="/stories#story-results" aria-label="Filter published stories">
          <label className="field" htmlFor="story-search">Search public stories<input id="story-search" name="q" type="search" maxLength={80} defaultValue={selection.q} aria-invalid={selection.invalid || undefined} aria-describedby="story-search-help" /></label>
          <label className="field" htmlFor="story-programme">Programme<select id="story-programme" name="programme" defaultValue={selection.programme} aria-invalid={selection.invalid || undefined} aria-describedby="story-search-help"><option value="">All programmes</option>{selection.programmes.map(programme => <option key={programme} value={programme}>{programme}</option>)}</select></label>
          <button className="v2-button" type="submit">Find stories</button>
          {selection.active && <Link className="v2-text-link" href="/stories#story-results">Clear story filters</Link>}
        </form>
        <p id="story-search-help">Search reviewed public titles and summaries. Do not enter personal or case details.</p>
        {selection.invalid && <p role="status">These filters could not be read. Clear the filters or use a search of up to 80 characters and a published programme.</p>}
        <p>{selection.count} published {selection.count === 1 ? "story" : "stories"} found.</p>
        {selection.totalPages > 1 && <nav aria-label="Story result pages">{selection.page > 1 && <Link className="v2-button" href={pageHref(selection.page - 1)}>Previous stories</Link>}<span> Page {selection.page} of {selection.totalPages} </span>{selection.page < selection.totalPages && <Link className="v2-button" href={pageHref(selection.page + 1)}>Next stories</Link>}</nav>}
      </div></section>

      {leadStory && <section className="v2-stories-feature" id="journal" aria-labelledby="featured-story-title"><div className="v2-shell v2-stories-feature-grid"><Link className="v2-stories-feature-media" href={`/stories/${leadStory.slug}`} aria-label={`Read ${leadStory.title}`}>{leadStoryMedia ? <PublicMedia asset={leadStoryMedia} /> : <WorkVisualPlaceholder label={leadStory.title} />}</Link><div className="v2-stories-feature-copy"><p className="v2-section-label">{selection.active ? "Matching field note" : "Featured field note"}</p><small>{leadStoryContext}</small><h2 id="featured-story-title">{leadStory.title}</h2><p>{leadStory.summary}</p><Link className="v2-text-link" href={`/stories/${leadStory.slug}`}>Read the story →</Link></div></div></section>}

      <section className="v2-section paper v2-stories-archive" id={leadStory ? undefined : "journal"} aria-labelledby="stories-archive-title"><div className="v2-shell"><SectionHeading eyebrow={<>Living archive</>} title={<>Circumstance. Verification. Action. Outcome.</>} subtitle={<>Completed work remains here so its story can still be understood after an appeal closes or a distribution ends.</>} id="stories-archive-title" />
        {remainingStories.length > 0 ? <div className="v2-stories-grid">{remainingStories.map((story,index)=>{const identity=selectIdentityPublicImage(story.mediaAssets);const context=story.initiative?.status==="PUBLISHED"&&story.initiative.cause.status==="PUBLISHED"?story.initiative.title:story.cause?.status==="PUBLISHED"?story.cause.title:"Story of Amanah";return <Link className={`v2-stories-card ${index%5===0?"wide":""}`} href={`/stories/${story.slug}`} key={story.id} aria-label={`Read story: ${story.title}`}><div className="v2-stories-card-media">{identity ? <PublicMedia asset={identity} /> : <WorkVisualPlaceholder label={story.title} />}</div><div className="v2-stories-card-copy"><span>{String((selection.page-1)*12+index+(leadStory?2:1)).padStart(2,"0")}</span><small>{context}</small><h3>{story.title}</h3><p>{story.summary}</p><b>Read story ↗</b></div></Link>})}</div> : leadStory ? <div className="v2-stories-single-note"><span>Archive beginning</span><p>More stories will appear here when they are ready to be shared responsibly.</p></div> : selection.active ? <div className="v2-reminder"><h3>No published stories match these filters.</h3><p>Change the search or clear the story filters to explore the public archive.</p></div> : <div className={styles.emptyState}><div className={styles.emptyMark} aria-hidden="true">✦</div><div className={styles.emptyCopy}><span className="v2-reminder-label">Privacy protected archive</span><h3>No public stories are available yet.</h3><p>Stories appear only after they are ready for public sharing. Until then, the people and details behind them remain private.</p><Link className="v2-text-link" href="/our-work">Explore published initiatives →</Link></div></div>}
      </div></section>

      <section className={`v2-section dark v2-stories-ethic ${evidenceStyles.surface}`}><div className="v2-shell v2-stories-ethic-grid"><div><p className="v2-section-label">Editorial ethic</p><h2 className="v2-section-title">The story should never cost someone their dignity.</h2><p className="v2-section-intro">Amaana shares enough to understand the work while keeping sensitive evidence and unnecessary personal detail out of public view.</p></div><div className={`v2-stories-ethic-list ${styles.ethicList}`}><article><span>01</span><h3>Permission before publication</h3><p>Stories and media reach the public only after the appropriate review.</p></article><article><span>02</span><h3>Proof without exposure</h3><p>Identity documents, medical records and other sensitive evidence remain private.</p></article><article><span>03</span><h3>Facts without embellishment</h3><p>Known outcomes are reported as known; assumptions about a person&apos;s circumstances are not presented as fact.</p></article></div></div></section>
      <section className="v2-closing"><div className="v2-shell"><SectionHeading eyebrow={<>Stories lead back to action</>} title={<>See the work behind every account.</>} subtitle={<>Read the initiative behind each story, see the documented outcome, and understand how the work was carried out.</>} /><div className="v2-hero-actions v2-actions-center"><Link className="v2-button" href="/our-work">Explore our work</Link><Link className="v2-text-link" href="/impact">See impact →</Link></div></div></section>
    </div>
  );
}
