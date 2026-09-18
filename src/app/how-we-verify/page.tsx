import { CanonicalArticle } from '@/components/canonical-article';
import { verificationCopy } from '@/lib/organization-copy';

export const metadata = {
  title: verificationCopy.title,
  description: verificationCopy.intro,
  alternates: { canonical: '/how-we-verify' },
  openGraph: { type: 'website', url: '/how-we-verify', title: `${verificationCopy.title} | Amaana Foundation`, description: verificationCopy.intro },
  twitter: { card: 'summary', title: `${verificationCopy.title} | Amaana Foundation`, description: verificationCopy.intro },
};
export default function Page(){return <CanonicalArticle eyebrow="How Amaana Works" heroVariant="information" heroVisualTitle="Verify Before We Mobilise" heroVisualNote="Need, evidence, privacy, review and known outcomes remain connected throughout the process." {...verificationCopy}></CanonicalArticle>;}
