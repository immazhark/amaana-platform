import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BreadcrumbStructuredData } from '@/components/breadcrumb-structured-data';
import { WorkVisualPlaceholder } from '@/components/work-visual-placeholder';
import { getPublishedInitiativeBySlug } from '@/lib/public-content';
import { programmeBySlug, programmeChildren } from '@/lib/master-copy';
import { PublicMedia } from '@/components/public-media';
import { canRenderPublicMedia, resolvePublicMediaUrl } from '@/lib/public-media';
import '@/app/our-work/[slug]/campaign.css';
import '@/app/canonical-content.css';

export async function ProgrammeDetail({slug}:{slug:string}) {
 const record=await getPublishedInitiativeBySlug(slug);if(!record)notFound();
 const canonical=programmeBySlug(slug);
 const title=canonical?.title??record.title;
 const story=canonical?.story??record.story;
 const summary=canonical?.summary??record.summary;
 const children=programmeChildren(slug);
 const media=record.mediaAssets.filter(canRenderPublicMedia);
 const lead=media.find(m=>m.kind==='IMAGE');
 const gallery=media.filter(m=>m.id!==lead?.id);
 const status=canonical?.programmeStatus??'RECURRING';
 const statusLabel=canonical?.causeSlug==='medical-financial-relief'?(slug==='jewellery-loan-intervention'?'Assistance completed':'Fundraising completed'):status==='EXPANDING'?'Developing pathway':status==='ONGOING'?'Ongoing sponsorship':status==='HISTORICAL'?'Historical response':status==='COMPLETED'?'Completed work':'Recurring programme';
 const parent=canonical?.parentSlug?programmeBySlug(canonical.parentSlug):undefined;
 const facts=canonical&&'facts' in canonical?canonical.facts:[];
 const storyParagraphs=story.split(/\n\s*\n/).filter(Boolean);
 const breadcrumbItems=[
  {name:'Home',path:'/'},
  {name:'Our Work',path:'/our-work'},
  ...(parent?[{name:parent.title,path:`/our-work/${parent.slug}`}]:[]),
  {name:title,path:`/our-work/${slug}`},
 ];
 return <div className="v2-home campaign-page canonical-programme">
  <BreadcrumbStructuredData items={breadcrumbItems}/>
  <div className="v2-shell campaign-breadcrumb"><nav aria-label="Breadcrumb"><Link href="/our-work">Our Work</Link> / {parent?<><Link href={`/our-work/${parent.slug}`}>{parent.title}</Link> / </>:null}<span>{title}</span></nav></div>
  <section className="campaign-hero"><div className="v2-shell campaign-hero-grid"><div className="campaign-heading"><p className="v2-kicker">{record.cause.title} · {statusLabel}</p><h1>{title}</h1><p className="campaign-summary">{summary}</p><div className="v2-hero-actions">{children.length>0?<a className="v2-button" href="#programme-pathways">{slug==='taleem'?'Explore Taleem Programmes':'View Year-by-Year Impact'}</a>:<a className="v2-button" href="#programme-story">Read about this work</a>}{media.length>0&&<a className="v2-text-link" href="#campaign-gallery">View photographs</a>}</div></div><div className="campaign-lead">{lead?<PublicMedia asset={lead} priority />:<WorkVisualPlaceholder label={title} className="campaign-lead-placeholder" />}</div></div></section>
  <section className="campaign-story v2-shell" id="programme-story"><div><p className="v2-section-label">The work</p><h2>What happened</h2></div><div className="campaign-story-copy">{storyParagraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div></section>
  {facts&&facts.length>0&&<section className="v2-section paper"><div className="v2-shell"><h2>Programme details</h2><ol className="canonical-facts">{facts.map(f=><li key={f}>{f}</li>)}</ol></div></section>}
  {children.length>0&&<section className="v2-section paper" id="programme-pathways"><div className="v2-shell"><h2>{slug==='taleem'?'One Initiative. Different Pathways to Learning.':'View Year-by-Year Impact'}</h2><div className="canonical-pathways">{children.map(child=><article key={child.slug}><div className="canonical-pathway-visual"><WorkVisualPlaceholder label={child.title}/></div><p className="v2-section-label">{'year' in child?child.year:child.programmeStatus==='EXPANDING'?'Developing pathway':'Continuing sponsorship'}</p><h3><Link href={`/our-work/${child.slug}`}>{child.title}</Link></h3><p>{child.summary}</p><Link className="v2-text-link" href={`/our-work/${child.slug}`}>Explore this {child.programmeStatus==='EXPANDING'?'pathway':'programme'} →</Link></article>)}</div></div></section>}
  {media.length>0&&<section className="campaign-gallery" id="campaign-gallery"><div className="v2-shell"><div className="campaign-section-heading"><h2>Real Work. Shared Responsibly.</h2><p>Original photographs from this programme. Personal documents remain private.</p></div><div className="campaign-gallery-grid">{(gallery.length?gallery:media).map(asset=><div key={asset.id}><PublicMedia asset={asset}/>{asset.kind==='IMAGE'&&<a href={resolvePublicMediaUrl(asset)??'#'} target="_blank" rel="noopener noreferrer">View full image</a>}</div>)}</div></div></section>}
  {(slug==='taleem'||slug.startsWith('taleem-'))&&<section className="v2-section"><div className="v2-shell"><h2>Knowledge should open doors — financial hardship should not close them.</h2><p>Identify a genuine educational barrier, verify the need, and respond responsibly.</p><Link className="v2-button" href="/get-involved/sponsor-education">Sponsor a Learner</Link></div></section>}
  <section className="campaign-next"><div className="v2-shell"><h2>Choose How You Want to Help</h2><div className="v2-hero-actions"><Link className="v2-button" href="/donate">Support Amaana</Link><Link className="v2-text-link" href="/our-work">Explore Our Work →</Link></div></div></section>
 </div>;
}
