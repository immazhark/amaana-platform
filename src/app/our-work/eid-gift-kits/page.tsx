import { ProgrammeDetail } from '@/components/programme-detail';
import { programmePageMetadata } from '@/lib/programme-page-metadata';

export const dynamic = 'force-dynamic';
export const metadata = programmePageMetadata('eid-gift-kits', '/our-work/eid-gift-kits');
export default function Page(){return <ProgrammeDetail slug="eid-gift-kits"/>;}
