/** Public status copy for verified programme records.
 * Completion of fundraising never asserts clinical recovery.
 */
export function programmeStatusLabel(causeSlug: string | undefined, slug: string, status: string): string {
  if (causeSlug === "medical-financial-relief") {
    if (status === "ONGOING") return "Ongoing assistance";
    if (slug === "medical-recovery-relief-2026") return "Collection closed · assistance delivered";
    if (slug === "jewellery-loan-intervention") return "Assistance completed";
    return "Fundraising completed";
  }
  if (status === "EXPANDING") return "Developing pathway";
  if (status === "ONGOING") return "Ongoing sponsorship";
  if (status === "HISTORICAL") return "Historical response";
  if (status === "COMPLETED") return "Completed work";
  return "Recurring programme";
}
