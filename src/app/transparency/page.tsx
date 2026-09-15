import { CanonicalArticle } from '@/components/canonical-article';
import { transparencyCopy } from '@/lib/organization-copy';

export const metadata={title:transparencyCopy.title,description:transparencyCopy.intro,alternates:{canonical:'/transparency'}};
export default function Page(){return <CanonicalArticle eyebrow="Amaana Foundation" {...transparencyCopy}></CanonicalArticle>;}
