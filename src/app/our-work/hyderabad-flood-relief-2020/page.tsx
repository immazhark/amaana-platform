import { ProgrammeDetail } from '@/components/programme-detail';
import { programmeBySlug } from '@/lib/master-copy';
export const dynamic = 'force-dynamic';
export const metadata = { title: programmeBySlug('hyderabad-flood-relief-2020')?.title, description: programmeBySlug('hyderabad-flood-relief-2020')?.summary, alternates: { canonical: '/our-work/hyderabad-flood-relief-2020' } };
export default function Page(){return <ProgrammeDetail slug="hyderabad-flood-relief-2020"/>;}

