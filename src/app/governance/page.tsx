import { CanonicalArticle } from '@/components/canonical-article';
import { governanceCopy } from '@/lib/organization-copy';

export const metadata = {
  title: governanceCopy.title,
  description: governanceCopy.intro,
  alternates: { canonical: '/governance' },
  openGraph: { type: 'website', url: '/governance', title: `${governanceCopy.title} | Amaana Foundation`, description: governanceCopy.intro },
  twitter: { card: 'summary', title: `${governanceCopy.title} | Amaana Foundation`, description: governanceCopy.intro },
};
export default function Page(){return <CanonicalArticle eyebrow="Governance" heroVariant="trust" heroVisualTitle="Governance" {...governanceCopy}></CanonicalArticle>;}
