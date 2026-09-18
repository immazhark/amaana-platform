import { ProgrammeDetail } from '@/components/programme-detail';
import { programmePageMetadata } from '@/lib/programme-page-metadata';

export const dynamic = 'force-dynamic';
export const metadata = programmePageMetadata('hyderabad-flood-relief-2020', '/our-work/hyderabad-flood-relief-2020');
export default function Page(){return <ProgrammeDetail slug="hyderabad-flood-relief-2020"/>;}
