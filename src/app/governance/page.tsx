import { CanonicalArticle } from '@/components/canonical-article';
import { governanceCopy } from '@/lib/organization-copy';

export const metadata={title:governanceCopy.title,description:governanceCopy.intro,alternates:{canonical:'/governance'}};
export default function Page(){return <CanonicalArticle eyebrow="Governance" heroVariant="trust" heroVisualTitle="Governance" {...governanceCopy}></CanonicalArticle>;}
