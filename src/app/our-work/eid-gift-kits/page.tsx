import { ProgrammeDetail } from '@/components/programme-detail';
import { programmeBySlug } from '@/lib/master-copy';
export const dynamic = 'force-dynamic';
export const metadata = { title: programmeBySlug('eid-gift-kits')?.title, description: programmeBySlug('eid-gift-kits')?.summary, alternates: { canonical: '/our-work/eid-gift-kits' } };
export default function Page(){return <ProgrammeDetail slug="eid-gift-kits"/>;}

