/** Only an authenticated, structurally valid, successful read can update
 * private tracking state. A malformed success is retryable, never an invalid link. */
export type TrackingRecord = {
  found: true;
  status: "SUBMITTED" | "DOCUMENTS_REQUESTED" | "UNDER_VERIFICATION" |
    "APPROVED" | "REJECTED" | "CONVERTED_TO_APPEAL" | "CLOSED";
  createdAt: string;
  updatedAt: string;
};

const statuses = new Set<TrackingRecord["status"]>([
  "SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION",
  "APPROVED", "REJECTED", "CONVERTED_TO_APPEAL", "CLOSED",
]);

function isServerTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const time = new Date(value);
  return Number.isFinite(time.getTime()) && time.toISOString() === value;
}

export function isTrackingResponse(value: unknown): value is TrackingRecord | { found: false } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (data.found === false) return true;
  return data.found === true &&
    typeof data.status === "string" && statuses.has(data.status as TrackingRecord["status"]) &&
    isServerTimestamp(data.createdAt) && isServerTimestamp(data.updatedAt) &&
    data.updatedAt >= data.createdAt;
}
