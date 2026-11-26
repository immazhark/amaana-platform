import "server-only";
import sharp from "sharp";
import { MANAGED_IMAGE_PIXEL_LIMIT, MANAGED_IMAGE_WIDTHS } from "./managed-image-variants";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 1024 * 1024;
const MAX_ACTIVE = 2;
const MAX_WAITING = 8;
const WAIT_MS = 5000;
let active = 0;
const waiting: Array<() => void> = [];

// Per process, bound concurrent source reads/decodes and the waiting queue.
// A timed-out request is removed, not left to start work later.
export async function withManagedImageSlot<T>(work: () => Promise<T>): Promise<T> {
  if (active < MAX_ACTIVE) active++;
  else {
    if (waiting.length >= MAX_WAITING) throw new Error("Managed image renderer busy");
    await new Promise<void>((resolve, reject) => {
      const enter = () => { clearTimeout(timer); resolve(); };
      const timer = setTimeout(() => {
        const index = waiting.indexOf(enter);
        if (index >= 0) waiting.splice(index, 1);
        reject(new Error("Managed image renderer busy"));
      }, WAIT_MS);
      waiting.push(enter);
    });
  }
  try { return await work(); }
  finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

export async function renderManagedImage(bytes: Uint8Array, contentType: string, width: number): Promise<Buffer> {
  const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[contentType as "image/jpeg" | "image/png" | "image/webp"];
  if (!expected || !(MANAGED_IMAGE_WIDTHS as readonly number[]).includes(width) || bytes.byteLength < 1 || bytes.byteLength > MAX_BYTES) {
    throw new Error("Invalid managed image rendition input");
  }
  const image = sharp(bytes, { limitInputPixels: MANAGED_IMAGE_PIXEL_LIMIT, failOn: "warning", animated: false });
  const metadata = await image.metadata();
  if (metadata.format !== expected || !metadata.width || !metadata.height || (metadata.pages ?? 1) !== 1 ||
      metadata.width > MANAGED_IMAGE_PIXEL_LIMIT / metadata.height) throw new Error("Invalid managed image rendition source");
  // No enlargement, no metadata, no persisted rendition or shared cache.
  const output = await image.rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).timeout({ seconds: 5 }).toBuffer();
  if (!output.length || output.length > MAX_OUTPUT_BYTES) throw new Error("Managed image rendition exceeds byte limit");
  return output;
}
