/** Donor-authored Shukr consent cannot be represented as a staff AuditEvent:
 * AuditEvent.actorId requires an authenticated User. Never impersonate staff
 * or retain a chosen public name once consent has been withdrawn.
 */
export const DONOR_CONSENT_ACTIONS = ["REQUESTED", "WITHDRAWN"] as const;
export type DonorConsentAction = typeof DONOR_CONSENT_ACTIONS[number];

export function donorConsentAuditEntry(donationId: string, action: DonorConsentAction) {
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(donationId) || !DONOR_CONSENT_ACTIONS.includes(action)) {
    throw new Error("Invalid private donor consent audit event");
  }
  return { donationId, action };
}

/** Compare against the receipt-verified state loaded at the beginning of an
 * action. Stale submission cannot overwrite a staff decision or revocation. */
export function recognitionVersionWhere(record: {
  id: string;
  recognitionRequestedAt: Date | null;
  recognitionApprovedAt: Date | null;
  recognitionRevokedAt: Date | null;
  recognitionDisplayName: string | null;
}) {
  return {
    id: record.id,
    recognitionRequestedAt: record.recognitionRequestedAt,
    recognitionApprovedAt: record.recognitionApprovedAt,
    recognitionRevokedAt: record.recognitionRevokedAt,
    recognitionDisplayName: record.recognitionDisplayName,
  };
}
