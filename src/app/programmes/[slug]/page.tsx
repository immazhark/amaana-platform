import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { programmeCategories,programmes } from '@/lib/master-copy';
import { getOurWorkIndexData } from '@/lib/public-page-data';
import { PublicMedia } from '@/components/public-media';
import '@/app/canonical-content.css';
const aliases:Record<string,string>={'qurbani':'qurbani-meat-distribution','seasonal-relief':'winter-relief','taleem':'taleem','eid-gift-kits':'eid-gift-kits','dates-distribution':'dates-distribution'};
const categoryAliases:Record<string,string>={'medical-financial-relief':'medical-financial-relief','emergency-relief':'emergency-humanitarian-relief','ramadan-eid':'ramadan-eid','seasonal-essentials':'seasonal-relief'};
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=programmeCategories.find(c=>c.slug===(categoryAliases[slug]??slug));return {title:c?.title??'Amaana Programmes',description:c?.summary};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(aliases[slug])permanentRedirect(`/our-work/${aliases[slug]}`);const category=programmeCategories.find(c=>c.slug===(categoryAliases[slug]??slug));if(!category)notFound();const causes=await getOurWorkIndexData();const records=causes.flatMap(c=>c.initiatives);const items=programmes.filter(p=>p.causeSlug===category.slug&&!('parentSlug'in p));return <div className="v2-home"><section className="v2-hero"><div className="v2-shell v2-hero-inner"><div><p className="v2-kicker">Our Work</p><h1 className="v2-display">{category.title}</h1></div><p className="v2-hero-copy">{category.description}</p></div></section><section className="v2-section paper"><div className="v2-shell canonical-pathways">{items.map(item=>{const photo=records.find(r=>r.slug===item.slug)?.mediaAssets[0];return <article key={item.slug}>{photo&&<PublicMedia asset={photo}/>}<h2><Link href={`/our-work/${item.slug}`}>{item.title}</Link></h2><p>{item.summary}</p><Link className="v2-text-link" href={`/our-work/${item.slug}`}>See the documented work →</Link></article>})}</div></section></div>;}
