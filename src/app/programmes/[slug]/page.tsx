import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { BreadcrumbStructuredData } from '@/components/breadcrumb-structured-data';
import { PublicContentStructuredData } from '@/components/public-content-structured-data';
import { PageHero } from '@/components/page-hero';
import { WorkVisualPlaceholder } from '@/components/work-visual-placeholder';
import { programmeCategories, programmes } from '@/lib/master-copy';
import { legacyProgrammeRoute, programmeCategoryFromRoute, programmeCategoryPath } from '@/lib/programme-category-routing';
import { getOurWorkIndexData } from '@/lib/public-page-data';
import { PublicMedia } from '@/components/public-media';
import { resolvePublicMediaUrl, selectIdentityPublicImage } from '@/lib/public-media';
import { openGraphShareImages, twitterShareImages } from '@/lib/social-share-media';
import '@/app/canonical-content.css';

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
  const legacyRoute = legacyProgrammeRoute(slug);
  if (legacyRoute?.kind === 'initiative') {
    const programme = programmes.find(item => item.slug === legacyRoute.targetSlug);
    if (!programme) {
      return {
        title: 'Programme not found',
        alternates: { canonical: legacyRoute.destination },
      };
    }
    return {
      title: programme.title,
      description: programme.summary,
      alternates: { canonical: legacyRoute.destination },
      openGraph: {
        type: 'article',
        url: legacyRoute.destination,
        title: `${programme.title} | Amaana Foundation`,
        description: programme.summary,
        images: openGraphShareImages(),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${programme.title} | Amaana Foundation`,
        description: programme.summary,
        images: twitterShareImages(),
      },
    };
  }
  if (legacyRoute?.kind === 'category') {
    const canonicalCategory = programmeCategories.find(item => programmeCategoryPath(item.slug) === legacyRoute.destination);
    if (!canonicalCategory) return { title: 'Programme not found' };
    return {
      title: canonicalCategory.title,
      description: canonicalCategory.summary,
      alternates: { canonical: legacyRoute.destination },
      openGraph: {
        type: 'website',
        url: legacyRoute.destination,
        title: `${canonicalCategory.title} | Amaana Foundation`,
        description: canonicalCategory.summary,
        images: openGraphShareImages(),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${canonicalCategory.title} | Amaana Foundation`,
        description: canonicalCategory.summary,
        images: twitterShareImages(),
      },
    };
  }

  const categorySlug = programmeCategoryFromRoute(slug);
  const category = programmeCategories.find(item => item.slug === categorySlug);
  if (!category) return { title: 'Programme not found' };
  const causes = await getOurWorkIndexData();
  const publishedSlugs = new Set(causes.flatMap(cause => cause.initiatives.map(item => item.slug)));
  if (!hasPublishedTopLevelProgramme(category.slug, publishedSlugs)) return { title: 'Programme not found' };
  const canonical = programmeCategoryPath(category.slug);
  return { title: category.title, description: category.summary, alternates: { canonical }, openGraph: { type: 'website', url: canonical, title: `${category.title} | Amaana Foundation`, description: category.summary, images: openGraphShareImages() }, twitter: { card: 'summary_large_image', title: `${category.title} | Amaana Foundation`, description: category.summary, images: twitterShareImages() } };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const legacyRoute = legacyProgrammeRoute(slug);
  if (legacyRoute) permanentRedirect(legacyRoute.destination);

  const categorySlug = programmeCategoryFromRoute(slug);
  const category = programmeCategories.find(item => item.slug === categorySlug);
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

  const canonical = programmeCategoryPath(category.slug);
  const leadPhoto = items.map(item => { const record = recordBySlug.get(item.slug); return record ? selectIdentityPublicImage(record.mediaAssets) : null; }).find(Boolean) ?? null;

  return <div className="v2-home">
    <PublicContentStructuredData
      type="WebPage"
      title={category.title}
      description={category.summary}
      path={canonical}
      imageUrl={leadPhoto ? resolvePublicMediaUrl(leadPhoto) : null}
      section="Our Work"
    />
    <BreadcrumbStructuredData items={[{ name: 'Home', path: '/' }, { name: 'Our Work', path: '/our-work' }, { name: category.title, path: canonical }]} />
    <div className="v2-shell campaign-breadcrumb"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/our-work">Our Work</Link><span aria-hidden="true"> / </span><span>{category.title}</span></nav></div>
    <PageHero variant="level2" eyebrow="Our Work · Programme Category" title={category.title} description={<p>{category.description}</p>} actions={[{label:'Explore programmes',href:'#programme-list'},{label:'Back to Our Work',href:'/our-work',secondary:true}]} visual={leadPhoto ? <PublicMedia asset={leadPhoto} priority /> : <WorkVisualPlaceholder label={category.title} />} />
    <section className="v2-section paper" id="programme-list"><div className="v2-shell canonical-pathways">{items.map(item => { const record = recordBySlug.get(item.slug); const photo = record ? selectIdentityPublicImage(record.mediaAssets) : null; return <article key={item.slug}><div className="canonical-pathway-visual">{photo ? <PublicMedia asset={photo} /> : <WorkVisualPlaceholder label={item.title} />}</div><h2><Link href={`/our-work/${item.slug}`}>{item.title}</Link></h2><p>{item.summary}</p><Link className="v2-text-link" href={`/our-work/${item.slug}`}>See the documented work →</Link></article>; })}</div></section>
  </div>;
}
