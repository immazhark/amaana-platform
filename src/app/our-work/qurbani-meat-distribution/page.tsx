import { ProgrammeDetail } from '@/components/programme-detail';
import { programmePageMetadata } from '@/lib/programme-page-metadata';

export const dynamic = 'force-dynamic';
export const metadata = programmePageMetadata('qurbani-meat-distribution', '/our-work/qurbani-meat-distribution');
export default function Page(){return <ProgrammeDetail slug="qurbani-meat-distribution"/>;}
