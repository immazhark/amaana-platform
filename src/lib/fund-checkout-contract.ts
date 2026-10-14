export type DonorFund = {
  id: string; revision: number; name: string; purpose: string; disclosure: string;
  acceptedIntents: readonly ("GENERAL" | "SADAQAH")[];
};

/** Bind the successful order to the same reviewed definition shown by the UI. */
export function isMatchingFundOrder(value: unknown, fund: DonorFund, givingIntent: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const order = value as Record<string, unknown>;
  return (givingIntent === "GENERAL" || givingIntent === "SADAQAH")
    && fund.acceptedIntents.includes(givingIntent) && order.givingIntent === givingIntent
    && order.designationKind === "FUND" && order.fundId === fund.id
    && order.fundRevision === fund.revision && order.fundName === fund.name
    && order.fundPurpose === fund.purpose && order.fundDisclosure === fund.disclosure;
}
