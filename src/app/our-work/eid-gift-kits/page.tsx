import type { Metadata } from "next";
import { ProgrammeDetail } from "@/components/programme-detail";
import { programmePageMetadata } from "@/lib/programme-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return programmePageMetadata("eid-gift-kits", "/our-work/eid-gift-kits");
}

export default function Page() {
  return <ProgrammeDetail slug="eid-gift-kits" />;
}
