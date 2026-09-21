import { CanonicalArticle } from '@/components/canonical-article';
import { transparencyCopy } from '@/lib/organization-copy';

export const metadata = {
  title: transparencyCopy.title,
  description: transparencyCopy.intro,
  alternates: { canonical: '/transparency' },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: 'website', url: '/transparency', title: `${transparencyCopy.title} | Amaana Foundation`, description: transparencyCopy.intro },
  twitter: { images: ["/twitter-image"], card: 'summary', title: `${transparencyCopy.title} | Amaana Foundation`, description: transparencyCopy.intro },
};
export default function Page(){return <CanonicalArticle eyebrow="Transparency" heroVariant="trust" heroVisualTitle="Transparency" bodyClassName="canonical-body--comparison" {...transparencyCopy}></CanonicalArticle>;}
