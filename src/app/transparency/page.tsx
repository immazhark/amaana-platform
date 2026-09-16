import { CanonicalArticle } from '@/components/canonical-article';
import { transparencyCopy } from '@/lib/organization-copy';

export const metadata={title:transparencyCopy.title,description:transparencyCopy.intro,alternates:{canonical:'/transparency'}};
export default function Page(){return <CanonicalArticle eyebrow="Transparency" heroVariant="trust" heroVisualTitle="Transparency" {...transparencyCopy}></CanonicalArticle>;}
