import type { Metadata } from "next";
import { ProgrammeDetail } from "@/components/programme-detail";
import { programmePageMetadata } from "@/lib/programme-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return programmePageMetadata("qurbani-meat-distribution", "/our-work/qurbani-meat-distribution");
}

export default function Page() {
  return <ProgrammeDetail slug="qurbani-meat-distribution" />;
}
