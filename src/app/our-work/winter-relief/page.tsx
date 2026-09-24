import type { Metadata } from "next";
import { ProgrammeDetail } from "@/components/programme-detail";
import { programmePageMetadata } from "@/lib/programme-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return programmePageMetadata("winter-relief", "/our-work/winter-relief");
}

export default function Page() {
  return <ProgrammeDetail slug="winter-relief" />;
}
