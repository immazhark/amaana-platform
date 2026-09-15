import { ProgrammeDetail } from '@/components/programme-detail';
import { programmeBySlug } from '@/lib/master-copy';
export const dynamic = 'force-dynamic';
export const metadata = { title: programmeBySlug('taleem')?.title, description: programmeBySlug('taleem')?.summary, alternates: { canonical: '/our-work/taleem' } };
export default function Page(){return <ProgrammeDetail slug="taleem"/>;}

