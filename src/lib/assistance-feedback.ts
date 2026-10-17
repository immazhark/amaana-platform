export const ASSISTANCE_FIELDS = ["applicantName", "phone", "email", "city", "category", "description", "documents", "consent"] as const;
export type AssistanceField = typeof ASSISTANCE_FIELDS[number];
export type AssistanceFieldErrors = Partial<Record<AssistanceField, string[]>>;

export const UNCERTAIN_ASSISTANCE_MESSAGE = "Your request may already be recorded. Contact Amaana before submitting again. Keep supporting documents private.";

type AssistanceResult =
  | { kind: "accepted"; referenceNumber: string; trackingToken: string }
  | { kind: "rejected"; message: string; fields: AssistanceFieldErrors }
  | { kind: "uncertain" };

export function classifyAssistanceResponse(status: number, value: unknown): AssistanceResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { kind: "uncertain" };
  const body = value as Record<string, unknown>;
  if (body.submissionUncertain === true) return { kind: "uncertain" };
  if (status === 201 && typeof body.referenceNumber === "string" && /^[A-Za-z0-9-]{1,80}$/.test(body.referenceNumber) &&
      typeof body.trackingToken === "string" && /^[A-Za-z0-9_-]{20,128}$/.test(body.trackingToken)) {
    return { kind: "accepted", referenceNumber: body.referenceNumber, trackingToken: body.trackingToken };
  }
  // The multipart reader's 408 explicitly confirms the body was never
  // fully read, so storage and case creation did not begin. A generic 408,
  // 5xx, or lost acknowledgement is still uncertain and must remain locked.
  const explicitNoWriteTimeout = status === 408 && body.submissionUncertain === false;
  if ((!explicitNoWriteTimeout && ![400, 403, 413, 429].includes(status)) ||
      typeof body.error !== "string" || !body.error.trim()) return { kind: "uncertain" };
  const fields: AssistanceFieldErrors = {};
  if (body.fields && typeof body.fields === "object" && !Array.isArray(body.fields)) {
    const input = body.fields as Record<string, unknown>;
    for (const field of ASSISTANCE_FIELDS) {
      const messages = input[field];
      const message = Array.isArray(messages) ? messages.find((item): item is string => typeof item === "string" && Boolean(item.trim())) : undefined;
      if (message) fields[field] = [message.slice(0, 300)];
    }
  }
  return { kind: "rejected", message: body.error.slice(0, 500), fields };
}
