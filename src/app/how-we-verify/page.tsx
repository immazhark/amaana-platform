import { CanonicalArticle } from '@/components/canonical-article';
import { verificationCopy } from '@/lib/organization-copy';

export const metadata = {
  title: verificationCopy.title,
  description: verificationCopy.intro,
  alternates: { canonical: '/how-we-verify' },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: 'website', url: '/how-we-verify', title: `${verificationCopy.title} | Amaana Foundation`, description: verificationCopy.intro },
  twitter: { images: ["/twitter-image"], card: 'summary_large_image', title: `${verificationCopy.title} | Amaana Foundation`, description: verificationCopy.intro },
};
export default function Page(){return <CanonicalArticle eyebrow="How Amaana Works" heroVariant="information" heroVisualTitle="Verify Before We Mobilise" heroVisualNote="Need, evidence, privacy, review and known outcomes remain connected throughout the process." bodyClassName="canonical-body--timeline" bodyId="verification-process" heroActions={[{ label: "Follow the review process", href: "#verification-process" }, { label: "Request assistance", href: "/request-assistance", secondary: true }]} pathways={[
    { label: "Transparency & reporting", href: "/transparency", description: "See how public evidence and private beneficiary information are deliberately separated." },
    { label: "Governance", href: "/governance", description: "Understand who carries formal responsibility for Amaana’s work." },
    { label: "Request assistance", href: "/request-assistance", description: "Use the private intake route when a person or family needs support." },
  ]} {...verificationCopy}></CanonicalArticle>;}
