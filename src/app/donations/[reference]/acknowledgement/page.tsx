import type { Metadata } from "next";
import { DonationAcknowledgementClient } from "@/components/donation-acknowledgement-client";

export const metadata: Metadata = {
  title: "Private Donation Acknowledgement",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ reference: string }> };

export default async function AcknowledgementPage({ params }: Props) {
  const { reference } = await params;
  return <DonationAcknowledgementClient reference={reference} />;
}
