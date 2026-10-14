/** Public media dimensions are untrusted database/remote-ingestion metadata.
 * Keep a consistent fallback ratio if either side is missing/invalid.
 * Next/Image must never receive nonfinite, fractional, negative or
 * unreasonably large intrinsic dimensions. */
const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 1200;
const MAX_INTRINSIC_DIMENSION = 10_000;

export function getPublicImageDimensions(value: {
  width?: number | null;
  height?: number | null;
}): { width: number; height: number } {
  const { width, height } = value;
  if (
    typeof width === "number" && Number.isSafeInteger(width) && width > 0 && width <= MAX_INTRINSIC_DIMENSION &&
    typeof height === "number" && Number.isSafeInteger(height) && height > 0 && height <= MAX_INTRINSIC_DIMENSION
  ) return { width, height };
  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
}
