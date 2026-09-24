import type { Metadata } from "next";
import { AssistanceStatusClient } from "@/components/assistance-status-client";

export const metadata: Metadata = {
  title: "Private Assistance Request Tracking",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function StatusPage() {
  return <AssistanceStatusClient />;
}
