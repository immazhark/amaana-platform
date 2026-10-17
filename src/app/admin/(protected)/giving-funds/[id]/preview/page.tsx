import { notFound } from "next/navigation";
import { FundPurposeDisclosure } from "@/components/fund-purpose-disclosure";
import { DONATION_INTENT_LABELS } from "@/lib/donation-intent";
import { requirePermission } from "@/lib/auth";
import { parseFundDraft, FundValidationError } from "@/lib/giving-funds";
import { prisma } from "@/lib/prisma";
import "../../../../../forms-experience.css";
import "../../../../../donate-structure.css";
import "../../../../../donate-wow.css";

export default async function FundPreview({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("fund.view");
  const { id } = await params;
  const fund = await prisma.givingFund.findUnique({ where: { id } });
  if (!fund) notFound();
  let definition;
  try {
    definition = parseFundDraft({ slug: fund.slug, name: fund.name, purpose: fund.purpose,
      disclosure: fund.disclosure, accountCode: fund.accountCode, acceptedIntents: fund.acceptedIntents });
  } catch (error) {
    if (!(error instanceof FundValidationError)) throw error;
    return <><h1>Donor flow preview</h1><p role="alert">The fund definition needs correction before its donor flow can be reviewed.</p></>;
  }
  return <>
    <header className="admin-heading"><div><h1>Donor flow preview</h1><p>{fund.status.replaceAll("_", " ")} · Revision {fund.revision}</p><p>This private preview does not accept payments or activate fundraising. Review the donor-facing purpose and restrictions before independent approval.</p></div></header>
    <FundPurposeDisclosure fund={{ id: fund.id, revision: fund.revision, name: definition.name,
      purpose: definition.purpose, disclosure: definition.disclosure, acceptedIntents: definition.acceptedIntents }}
      />
    <fieldset disabled className="card"><legend>Donor purpose confirmation preview</legend>
      <p>Accepted intentions: {definition.acceptedIntents.map(intent => DONATION_INTENT_LABELS[intent]).join(" / ")}</p>
      <label className="checkbox"><input type="checkbox" name="fundPurposeConfirmed" required aria-describedby="fund-purpose"/><span>I accept the purpose and restrictions. My donation follows the reviewed purpose above.</span></label>
      <p>Preview only · payments disabled. No donor details are collected here.</p>
    </fieldset>
  </>;
}
