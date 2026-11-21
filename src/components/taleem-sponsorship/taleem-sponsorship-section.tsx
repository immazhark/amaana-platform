import { fundDonationFormCopy } from "@/components/fund-giving/fund-copy";
import { prisma } from "@/lib/prisma";
import { getDonationPaymentDetails } from "@/lib/donation-payment-details";
import { feeEstimateBasisPoints } from "@/lib/processing-fee";
import { isTaleemSponsorshipEnabled } from "@/lib/taleem-sponsorship-flag";
import { sponsorshipOffer, TALEEM_FUND_SLUG } from "@/lib/taleem-sponsorship";
import { logServerError } from "@/lib/server-log";
import styles from "@/components/fund-giving/fund-giving.module.css";
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
  const offer = sponsorshipOffer();
  if (offer.programmes.length === 0) return null;
  return <TaleemSponsorshipConfigurator fund={loaded.fund} offer={offer}
    intro={<p className={styles.fine}>Your gift supports the Taleem programme and its teaching. It does not name or reserve a student. The period you choose is paid once; it is not a monthly subscription.</p>}
    panelNote={<p className={styles.fine}>Months are a prepaid period, not a recurring mandate. If the programme cannot go ahead as planned, your gift goes to the nearest similar Taleem purpose and is recorded in our ledger. Zakat is never moved to a different purpose without your permission.</p>}
    copy={fundDonationFormCopy(loaded.fund)} paymentDetails={loaded.paymentDetails} feeBps={feeEstimateBasisPoints()} />;
}
