import { CanonicalArticle } from '@/components/canonical-article';
import {masterSection,copyBetween} from '@/lib/master-copy';
const source=masterSection(27);
export const metadata={title:'Partner With Amaana Foundation'};
export default function Page(){return <CanonicalArticle eyebrow="Partner With Amaana" heroVariant="action" heroVisualTitle="Build Local Impact Together" heroVisualNote="Partnerships should strengthen verified work, community reach and accountable delivery—not dilute the purpose." title="Better Local Impact Is Often Built Together" intro={copyBetween(source,'## Copy','## Partnership Areas')} blocks={[{title:'Partnership Areas',items:copyBetween(source,'## Partnership Areas','**CTA:**').split('\n').filter(x=>x.startsWith('- ')).map(x=>x.slice(2))}]}><a className="v2-button" href="mailto:amaanafoundation24@gmail.com?subject=Partnership%20Enquiry">Start a Partnership Conversation</a></CanonicalArticle>;}
