import type { Metadata } from "next";
import { AssistanceReceivedClient } from "@/components/assistance-received-client";

export const metadata: Metadata = {
  title: "Assistance Request Received",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ReceivedPage() {
  return <AssistanceReceivedClient />;
}
