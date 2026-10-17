export const DIRECT_TRANSFER_FIELDS = [
  "donorName", "donorEmail", "donorPhone", "amount", "transferReference",
  "transferredAt", "evidence", "givingIntent", "domesticConfirmed",
] as const;

export type DirectTransferField = typeof DIRECT_TRANSFER_FIELDS[number];
export type DirectTransferFieldErrors = Partial<Record<DirectTransferField, string[]>>;

export const UNCERTAIN_TRANSFER_MESSAGE = "We could not confirm whether your transfer submission was recorded. Keep your bank or UPI confirmation and contact Amaana before submitting again. Do not make another payment for this transfer.";

export function isDirectTransferField(value: string): value is DirectTransferField {
  return (DIRECT_TRANSFER_FIELDS as readonly string[]).includes(value);
}

export function directTransferFieldErrors(value: unknown): DirectTransferFieldErrors {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const errors: DirectTransferFieldErrors = {};
  for (const field of DIRECT_TRANSFER_FIELDS) {
    const messages = input[field];
    if (Array.isArray(messages)) {
      const message = messages.find((item): item is string => typeof item === "string" && item.trim().length > 0);
      if (message) errors[field] = [message.slice(0, 300)];
    }
  }
  return errors;
}

export type DirectTransferResult =
  | { kind: "accepted"; referenceNumber: string; receiptToken: string }
  | { kind: "rejected"; message: string; fieldErrors: DirectTransferFieldErrors }
  | { kind: "uncertain" };

export function classifyDirectTransferResponse(status: number, value: unknown): DirectTransferResult {
  // A server error or unusable response cannot prove a write did not commit.
  if (status >= 500 || !value || typeof value !== "object" || Array.isArray(value)) return { kind: "uncertain" };
  const body = value as Record<string, unknown>;
  if (body.submissionUncertain === true) return { kind: "uncertain" };
  // A generic 408 might follow a committed transfer claim. Only the server's
  // documented multipart *pre-write* timeout explicitly proves that neither
  // a donation record nor private evidence was saved.
  if (status === 408 && body.submissionUncertain !== false) return { kind: "uncertain" };
  if (status === 202 && body.status === "PENDING_VERIFICATION" &&
      typeof body.referenceNumber === "string" && /^[A-Za-z0-9-]{1,80}$/.test(body.referenceNumber) &&
      typeof body.receiptToken === "string" && /^[A-Za-z0-9_-]{20,128}$/.test(body.receiptToken)) {
    return { kind: "accepted", referenceNumber: body.referenceNumber, receiptToken: body.receiptToken };
  }
  if (status >= 400 && status < 500 && typeof body.error === "string" && body.error.trim()) {
    return { kind: "rejected", message: body.error.slice(0, 500), fieldErrors: directTransferFieldErrors(body.fieldErrors) };
  }
  return { kind: "uncertain" };
}
