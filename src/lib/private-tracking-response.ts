export type TrackingRecord = { found: true; status: string; createdAt: string; updatedAt: string };

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 4096;
}

function date(value: unknown) {
  return text(value) && Number.isFinite(Date.parse(value));
}

export function isTrackingResponse(value: unknown): value is TrackingRecord | { found: false } {
  return object(value) && (value.found === false
    || (value.found === true && text(value.status) && date(value.createdAt) && date(value.updatedAt)));
}
