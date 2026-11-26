export const MANAGED_IMAGE_WIDTHS = [384, 640, 960, 1280] as const;
export const MANAGED_IMAGE_PIXEL_LIMIT = 16_000_000;
const managedPath = /^\/media\/\d{4}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;

// No arbitrary widths, qualities or alternate query spellings.
export function parseManagedImageWidth(search: string): number | undefined | null {
  if (!search) return undefined;
  const width = MANAGED_IMAGE_WIDTHS.find(value => search === `?w=${value}`);
  return width ?? null;
}

export function managedImageSrcSet(path: string, width?: number | null, height?: number | null): string | undefined {
  if (!managedPath.test(path) || typeof width !== "number" || typeof height !== "number" ||
      !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 ||
      width > MANAGED_IMAGE_PIXEL_LIMIT / height) return undefined;
  const candidates = MANAGED_IMAGE_WIDTHS.filter(value => value <= width);
  return candidates.length ? candidates.map(value => `${path}?w=${value} ${value}w`).join(", ") : undefined;
}
