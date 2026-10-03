export function retentionDeletionConfirmed(decision: string, confirmation: string) {
  return decision !== "DELETE" || confirmation.trim() === "DELETE";
}
