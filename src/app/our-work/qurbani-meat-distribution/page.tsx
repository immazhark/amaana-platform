import { ProgrammeDetail } from '@/components/programme-detail';
import { programmeBySlug } from '@/lib/master-copy';
export const dynamic = 'force-dynamic';
export const metadata = { title: programmeBySlug('qurbani-meat-distribution')?.title, description: programmeBySlug('qurbani-meat-distribution')?.summary, alternates: { canonical: '/our-work/qurbani-meat-distribution' } };
export default function Page(){return <ProgrammeDetail slug="qurbani-meat-distribution"/>;}

