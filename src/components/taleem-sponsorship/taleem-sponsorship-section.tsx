import { fundDonationFormCopy } from "@/components/fund-giving/fund-copy";
import { prisma } from "@/lib/prisma";
import { getDonationPaymentDetails } from "@/lib/donation-payment-details";
import { feeEstimateBasisPoints } from "@/lib/processing-fee";
import { isTaleemSponsorshipEnabled } from "@/lib/taleem-sponsorship-flag";
import { TALEEM_FUND_SLUG } from "@/lib/taleem-sponsorship";
import { logServerError } from "@/lib/server-log";
import { TaleemSponsorshipConfigurator } from "./taleem-sponsorship-configurator";

async function loadTaleemFund() {
  try {
    const fund = await prisma.fund.findFirst({
      where: { slug: TALEEM_FUND_SLUG, status: "ACTIVE" },
      select: { slug: true, name: true, summary: true, zakatPolicy: true, isGeneral: true },
    });
    if (!fund) return null;
    return { fund, paymentDetails: await getDonationPaymentDetails() };
  } catch (error) {
    logServerError("taleem_sponsorship_section_unavailable", { errorName: error instanceof Error ? error.name : "unknown" });
    return null;
  }
}

/** The programme sponsorship section of the sponsor-education page. It renders nothing, and touches no database, while the
 * activation switches are off. It is an enhancement, so any lookup failure degrades to the page without it. */
export async function TaleemSponsorshipSection() {
  if (!isTaleemSponsorshipEnabled()) return null;
  const loaded = await loadTaleemFund();
  if (!loaded) return null;
  return <TaleemSponsorshipConfigurator fund={loaded.fund} copy={fundDonationFormCopy(loaded.fund)} paymentDetails={loaded.paymentDetails} feeBps={feeEstimateBasisPoints()} />;
}
