import "server-only";
import sharp from "sharp";
import { PLACEHOLDER_MAX_DATA_URL_LENGTH, PLACEHOLDER_MAX_EDGE, isValidPlaceholder } from "./image-placeholder-validate";

export { PLACEHOLDER_MAX_DATA_URL_LENGTH, PLACEHOLDER_MAX_EDGE, isValidPlaceholder };

// AF-R056: governed low-quality image placeholder contract.
// A placeholder is a tiny blurred WebP data URL derived from the stored image;
// it is rendered only while the asset is public and approved, and cleared on unpublish. It never carries metadata (sharp strips EXIF,
// GPS and ICC by default) and is hard-bounded so it cannot bloat HTML or
// reveal identifiable detail. Any failure yields null: callers render no
// placeholder rather than a broken one.
const MAX_INPUT_PIXELS = 25_000_000;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

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
