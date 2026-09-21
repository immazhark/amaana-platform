import { CanonicalArticle } from '@/components/canonical-article';
import { governanceCopy } from '@/lib/organization-copy';

export const metadata = {
  title: governanceCopy.title,
  description: governanceCopy.intro,
  alternates: { canonical: '/governance' },
  openGraph: { type: 'website', url: '/governance', title: `${governanceCopy.title} | Amaana Foundation`, description: governanceCopy.intro },
  twitter: { card: 'summary', title: `${governanceCopy.title} | Amaana Foundation`, description: governanceCopy.intro },
};
export default function Page(){
  return <CanonicalArticle eyebrow="Governance" heroVariant="trust" heroVisualTitle="Governance" bodyClassName="canonical-body--governance" {...governanceCopy}>
    <section className="governance-summary" aria-label="Governance at a glance">
      <div><span>Formal responsibility</span><strong>3 trustees</strong><small>Named in Amaana’s public governance record.</small></div>
      <div><span>Trust registration</span><strong>23 Feb 2024</strong><small>Hyderabad, Telangana.</small></div>
      <div><span>Fundraising boundary</span><strong>Domestic only</strong><small>Amaana Foundation is not FCRA-registered.</small></div>
    </section>
  </CanonicalArticle>;
}
