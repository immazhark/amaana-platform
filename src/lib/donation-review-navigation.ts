import { DonationIntent, DonationPaymentMethod, DonationStatus, type Prisma } from "@prisma/client";
import { parseAdminPage } from "./admin-pagination";
import { donationExceptionFilter } from "./donation-exception-review";
import { donationReviewFilters } from "./pending-transfer-review";

type Filters = Record<string, string | string[] | undefined>;
type EventBoundary = { processedAt: Date; id: string };
const keys = ["status", "intent", "method", "reference", "sort", "issue", "page"] as const;
const detailKey = (key: string) => "queue" + key.charAt(0).toUpperCase() + key.slice(1);

/** Only existing validated list filters, including fail-closed invalid selectors. */
function accepted(raw: Filters): Record<string, string> {
  const result: Record<string, string> = {};
  const { status, intent, method } = raw;
  if (typeof status === "string" && Object.values(DonationStatus).includes(status as DonationStatus)) result.status = status;
  if (typeof intent === "string" && Object.values(DonationIntent).includes(intent as DonationIntent)) result.intent = intent;
  if (typeof method === "string" && Object.values(DonationPaymentMethod).includes(method as DonationPaymentMethod)) result.method = method;
  const review = donationReviewFilters(raw.reference, raw.sort);
  if (review.reference) result.reference = review.reference;
  else if (review.invalidReference) result.reference = "invalid";
  if (review.direction === "asc") result.sort = "oldest";
  const issue = donationExceptionFilter(raw.issue).query.issue;
  if (issue) result.issue = issue;
  const page = parseAdminPage(raw.page);
  if (page > 1) result.page = String(page);
  return result;
}
function withQuery(path: string, entries: [string, string][]) {
  return entries.length ? path + "?" + entries.map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value)).join("&") : path;
}
export function donationQueueHref(raw: Filters) {
  return withQuery("/admin/donations", Object.entries(accepted(raw)));
}
export function donationReturnFilters(raw: Filters): Filters {
  return accepted(Object.fromEntries(keys.map(key => [key, raw[detailKey(key)]])));
}
export function donationDetailHref(id: string, raw: Filters, boundary?: EventBoundary) {
  const fields = accepted(raw);
  const entries: [string, string][] = Object.entries(fields).map(([key, value]) => [detailKey(key), value]);
  if (boundary) entries.push(["eventsBefore", boundary.processedAt.toISOString() + "~" + boundary.id]);
  return withQuery("/admin/donations/" + encodeURIComponent(id), entries);
}

export const PAYMENT_EVENT_PAGE_SIZE = 50;
export function parsePaymentEventBoundary(value: unknown): EventBoundary | null {
  if (typeof value !== "string" || value.length > 110) return null;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)~([A-Za-z0-9_-]{1,80})$/.exec(value);
  if (!match) return null;
  const processedAt = new Date(match[1]!);
  if (!Number.isFinite(processedAt.getTime()) || processedAt.toISOString() !== match[1]) return null;
  return { processedAt, id: match[2]! };
}
/** The nested donation relation supplies the record boundary. */
export function paymentEventSelection(boundary: EventBoundary | null) {
  return {
    ...(boundary ? { where: { OR: [{ processedAt: { lt: boundary.processedAt } }, { processedAt: boundary.processedAt, id: { lt: boundary.id } }] } } : {}),
    select: { id: true, eventType: true, providerEventId: true, processedAt: true },
    orderBy: [{ processedAt: "desc" }, { id: "desc" }],
    take: PAYMENT_EVENT_PAGE_SIZE + 1,
  } satisfies Prisma.PaymentEventFindManyArgs;
}
export function paymentEventPage<T extends EventBoundary>(rows: readonly T[]) {
  const events = rows.slice(0, PAYMENT_EVENT_PAGE_SIZE);
  return { events, older: rows.length > PAYMENT_EVENT_PAGE_SIZE ? events.at(-1) ?? null : null };
}
