import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BreadcrumbStructuredData } from '@/components/breadcrumb-structured-data';
import { PageHero } from '@/components/page-hero';
import { WorkVisualPlaceholder } from '@/components/work-visual-placeholder';
import { getPublishedInitiativeBySlug } from '@/lib/public-content';
import { getProgrammeChildMedia } from '@/lib/public-page-data';
import { programmeBySlug, programmeChildren } from '@/lib/master-copy';
import { PublicMedia } from '@/components/public-media';
import { canRenderPublicMedia, resolvePublicMediaUrl } from '@/lib/public-media';
import { distinctStoryParagraphs, publicRecordFallback } from '@/lib/public-copy';
import { CampaignMediaGallery } from '@/components/campaign-media-gallery';
import '@/app/our-work/[slug]/campaign.css';
import '@/app/canonical-content.css';

export async function ProgrammeDetail({slug}:{slug:string}) {
 const record=await getPublishedInitiativeBySlug(slug);if(!record)notFound();
 const canonical=programmeBySlug(slug);
 const title=canonical?.title??record.title;
 const story=canonical?.story??record.story;
 const summary=canonical?.summary??record.summary;
 const children=programmeChildren(slug);
 const childMediaRecords=await getProgrammeChildMedia(children.map(child=>child.slug));
 const childMedia=new Map(childMediaRecords.map(item=>[item.slug,item.mediaAssets[0]??null]));
 const media=record.mediaAssets.filter(canRenderPublicMedia);
 const lead=media.find(m=>m.kind==='IMAGE');
 const gallery=media.filter(m=>m.id!==lead?.id);
 const status=canonical?.programmeStatus??'RECURRING';
 const statusLabel=canonical?.causeSlug==='medical-financial-relief'?(slug==='jewellery-loan-intervention'?'Assistance completed':'Fundraising completed'):status==='EXPANDING'?'Developing pathway':status==='ONGOING'?'Ongoing sponsorship':status==='HISTORICAL'?'Historical response':status==='COMPLETED'?'Completed work':'Recurring programme';
 const parent=canonical?.parentSlug?programmeBySlug(canonical.parentSlug):undefined;
 const facts=canonical&&'facts' in canonical?canonical.facts:[];
 const storyParagraphs=distinctStoryParagraphs(summary,story);
 const breadcrumbItems=[
  {name:'Home',path:'/'},
  {name:'Our Work',path:'/our-work'},
  ...(parent?[{name:parent.title,path:`/our-work/${parent.slug}`}]:[]),
  {name:title,path:`/our-work/${slug}`},
 ];
 return <div className="v2-home campaign-page canonical-programme">
  <BreadcrumbStructuredData items={breadcrumbItems}/>
  <div className="v2-shell campaign-breadcrumb"><nav aria-label="Breadcrumb"><Link href="/our-work">Our Work</Link> / {parent?<><Link href={`/our-work/${parent.slug}`}>{parent.title}</Link> / </>:null}<span>{title}</span></nav></div>
  <PageHero
    variant="level2"
    eyebrow={`${record.cause.title} · ${statusLabel}`}
    title={title}
    description={<p>{summary}</p>}
    actions={[
      {label: children.length>0?(slug==='taleem'?'Explore Taleem Programmes':'View Year-by-Year Impact'):'Read about this work',href:children.length>0?'#programme-pathways':'#programme-story'},
      ...(media.length>0?[{label:'View photographs',href:'#campaign-gallery',secondary:true} as const]:[]),
    ]}
    visual={lead?<PublicMedia asset={lead} priority />:<WorkVisualPlaceholder label={title} className="campaign-lead-placeholder" />}
  />
  <section className="campaign-story v2-shell" id="programme-story"><div><p className="v2-section-label">The work</p><h2>What happened</h2></div><div className="campaign-story-copy">{storyParagraphs.length>0?storyParagraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>):<p>{publicRecordFallback}</p>}</div></section>
  {facts&&facts.length>0&&<section className="v2-section paper"><div className="v2-shell"><h2>Programme details</h2><ol className="canonical-facts">{facts.map(f=><li key={f}>{f}</li>)}</ol></div></section>}
  {children.length>0&&<section className="v2-section paper" id="programme-pathways"><div className="v2-shell"><h2>{slug==='taleem'?'One Initiative. Different Pathways to Learning.':'View Year-by-Year Impact'}</h2><div className="canonical-pathways">{children.map(child=>{const mediaAsset=childMedia.get(child.slug)??null;return <article key={child.slug}><div className="canonical-pathway-visual">{mediaAsset?<PublicMedia asset={mediaAsset}/>:<WorkVisualPlaceholder label={child.title}/>}</div><p className="v2-section-label">{'year' in child?child.year:child.programmeStatus==='EXPANDING'?'Developing pathway':'Continuing sponsorship'}</p><h3><Link href={`/our-work/${child.slug}`}>{child.title}</Link></h3><p>{child.summary}</p><Link className="v2-text-link" href={`/our-work/${child.slug}`}>Explore this {child.programmeStatus==='EXPANDING'?'pathway':'programme'} →</Link></article>})}</div></div></section>}
  {media.length>0&&<section className="campaign-gallery" id="campaign-gallery"><div className="v2-shell"><div className="campaign-section-heading"><h2>Real Work. Shared Responsibly.</h2><p>Original photographs from this programme. Personal documents remain private.</p></div><CampaignMediaGallery items={(gallery.length?gallery:media).filter(asset=>asset.kind==='IMAGE').map(asset=>({id:asset.id,url:resolvePublicMediaUrl(asset)??"",alt:asset.altText,caption:asset.caption})).filter(item=>Boolean(item.url))}/><div className="campaign-gallery-grid">{(gallery.length?gallery:media).filter(asset=>asset.kind!=='IMAGE').map(asset=><PublicMedia asset={asset} key={asset.id}/>)}</div></div></section>}
  {(slug==='taleem'||slug.startsWith('taleem-'))&&<section className="v2-section"><div className="v2-shell"><h2>Knowledge should open doors — financial hardship should not close them.</h2><p>Identify a genuine educational barrier, verify the need, and respond responsibly.</p><Link className="v2-button" href="/get-involved/sponsor-education">Sponsor a Learner</Link></div></section>}
  <section className="campaign-next"><div className="v2-shell"><h2>Choose How You Want to Help</h2><div className="v2-hero-actions"><Link className="v2-button" href="/donate">Support Amaana</Link><Link className="v2-text-link" href="/our-work">Explore Our Work →</Link></div></div></section>
 </div>;
}
