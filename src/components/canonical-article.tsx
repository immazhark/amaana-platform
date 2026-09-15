import Link from 'next/link';
import '@/app/canonical-content.css';
export type ArticleBlock={title:string;paragraphs?:string[];items?:string[]};
export function CanonicalArticle({title,intro,eyebrow,blocks,children}:{title:string;intro:string;eyebrow:string;blocks:ArticleBlock[];children?:React.ReactNode}){
 return <div className="v2-home canonical-article"><section className="v2-hero"><div className="v2-shell v2-hero-inner"><div><p className="v2-kicker">{eyebrow}</p><h1 className="v2-display">{title}</h1></div><div><p className="v2-hero-copy">{intro}</p><div className="v2-hero-actions"><Link className="v2-button" href="/our-work">Explore Our Work</Link><Link className="v2-text-link" href="/contact">Contact Amaana →</Link></div></div></div></section><section className="v2-section paper"><div className="v2-shell canonical-body">{blocks.map((b,i)=><section className="canonical-block" key={i}><h2>{b.title}</h2><div>{b.paragraphs?.map((p,j)=><p key={j}>{p}</p>)}{b.items&&<ul>{b.items.map((p,j)=><li key={j}>{p}</li>)}</ul>}</div></section>)}{children}</div></section></div>;
}
