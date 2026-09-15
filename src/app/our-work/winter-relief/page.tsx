import { ProgrammeDetail } from '@/components/programme-detail';
import { programmeBySlug } from '@/lib/master-copy';
export const dynamic = 'force-dynamic';
export const metadata = { title: programmeBySlug('winter-relief')?.title, description: programmeBySlug('winter-relief')?.summary, alternates: { canonical: '/our-work/winter-relief' } };
export default function Page(){return <ProgrammeDetail slug="winter-relief"/>;}

