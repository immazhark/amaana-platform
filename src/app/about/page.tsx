import { CanonicalArticle } from '@/components/canonical-article';
import { aboutCopy } from '@/lib/organization-copy';
import Link from 'next/link';
export const metadata={title:aboutCopy.title,description:aboutCopy.intro,alternates:{canonical:'/about'}};
export default function Page(){return <CanonicalArticle eyebrow="Amaana Foundation" {...aboutCopy}><section className="canonical-block"><h2>Recognition from AMP</h2><div><p>Amaana Foundation received the Best NGO Award of the Year (Telangana) at AMP’s 5th National Awards for Social Excellence 2025.</p><Link href="/recognition">View the Certificate of Excellence →</Link></div></section></CanonicalArticle>;}
