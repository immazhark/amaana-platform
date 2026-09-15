import { CanonicalArticle } from '@/components/canonical-article';
import { verificationCopy } from '@/lib/organization-copy';

export const metadata={title:verificationCopy.title,description:verificationCopy.intro,alternates:{canonical:'/how-we-verify'}};
export default function Page(){return <CanonicalArticle eyebrow="Amaana Foundation" {...verificationCopy}></CanonicalArticle>;}
