// Pure (no sharp, no server-only) so render paths can validate a stored placeholder.
export const PLACEHOLDER_MAX_EDGE = 12;
export const PLACEHOLDER_MAX_DATA_URL_LENGTH = 900;
const DATA_URL = /^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/;

export function isValidPlaceholder(value: unknown): value is string {
  return typeof value === "string" && value.length <= PLACEHOLDER_MAX_DATA_URL_LENGTH && DATA_URL.test(value);
}
