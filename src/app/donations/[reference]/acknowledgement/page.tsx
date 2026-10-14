import type { Metadata } from "next";
import { isPrivateReceiptPdfEnabled } from "@/lib/receipt-pdf-feature";
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
  // Keep the dormant PDF control out of donor pages unless all independent
  // server-only rollout gates have been explicitly configured.
  return <DonationAcknowledgementClient reference={reference} pdfEnabled={isPrivateReceiptPdfEnabled()} />;
}
