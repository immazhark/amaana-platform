import { ProgrammeDetail } from '@/components/programme-detail';
import { programmePageMetadata } from '@/lib/programme-page-metadata';

export const dynamic = 'force-dynamic';
export const metadata = programmePageMetadata('taleem', '/our-work/taleem');
export default function Page(){return <ProgrammeDetail slug="taleem"/>;}
