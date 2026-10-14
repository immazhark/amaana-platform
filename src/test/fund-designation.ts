/** Synthetic reviewed snapshot; contains no real fund or beneficiary data. */
export function syntheticFundDesignation(fundId: string, givingIntent = "GENERAL") {
  return {
    version: 1, kind: "FUND", fundId, fundRevision: 4,
    label: "Synthetic independently approved fund",
    purpose: "A reviewed synthetic domestic charitable programme.",
    disclosure: "Donations support the original independently reviewed charitable purpose.",
    accountCode: "TEST-FUND", givingIntent,
  };
}
