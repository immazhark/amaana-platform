import "@/app/canonical-content.css";
import { PageHero } from '@/components/page-hero';
import { SectionHeading } from '@/components/section-heading';
import { masterSection, copyBetween } from '@/lib/master-copy';
import styles from './partner-audit.module.css';

const source = masterSection(27);
const description = 'Partner with Amaana Foundation on verified community initiatives, responsible local support and accountable delivery in Hyderabad.';
const areas = copyBetween(source, '## Partnership Areas', '**CTA:**').split('\n').filter(item => item.startsWith('- ')).map(item => item.slice(2));
const icons = [
  'm12 3 9 17H3zM12 9v4m0 3h.01',
  'm2 9 10-5 10 5-10 5zM6 11v6l6 3 6-3v-6',
  'M4 7h16v14H4zM8 3v8m8-8v8M4 11h16',
  'M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6zM12 8v8M8 12h8',
  'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2',
  'M3 4h12v13H3zM15 9h4l3 4v4h-7M5 17a2 2 0 1 0 4 0m7 0a2 2 0 1 0 4 0',
  'M4 21V7l8-4 8 4v14M8 9h1m6 0h1M8 13h1m6 0h1M10 21v-4h4v4',
  'm8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18',
];
const pathways = [
  { label: 'How Amaana works', href: '/how-we-verify', description: 'Understand how verification, privacy and responsible review shape work before support is mobilised.' },
  { label: 'Transparency', href: '/transparency', description: 'See how Amaana separates public evidence from private beneficiary information and reports responsibly.' },
  { label: 'Get involved', href: '/get-involved', description: 'Explore other practical ways to contribute time, skills, sponsorship or support.' },
];
export const metadata = {
  title: 'Partner With Amaana', description,
  alternates: { canonical: '/partner' },
  openGraph: { images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Amaana Foundation' }], type: 'website', url: '/partner', title: 'Partner With Amaana | Amaana Foundation', description },
  twitter: { images: ['/twitter-image'], card: 'summary_large_image', title: 'Partner With Amaana | Amaana Foundation', description },
};
export default function Page() {
  return <div className="v2-home canonical-article">
    <PageHero variant="action" eyebrow="Partner With Amaana" title="Better Local Impact Is Often Built Together" description={<p>{copyBetween(source, '## Copy', '## Partnership Areas')}</p>} visualTitle="Build Local Impact Together" visualNote="Partnerships should strengthen verified work, community reach and accountable delivery—not dilute the purpose." actions={[{ label: 'Explore partnership areas', href: '#partnership-areas' }, { label: 'Start a conversation', href: 'mailto:amaanafoundation24@gmail.com?subject=Partnership%20Enquiry', secondary: true }]} />
    <section className="v2-section paper" id="partnership-areas"><div className="v2-shell canonical-body">
      <SectionHeading eyebrow="Partner with Amaana" title="Partnership Areas" subtitle="Partnerships should strengthen verified work, community reach and accountable delivery—not dilute the purpose." />
      <ul className={styles.areas}>{areas.map((area, index) => <li key={area}><span className={styles.icon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[index] ?? icons[6]} /></svg></span><span>{area}</span></li>)}</ul>
      <div className={`canonical-actions ${styles.actions}`}><a className="v2-button" href="mailto:amaanafoundation24@gmail.com?subject=Partnership%20Enquiry">Start a Partnership Conversation</a></div>
      <nav className="canonical-pathways" aria-label="Continue exploring Amaana">{pathways.map(path => <a className="canonical-pathway" href={path.href} key={path.href}><span>{path.label}</span><p>{path.description}</p><strong aria-hidden="true">Continue →</strong></a>)}</nav>
    </div></section>
  </div>;
}
