import { CanonicalArticle } from '@/components/canonical-article';
import {masterSection,copyBetween} from '@/lib/master-copy';

const source=masterSection(27);
const description='Partner with Amaana Foundation on verified community initiatives, responsible local support and accountable delivery in Hyderabad.';
export const metadata = {
  title: 'Partner With Amaana',
  description,
  alternates: { canonical: '/partner' },
  openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Amaana Foundation" }], type: 'website', url: '/partner', title: 'Partner With Amaana | Amaana Foundation', description },
  twitter: { images: ["/twitter-image"], card: 'summary_large_image', title: 'Partner With Amaana | Amaana Foundation', description },
};
export default function Page(){return <CanonicalArticle eyebrow="Partner With Amaana" heroVariant="action" heroVisualTitle="Build Local Impact Together" heroVisualNote="Partnerships should strengthen verified work, community reach and accountable delivery—not dilute the purpose." bodyId="partnership-areas" heroActions={[{label:"Explore partnership areas",href:"#partnership-areas"},{label:"Start a conversation",href:"mailto:amaanafoundation24@gmail.com?subject=Partnership%20Enquiry",secondary:true}]} pathways={[
  { label: "How Amaana works", href: "/how-we-verify", description: "Understand how verification, privacy and responsible review shape work before support is mobilised." },
  { label: "Transparency", href: "/transparency", description: "See how Amaana separates public evidence from private beneficiary information and reports responsibly." },
  { label: "Get involved", href: "/get-involved", description: "Explore other practical ways to contribute time, skills, sponsorship or support." },
]} title="Better Local Impact Is Often Built Together" intro={copyBetween(source,'## Copy','## Partnership Areas')} blocks={[{title:'Partnership Areas',presentation:'card-list',items:copyBetween(source,'## Partnership Areas','**CTA:**').split('\n').filter(x=>x.startsWith('- ')).map(x=>x.slice(2))}]}><a className="v2-button" href="mailto:amaanafoundation24@gmail.com?subject=Partnership%20Enquiry">Start a Partnership Conversation</a></CanonicalArticle>;}
