import { ProgrammeDetail } from '@/components/programme-detail';
import { programmePageMetadata } from '@/lib/programme-page-metadata';

export const dynamic = 'force-dynamic';
export const metadata = programmePageMetadata('dates-distribution', '/our-work/dates-distribution');
export default function Page(){return <ProgrammeDetail slug="dates-distribution"/>;}
