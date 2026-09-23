import { CanonicalArticle } from '@/components/canonical-article';
import { transparencyCopy } from '@/lib/organization-copy';

export const metadata = {
  title: transparencyCopy.title,
  description: transparencyCopy.intro,
  alternates: { canonical: '/transparency' },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: 'website', url: '/transparency', title: `${transparencyCopy.title} | Amaana Foundation`, description: transparencyCopy.intro },
  twitter: { images: ["/twitter-image"], card: 'summary_large_image', title: `${transparencyCopy.title} | Amaana Foundation`, description: transparencyCopy.intro },
};
export default function Page(){return <CanonicalArticle eyebrow="Transparency" heroVariant="trust" heroVisualTitle="Transparency" bodyClassName="canonical-body--comparison" bodyId="transparency-record" heroActions={[{ label: "How accountability works", href: "#transparency-record" }, { label: "Compliance position", href: "/compliance", secondary: true }]} pathways={[
    { label: "How verification works", href: "/how-we-verify", description: "Follow the review process behind verified assistance and public appeals." },
    { label: "Governance", href: "/governance", description: "See the trustees and formal responsibility behind Amaana Foundation." },
    { label: "Compliance position", href: "/compliance", description: "Review current domestic-donation, FCRA and provisional tax-registration boundaries." },
  ]} {...transparencyCopy}></CanonicalArticle>;}
