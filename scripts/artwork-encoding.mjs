import { MAX_ARTWORK_BYTES } from "./check-public-image-weight.mjs";

const qualities = Object.freeze([88, 86, 84, 82, 80, 78, 76]);

/** Preserve the preferred encoding when it fits; never exceed the shared cap. */
export async function encodeArtworkWithinBudget(encode) {
  if (typeof encode !== "function") throw new TypeError("An artwork encoder is required");
  let smallestBytes = Infinity;
  for (const quality of qualities) {
    const encoded = await encode(quality);
    if (!Buffer.isBuffer(encoded) || encoded.length === 0) {
      throw new Error("Artwork encoder returned an empty or invalid image");
    }
    smallestBytes = Math.min(smallestBytes, encoded.length);
    if (encoded.length <= MAX_ARTWORK_BYTES) return { encoded, quality };
  }
  throw new Error(`Refined artwork exceeds the ${MAX_ARTWORK_BYTES}-byte cap at the minimum configured quality; smallest encoding was ${smallestBytes} bytes`);
}
