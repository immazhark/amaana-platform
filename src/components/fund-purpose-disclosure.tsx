import type { DonorFund } from "@/lib/fund-checkout-contract";

/** Shared reviewed copy; works in server previews and the client checkout. */
export function FundPurposeDisclosure({ fund }: { fund: DonorFund }) {
  return <section className="card" aria-labelledby="fund-purpose">
    <h2 id="fund-purpose">{fund.name}</h2><p>{fund.purpose}</p><p>{fund.disclosure}</p>
  </section>;
}
