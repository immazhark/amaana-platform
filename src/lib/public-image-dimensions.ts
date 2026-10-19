/** Public image dimensions come from untrusted ingestion metadata.
 * Keep a consistent fallback ratio if either side is missing or invalid.
 * Never pass non-finite, fractional or excessive values to Next/Image. */
const FALLBACK = { width: 1600, height: 1200 } as const;
const MAX_DIMENSION = 10_000;

export function getPublicImageDimensions(value: {
  width?: number | null;
  height?: number | null;
}): { width: number; height: number } {
  const { width, height } = value;
  if (
    typeof width === "number" && Number.isSafeInteger(width) && width > 0 && width <= MAX_DIMENSION &&
    typeof height === "number" && Number.isSafeInteger(height) && height > 0 && height <= MAX_DIMENSION
  ) return { width, height };
  return { ...FALLBACK };
}
