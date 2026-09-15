import { ProgrammeDetail } from '@/components/programme-detail';
import { programmeBySlug } from '@/lib/master-copy';
export const dynamic = 'force-dynamic';
export const metadata = { title: programmeBySlug('dates-distribution')?.title, description: programmeBySlug('dates-distribution')?.summary, alternates: { canonical: '/our-work/dates-distribution' } };
export default function Page(){return <ProgrammeDetail slug="dates-distribution"/>;}

