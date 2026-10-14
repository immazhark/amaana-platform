import "server-only";
import sharp from "sharp";

/** Called only by validated public-media ingestion, never by private evidence upload.
 * Preview failures are optional metadata failures; do not orphan or retry a valid upload.
 */
export async function generatePublicImagePlaceholder(bytes: Buffer, maxInputPixels: number): Promise<string | null> {
  try {
    const preview = await sharp(bytes, { limitInputPixels: maxInputPixels, sequentialRead: true, animated: false })
      .rotate()
      .resize(12, 12, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#fffdf8" })
      .jpeg({ quality: 35 })
      .timeout({ seconds: 2 })
      .toBuffer();
    if (preview.length > 1024) return null;
    return `data:image/jpeg;base64,${preview.toString("base64")}`;
  } catch {
    // Original validated media can still be ingested without a placeholder.
    return null;
  }
}
