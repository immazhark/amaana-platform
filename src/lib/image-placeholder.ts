import "server-only";
import sharp from "sharp";

// AF-R056: governed low-quality image placeholder contract.
// A placeholder is a tiny blurred WebP data URL derived from an image that has
// already passed privacy review. It never carries metadata (sharp strips EXIF,
// GPS and ICC by default) and is hard-bounded so it cannot bloat HTML or
// reveal identifiable detail. Any failure yields null: callers render no
// placeholder rather than a broken one.
export const PLACEHOLDER_MAX_EDGE = 12;
export const PLACEHOLDER_MAX_DATA_URL_LENGTH = 900;
const MAX_INPUT_PIXELS = 25_000_000;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const DATA_URL = /^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/;

export function isValidPlaceholder(value: unknown): value is string {
  return typeof value === "string" && value.length <= PLACEHOLDER_MAX_DATA_URL_LENGTH && DATA_URL.test(value);
}

export async function createImagePlaceholder(input: Uint8Array): Promise<string | null> {
  if (input.byteLength === 0 || input.byteLength > MAX_INPUT_BYTES) return null;
  try {
    const bytes = await sharp(input, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize(PLACEHOLDER_MAX_EDGE, PLACEHOLDER_MAX_EDGE, { fit: "inside", withoutEnlargement: true })
      .blur(0.8)
      .webp({ quality: 30, effort: 4 })
      .toBuffer();
    const url = `data:image/webp;base64,${bytes.toString("base64")}`;
    return isValidPlaceholder(url) ? url : null;
  } catch {
    return null;
  }
}
