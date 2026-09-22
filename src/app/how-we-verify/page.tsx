import { CanonicalArticle } from '@/components/canonical-article';
import { verificationCopy } from '@/lib/organization-copy';

export const metadata = {
  title: verificationCopy.title,
  description: verificationCopy.intro,
  alternates: { canonical: '/how-we-verify' },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: 'website', url: '/how-we-verify', title: `${verificationCopy.title} | Amaana Foundation`, description: verificationCopy.intro },
  twitter: { images: ["/twitter-image"], card: 'summary', title: `${verificationCopy.title} | Amaana Foundation`, description: verificationCopy.intro },
};
export default function Page(){return <CanonicalArticle eyebrow="How Amaana Works" heroVariant="information" heroVisualTitle="Verify Before We Mobilise" heroVisualNote="Need, evidence, privacy, review and known outcomes remain connected throughout the process." bodyClassName="canonical-body--timeline" heroActions={[{ label: "Follow the review process", href: "#verification-process" }, { label: "Request assistance", href: "/request-assistance", secondary: true }]} {...verificationCopy}></CanonicalArticle>;}
