/** Public image dimensions come from untrusted ingestion metadata.
 * Keep a consistent fallback ratio if either side is missing or invalid.
 * Never pass non-finite, fractional or excessive values to Next/Image. */
const FALLBACK = { width: 1600, height: 1200 } as const;
const MAX_DIMENSION = 10_000;
// Keep public metadata within the 40 MP storage ingestion safety limit.
const MAX_PUBLIC_IMAGE_PIXELS = 40_000_000;

type PublicImageDimensions = { width?: number | null; height?: number | null };

export function hasValidPublicImageDimensions(value: PublicImageDimensions): value is { width: number; height: number } {
  const { width, height } = value;
  return typeof width === "number" && Number.isSafeInteger(width) && width > 0 && width <= MAX_DIMENSION
    && typeof height === "number" && Number.isSafeInteger(height) && height > 0 && height <= MAX_DIMENSION
    && width <= MAX_PUBLIC_IMAGE_PIXELS / height;
}

export function getPublicImageDimensions(value: PublicImageDimensions): { width: number; height: number } {
  return hasValidPublicImageDimensions(value)
    ? { width: value.width, height: value.height }
    : { ...FALLBACK };
}
