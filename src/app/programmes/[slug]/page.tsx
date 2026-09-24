import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { BreadcrumbStructuredData } from '@/components/breadcrumb-structured-data';
import { PageHero } from '@/components/page-hero';
import { WorkVisualPlaceholder } from '@/components/work-visual-placeholder';
import { programmeCategories, programmes } from '@/lib/master-copy';
import { legacyProgrammeCategoryDestination, programmeCategoryFromRoute, programmeCategoryPath } from '@/lib/programme-category-routing';
import { getInitiativePageData, getOurWorkIndexData } from '@/lib/public-page-data';
import { PublicMedia } from '@/components/public-media';
import { selectIdentityPublicImage } from '@/lib/public-media';
import '@/app/canonical-content.css';

const programmeAliases: Record<string, string> = { qurbani: 'qurbani-meat-distribution', taleem: 'taleem', 'eid-gift-kits': 'eid-gift-kits', 'dates-distribution': 'dates-distribution' };
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };

function hasPublishedTopLevelProgramme(categorySlug: string, publishedSlugs: Set<string>) {
  return programmes.some(
    item => item.causeSlug === categorySlug
      && !('parentSlug' in item)
      && publishedSlugs.has(item.slug),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const legacyDestination = legacyProgrammeCategoryDestination(slug);
  const categorySlug = programmeCategoryFromRoute(slug);
  const category = programmeCategories.find(item => item.slug === categorySlug);
  const aliasTarget = programmeAliases[slug];
  if (aliasTarget) {
    const initiative = await getInitiativePageData(aliasTarget);
    if (!initiative) return { title: 'Programme not found' };
    const canonical = `/our-work/${initiative.slug}`;
    return {
      title: initiative.title,
      description: initiative.summary,
      alternates: { canonical },
      openGraph: {
        type: 'article',
        url: canonical,
        title: `${initiative.title} | Amaana Foundation`,
        description: initiative.summary,
      },
      twitter: {
        card: 'summary',
        title: `${initiative.title} | Amaana Foundation`,
        description: initiative.summary,
      },
    };
  }
  if (legacyDestination) {
    const canonicalCategory = programmeCategories.find(item => programmeCategoryPath(item.slug) === legacyDestination);
    if (!canonicalCategory) return { title: 'Programme not found' };
    const causes = await getOurWorkIndexData();
    const publishedSlugs = new Set(causes.flatMap(cause => cause.initiatives.map(item => item.slug)));
    if (!hasPublishedTopLevelProgramme(canonicalCategory.slug, publishedSlugs)) return { title: 'Programme not found' };
    return {
      title: canonicalCategory.title,
      description: canonicalCategory.summary,
      alternates: { canonical: legacyDestination },
      openGraph: {
        type: 'website',
        url: legacyDestination,
        title: `${canonicalCategory.title} | Amaana Foundation`,
        description: canonicalCategory.summary,
      },
      twitter: {
        card: 'summary',
        title: `${canonicalCategory.title} | Amaana Foundation`,
        description: canonicalCategory.summary,
      },
    };
  }
  if (!category) return { title: 'Programme not found' };
  const causes = await getOurWorkIndexData();
  const publishedSlugs = new Set(causes.flatMap(cause => cause.initiatives.map(item => item.slug)));
  if (!hasPublishedTopLevelProgramme(category.slug, publishedSlugs)) return { title: 'Programme not found' };
  const canonical = programmeCategoryPath(category.slug);
  return { title: category.title, description: category.summary, alternates: { canonical }, openGraph: { type: 'website', url: canonical, title: `${category.title} | Amaana Foundation`, description: category.summary }, twitter: { card: 'summary', title: `${category.title} | Amaana Foundation`, description: category.summary } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const aliasTarget = programmeAliases[slug];
  if (aliasTarget) {
    const initiative = await getInitiativePageData(aliasTarget);
    if (!initiative) notFound();
    permanentRedirect(`/our-work/${initiative.slug}`);
  }
  const legacyDestination = legacyProgrammeCategoryDestination(slug);
  const categorySlug = programmeCategoryFromRoute(slug);
  const directCategory = programmeCategories.find(item => item.slug === categorySlug);
  const legacyCategory = legacyDestination
    ? programmeCategories.find(item => programmeCategoryPath(item.slug) === legacyDestination)
    : undefined;
  const category = directCategory ?? legacyCategory;
  if (!category) notFound();

  const causes = await getOurWorkIndexData();
  const records = causes.flatMap(cause => cause.initiatives);
  const recordBySlug = new Map(records.map(record => [record.slug, record]));
  const items = programmes.filter(
    item => item.causeSlug === category.slug
      && !('parentSlug' in item)
      && recordBySlug.has(item.slug),
  );
  if (items.length === 0) notFound();
  if (legacyDestination) permanentRedirect(legacyDestination);

  const canonical = programmeCategoryPath(category.slug);
  const leadPhoto = items.map(item => { const record = recordBySlug.get(item.slug); return record ? selectIdentityPublicImage(record.mediaAssets) : null; }).find(Boolean) ?? null;

  return <div className="v2-home">
    <BreadcrumbStructuredData items={[{ name: 'Home', path: '/' }, { name: 'Our Work', path: '/our-work' }, { name: category.title, path: canonical }]} />
    <div className="v2-shell campaign-breadcrumb"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/our-work">Our Work</Link><span aria-hidden="true"> / </span><span>{category.title}</span></nav></div>
    <PageHero variant="level2" eyebrow="Our Work · Programme Category" title={category.title} description={<p>{category.description}</p>} actions={[{label:'Explore programmes',href:'#programme-list'},{label:'Back to Our Work',href:'/our-work',secondary:true}]} visual={leadPhoto ? <PublicMedia asset={leadPhoto} priority /> : <WorkVisualPlaceholder label={category.title} />} />
    <section className="v2-section paper" id="programme-list"><div className="v2-shell canonical-pathways">{items.map(item => { const record = recordBySlug.get(item.slug); const photo = record ? selectIdentityPublicImage(record.mediaAssets) : null; return <article key={item.slug}><div className="canonical-pathway-visual">{photo ? <PublicMedia asset={photo} /> : <WorkVisualPlaceholder label={item.title} />}</div><h2><Link href={`/our-work/${item.slug}`}>{item.title}</Link></h2><p>{item.summary}</p><Link className="v2-text-link" href={`/our-work/${item.slug}`}>See the documented work →</Link></article>; })}</div></section>
  </div>;
}
