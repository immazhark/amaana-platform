import type { Metadata } from "next";
import { isAbsolute } from "node:path";
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
  const renderer = process.env.AMAANA_RECEIPT_PDF_RENDERER_BIN;
  const pdfEnabled = process.env.AMAANA_RECEIPT_PDF_ENABLED === "true"
    && /^[0-9a-fA-F]{64}$/.test(process.env.RECEIPT_DOWNLOAD_ENCRYPTION_KEY ?? "")
    && typeof renderer === "string" && isAbsolute(renderer);
  return <DonationAcknowledgementClient reference={reference} pdfEnabled={pdfEnabled} />;
}
