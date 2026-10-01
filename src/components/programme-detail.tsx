import { BodyCarousel } from "@/components/body-carousel";
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BreadcrumbStructuredData } from '@/components/breadcrumb-structured-data';
import { PublicContentStructuredData } from '@/components/public-content-structured-data';
import { PageHero } from '@/components/page-hero';
import { WorkVisualPlaceholder } from '@/components/work-visual-placeholder';
import { getPublishedInitiativeBySlug } from '@/lib/public-content';
import { getProgrammeChildMedia } from '@/lib/public-page-data';
import { programmeBySlug, programmeChildren } from '@/lib/master-copy';
import { PublicMedia } from '@/components/public-media';
import { canRenderPublicMedia, resolvePublicMediaUrl, selectIdentityPublicImage } from '@/lib/public-media';
import { buildPublicRecordFallback, programmeStoryParagraphs, heroTeaser } from '@/lib/public-copy';
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
 const publishedChildSlugs=new Set(childMediaRecords.map(item=>item.slug));
 const publishedChildren=children.filter(child=>publishedChildSlugs.has(child.slug));
 const childMedia=new Map(childMediaRecords.map(item=>[item.slug,selectIdentityPublicImage(item.mediaAssets)??null]));
 const media=record.mediaAssets.filter(canRenderPublicMedia).filter((asset,index,list)=>list.findIndex(other=>resolvePublicMediaUrl(other)===resolvePublicMediaUrl(asset))===index);
 const lead=selectIdentityPublicImage(media);
 const highlightMedia=slug==='eid-gift-kits-2026'?media.find(asset=>/beneficiar|impact graphic/i.test(`${asset.title??''} ${asset.caption??''}`)):undefined;
 const gallery=media.filter(m=>m.id!==lead?.id&&m.id!==highlightMedia?.id);
 const status=canonical?.programmeStatus??'RECURRING';
 const primaryMetric=record.primaryMetric;
 const primaryMetricLabel=record.primaryMetricLabel;
 const statusLabel=canonical?.causeSlug==='medical-financial-relief'?(slug==='jewellery-loan-intervention'?'Assistance completed':'Fundraising completed'):status==='EXPANDING'?'Developing pathway':status==='ONGOING'?'Ongoing sponsorship':status==='HISTORICAL'?'Historical response':status==='COMPLETED'?'Completed work':'Recurring programme';
 const parentCandidate=canonical?.parentSlug?programmeBySlug(canonical.parentSlug):undefined;
 const parentRecord=parentCandidate?await getPublishedInitiativeBySlug(parentCandidate.slug):null;
 const parent=parentRecord?parentCandidate:undefined;
 const facts=canonical&&'facts' in canonical?canonical.facts:[];
 const storyParagraphs=programmeStoryParagraphs(summary,story);
 const historicalGrassroots=['hyderabad-flood-relief-2020','covid-essential-support-2020'].includes(slug);
 const fallbackStory=buildPublicRecordFallback({metric:primaryMetric,metricLabel:primaryMetricLabel});
 const factsClass=slug==='hyderabad-flood-relief-2020'?'canonical-facts canonical-facts--timeline':'canonical-facts';
 const breadcrumbItems=[
  {name:'Home',path:'/'},
  {name:'Our Work',path:'/our-work'},
  ...(parent?[{name:parent.title,path:`/our-work/${parent.slug}`}]:[]),
  {name:title,path:`/our-work/${slug}`},
 ];
 return <div className="v2-home campaign-page canonical-programme">
  <PublicContentStructuredData
   type="WebPage"
   title={title}
   description={summary}
   path={`/our-work/${slug}`}
   publishedAt={record.publishedAt}
   modifiedAt={record.updatedAt}
   imageUrl={lead?resolvePublicMediaUrl(lead):null}
   section={record.cause.title}
  />
  <BreadcrumbStructuredData items={breadcrumbItems}/>
  <div className="v2-shell campaign-breadcrumb"><nav aria-label="Breadcrumb"><Link href="/our-work">Our Work</Link> / {parent?<><Link href={`/our-work/${parent.slug}`}>{parent.title}</Link> / </>:null}<span>{title}</span></nav></div>
  <PageHero
    variant="level2"
    eyebrow={`${record.cause.title} · ${statusLabel}`}
    title={title}
    description={<p>{heroTeaser(summary)}</p>}
    actions={[
      {label: publishedChildren.length>0?(slug==='taleem'?'Explore Taleem Programmes':'View Year-by-Year Impact'):'Read about this work',href:publishedChildren.length>0?'#programme-pathways':'#programme-story'},
      ...(media.length>0?[{label:'View photographs',href:'#campaign-gallery',secondary:true} as const]:[]),
    ]}
    visual={lead?<PublicMedia asset={lead} priority />:<WorkVisualPlaceholder label={title} className="campaign-lead-placeholder" />}
  />
  {(primaryMetric||primaryMetricLabel)&&<section className="campaign-impact-strip" aria-label="Programme impact summary"><div className="v2-shell"><div><span>Documented impact</span><strong>{primaryMetric??"Published record"}</strong><p>{primaryMetricLabel??statusLabel}</p></div><div><span>Status</span><strong>{statusLabel}</strong></div></div></section>}
  <section className="campaign-story" id="programme-story"><div className="v2-shell campaign-story-layout"><div><p className="v2-section-label">The work</p><h2>How the programme took shape</h2></div><div className="campaign-story-copy">{storyParagraphs.length>0?storyParagraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>):<p>{fallbackStory}</p>}</div></div></section>
  {historicalGrassroots&&<section className="campaign-history-note"><div className="v2-shell"><span>Historical grassroots record</span><p>This work predates Amaana Foundation&apos;s later formal registration and is presented as part of the community effort that preceded the registered trust.</p></div></section>}

  {facts&&facts.length>0&&<section className="v2-section paper"><div className="v2-shell"><h2>Programme details</h2><ol className={factsClass}>{facts.map(f=><li key={f}>{f}</li>)}</ol></div></section>}
  {publishedChildren.length>0&&<section className="v2-section paper" id="programme-pathways"><div className="v2-shell"><BodyCarousel label={slug==='taleem'?'Taleem programme pathways':'Programme years'} variant="timeline-impact" className="campaign-pathway-carousel" heading={<h2>{slug==='taleem'?'One Initiative. Different Pathways to Learning.':'View Year-by-Year Impact'}</h2>}>{publishedChildren.map(child=>{const mediaAsset=childMedia.get(child.slug)??null;return <article className="campaign-pathway-card" key={child.slug}><div className="canonical-pathway-visual">{mediaAsset&&canRenderPublicMedia(mediaAsset)?<PublicMedia asset={mediaAsset}/>:<WorkVisualPlaceholder label={child.title}/>}</div><p className="v2-section-label">{'year' in child?child.year:child.programmeStatus==='EXPANDING'?'Developing pathway':'Continuing sponsorship'}</p><h3><Link href={`/our-work/${child.slug}`}>{child.title}</Link></h3><p>{child.summary}</p>{'primaryMetric' in child&&child.primaryMetric&&<div className="canonical-pathway-metric"><strong>{child.primaryMetric}</strong>{'primaryMetricLabel' in child&&child.primaryMetricLabel&&<span>{child.primaryMetricLabel}</span>}</div>}<Link className="v2-text-link" href={`/our-work/${child.slug}`}>Explore this {child.programmeStatus==='EXPANDING'?'pathway':'programme'} →</Link></article>})}</BodyCarousel></div></section>}
  {highlightMedia&&<section className="campaign-data-visual"><div className="v2-shell"><div><span className="v2-section-label">Beneficiary breakdown</span><h2>Who the 2026 Eid Gift Kits reached</h2><p>{highlightMedia.caption}</p></div><PublicMedia asset={highlightMedia}/></div></section>}
  {gallery.length>0&&<section className="campaign-gallery" id="campaign-gallery"><div className="v2-shell"><div className="campaign-section-heading"><h2>Real Work. Shared Responsibly.</h2><p>Original photographs from this programme. Personal documents remain private.</p></div><CampaignMediaGallery items={gallery.filter(asset=>asset.kind==='IMAGE').map(asset=>({id:asset.id,url:resolvePublicMediaUrl(asset)??"",alt:asset.altText,caption:asset.caption,width:asset.width,height:asset.height})).filter(item=>Boolean(item.url))}/><div className="campaign-gallery-grid">{gallery.filter(asset=>asset.kind!=='IMAGE').map(asset=><PublicMedia asset={asset} key={asset.id}/>)}</div></div></section>}
  {(slug==='taleem'||slug.startsWith('taleem-'))&&<section className="v2-section"><div className="v2-shell"><h2>Knowledge should open doors — financial hardship should not close them.</h2><p>Identify a genuine educational barrier, verify the need, and respond responsibly.</p><Link className="v2-button" href="/get-involved/sponsor-education">Sponsor a Learner</Link></div></section>}
  <section className="campaign-next"><div className="v2-shell"><h2>Choose How You Want to Help</h2><div className="v2-hero-actions"><Link className="v2-button" href="/donate">Support Amaana</Link><Link className="v2-text-link" href="/our-work">Explore Our Work →</Link></div></div></section>
 </div>;
}
