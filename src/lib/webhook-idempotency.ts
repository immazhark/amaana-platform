import { Prisma } from "@prisma/client";
import { isDeepStrictEqual } from "node:util";
import type { paymentEventAuditPayload } from "./payment-event-audit";

type AuditedWebhookPayload = ReturnType<typeof paymentEventAuditPayload>;

export function isPrismaUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** An event ID can be replayed only when its sanitized financial meaning matches.
 *  Comparing the audited fields avoids both JSON property-order differences and
 *  storing raw webhook bodies containing donor identifying information.
 */
export function isMatchingPaymentEventReplay(
  stored: { eventType: string; payload: unknown } | null,
  eventType: string,
  incoming: AuditedWebhookPayload,
) {
  return Boolean(stored &&
    stored.eventType === eventType &&
    isDeepStrictEqual(stored.payload, incoming));
}
